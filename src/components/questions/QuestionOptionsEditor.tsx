
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';

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
  const [localOptions, setLocalOptions] = useState([]);
  const [localCorrectAnswer, setLocalCorrectAnswer] = useState(null);

  useEffect(() => {
    if (questionType === 'multiple_choice') {
      setLocalOptions(options || [{ text: '', id: '1' }, { text: '', id: '2' }]);
      setLocalCorrectAnswer(correctAnswer || '');
    } else if (questionType === 'true_false') {
      setLocalOptions([
        { text: 'True', id: 'true' },
        { text: 'False', id: 'false' }
      ]);
      setLocalCorrectAnswer(correctAnswer || 'true');
    } else {
      setLocalCorrectAnswer(correctAnswer || '');
    }
  }, [questionType, options, correctAnswer]);

  useEffect(() => {
    if (questionType === 'multiple_choice' || questionType === 'true_false') {
      onOptionsChange(localOptions);
    }
    onCorrectAnswerChange(localCorrectAnswer);
  }, [localOptions, localCorrectAnswer]);

  const addOption = () => {
    const newOption = {
      text: '',
      id: Date.now().toString()
    };
    setLocalOptions([...localOptions, newOption]);
  };

  const removeOption = (id: string) => {
    setLocalOptions(localOptions.filter(opt => opt.id !== id));
    if (localCorrectAnswer === id) {
      setLocalCorrectAnswer('');
    }
  };

  const updateOption = (id: string, text: string) => {
    setLocalOptions(localOptions.map(opt => 
      opt.id === id ? { ...opt, text } : opt
    ));
  };

  const renderMultipleChoice = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Answer Options</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={localCorrectAnswer} onValueChange={setLocalCorrectAnswer}>
          {localOptions.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <RadioGroupItem value={option.id} id={option.id} />
              <Input
                value={option.text}
                onChange={(e) => updateOption(option.id, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1"
              />
              {localOptions.length > 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(option.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </RadioGroup>
        
        <Button type="button" variant="outline" onClick={addOption}>
          <Plus className="w-4 h-4 mr-2" />
          Add Option
        </Button>
        
        {!localCorrectAnswer && (
          <p className="text-red-500 text-sm">Please select the correct answer</p>
        )}
      </CardContent>
    </Card>
  );

  const renderTrueFalse = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Correct Answer</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={localCorrectAnswer} onValueChange={setLocalCorrectAnswer}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="true" id="true" />
            <Label htmlFor="true">True</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="false" id="false" />
            <Label htmlFor="false">False</Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );

  const renderShortAnswer = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Expected Answer</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          value={localCorrectAnswer || ''}
          onChange={(e) => setLocalCorrectAnswer(e.target.value)}
          placeholder="Enter the expected answer..."
        />
        <p className="text-sm text-muted-foreground mt-2">
          Student answers will be compared against this expected answer
        </p>
      </CardContent>
    </Card>
  );

  const renderLongAnswer = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Sample Answer / Rubric</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={localCorrectAnswer || ''}
          onChange={(e) => setLocalCorrectAnswer(e.target.value)}
          placeholder="Provide a sample answer or grading rubric..."
          rows={4}
        />
        <p className="text-sm text-muted-foreground mt-2">
          This will be used as reference for manual grading
        </p>
      </CardContent>
    </Card>
  );

  const renderCoding = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Expected Solution</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={localCorrectAnswer || ''}
          onChange={(e) => setLocalCorrectAnswer(e.target.value)}
          placeholder="Provide the expected code solution..."
          rows={6}
          className="font-mono"
        />
        <p className="text-sm text-muted-foreground mt-2">
          Include test cases and expected output if applicable
        </p>
      </CardContent>
    </Card>
  );

  const renderFillInBlank = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Correct Answers</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={localCorrectAnswer || ''}
          onChange={(e) => setLocalCorrectAnswer(e.target.value)}
          placeholder="Enter acceptable answers, one per line..."
          rows={3}
        />
        <p className="text-sm text-muted-foreground mt-2">
          Each line represents an acceptable answer. Use _____ in the question text to indicate blanks.
        </p>
      </CardContent>
    </Card>
  );

  switch (questionType) {
    case 'multiple_choice':
      return renderMultipleChoice();
    case 'true_false':
      return renderTrueFalse();
    case 'short_answer':
      return renderShortAnswer();
    case 'long_answer':
      return renderLongAnswer();
    case 'coding':
      return renderCoding();
    case 'fill_in_blank':
      return renderFillInBlank();
    default:
      return null;
  }
}
