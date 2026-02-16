import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
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
import { Option } from "@/utils/api";

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
  setSelectedQuestion?: (question: any) => void;
  schools: any[];
}

export function QuestionEditor({
  question,
  onSave,
  onCancel,
  setSelectedQuestion,
  difficultyLevels,
  schools,
}: QuestionEditorProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    question_type: string;
    difficulty_level: string;
    points: number;
    question_text: { english: string; hindi: string; marathi: string };
    options: {
      english: Option[];
      hindi: Option[];
      marathi: Option[];
    };
    correct_answer: number;
    explanation: string;
    school_ids: string[];
  }>({
    question_type: "MCQ",
    difficulty_level: "",
    points: 0,
    question_text: { english: "", hindi: "", marathi: "" },
    options: {
      english: [],
      hindi: [],
      marathi: [],
    },
    correct_answer: 0,
    explanation: "",
    school_ids: [],
  });

  useEffect(() => {
    if (!question) {
      setSelectedQuestion?.(null);
      // Initialize with default empty options
      setFormData(prev => ({
        ...prev,
        options: {
          english: [1, 2, 3, 4].map(id => ({ id, text: "" })),
          hindi: [1, 2, 3, 4].map(id => ({ id, text: "" })),
          marathi: [1, 2, 3, 4].map(id => ({ id, text: "" })),
        },
        correct_answer: 1, // Default to first option ID
        school_ids: []
      }));
      return;
    }

    const level = difficultyLevels.find(
      (lvl) => lvl.id === question.difficulty_level,
    );

    // Normalize options and answer key
    let normalizedOptions = {
      english: [] as Option[],
      hindi: [] as Option[],
      marathi: [] as Option[]
    };
    let normalizedAnswerKey = 0;

    // Check if options are strings (Legacy) or objects
    const isLegacy = Array.isArray(question.english_options) &&
      question.english_options.length > 0 &&
      typeof question.english_options[0] === 'string';

    if (isLegacy) {
      // Convert strings to objects with IDs
      const toOptions = (opts: string[]) => opts.map((text, idx) => ({ id: idx + 1, text }));

      normalizedOptions = {
        english: toOptions(question.english_options || []),
        hindi: toOptions(question.hindi_options || []),
        marathi: toOptions(question.marathi_options || [])
      };

      // Convert index-based answer key to ID-based
      const correctIndex = question.answer_key?.[0] ?? 0;
      // Legacy answer key was likely an index (0-3). If valid, map to ID (index + 1).
      // If it was already an ID stored in answer_key, we might need heuristics, 
      // but typically index 0 -> ID 1.
      normalizedAnswerKey = correctIndex + 1;

    } else {
      // Assume already Option objects
      // Ensure they have valid structure, otherwise default
      const ensureOptions = (opts: any[]) => {
        if (!Array.isArray(opts)) return [];
        return opts.map((o, idx) => {
          if (typeof o === 'string') {
            return { id: idx + 1, text: o };
          }
          return {
            id: o.id || idx + 1,
            text: o.text || o.value || ""
          };
        });
      };

      normalizedOptions = {
        english: ensureOptions(question.english_options),
        hindi: ensureOptions(question.hindi_options),
        marathi: ensureOptions(question.marathi_options)
      };

      // Answer key should be the ID
      normalizedAnswerKey = question.answer_key?.[0] ?? 0;
    }

    setFormData({
      question_type: question.question_type ?? "MCQ",
      difficulty_level: question.difficulty_level?.toString() ?? "",
      points: level?.points ?? 0,
      question_text: {
        english: question.english_text ?? "",
        hindi: question.hindi_text ?? "",
        marathi: question.marathi_text ?? "",
      },
      options: normalizedOptions,
      correct_answer: normalizedAnswerKey,
      explanation: question.explanation ?? "",
      school_ids: question.school_ids ? question.school_ids.map(String) : [],
    });
  }, [question, difficultyLevels]);

  const updateField = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const updateQuestionText = (
    lang: "english" | "hindi" | "marathi",
    value: string,
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
        title: "⚠️ Required field",
        description: "Select a question type",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (!formData.difficulty_level) {
      toast({
        title: "⚠️ Required field",
        description: "Select difficulty level",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    // Validate question text
    if (!formData.question_text.english.trim()) {
      toast({
        title: "⚠️ Required field",
        description: "Please enter the question text in English, Hindi, and Marathi",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (!formData.question_text.hindi.trim()) {
      toast({
        title: "⚠️ Required field",
        description: "Enter question text in Hindi and Marathi",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (!formData.question_text.marathi.trim()) {
      toast({
        title: "⚠️ Required field",
        description: "Enter question text in Marathi",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    // Validate MCQ options
    if (formData.question_type === "MCQ") {
      const { english, hindi, marathi } = formData.options;
      const hasEmptyOption =
        english.some((o) => !o.text.trim()) ||
        hindi.some((o) => !o.text.trim()) ||
        marathi.some((o) => !o.text.trim());

      if (hasEmptyOption) {
        toast({
          title: "⚠️ Required field",
          description: "All MCQ options must be filled in all languages",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return;
      }

      // Validate correct answer
      if (
        formData.correct_answer === null ||
        formData.correct_answer === undefined ||
        formData.correct_answer === 0
      ) {
        toast({
          title: "⚠️ Required field",
          description: "Select the correct answer",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900",
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
      answer_key: [formData.correct_answer], // Array of integers (IDs)
      explanation: formData.explanation,
    };

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question Type & Difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
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

        <div className="space-y-2">
          <Label>Difficulty</Label>
          <Select
            value={formData.difficulty_level}
            onValueChange={(v) => {
              updateField("difficulty_level", v);
              const level = difficultyLevels.find(
                (lvl) => lvl.id.toString() === v,
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
        <div className="space-y-2">
          <Label>Points</Label>
          <Input type="number" min={1} value={formData.points} disabled />
        </div>
        {/* <div className="space-y-2">
          <Label>Schools</Label>
          <MultiSelectCombobox
            options={schools.map((school) => ({
              value: String(school.id),
              label: school.school_name,
            }))}
            value={formData.school_ids}
            onValueChange={(value) => updateField("school_ids", value)}
            placeholder="Select schools (Optional)"
            searchPlaceholder="Search schools..."
          />
        </div> */}
      </div>

      <Separator />

      {/* Question Texts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Question Text (English)</Label>
          <Textarea
            value={formData.question_text.english}
            onChange={(e) => updateQuestionText("english", e.target.value)}
            placeholder="Enter question text in English"
          />
        </div>
        <div className="space-y-2">
          <Label>Question Text (Hindi)</Label>
          <Textarea
            value={formData.question_text.hindi}
            onChange={(e) => updateQuestionText("hindi", e.target.value)}
            placeholder="Enter question text in Hindi"
          />
        </div>
        <div className="space-y-2">
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
      <div className="space-y-2">
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
        {question && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
        )}

        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          {question ? "Update Question" : "Create Question"}
        </Button>
      </div>
    </form>
  );
}
