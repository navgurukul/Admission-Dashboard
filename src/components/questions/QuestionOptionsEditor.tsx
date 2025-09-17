import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

interface QuestionOptionsEditorProps {
  questionType: string;
  options: { english: string[]; hindi: string[]; marathi: string[] };
  correctAnswer: number | null;
  onOptionsChange: (options: { english: string[]; hindi: string[]; marathi: string[] }) => void;
  onCorrectAnswerChange: (answer: number) => void;
}

export function QuestionOptionsEditor({
  questionType,
  options,
  correctAnswer,
  onOptionsChange,
  onCorrectAnswerChange,
}: QuestionOptionsEditorProps) {
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState(options || { english: ['', '', '', ''], hindi: ['', '', '', ''], marathi: ['', '', '', ''] });
  const [selectedCorrectOption, setSelectedCorrectOption] = useState(correctAnswer || 0);

  useEffect(() => {
    if (options) setMultipleChoiceOptions(options);
    if (typeof correctAnswer === 'number') setSelectedCorrectOption(correctAnswer);
  }, [options, correctAnswer]);

  const handleOptionChange = (lang: 'english' | 'hindi' | 'marathi', index: number, value: string) => {
    const updated = { ...multipleChoiceOptions, [lang]: [...multipleChoiceOptions[lang]] };
    updated[lang][index] = value;
    setMultipleChoiceOptions(updated);
    onOptionsChange(updated);
  };

  const addOption = () => {
    const updated = {
      english: [...multipleChoiceOptions.english, ''],
      hindi: [...multipleChoiceOptions.hindi, ''],
      marathi: [...multipleChoiceOptions.marathi, ''],
    };
    setMultipleChoiceOptions(updated);
    onOptionsChange(updated);
  };

  const removeOption = (index: number) => {
    if (multipleChoiceOptions.english.length <= 2) return;
    const updated = {
      english: multipleChoiceOptions.english.filter((_, i) => i !== index),
      hindi: multipleChoiceOptions.hindi.filter((_, i) => i !== index),
      marathi: multipleChoiceOptions.marathi.filter((_, i) => i !== index),
    };
    setMultipleChoiceOptions(updated);
    onOptionsChange(updated);

    if (selectedCorrectOption >= updated.english.length) {
      setSelectedCorrectOption(0);
      onCorrectAnswerChange(0);
    }
  };

  const handleCorrectAnswerChange = (index: number) => {
    setSelectedCorrectOption(index);
    onCorrectAnswerChange(index);
  };

  const handleTrueFalseChange = (value: string) => {
    // for true/false, correctAnswer can be stored as 0=false, 1=true
    const ans = value === 'true' ? 1 : 0;
    onCorrectAnswerChange(ans);
  };

  const handleTextAnswerChange = (value: string) => {
    // for short_answer, long_answer, coding
    onCorrectAnswerChange(value as any);
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
            onValueChange={(val) => handleCorrectAnswerChange(parseInt(val))}
          >
            {multipleChoiceOptions.english.map((_, index) => (
              <div key={index} className="flex gap-2 items-center">
                <RadioGroupItem value={index.toString()} />
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <Input
                    value={multipleChoiceOptions.english[index]}
                    onChange={(e) => handleOptionChange('english', index, e.target.value)}
                    placeholder={`EN Option ${index + 1}`}
                  />
                  <Input
                    value={multipleChoiceOptions.hindi[index]}
                    onChange={(e) => handleOptionChange('hindi', index, e.target.value)}
                    placeholder={`HI Option ${index + 1}`}
                  />
                  <Input
                    value={multipleChoiceOptions.marathi[index]}
                    onChange={(e) => handleOptionChange('marathi', index, e.target.value)}
                    placeholder={`MR Option ${index + 1}`}
                  />
                </div>
                {multipleChoiceOptions.english.length > 2 && (
                  <Button variant="ghost" size="sm" onClick={() => removeOption(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </RadioGroup>

          <Button type="button" variant="outline" onClick={addOption}>
            <Plus className="w-4 h-4 mr-2" /> Add Option
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
            value={correctAnswer === 1 ? 'true' : 'false'}
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
