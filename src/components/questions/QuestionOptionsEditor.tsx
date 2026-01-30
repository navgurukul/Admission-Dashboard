import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Option } from "@/utils/api";

interface QuestionOptionsEditorProps {
  questionType: string;
  options: { english: Option[]; hindi: Option[]; marathi: Option[] };
  correctAnswer: number | null;
  onOptionsChange: (options: {
    english: Option[];
    hindi: Option[];
    marathi: Option[];
  }) => void;
  onCorrectAnswerChange: (answer: number) => void;
}

export function QuestionOptionsEditor({
  questionType,
  options,
  correctAnswer,
  onOptionsChange,
  onCorrectAnswerChange,
}: QuestionOptionsEditorProps) {
  // Initialize with at least 4 empty options if none provided
  const initializeOptions = () => {
    if (options && options.english.length > 0) return options;

    // Create 4 initial options with unique IDs
    const initialIds = [1, 2, 3, 4];
    return {
      english: initialIds.map(id => ({ id, text: "" })),
      hindi: initialIds.map(id => ({ id, text: "" })),
      marathi: initialIds.map(id => ({ id, text: "" })),
    };
  };

  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState(initializeOptions());

  // Use local state for selected correct option ID
  const [selectedCorrectOptionId, setSelectedCorrectOptionId] = useState<number>(
    correctAnswer || (multipleChoiceOptions.english[0]?.id ?? 0)
  );

  useEffect(() => {
    if (options) {
      setMultipleChoiceOptions(options);
    }
    if (typeof correctAnswer === "number") {
      setSelectedCorrectOptionId(correctAnswer);
    }
  }, [options, correctAnswer]);

  const handleOptionChange = (
    lang: "english" | "hindi" | "marathi",
    index: number,
    value: string,
  ) => {
    const updated = {
      ...multipleChoiceOptions,
      [lang]: [...multipleChoiceOptions[lang]],
    };
    // Ensure ID is preserved. If option didn't exist (e.g. empty array), use corresponding English ID
    const existingOption = updated[lang][index];
    const id = existingOption?.id || multipleChoiceOptions.english[index]?.id || (index + 1);

    updated[lang][index] = { id, text: value };

    setMultipleChoiceOptions(updated);
    onOptionsChange(updated);
  };

  const addOption = () => {
    // Generate new ID (max existing ID + 1)
    const allIds = multipleChoiceOptions.english.map(o => o.id);
    const newId = (allIds.length > 0 ? Math.max(...allIds) : 0) + 1;

    const updated = {
      english: [...multipleChoiceOptions.english, { id: newId, text: "" }],
      hindi: [...multipleChoiceOptions.hindi, { id: newId, text: "" }],
      marathi: [...multipleChoiceOptions.marathi, { id: newId, text: "" }],
    };
    setMultipleChoiceOptions(updated);
    onOptionsChange(updated);
  };

  const removeOption = (index: number) => {
    if (multipleChoiceOptions.english.length <= 2) return;

    const optionToRemoveId = multipleChoiceOptions.english[index].id;

    const updated = {
      english: multipleChoiceOptions.english.filter((_, i) => i !== index),
      hindi: multipleChoiceOptions.hindi.filter((_, i) => i !== index),
      marathi: multipleChoiceOptions.marathi.filter((_, i) => i !== index),
    };

    setMultipleChoiceOptions(updated);
    onOptionsChange(updated);

    // If we removed the correct answer, reset to the first option
    if (selectedCorrectOptionId === optionToRemoveId) {
      const newCorrectId = updated.english[0]?.id ?? 0;
      setSelectedCorrectOptionId(newCorrectId);
      onCorrectAnswerChange(newCorrectId);
    }
  };

  const handleCorrectAnswerChange = (id: number) => {
    setSelectedCorrectOptionId(id);
    onCorrectAnswerChange(id);
  };

  const handleTrueFalseChange = (value: string) => {
    // for true/false, correctAnswer can be stored as 0=false, 1=true
    const ans = value === "true" ? 1 : 0;
    onCorrectAnswerChange(ans);
  };

  const handleTextAnswerChange = (value: string) => {
    // for short_answer, long_answer, coding
    onCorrectAnswerChange(value as any);
  };

  if (questionType === "MCQ") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Multiple Choice Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={selectedCorrectOptionId.toString()}
            onValueChange={(val) => handleCorrectAnswerChange(parseInt(val))}
          >
            {multipleChoiceOptions.english.map((opt, index) => (
              <div key={opt.id} className="flex gap-2 items-center">
                {/* Value matches the Option ID */}
                <RadioGroupItem value={opt.id.toString()} />
                <div className="grid grid-cols-3 gap-2 flex-1">
                  <Input
                    value={opt.text}
                    onChange={(e) =>
                      handleOptionChange("english", index, e.target.value)
                    }
                    placeholder={`EN Option ${index + 1}`}
                  />
                  <Input
                    value={multipleChoiceOptions.hindi[index]?.text || ""}
                    onChange={(e) =>
                      handleOptionChange("hindi", index, e.target.value)
                    }
                    placeholder={`HI Option ${index + 1}`}
                  />
                  <Input
                    value={multipleChoiceOptions.marathi[index]?.text || ""}
                    onChange={(e) =>
                      handleOptionChange("marathi", index, e.target.value)
                    }
                    placeholder={`MR Option ${index + 1}`}
                  />
                </div>
                {multipleChoiceOptions.english.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                  >
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

  if (questionType === "true_false") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>True/False Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={correctAnswer === 1 ? "true" : "false"}
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

  if (questionType === "short_answer" || questionType === "fill_in_blank") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expected Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={correctAnswer || ""}
            onChange={(e) => handleTextAnswerChange(e.target.value)}
            placeholder="Enter the expected answer"
          />
        </CardContent>
      </Card>
    );
  }

  if (questionType === "long_answer") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sample Answer / Grading Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={correctAnswer || ""}
            onChange={(e) => handleTextAnswerChange(e.target.value)}
            placeholder="Provide a sample answer or grading criteria"
            rows={4}
          />
        </CardContent>
      </Card>
    );
  }

  if (questionType === "coding") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expected Solution</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={correctAnswer || ""}
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
