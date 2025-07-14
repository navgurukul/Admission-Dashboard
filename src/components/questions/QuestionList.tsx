
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Eye, History, Archive, Trash2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

interface QuestionListProps {
  questions: any[];
  loading: boolean;
  onEdit: (question: any) => void;
  onPreview: (question: any) => void;
  onHistory: (question: any) => void;
  onArchive: (questionId: string) => void;
  onDelete: (questionId: string) => void;
}

export function QuestionList({
  questions,
  loading,
  onEdit,
  onPreview,
  onHistory,
  onArchive,
  onDelete
}: QuestionListProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels = {
      'multiple_choice': 'Multiple Choice',
      'true_false': 'True/False',
      'short_answer': 'Short Answer',
      'long_answer': 'Long Answer',
      'coding': 'Coding',
      'fill_in_blank': 'Fill in Blank'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No questions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Card key={question.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getStatusColor(question.status)}>
                    {question.status}
                  </Badge>
                  <Badge className={getDifficultyColor(question.difficulty_level)}>
                    {question.difficulty_level}
                  </Badge>
                  <Badge variant="outline">
                    {getQuestionTypeLabel(question.question_type)}
                  </Badge>
                  <Badge variant="outline">
                    {question.language}
                  </Badge>
                  <Badge variant="outline">
                    {question.points} pts
                  </Badge>
                </div>
                
                <h3 className="font-medium text-sm mb-2 line-clamp-2">
                  <div dangerouslySetInnerHTML={{ __html: question.question_text }} />
                </h3>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Created: {format(new Date(question.created_at), 'MMM dd, yyyy')}
                  </span>
                  <span>Version: {question.version_number}</span>
                  {question.tags && question.tags.length > 0 && (
                    <div className="flex gap-1">
                      {question.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {question.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{question.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPreview(question)}
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(question)}
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onHistory(question)}
                  title="Version History"
                >
                  <History className="w-4 h-4" />
                </Button>
                {question.status === 'active' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onArchive(question.id)}
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(question.id)}
                    title="Delete Permanently"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
