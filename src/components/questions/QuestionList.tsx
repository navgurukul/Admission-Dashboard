import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Archive, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Question {
  id: number;
  difficulty_level: number;
  question_type: string;
  english_text: string;
  hindi_text: string;
  marathi_text: string;
  status: boolean;
  created_at: string;
  tags?: string[];
  points?: number;
  version_number?: number;
}

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  onEdit: (question: Question) => void;
  onArchive: (questionId: number) => void;
  onDelete: (questionId: number) => void;
}

export function QuestionList({
  questions,
  loading,
  onEdit,
  // onPreview,
  // onHistory,
  onArchive,
  onDelete,
}: QuestionListProps) {
  const getDifficultyLabel = (level: number) => {
    if (level <= 1)
      return { label: "Easy", color: "bg-green-100 text-green-800" };
    if (level === 2)
      return { label: "Medium", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Hard", color: "bg-red-100 text-red-800" };
  };

  const getStatus = (status: boolean) => (status ? "active" : "archived");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      MCQ: "Multiple Choice",
      TrueFalse: "True/False",
      ShortAnswer: "Short Answer",
      LongAnswer: "Long Answer",
      Coding: "Coding",
      FillInBlank: "Fill in Blank",
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
    <div className="space-y-4 h-[600px] overflow-y-auto ">
      {questions.map((question) => {
        const difficulty = getDifficultyLabel(question.difficulty_level);
        return (
          <Card key={question.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={difficulty.color}>
                      {difficulty.label}
                    </Badge>
                    <Badge variant="outline">
                      {getQuestionTypeLabel(question.question_type)}
                    </Badge>
                    {question.points && (
                      <Badge variant="outline">{question.points} pts</Badge>
                    )}
                  </div>

                  <h3 className="font-medium text-sm mb-2">
                    <div className="space-y-1">
                      <div>
                        <strong>EN:</strong> {question.english_text}
                      </div>
                      <div>
                        <strong>HI:</strong> {question.hindi_text}
                      </div>
                      <div>
                        <strong>MR:</strong> {question.marathi_text}
                      </div>
                    </div>
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Created:{" "}
                      {format(new Date(question.created_at), "MMM dd, yyyy")}
                    </span>
                    {question.version_number && (
                      <span>Version: {question.version_number}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 ml-4">
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
                    onClick={() => onDelete(question.id)}
                    title="Delete Permanently"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  {/* {question.status ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onArchive(question.id)}
                      title="Archive"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  ) : (
                   
                  )} */}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
