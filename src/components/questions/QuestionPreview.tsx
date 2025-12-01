import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Clock, Award } from "lucide-react";

interface QuestionPreviewProps {
  question: any;
}

export function QuestionPreview({ question }: QuestionPreviewProps) {
  const renderQuestionContent = () => {
    switch (question.question_type) {
      case "multiple_choice":
        return (
          <div className="space-y-3">
            <RadioGroup>
              {question.options?.map((option, index) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="font-normal">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "true_false":
        return (
          <RadioGroup>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="true" />
              <Label htmlFor="true" className="font-normal">
                True
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="false" />
              <Label htmlFor="false" className="font-normal">
                False
              </Label>
            </div>
          </RadioGroup>
        );

      case "short_answer":
        return <Input placeholder="Enter your answer..." disabled />;

      case "long_answer":
        return (
          <Textarea
            placeholder="Enter your detailed answer..."
            rows={4}
            disabled
          />
        );

      case "coding":
        return (
          <Textarea
            placeholder="Write your code here..."
            rows={8}
            className="font-mono text-sm"
            disabled
          />
        );

      case "fill_in_blank":
        return (
          <div className="space-y-2">
            <div dangerouslySetInnerHTML={{ __html: question.question_text }} />
            <p className="text-sm text-muted-foreground">
              Fill in the blanks in the question above
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={getDifficultyColor(question.difficulty_level)}>
            {question.difficulty_level}
          </Badge>
          <Badge variant="outline">
            {question.question_type.replace("_", " ")}
          </Badge>
          <Badge variant="outline">{question.language}</Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {question.time_limit_seconds && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {question.time_limit_seconds}s
            </div>
          )}
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            {question.points} pts
          </div>
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Question Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question Text */}
          {question.question_type !== "fill_in_blank" && (
            <div className="prose prose-sm max-w-none">
              <div
                dangerouslySetInnerHTML={{ __html: question.question_text }}
              />
            </div>
          )}

          {/* Answer Options */}
          {renderQuestionContent()}

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explanation (Admin View Only) */}
      {question.explanation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-green-700">
              Explanation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-green-800">
              {question.explanation}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Correct Answer (Admin View Only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-blue-700">
            Correct Answer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-3 rounded-lg">
            {question.question_type === "multiple_choice" &&
              question.options && (
                <div>
                  {question.options.find(
                    (opt) => opt.id === question.correct_answer,
                  )?.text || "No correct answer set"}
                </div>
              )}
            {question.question_type === "true_false" && (
              <div>{question.correct_answer === "true" ? "True" : "False"}</div>
            )}
            {[
              "short_answer",
              "long_answer",
              "coding",
              "fill_in_blank",
            ].includes(question.question_type) && (
              <div className="whitespace-pre-wrap font-mono text-sm">
                {question.correct_answer}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
