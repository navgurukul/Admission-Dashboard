import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Archive, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/routes/LaunguageContext";
import { Language } from "@/utils/student.types";
import { QuestionFormattedText } from "./QuestionFormattedText";

interface Question {
  id: number;
  difficulty_level: number;
  topic?: number | string;
  question_type: string;
  english_text: string;
  hindi_text: string;
  marathi_text: string;
  status: boolean;
  created_at: string;
  tags?: string[];
  points?: number;
  version_number?: number;
  school_ids?: number[];
}

interface QuestionListProps {
  questions: Question[];
  loading: boolean;
  onEdit: (question: Question) => void;
  onArchive: (questionId: number) => void;
  onDelete: (questionId: number) => void;
  schools: any[];
  topics?: Array<{ id: number; topic: string }>;
}

export function QuestionList({
  questions,
  loading,
  onEdit,
  // onPreview,
  // onHistory,
  onArchive,
  onDelete,
  schools,
  topics = [],
}: QuestionListProps) {
  const { selectedLanguage, setSelectedLanguage } = useLanguage();

  React.useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage") as Language | null;
    if (
      savedLanguage &&
      ["english", "hindi", "marathi"].includes(savedLanguage) &&
      savedLanguage !== selectedLanguage
    ) {
      setSelectedLanguage(savedLanguage);
    }
  }, [selectedLanguage, setSelectedLanguage]);

  const getQuestionTextByLanguage = (question: Question) => {
    if (selectedLanguage === "hindi") {
      return question.hindi_text || question.english_text;
    }

    if (selectedLanguage === "marathi") {
      return question.marathi_text || question.english_text;
    }

    return question.english_text;
  };

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
    <div className="space-y-4">
      {questions.map((question) => {
        const difficulty = getDifficultyLabel(question.difficulty_level);
        const topicId = Number(question.topic);
        const matchedTopic = Number.isInteger(topicId)
          ? topics.find((topic) => topic.id === topicId)
          : null;
        const topicLabel =
          matchedTopic?.topic ||
          (question.topic !== undefined &&
          question.topic !== null &&
          String(question.topic).trim() !== ""
            ? String(question.topic)
            : "");
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
                    {topicLabel && (
                      <Badge variant="outline">{topicLabel}</Badge>
                    )}
                    {question.points && (
                      <Badge variant="outline">{question.points} pts</Badge>
                    )}
                    {question.school_ids && question.school_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {question.school_ids.map((id: number) => {
                          const school = schools.find((s) => s.id === id);
                          return school ? (
                            <Badge key={id} variant="secondary" className="text-[10px] px-1.5 h-5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                              {school.school_name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mb-2">
                    <QuestionFormattedText
                      text={getQuestionTextByLanguage(question)}
                    />
                  </div>

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
