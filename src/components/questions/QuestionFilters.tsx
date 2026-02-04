import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface QuestionFiltersProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  difficultyLevels: any;
}

export function QuestionFilters({
  filters,
  onFiltersChange,
  difficultyLevels,
}: QuestionFiltersProps) {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: "All",
      difficulty_level: "All",
      question_type: "All",
      topic: "",
    });
  };

  return (
    <div className="p-4 bg-muted/30 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filters</h3>
        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
          Clear All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Difficulty</Label>
          <Select
            value={filters.difficulty_level || "All"}
            onValueChange={(value) => updateFilter("difficulty_level", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {difficultyLevels.map((lvl) => (
                <SelectItem key={lvl.id} value={lvl.id.toString()}>
                  {lvl.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* <div>
          <Label>Question Type</Label>
          <Select
            value={filters.question_type || "All"}
            onValueChange={(value) => updateFilter("question_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="MCQ">Multiple Choice</SelectItem>
            </SelectContent>
          </Select>
        </div> */}
      </div>
    </div>
  );
}
