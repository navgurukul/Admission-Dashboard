import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DifficultyLevel {
  id: number;
  name: string;
  points: number;
  status?: boolean;
}

interface DifficultyLevelManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levels: DifficultyLevel[];
  selectedLevelId?: string;
  onSelectedLevelChange?: (value: string) => void;
  onCreateLevel: (name: string, marks: number) => Promise<DifficultyLevel> | DifficultyLevel;
  onUpdateLevel: (id: number, name: string, marks: number) => Promise<DifficultyLevel | void> | DifficultyLevel | void;
  onDeleteLevel: (id: number) => Promise<{ message?: string } | void> | { message?: string } | void;
}

export function DifficultyLevelManagementDialog({
  open,
  onOpenChange,
  levels,
  selectedLevelId,
  onSelectedLevelChange,
  onCreateLevel,
  onUpdateLevel,
  onDeleteLevel,
}: DifficultyLevelManagementDialogProps) {
  const { toast } = useToast();
  const [newLevelName, setNewLevelName] = useState("");
  const [newLevelMarks, setNewLevelMarks] = useState<string>("0");
  const [editingLevelId, setEditingLevelId] = useState<number | null>(null);
  const [editingLevelName, setEditingLevelName] = useState("");
  const [editingLevelMarks, setEditingLevelMarks] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedLevels = useMemo(
    () =>
      [...levels].sort((a, b) => a.points - b.points),
    [levels],
  );

  const resetEditor = () => {
    setNewLevelName("");
    setNewLevelMarks("0");
    setEditingLevelId(null);
    setEditingLevelName("");
    setEditingLevelMarks("0");
  };

  const handleCreate = async () => {
    const name = newLevelName.trim();
    const marks = parseInt(newLevelMarks);

    if (!name) return;
    if (isNaN(marks)) return;

    setIsSubmitting(true);
    try {
      const createdLevel = await onCreateLevel(name, marks);
      setNewLevelName("");
      setNewLevelMarks("0");
      onSelectedLevelChange?.(String(createdLevel.id));
      toast({
        title: "Difficulty level created",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } catch (error: any) {
      toast({
        title: error?.message || "Failed to create difficulty level",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (editingLevelId === null) return;

    const name = editingLevelName.trim();
    const marks = parseInt(editingLevelMarks);

    if (!name) return;
    if (isNaN(marks)) return;

    setIsSubmitting(true);
    try {
      await onUpdateLevel(editingLevelId, name, marks);
      resetEditor();
      toast({
        title: "Difficulty level updated",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } catch (error: any) {
      toast({
        title: error?.message || "Failed to update difficulty level",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsSubmitting(true);
    try {
      await onDeleteLevel(id);
      if (selectedLevelId === String(id)) {
        onSelectedLevelChange?.("");
      }
      if (editingLevelId === id) {
        resetEditor();
      }
      toast({
        title: "Difficulty level deleted",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } catch (error: any) {
      toast({
        title: error?.message || "Failed to delete difficulty level",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (level: DifficultyLevel) => {
    setEditingLevelId(level.id);
    setEditingLevelName(level.name);
    setEditingLevelMarks(String(level.points));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetEditor();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Difficulty Level Management</DialogTitle>
          <DialogDescription>
            Create, update, or delete difficulty levels.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-3 rounded-lg border p-4">
            <div className="space-y-2">
              <Label htmlFor="new-level-name">Create Level</Label>
              <Input
                id="new-level-name"
                value={newLevelName}
                onChange={(e) => setNewLevelName(e.target.value)}
                placeholder="Name (e.g. Expert)"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-level-marks">Marks</Label>
              <Input
                id="new-level-marks"
                type="number"
                value={newLevelMarks}
                onChange={(e) => setNewLevelMarks(e.target.value)}
                placeholder="Marks"
                disabled={isSubmitting}
              />
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={handleCreate}
              disabled={isSubmitting || !newLevelName.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Level
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Available Levels</Label>
              <Badge variant="outline">{sortedLevels.length} levels</Badge>
            </div>

            <ScrollArea className="h-[320px] rounded-lg border">
              <div className="space-y-3 p-4">
                {sortedLevels.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No difficulty levels available yet.
                  </div>
                ) : (
                  sortedLevels.map((level) => {
                    const isEditing = editingLevelId === level.id;
                    const isSelected = selectedLevelId === String(level.id);

                    return (
                      <div
                        key={level.id}
                        className="rounded-lg border p-3 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-2">
                            {isEditing ? (
                              <div className="space-y-2">
                                <Input
                                  value={editingLevelName}
                                  onChange={(e) =>
                                    setEditingLevelName(e.target.value)
                                  }
                                  placeholder="Name"
                                  disabled={isSubmitting}
                                />
                                <Input
                                  type="number"
                                  value={editingLevelMarks}
                                  onChange={(e) =>
                                    setEditingLevelMarks(e.target.value)
                                  }
                                  placeholder="Marks"
                                  disabled={isSubmitting}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{level.name}</p>
                                <Badge variant="outline">{level.points} marks</Badge>
                                {isSelected && (
                                  <Badge variant="secondary">Selected</Badge>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleUpdate}
                                  disabled={isSubmitting}
                                >
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={resetEditor}
                                  disabled={isSubmitting}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => startEditing(level)}
                                  disabled={isSubmitting}
                                  title="Edit level"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDelete(level.id)}
                                  disabled={isSubmitting}
                                  title="Delete level"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
