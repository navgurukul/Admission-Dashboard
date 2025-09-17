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
import { difficultyLevelAPI } from "@/utils/difficultyLevelAPI";

interface QuestionEditorProps {
  question?: any;
  onSave: (questionData: any) => void;
  onCancel: () => void;
}

interface DifficultyLevel {
  id: number;
  name: string;
  points: number;
}

export function QuestionEditor({ question, onSave, onCancel,}: QuestionEditorProps) {
  
  const [difficultyOptions, setDifficultyOptions] = useState<DifficultyLevel[]>([]);

  const [formData, setFormData] = useState({
    question_type: "multiple_choice",
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
    async function fetchDifficultyLevels() {
      try {
        const levelsRaw = await difficultyLevelAPI.getDifficultyLevels();
        const arr = Array.isArray(levelsRaw.data?.data)
          ? levelsRaw.data.data.map((item: any) => ({
              id: item.id,
              name: item.name,
              points: item.marks ?? 0,
            }))
          : [];
        setDifficultyOptions(arr);

        // Pre-select difficulty if editing

        if (question?.difficulty_level) {
          const match = arr.find(
            (lvl) => lvl.id.toString() === question.difficulty_level?.toString()
          );
          if (match) {
            setFormData((p) => ({
              ...p,
              difficulty_level: match.id.toString(),
            }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch difficulty levels:", err);
        setDifficultyOptions([]);
      }
    }

    fetchDifficultyLevels();
  }, [question]);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateQuestionText = (
    lang: "english" | "hindi" | "marathi",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      question_text: { ...prev.question_text, [lang]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure at least one language has content
    if (
      !formData.question_text.english.trim() &&
      !formData.question_text.hindi.trim() &&
      !formData.question_text.marathi.trim()
    )
      return;

    const payload = {
      difficulty_level: formData.difficulty_level,
      question_type:
        formData.question_type === "multiple_choice"
          ? "MCQ"
          : formData.question_type.toUpperCase(),
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
          <Label>Difficulty</Label>
          <Select
            value={formData.difficulty_level}
            onValueChange={(v) => {
              updateField("difficulty_level", v);

              const level = difficultyOptions.find(
                (lvl) => lvl.id.toString() === v
              );
              if (level) updateField("points", level.points); //  set points
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {difficultyOptions.map((level) => (
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
      {formData.question_type === "multiple_choice" && (
        <QuestionOptionsEditor
          questionType="multiple_choice"
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
          <Save className="w-4 h-4 mr-2" />{" "}
          {question ? "Update Question" : "Create Question"}
        </Button>
      </div>
    </form>
  );
}
