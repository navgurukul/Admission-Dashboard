import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface QuestionFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  difficultyLevels: any;
  topics?: Array<{ id: number; topic: string; status?: boolean }>;
  className?: string;
}

export function QuestionFilters({
  filters,
  onFiltersChange,
  difficultyLevels,
  topics = [],
  className = "",
}: QuestionFiltersProps) {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearSingleFilter = (key: string) => {
    onFiltersChange({
      ...filters,
      [key]: key === "topic" ? "" : "All",
    });
  };

  const activeFilters: Array<{
    key: string;
    label: string;
    onRemove: () => void;
  }> = [];

  if (filters.difficulty_level && filters.difficulty_level !== "All") {
    const difficulty = difficultyLevels.find(
      (level: any) => String(level.id) === String(filters.difficulty_level),
    );
    activeFilters.push({
      key: `difficulty-${filters.difficulty_level}`,
      label: `Difficulty: ${difficulty?.name || filters.difficulty_level}`,
      onRemove: () => clearSingleFilter("difficulty_level"),
    });
  }

  if (filters.topic && filters.topic !== "All") {
    const topic = topics.find(
      (topicItem) => String(topicItem.id) === String(filters.topic),
    );
    activeFilters.push({
      key: `topic-${filters.topic}`,
      label: `Topic: ${topic?.topic || filters.topic}`,
      onRemove: () => clearSingleFilter("topic"),
    });
  }

  return (
    <div className={className}>
      {activeFilters.length > 0 && (
        <div className="px-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {activeFilters.map((filter) => (
              <Button
                key={filter.key}
                size="sm"
                variant="ghost"
                className="h-auto min-w-fit whitespace-nowrap rounded-full border px-2 py-1.5"
                onClick={filter.onRemove}
              >
                <span className="inline-block text-sm">{filter.label}</span>
                <X className="ml-2 h-3 w-3 flex-shrink-0" />
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 rounded-lg bg-muted/30 p-4 md:grid-cols-2">
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">Difficulty</Label>
          <Select
            value={filters.difficulty_level || "All"}
            onValueChange={(value) => updateFilter("difficulty_level", value)}
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-border bg-background">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Difficulties</SelectItem>
              {difficultyLevels.map((lvl) => (
                <SelectItem key={lvl.id} value={lvl.id.toString()}>
                  {lvl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">Topic</Label>
          <Select
            value={filters.topic || "All"}
            onValueChange={(value) =>
              updateFilter("topic", value === "All" ? "" : value)
            }
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-border bg-background">
              <SelectValue placeholder="All topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Topics</SelectItem>
              {topics.map((topic) => (
                <SelectItem key={topic.id} value={topic.id.toString()}>
                  {topic.topic}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* <div className="space-y-3">
        <Label className="text-sm font-semibold text-foreground">Question Type</Label>
          <Select
            value={filters.question_type || "All"}
            onValueChange={(value) => updateFilter("question_type", value)}
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-border bg-background">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="MCQ">Multiple Choice</SelectItem>
            </SelectContent>
          </Select>
        </Select>
      </div> */}
    </div>
  );
}
