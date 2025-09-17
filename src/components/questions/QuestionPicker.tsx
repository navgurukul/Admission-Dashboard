import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

export function QuestionPicker({ allQuestions, activeSet, onClose, onSave }) {
  const [selected, setSelected] = useState(activeSet.questions || []);

  useEffect(() => {
    setSelected(activeSet.questions || []);
  }, [activeSet]);

  const toggle = (q) => {
    setSelected((prev) =>
      prev.includes(q)
        ? prev.filter((id) => id !== q)
        : [...prev, q]
    );
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Choose Questions for <span className="font-semibold">{activeSet.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[400px] overflow-y-auto space-y-2 mt-3">
          {allQuestions.map((q) => (
            <div key={q.id} className="flex items-start gap-3 p-2 border rounded hover:bg-gray-50">
              <Checkbox
                checked={selected.includes(q.id)}
                onCheckedChange={() => toggle(q.id)}
              />
              <div className="text-sm flex-1">{q.english_text}</div>
              <div className="text-sm flex-1">{q.hindi_text}</div>
              <div className="text-sm flex-1">{q.marathi_text}</div>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4">
          <div className="text-sm text-gray-600 mr-auto">
            Selected: {selected.length}
            {activeSet.limit ? ` / ${activeSet.limit}` : ""}
          </div>
          <Button onClick={handleSave}>Save</Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
