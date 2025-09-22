import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, X } from "lucide-react";
import { QuestionOptionsEditor } from "./QuestionOptionsEditor";
import { useToast } from "@/hooks/use-toast";

interface DifficultyLevel {
  id: number;
  name: string;
  points: number;
}

interface QuestionEditorProps {
  question?: any;
  onSave: (questionData: any) => void;
  onCancel: () => void;
  difficultyLevels: DifficultyLevel[];
}

export function QuestionEditor({
  question,
  onSave,
  onCancel,
  difficultyLevels,
}: QuestionEditorProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    question_type: "MCQ",
    difficulty_level: "",
    points: 0,
    question_text: { english: "", hindi: "", marathi: "" },
    options: {
      english: ["", "", "", ""],
      hindi: ["", "", "", ""],
      marathi: ["", "", "", ""],
    },
    correct_answer: 0,
    explanation: "",
  });

  useEffect(() => {
    if (!question) return;

    const level = difficultyLevels.find(
      (lvl) => lvl.id === question.difficulty_level
    );

    setFormData({
      question_type: question.question_type ?? "MCQ",
      difficulty_level: question.difficulty_level?.toString() ?? "",
      points: level?.points ?? 0,
      question_text: {
        english: question.english_text ?? "",
        hindi: question.hindi_text ?? "",
        marathi: question.marathi_text ?? "",
      },
      options: {
        english: question.english_options ?? ["", "", "", ""],
        hindi: question.hindi_options ?? ["", "", "", ""],
        marathi: question.marathi_options ?? ["", "", "", ""],
      },
      correct_answer: question.answer_key?.[0] ?? 0,
      explanation: question.explanation ?? "",
    });
  }, [question, difficultyLevels]);

  const updateField = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const updateQuestionText = (
    lang: "english" | "hindi" | "marathi",
    value: string
  ) =>
    setFormData((prev) => ({
      ...prev,
      question_text: { ...prev.question_text, [lang]: value },
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate question type & difficulty
    if (!formData.question_type) {
      toast({
        title: "Validation Error",
        description: "Select a question type",
        variant: "destructive",
      });
      return;
    }

    if (!formData.difficulty_level) {
      toast({
        title: "Validation Error",
        description: "Select difficulty level",
        variant: "destructive",
      });
      return;
    }

    // Validate question text
    if (!formData.question_text.english.trim()) {
      toast({
        title: "Validation Error",
        description: "Enter question text in English",
        variant: "destructive",
      });
      return;
    }

    if (!formData.question_text.hindi.trim()) {
      toast({
        title: "Validation Error",
        description: "Enter question text in Hindi",
        variant: "destructive",
      });
      return;
    }

    if (!formData.question_text.marathi.trim()) {
      toast({
        title: "Validation Error",
        description: "Enter question text in Marathi",
        variant: "destructive",
      });
      return;
    }

    // Validate MCQ options
    if (formData.question_type === "MCQ") {
      const { english, hindi, marathi } = formData.options;
      const hasEmptyOption =
        english.some((o) => !o.trim()) ||
        hindi.some((o) => !o.trim()) ||
        marathi.some((o) => !o.trim());

      if (hasEmptyOption) {
        toast({
          title: "Validation Error",
          description: "All MCQ options must be filled in all languages",
          variant: "destructive",
        });
        return;
      }

      // Validate correct answer
      if (
        formData.correct_answer === null ||
        formData.correct_answer === undefined
      ) {
        toast({
          title: "Validation Error",
          description: "Select the correct answer",
          variant: "destructive",
        });
        return;
      }
    }

    const payload = {
      difficulty_level: formData.difficulty_level,
      question_type: formData.question_type,
      english_text: formData.question_text.english,
      hindi_text: formData.question_text.hindi,
      marathi_text: formData.question_text.marathi,
      english_options: formData.options.english,
      hindi_options: formData.options.hindi,
      marathi_options: formData.options.marathi,
      answer_key: [formData.correct_answer],
      explanation: formData.explanation,
    };

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question Type & Difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Question Type</Label>
          <Select
            value={formData.question_type}
            onValueChange={(v) => updateField("question_type", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MCQ">Multiple Choice</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Difficulty</Label>
          <Select
            value={formData.difficulty_level}
            onValueChange={(v) => {
              updateField("difficulty_level", v);
              const level = difficultyLevels.find(
                (lvl) => lvl.id.toString() === v
              );
              if (level) updateField("points", level.points);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficultyLevels.map((level) => (
                <SelectItem key={level.id} value={level.id.toString()}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Points */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Points</Label>
          <Input type="number" min={1} value={formData.points} disabled />
        </div>
      </div>

      <Separator />

      {/* Question Texts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <Label>Question Text (English)</Label>
          <Textarea
            value={formData.question_text.english}
            onChange={(e) => updateQuestionText("english", e.target.value)}
            placeholder="Enter question text in English"
          />
        </div>
        <div>
          <Label>Question Text (Hindi)</Label>
          <Textarea
            value={formData.question_text.hindi}
            onChange={(e) => updateQuestionText("hindi", e.target.value)}
            placeholder="Enter question text in Hindi"
          />
        </div>
        <div>
          <Label>Question Text (Marathi)</Label>
          <Textarea
            value={formData.question_text.marathi}
            onChange={(e) => updateQuestionText("marathi", e.target.value)}
            placeholder="Enter question text in Marathi"
          />
        </div>
      </div>

      {/* Options */}
      {formData.question_type === "MCQ" && (
        <QuestionOptionsEditor
          questionType={formData.question_type}
          options={formData.options}
          correctAnswer={formData.correct_answer}
          onOptionsChange={(opts) => updateField("options", opts)}
          onCorrectAnswerChange={(ans) => updateField("correct_answer", ans)}
        />
      )}

      {/* Explanation */}
      <div>
        <Label>Explanation (Optional)</Label>
        <Textarea
          value={formData.explanation}
          onChange={(e) => updateField("explanation", e.target.value)}
          placeholder="Provide an explanation for the correct answer..."
          rows={3}
        />
      </div>

      {/* Save / Cancel Buttons */}
      <div className="flex items-center justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" /> Cancel
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          {question ? "Update Question" : "Create Question"}
        </Button>
      </div>
    </form>
  );
}
