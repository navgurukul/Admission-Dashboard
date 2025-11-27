import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDifficultyLevels } from "@/hooks/useDifficultyLevels";

interface DifficultyLevelSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showActiveOnly?: boolean;
  className?: string;
  disabled?: boolean;
}

export function DifficultyLevelSelector({
  value,
  onValueChange,
  placeholder = "Select difficulty level",
  showActiveOnly = true,
  className,
  disabled = false,
}: DifficultyLevelSelectorProps) {
  const {
    difficultyLevels,
    loading,
    fetchDifficultyLevels,
    difficultyLevelUtils,
  } = useDifficultyLevels();

  useEffect(() => {
    fetchDifficultyLevels();
  }, [fetchDifficultyLevels]);

  // Filter levels based on showActiveOnly prop
  const filteredLevels = showActiveOnly
    ? difficultyLevels.filter((level) => level.status)
    : difficultyLevels;

  // Sort levels by name
  const sortedLevels = filteredLevels.sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={loading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {loading ? (
          <SelectItem value="" disabled>
            Loading difficulty levels...
          </SelectItem>
        ) : sortedLevels.length === 0 ? (
          <SelectItem value="" disabled>
            No difficulty levels available
          </SelectItem>
        ) : (
          sortedLevels.map((level) => (
            <SelectItem key={level.id} value={level.id.toString()}>
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: level.color || "#3B82F6" }}
                />
                <span>{level.name}</span>
                {!level.status && (
                  <Badge variant="secondary" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

// Badge component for displaying difficulty level
interface DifficultyLevelBadgeProps {
  levelId: string | number;
  className?: string;
}

export function DifficultyLevelBadge({
  levelId,
  className,
}: DifficultyLevelBadgeProps) {
  const {
    difficultyLevels,
    loading,
    fetchDifficultyLevels,
    difficultyLevelUtils,
  } = useDifficultyLevels();
  const [level, setLevel] = useState<any>(null);

  useEffect(() => {
    fetchDifficultyLevels();
  }, [fetchDifficultyLevels]);

  useEffect(() => {
    if (difficultyLevels.length > 0) {
      const foundLevel = difficultyLevels.find(
        (l) => l.id.toString() === levelId.toString(),
      );
      setLevel(foundLevel || null);
    }
  }, [difficultyLevels, levelId]);

  if (loading || !level) {
    return (
      <Badge variant="secondary" className={className}>
        Loading...
      </Badge>
    );
  }

  return (
    <Badge
      className={`${difficultyLevelUtils.getDifficultyColor(level.name)} ${className || ""}`}
      variant="secondary"
    >
      <div className="flex items-center gap-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: level.color || "#3B82F6" }}
        />
        {level.name}
      </div>
    </Badge>
  );
}

// Display component for showing difficulty level info
interface DifficultyLevelDisplayProps {
  levelId: string | number;
  showDescription?: boolean;
  className?: string;
}

export function DifficultyLevelDisplay({
  levelId,
  showDescription = false,
  className,
}: DifficultyLevelDisplayProps) {
  const {
    difficultyLevels,
    loading,
    fetchDifficultyLevels,
    difficultyLevelUtils,
  } = useDifficultyLevels();
  const [level, setLevel] = useState<any>(null);

  useEffect(() => {
    fetchDifficultyLevels();
  }, [fetchDifficultyLevels]);

  useEffect(() => {
    if (difficultyLevels.length > 0) {
      const foundLevel = difficultyLevels.find(
        (l) => l.id.toString() === levelId.toString(),
      );
      setLevel(foundLevel || null);
    }
  }, [difficultyLevels, levelId]);

  if (loading || !level) {
    return (
      <div className={`text-muted-foreground ${className || ""}`}>
        Loading...
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className || ""}`}>
      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: level.color || "#3B82F6" }}
      />
      <div>
        <span className="font-medium">{level.name}</span>
        {showDescription && level.description && (
          <p className="text-sm text-muted-foreground">{level.description}</p>
        )}
      </div>
      {!level.status && (
        <Badge variant="secondary" className="text-xs">
          Inactive
        </Badge>
      )}
    </div>
  );
}
