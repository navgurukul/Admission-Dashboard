import React, { useMemo, useState, useEffect } from "react";
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
import { Pencil, Plus, Trash2, X, Bold, Italic, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TopicOption, TopicPayload } from "@/utils/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface TopicManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: TopicOption[];
  selectedTopicId?: string;
  onSelectedTopicChange?: (value: string) => void;
  onCreateTopic: (payload: TopicPayload) => Promise<TopicOption> | TopicOption;
  onUpdateTopic: (topicId: number, payload: TopicPayload) => Promise<TopicOption | void> | TopicOption | void;
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
  const [topicName, setTopicName] = useState("");
  const [englishInstruction, setEnglishInstruction] = useState("");
  const [hindiInstruction, setHindiInstruction] = useState("");
  const [marathiInstruction, setMarathiInstruction] = useState("");
  const [instructionStyle, setInstructionStyle] = useState({
    color: "#4f46e5",
    isBold: false,
    isItalic: false,
  });

  const [editingTopicId, setEditingTopicId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortedTopics = useMemo(
    () =>
      [...topics].sort((a, b) =>
        a.topic.localeCompare(b.topic, undefined, { sensitivity: "base" }),
      ),
    [topics],
  );

  const resetEditor = () => {
    setTopicName("");
    setEnglishInstruction("");
    setHindiInstruction("");
    setMarathiInstruction("");
    setInstructionStyle({
      color: "#4f46e5",
      isBold: false,
      isItalic: false,
    });
    setEditingTopicId(null);
  };

  const startEditing = (topic: TopicOption) => {
    setEditingTopicId(topic.id);
    setTopicName(topic.topic);
    setEnglishInstruction(topic.english_instruction || "");
    setHindiInstruction(topic.hindi_instruction || "");
    setMarathiInstruction(topic.marathi_instruction || "");
    setInstructionStyle(topic.instruction_style || {
      color: "#4f46e5",
      isBold: false,
      isItalic: false,
    });
  };

  const handleSave = async () => {
    if (!topicName.trim()) {
      toast({
        title: "Topic name required",
        variant: "destructive",
      });
      return;
    }

    const payload: TopicPayload = {
      topic: topicName.trim(),
      english_instruction: englishInstruction.trim() || undefined,
      hindi_instruction: hindiInstruction.trim() || undefined,
      marathi_instruction: marathiInstruction.trim() || undefined,
      instruction_style: instructionStyle,
      status: true,
    };

    setIsSubmitting(true);
    try {
      if (editingTopicId) {
        const result = await onUpdateTopic(editingTopicId, payload);
        toast({
          title: "Topic updated",
          description: (result as any)?.message,
          className: "border-green-500 bg-green-50 text-green-900",
        });
      } else {
        const created = await onCreateTopic(payload);
        onSelectedTopicChange?.(String(created.id));
        toast({
          title: "Topic created",
          description: created.message,
          className: "border-green-500 bg-green-50 text-green-900",
        });
      }
      resetEditor();
    } catch (error: any) {
      toast({
        title: error?.message || "Operation failed",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (topicId: number) => {
    if (!confirm("Are you sure you want to delete this topic?")) return;
    
    setIsSubmitting(true);
    try {
      const result = await onDeleteTopic(topicId);
      if (selectedTopicId === String(topicId)) {
        onSelectedTopicChange?.("");
      }
      if (editingTopicId === topicId) {
        resetEditor();
      }
      toast({
        title: "Topic deleted",
        description: (result as any)?.message,
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

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetEditor();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingTopicId ? "Edit Topic" : "Topic Management"}</DialogTitle>
          <DialogDescription>
            Manage topics and their specific instructions for students.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px] flex-1 overflow-hidden">
          {/* Form Side */}
          <div className="space-y-4 overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label htmlFor="topic-name">Topic Name</Label>
              <Input
                id="topic-name"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g. Mathematical Patterns"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Topic Instructions (Optional)</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant={instructionStyle.isBold ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setInstructionStyle(s => ({ ...s, isBold: !s.isBold }))}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={instructionStyle.isItalic ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setInstructionStyle(s => ({ ...s, isItalic: !s.isItalic }))}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-2 ml-2 border rounded-md px-2 py-1 bg-white">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <input 
                      type="color" 
                      value={instructionStyle.color}
                      onChange={(e) => setInstructionStyle(s => ({ ...s, color: e.target.value }))}
                      className="h-6 w-6 border-none cursor-pointer p-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>

              <Tabs defaultValue="english" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="english">English</TabsTrigger>
                  <TabsTrigger value="hindi">Hindi</TabsTrigger>
                  <TabsTrigger value="marathi">Marathi</TabsTrigger>
                </TabsList>
                <TabsContent value="english">
                  <Textarea
                    placeholder="Enter instructions in English..."
                    value={englishInstruction}
                    onChange={(e) => setEnglishInstruction(e.target.value)}
                    className="h-32 min-h-[120px]"
                    style={{ 
                      color: instructionStyle.color,
                      fontWeight: instructionStyle.isBold ? 'bold' : 'normal',
                      fontStyle: instructionStyle.isItalic ? 'italic' : 'normal'
                    }}
                  />
                </TabsContent>
                <TabsContent value="hindi">
                  <Textarea
                    placeholder="हिंदी में निर्देश दर्ज करें..."
                    value={hindiInstruction}
                    onChange={(e) => setHindiInstruction(e.target.value)}
                    className="h-32 min-h-[120px]"
                    style={{ 
                      color: instructionStyle.color,
                      fontWeight: instructionStyle.isBold ? 'bold' : 'normal',
                      fontStyle: instructionStyle.isItalic ? 'italic' : 'normal'
                    }}
                  />
                </TabsContent>
                <TabsContent value="marathi">
                  <Textarea
                    placeholder="मराठीत सूचना प्रविष्ट करा..."
                    value={marathiInstruction}
                    onChange={(e) => setMarathiInstruction(e.target.value)}
                    className="h-32 min-h-[120px]"
                    style={{ 
                      color: instructionStyle.color,
                      fontWeight: instructionStyle.isBold ? 'bold' : 'normal',
                      fontStyle: instructionStyle.isItalic ? 'italic' : 'normal'
                    }}
                  />
                </TabsContent>
              </Tabs>
              <p className="text-[10px] text-muted-foreground italic">
                These instructions will appear right before the first question of this topic in the test.
              </p>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSave} disabled={isSubmitting}>
                {editingTopicId ? "Update Topic" : "Add Topic"}
              </Button>
              {editingTopicId && (
                <Button variant="outline" onClick={resetEditor} disabled={isSubmitting}>
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* List Side */}
          <div className="flex flex-col border rounded-lg bg-muted/30 overflow-hidden">
            <div className="p-3 border-b bg-white flex items-center justify-between">
              <Label className="font-semibold text-xs uppercase tracking-wider">Existing Topics</Label>
              <Badge variant="secondary" className="text-[10px]">{sortedTopics.length}</Badge>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-2">
                {sortedTopics.map((topic) => {
                  const isSelected = selectedTopicId === String(topic.id);
                  const isEditing = editingTopicId === topic.id;

                  return (
                    <div
                      key={topic.id}
                      className={`group p-2 rounded-md border transition-all ${
                        isEditing ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-white hover:border-primary/50"
                      } ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-medium truncate ${isSelected ? "text-primary" : ""}`}>
                            {topic.topic}
                          </p>
                          {(topic.english_instruction || topic.hindi_instruction || topic.marathi_instruction) && (
                            <Badge variant="outline" className="h-4 px-1 text-[8px] border-blue-200 bg-blue-50 text-blue-700">
                              Has Instructions
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => startEditing(topic)}
                            disabled={isSubmitting}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(topic.id)}
                            disabled={isSubmitting}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="mt-4 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
