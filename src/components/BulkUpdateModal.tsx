import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getStagesApi, getStatusesByStageId, getCampusesApi } from "@/utils/api";

interface CampusOption {
  id: number;
  campus_name: string;
}

interface Stage {
  id: number;
  stage_name: string;
}

interface Status {
  id: number;
  status_name: string;
}

interface BulkUpdateModalProps {
  selectedApplicants: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkUpdateModal({
  selectedApplicants,
  isOpen,
  onClose,
  onSuccess,
}: BulkUpdateModalProps) {
  const [updateData, setUpdateData] = useState({
    stageId: "no_change",
    statusId: "no_change",
    campusId: "no_change",
  });

  const [stageOptions, setStageOptions] = useState<Stage[]>([]);
  const [statusOptions, setStatusOptions] = useState<Status[]>([]);
  const [campusOptions, setCampusOptions] = useState<CampusOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch stages and campuses when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStages();
      fetchCampuses();
    }
  }, [isOpen]);

  const fetchStages = async () => {
    try {
      const stages = await getStagesApi();
      setStageOptions(stages);
    } catch (err) {
      console.error("Error fetching stages:", err);
    }
  };

  const fetchCampuses = async () => {
    try {
      const campuses = await getCampusesApi();
      setCampusOptions(campuses);
    } catch (err) {
      console.error("Error fetching campuses:", err);
    }
  };

  const handleStageChange = async (stageId: string) => {
    setUpdateData((prev) => ({ ...prev, stageId, statusId: "no_change" }));

    try {
      const statuses = await getStatusesByStageId(stageId);
      setStatusOptions(statuses);
    } catch (err) {
      console.error("Error fetching statuses:", err);
      setStatusOptions([]);
    }
  };

  const handleFakeUpdate = () => {
    if (
      updateData.stageId === "no_change" &&
      updateData.campusId === "no_change"
    ) {
      toast({
        title: "Error",
        description: "Please select at least a stage or campus to update.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Success",
        description: `Updated ${selectedApplicants.length} applicant(s) successfully (mock update).`,
      });
      onSuccess();
      onClose();
      setUpdateData({
        stageId: "no_change",
        statusId: "no_change",
        campusId: "no_change",
      });
    }, 800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Update - {selectedApplicants.length} Applicant(s)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Update selected fields for {selectedApplicants.length} applicant(s). Leave fields as “No change” to keep them unchanged.
            </p>
          </div>

          {/* Stage Dropdown */}
          <div>
            <Label>Stage (Optional)</Label>
            <Select
              value={updateData.stageId}
              onValueChange={handleStageChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">No change</SelectItem>
                {stageOptions.map((stage) => (
                  <SelectItem key={stage.id} value={String(stage.id)}>
                    {stage.stage_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Dropdown */}
          {statusOptions.length > 0 && updateData.stageId !== "no_change" && (
            <div>
              <Label>Status</Label>
              <Select
                value={updateData.statusId}
                onValueChange={(val) =>
                  setUpdateData((prev) => ({ ...prev, statusId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">No change</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.id} value={String(status.id)}>
                      {status.status_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Campus Dropdown */}
          <div>
            <Label>Campus (Optional)</Label>
            <Select
              value={updateData.campusId}
              onValueChange={(val) =>
                setUpdateData((prev) => ({ ...prev, campusId: val }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select campus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">No change</SelectItem>
                <SelectItem value="unassigned">Not assigned</SelectItem>
                {campusOptions.map((campus) => (
                  <SelectItem key={campus.id} value={String(campus.id)}>
                    {campus.campus_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Bulk Update</span>
              <ArrowRight className="w-4 h-4" />
              <span className="font-medium">
                {updateData.stageId !== "no_change" ||
                updateData.campusId !== "no_change"
                  ? `${
                      updateData.stageId !== "no_change"
                        ? `Stage: ${
                            stageOptions.find(
                              (s) => String(s.id) === updateData.stageId
                            )?.stage_name || updateData.stageId
                          }`
                        : ""
                    }${
                      updateData.stageId !== "no_change" &&
                      updateData.campusId !== "no_change"
                        ? ", "
                        : ""
                    }${
                      updateData.campusId !== "no_change"
                        ? `Campus: ${
                            campusOptions.find(
                              (c) => String(c.id) === updateData.campusId
                            )?.campus_name || updateData.campusId
                          }`
                        : ""
                    }`
                  : "Select fields to update"}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleFakeUpdate}
              disabled={
                loading ||
                (updateData.stageId === "no_change" &&
                  updateData.campusId === "no_change")
              }
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                `Update ${selectedApplicants.length} Applicant(s)`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
