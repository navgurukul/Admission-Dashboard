
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface QuestionOptionsEditorProps {
  questionType: string;
  options: any;
  correctAnswer: any;
  onOptionsChange: (options: any) => void;
  onCorrectAnswerChange: (answer: any) => void;
}

export function QuestionOptionsEditor({
  questionType,
  options,
  correctAnswer,
  onOptionsChange,
  onCorrectAnswerChange
}: QuestionOptionsEditorProps) {
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>(['', '', '', '']);
  const [selectedCorrectOption, setSelectedCorrectOption] = useState<number>(0);

  useEffect(() => {
    if (options && Array.isArray(options)) {
      setMultipleChoiceOptions(options);
    }
    if (typeof correctAnswer === 'number') {
      setSelectedCorrectOption(correctAnswer);
    }
  }, [options, correctAnswer]);

  const handleMultipleChoiceChange = (index: number, value: string) => {
    const newOptions = [...multipleChoiceOptions];
    newOptions[index] = value;
    setMultipleChoiceOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const addOption = () => {
    const newOptions = [...multipleChoiceOptions, ''];
    setMultipleChoiceOptions(newOptions);
    onOptionsChange(newOptions);
  };

  const removeOption = (index: number) => {
    if (multipleChoiceOptions.length <= 2) return;
    const newOptions = multipleChoiceOptions.filter((_, i) => i !== index);
    setMultipleChoiceOptions(newOptions);
    onOptionsChange(newOptions);
    
    if (selectedCorrectOption >= newOptions.length) {
      const newCorrect = 0;
      setSelectedCorrectOption(newCorrect);
      onCorrectAnswerChange(newCorrect);
    }
  };

  const handleCorrectAnswerChange = (index: number) => {
    setSelectedCorrectOption(index);
    onCorrectAnswerChange(index);
  };

  const handleTrueFalseChange = (value: string) => {
    onCorrectAnswerChange(value === 'true');
  };

  const handleTextAnswerChange = (value: string) => {
    onCorrectAnswerChange(value);
  };

  if (questionType === 'multiple_choice') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multiple Choice Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={selectedCorrectOption.toString()}
            onValueChange={(value) => handleCorrectAnswerChange(parseInt(value))}
          >
            {multipleChoiceOptions.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <RadioGroupItem value={index.toString()} />
                <div className="flex-1 flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => handleMultipleChoiceChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  {multipleChoiceOptions.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
          
          <Button type="button" variant="outline" onClick={addOption}>
            <Plus className="w-4 h-4 mr-2" />
            Add Option
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (questionType === 'true_false') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>True/False Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={correctAnswer?.toString() || 'true'}
            onValueChange={handleTrueFalseChange}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" />
              <Label>True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" />
              <Label>False</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    );
  }

  if (questionType === 'short_answer' || questionType === 'fill_in_blank') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expected Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={correctAnswer || ''}
            onChange={(e) => handleTextAnswerChange(e.target.value)}
            placeholder="Enter the expected answer"
          />
        </CardContent>
      </Card>
    );
  }

  if (questionType === 'long_answer') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sample Answer / Grading Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={correctAnswer || ''}
            onChange={(e) => handleTextAnswerChange(e.target.value)}
            placeholder="Provide a sample answer or grading criteria"
            rows={4}
          />
        </CardContent>
      </Card>
    );
  }

  if (questionType === 'coding') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expected Solution</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={correctAnswer || ''}
            onChange={(e) => handleTextAnswerChange(e.target.value)}
            placeholder="Provide the expected code solution"
            rows={6}
            className="font-mono"
          />
        </CardContent>
      </Card>
    );
  }

  return null;
}
