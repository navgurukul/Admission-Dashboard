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
import type { TopicOption } from "@/utils/api";

interface TopicManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: TopicOption[];
  selectedTopicId?: string;
  onSelectedTopicChange?: (value: string) => void;
  onCreateTopic: (topicName: string) => Promise<TopicOption> | TopicOption;
  onUpdateTopic: (topicId: number, topicName: string) => Promise<TopicOption | void> | TopicOption | void;
  onDeleteTopic: (topicId: number) => Promise<{ message?: string } | void> | { message?: string } | void;
}

export function TopicManagementDialog({
  open,
  onOpenChange,
  topics,
  selectedTopicId,
  onSelectedTopicChange,
  onCreateTopic,
  onUpdateTopic,
  onDeleteTopic,
}: TopicManagementDialogProps) {
  const { toast } = useToast();
  const [newTopicName, setNewTopicName] = useState("");
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [editingTopicName, setEditingTopicName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedTopics = useMemo(
    () =>
      [...topics].sort((a, b) =>
        a.topic.localeCompare(b.topic, undefined, { sensitivity: "base" }),
      ),
    [topics],
  );

  const resetEditor = () => {
    setNewTopicName("");
    setEditingTopicId(null);
    setEditingTopicName("");
  };

  const handleCreate = async () => {
    const topicName = newTopicName.trim();

    setIsSubmitting(true);
    try {
      const createdTopic = await onCreateTopic(topicName);
      setNewTopicName("");
      onSelectedTopicChange?.(String(createdTopic.id));
      toast({
        title: "Topic created",
        description: createdTopic.message,
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } catch (error: any) {
      toast({
        title: error?.message,
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (editingTopicId === null) return;

    const topicName = editingTopicName.trim();

    setIsSubmitting(true);
    try {
      const updatedTopic = await onUpdateTopic(editingTopicId, topicName);
      const Message =
        updatedTopic && typeof updatedTopic === "object" && "message" in updatedTopic
          ? updatedTopic.message
          : undefined;
      resetEditor();
      toast({
        title: "Topic updated",
        description: Message,
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } catch (error: any) {
      toast({
        title: error?.message,
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (topicId: number) => {
    setIsSubmitting(true);
    try {
      const result = await onDeleteTopic(topicId);
      const Message =
        result && typeof result === "object" && "message" in result
          ? result.message
          : undefined;
      if (selectedTopicId === String(topicId)) {
        onSelectedTopicChange?.("");
      }
      if (editingTopicId === topicId) {
        resetEditor();
      }
      toast({
        title: "Topic deleted",
        description: Message,
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } catch (error: any) {
      toast({
        title: error?.message,
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (topic: TopicOption) => {
    setEditingTopicId(topic.id);
    setEditingTopicName(topic.topic);
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
          <DialogTitle>Topic Management</DialogTitle>
          <DialogDescription>
            Create, update, or delete topics.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-3 rounded-lg border p-4">
            <div className="space-y-2">
              <Label htmlFor="new-topic-name">Create Topic</Label>
              <Input
                id="new-topic-name"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                placeholder="Enter topic name"
                disabled={isSubmitting}
              />
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={handleCreate}
              disabled={isSubmitting}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Topic
            </Button>

          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Available Topics</Label>
              <Badge variant="outline">{sortedTopics.length} topics</Badge>
            </div>

            <ScrollArea className="h-[320px] rounded-lg border">
              <div className="space-y-3 p-4">
                {sortedTopics.length === 0 ? (
                  <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                    No topics available yet.
                  </div>
                ) : (
                  sortedTopics.map((topic) => {
                    const isEditing = editingTopicId === topic.id;
                    const isSelected = selectedTopicId === String(topic.id);

                    return (
                      <div
                        key={topic.id}
                        className="rounded-lg border p-3 transition-colors hover:bg-muted/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-2">
                            {isEditing ? (
                              <Input
                                value={editingTopicName}
                                onChange={(e) =>
                                  setEditingTopicName(e.target.value)
                                }
                                disabled={isSubmitting}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{topic.topic}</p>
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
                                  onClick={() => startEditing(topic)}
                                  disabled={isSubmitting}
                                  title="Rename topic"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDelete(topic.id)}
                                  disabled={isSubmitting}
                                  title="Delete topic"
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
