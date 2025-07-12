
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RichTextEditor } from '@/components/offer-letters/RichTextEditor';
import { TagSelector } from './TagSelector';
import { QuestionOptionsEditor } from './QuestionOptionsEditor';
import { Save, X } from 'lucide-react';

interface QuestionEditorProps {
  question?: any;
  onSave: (questionData: any) => void;
  onCancel: () => void;
}

export function QuestionEditor({ question, onSave, onCancel }: QuestionEditorProps) {
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'multiple_choice',
    options: null,
    correct_answer: null,
    explanation: '',
    difficulty_level: 'medium',
    language: 'EN',
    time_limit_seconds: null,
    points: 1,
    tags: []
  });

  useEffect(() => {
    if (question) {
      setFormData({
        question_text: question.question_text || '',
        question_type: question.question_type || 'multiple_choice',
        options: question.options || null,
        correct_answer: question.correct_answer || null,
        explanation: question.explanation || '',
        difficulty_level: question.difficulty_level || 'medium',
        language: question.language || 'EN',
        time_limit_seconds: question.time_limit_seconds || null,
        points: question.points || 1,
        tags: question.tags || []
      });
    }
  }, [question]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question_text.trim()) {
      return;
    }

    if (!formData.correct_answer) {
      return;
    }

    onSave(formData);
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="question_text">Question Text *</Label>
            <RichTextEditor
              content={formData.question_text}
              onChange={(content) => updateField('question_text', content)}
              placeholder="Enter your question here..."
            />
          </div>

          <div>
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => updateField('explanation', e.target.value)}
              placeholder="Provide an explanation for the correct answer..."
              rows={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="question_type">Question Type *</Label>
              <Select
                value={formData.question_type}
                onValueChange={(value) => updateField('question_type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                  <SelectItem value="long_answer">Long Answer</SelectItem>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="fill_in_blank">Fill in the Blank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty_level">Difficulty</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => updateField('difficulty_level', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => updateField('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EN">English</SelectItem>
                  <SelectItem value="HI">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="points">Points</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={formData.points}
                onChange={(e) => updateField('points', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="time_limit">Time Limit (seconds, optional)</Label>
            <Input
              id="time_limit"
              type="number"
              min="1"
              value={formData.time_limit_seconds || ''}
              onChange={(e) => updateField('time_limit_seconds', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="No time limit"
            />
          </div>

          <div>
            <Label>Tags</Label>
            <TagSelector
              selectedTags={formData.tags}
              onTagsChange={(tags) => updateField('tags', tags)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <QuestionOptionsEditor
        questionType={formData.question_type}
        options={formData.options}
        correctAnswer={formData.correct_answer}
        onOptionsChange={(options) => updateField('options', options)}
        onCorrectAnswerChange={(answer) => updateField('correct_answer', answer)}
      />

      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          {question ? 'Update Question' : 'Create Question'}
        </Button>
      </div>
    </form>
  );
}
