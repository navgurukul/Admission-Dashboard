import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getSchedulingHistory, createSchedulingAttempt } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ApplicantSchedulingProps {
  student: any;
  targetRound: "LR" | "CFR";
  onProfileUpdate?: () => void;
}

export function ApplicantScheduling({ student, targetRound, onProfileUpdate }: ApplicantSchedulingProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  const isScreeningPassed = (student?.exam_sessions || []).some((session: any) => {
    if (session?.is_archived === true) return false;
    const stat = session?.status || "";
    return stat.toLowerCase().includes("pass") || stat === "Created Student Without Exam";
  });

  const isLearningPassed = (student?.interview_learner_round || []).some((round: any) => {
    if (round?.is_archived === true) return false;
    const stat = round?.learning_round_status || "";
    return stat.toLowerCase().includes("pass");
  });

  const isCulturalPassed = (student?.interview_cultural_fit_round || []).some((round: any) => {
    if (round?.is_archived === true) return false;
    const stat = round?.cultural_fit_status || "";
    return stat.toLowerCase().includes("pass");
  });

  const isEligible = targetRound === "LR" ? isScreeningPassed : (isScreeningPassed && isLearningPassed);
  
  const isTargetRoundPassed = targetRound === "LR" ? isLearningPassed : isCulturalPassed;

  const fetchHistory = React.useCallback(async () => {
    if (!student?.id) return;
    setLoading(true);
    try {
      const data = await getSchedulingHistory(student.id);
      const dataArray = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setHistory(dataArray);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [student?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const roundHistory = history.filter((h) => h.round === targetRound || h.round_type === targetRound);

  const handleOpenModal = () => {
    setStatus("");
    setRemarks("");
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!status) {
      toast({ title: "Validation Error", description: "Please select status", variant: "destructive" });
      return;
    }
    
    setSubmitting(true);
    try {
      await createSchedulingAttempt({
        student_id: student.id,
        round: targetRound,
        status: status,
        remarks: remarks,
        scheduling_method: "Team Assisted"
      });
      
      toast({ title: "Success", description: "Call attempt logged successfully" });
      setIsModalOpen(false);
      fetchHistory();
      
      if (status === "Disinterested" && onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to log attempt", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const tableRows: any[] = [];
  if (isEligible) {
    if (roundHistory.length === 0) {
      tableRows.push({ isPlaceholder: true, displayRound: targetRound, status: "Not Started" });
    } else {
      tableRows.push(...roundHistory.map(h => ({ ...h, displayRound: targetRound })));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-sm font-semibold text-gray-700">
          {targetRound === "LR" ? "LR" : "CFR"} Schedule Activity
        </h3>
        <Button 
          onClick={handleOpenModal} 
          disabled={!isEligible || isTargetRoundPassed} 
          size="sm" 
          variant="outline" 
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Log Follow-up
        </Button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 px-1">Loading history...</div>
      ) : (
        <div className="border rounded-md shadow-sm bg-white overflow-y-auto max-h-[250px] relative">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-[0_1px_3px_0_rgba(0,0,0,0.1)]">
              <TableRow>
                <TableHead className="font-semibold text-gray-700 w-[80px]">Round</TableHead>
                <TableHead className="font-semibold text-gray-700">Method</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Remarks</TableHead>
                <TableHead className="font-semibold text-gray-700">Logged By</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-6">
                    {!isEligible 
                      ? (targetRound === "LR" ? "Not eligible yet (Screening not passed)." : "Not eligible yet (Learning Round not passed).")
                      : "No scheduling history found."}
                  </TableCell>
                </TableRow>
              ) : (
                tableRows.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium text-gray-900">{row.displayRound}</TableCell>
                    <TableCell className="text-gray-600">{row.isPlaceholder ? "—" : (row.scheduling_method || "—")}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        (row.status === "Scheduled" || row.status === "Rescheduled") ? "bg-green-100 text-green-800" :
                        (row.status === "Wrong Number" || row.status === "Not Responding" || row.status === "Switch Off") ? "bg-red-100 text-red-800" :
                        row.status === "Disinterested" ? "bg-gray-100 text-gray-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {row.status || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-600 max-w-[200px] truncate" title={row.remarks}>
                      {row.isPlaceholder ? "—" : (row.remarks || "—")}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {row.isPlaceholder ? "—" : (row.logged_by || "—")}
                    </TableCell>
                    <TableCell className="text-gray-600 text-right whitespace-nowrap">
                      {row.isPlaceholder ? "—" : (() => {
                        const d = new Date(row.created_at);
                        if (isNaN(d.getTime())) return "—";
                        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        let hours = d.getHours();
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        hours = hours % 12;
                        hours = hours ? hours : 12;
                        const mins = d.getMinutes().toString().padStart(2, '0');
                        return `${d.getDate()} ${months[d.getMonth()]}, ${hours}:${mins} ${ampm}`;
                      })()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log {targetRound} Call Attempt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wrong Number">Wrong Number</SelectItem>
                  <SelectItem value="Not Responding">Not Responding</SelectItem>
                  <SelectItem value="Switch Off">Switch Off</SelectItem>
                  <SelectItem value="Disinterested">Disinterested</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks</label>
              <Textarea 
                value={remarks} 
                onChange={e => setRemarks(e.target.value)}
                placeholder="Enter call remarks..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Save Attempt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
