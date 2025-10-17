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
import {
  getCampusesApi,
  getAllStates,
  getDistrictsByState,
  getBlocksByDistrict,
  getAllCasts,
  getAllQualification,
  getAllStatus,
  updateStudent,
  submitFinalDecision,
} from "@/utils/api";
import { Input } from "@/components/ui/input"; // added for city / date inputs

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

interface StateOption {
  value: string;
  label: string;
}
interface DistrictOption {
  value: string;
  label: string;
}
interface BlockOption {
  value: string;
  label: string;
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
  // ---------- Expanded update payload ----------
  const [updateData, setUpdateData] = useState({
    stageId: "no_change",
    statusId: "no_change",
    campusId: "no_change",
    state: "no_change",
    district: "no_change",
    block: "no_change",
    city: "",
    // NEW fields
    castId: "no_change",
    qualificationId: "no_change",
    currentWorkId: "no_change",
    offerLetterStatus: "no_change",
    onboardedStatus: "no_change",
    joiningDate: "",
    finalNotes: "",
  });


  const [statusOptions, setStatusOptions] = useState<Status[]>([]);
  const [campusOptions, setCampusOptions] = useState<CampusOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // New location & state data
  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);
  const [blockOptions, setBlockOptions] = useState<BlockOption[]>([]);

  // NEW option lists for cast / qualification / current work
  const [castOptions, setCastOptions] = useState<{ value: string; label: string }[]>([]);
  const [qualificationOptions, setQualificationOptions] = useState<{ value: string; label: string }[]>([]);
  const [currentWorkOptions, setCurrentWorkOptions] = useState<{ value: string; label: string }[]>([]);

  // Fetch stages and campuses when modal opens, plus states and the new dropdowns
  useEffect(() => {
    if (isOpen) {
  
      fetchCampuses();
      fetchStates();
      fetchDropdowns(); // NEW
    }
  }, [isOpen]);


  const fetchCampuses = async () => {
    try {
      const campuses = await getCampusesApi();
      setCampusOptions(campuses);
    } catch (err) {
      console.error("Error fetching campuses:", err);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await getAllStates();
      const states = (res?.data || res || []).map((s: any) => ({
        value: s.state_code,
        label: s.state_name,
      }));
      setStateOptions(states);
    } catch (err) {
      console.error("Error fetching states:", err);
      setStateOptions([]);
    }
  };

  // NEW: fetch cast / qualification / current work options
  const fetchDropdowns = async () => {
    try {
      const [castsRes, qualsRes, statusRes] = await Promise.all([
        getAllCasts().catch(() => []),
        getAllQualification().catch(() => []),
        getAllStatus().catch(() => []),
      ]);

      setCastOptions(
        (castsRes || []).map((c: any) => ({
          value: String(c.id),
          label: c.cast_name || c.name || `#${c.id}`,
        }))
      );

      setQualificationOptions(
        (qualsRes || []).map((q: any) => ({
          value: String(q.id),
          label: q.qualification_name || q.name || `#${q.id}`,
        }))
      );

      setCurrentWorkOptions(
        (statusRes || []).map((s: any) => ({
          value: String(s.id),
          label: s.current_status_name || s.name || `#${s.id}`,
        }))
      );
    } catch (err) {
      console.error("Error fetching dropdowns:", err);
    }
  };

  // ---------- Dependent dropdowns ----------



  const handleStateChange = async (stateCode: string) => {
    setUpdateData((prev) => ({ ...prev, state: stateCode, district: "no_change", block: "no_change" }));
    setDistrictOptions([]);
    setBlockOptions([]);

    try {
      const res = await getDistrictsByState(stateCode);
      const districts = (res?.data || res || []).map((d: any) => ({
        value: d.district_code,
        label: d.district_name,
      }));
      setDistrictOptions(districts);
    } catch (err) {
      console.error("Error fetching districts:", err);
      setDistrictOptions([]);
    }
  };

  const handleDistrictChange = async (districtCode: string) => {
    setUpdateData((prev) => ({ ...prev, district: districtCode, block: "no_change" }));
    setBlockOptions([]);

    try {
      const res = await getBlocksByDistrict(districtCode);
      const blocks = (res?.data || res || []).map((b: any) => ({
        value: b.block_code,
        label: b.block_name,
      }));
      setBlockOptions(blocks);
    } catch (err) {
      console.error("Error fetching blocks:", err);
      setBlockOptions([]);
    }
  };

  // ---------- Replace mock update with per-applicant API calls ----------
  const handleBulkUpdate = async () => {
    // Ensure at least one real change
    const isNoChange =
      updateData.stageId === "no_change" &&
      updateData.campusId === "no_change" &&
      updateData.state === "no_change" &&
      updateData.district === "no_change" &&
      updateData.block === "no_change" &&
      updateData.castId === "no_change" &&
      updateData.qualificationId === "no_change" &&
      updateData.currentWorkId === "no_change" &&
      updateData.offerLetterStatus === "no_change" &&
      updateData.onboardedStatus === "no_change" &&
      !updateData.joiningDate &&
      !updateData.finalNotes;

    if (isNoChange) {
      toast({
        title: "Error",
        description: "Please select at least one field to update.",
        variant: "destructive",
      });
      return;
    }

    // Build shared payload fragments (student-level fields)
    const studentFields: Record<string, any> = {};
    if (updateData.stageId !== "no_change") {
      studentFields.stage_id = Number(updateData.stageId);
      if (updateData.statusId !== "no_change") studentFields.status_id = Number(updateData.statusId);
    }
    if (updateData.campusId !== "no_change") {
      studentFields.campus_id = updateData.campusId === "unassigned" ? null : Number(updateData.campusId);
    }
    if (updateData.castId !== "no_change") studentFields.cast_id = Number(updateData.castId);
    if (updateData.qualificationId !== "no_change") studentFields.qualification_id = Number(updateData.qualificationId);
    if (updateData.currentWorkId !== "no_change") studentFields.current_status_id = Number(updateData.currentWorkId);
    if (updateData.state !== "no_change") studentFields.state = updateData.state;
    if (updateData.district !== "no_change") studentFields.district = updateData.district;
    if (updateData.block !== "no_change") studentFields.block = updateData.block;
 ;

    // Final decision fields (separate API)
    const finalDecisionFields: Record<string, any> = {};
    if (updateData.offerLetterStatus !== "no_change") finalDecisionFields.offer_letter_status = updateData.offerLetterStatus;
    if (updateData.onboardedStatus !== "no_change") finalDecisionFields.onboarded_status = updateData.onboardedStatus;
    if (updateData.joiningDate) finalDecisionFields.joining_date = updateData.joiningDate;
    if (updateData.finalNotes) finalDecisionFields.final_notes = updateData.finalNotes;

    setLoading(true);
    const errors: { id: string; error: any }[] = [];

    try {
      // Update each selected applicant one-by-one
      for (const applicantId of selectedApplicants) {
        try {
          // 1) Update student core fields if any
          if (Object.keys(studentFields).length > 0) {
            await updateStudent(applicantId, studentFields);
          }

          // 2) Update final decision if any final decision fields provided
          if (Object.keys(finalDecisionFields).length > 0) {
            const payload = { student_id: applicantId, ...finalDecisionFields };
            await submitFinalDecision(payload);
          }
        } catch (err) {
          console.error(`Failed updating applicant ${applicantId}:`, err);
          errors.push({ id: applicantId, error: err });
        }
      }

      if (errors.length === 0) {
        toast({
          title: "Success",
          description: `Updated ${selectedApplicants.length} applicant(s) successfully.`,
        });
      } else if (errors.length === selectedApplicants.length) {
        toast({
          title: "Failed",
          description: `All ${selectedApplicants.length} updates failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Partial Success",
          description: `Updated ${selectedApplicants.length - errors.length}/${selectedApplicants.length} applicants. ${errors.length} failed.`,
          variant: "destructive",
        });
      }

      onSuccess();
      onClose();

      // Reset form
      setUpdateData({
        stageId: "no_change",
        statusId: "no_change",
        campusId: "no_change",
        state: "no_change",
        district: "no_change",
        block: "no_change",
        city: "",
        castId: "no_change",
        qualificationId: "no_change",
        currentWorkId: "no_change",
        offerLetterStatus: "no_change",
        onboardedStatus: "no_change",
        joiningDate: "",
        finalNotes: "",
      });
    } catch (err: any) {
      console.error("Bulk update failure:", err);
      toast({
        title: "Update Failed",
        description: err?.message || "Bulk update failed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

          {/* ---------- New: Location fields ---------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>State (Optional)</Label>
              <Select
                value={updateData.state}
                onValueChange={(val) => handleStateChange(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">No change</SelectItem>
                  {stateOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Changing state will reset district and block selections.
              </p>
            </div>

            <div>
              <Label>District (Optional)</Label>
              <Select
                value={updateData.district}
                onValueChange={(val) => handleDistrictChange(val)}
                disabled={updateData.state === "no_change" || districtOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">No change</SelectItem>
                  {districtOptions.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Changing district will reset the block selection.
              </p>
            </div>

            <div>
              <Label>Block (Optional)</Label>
              <Select
                value={updateData.block}
                onValueChange={(val) =>
                  setUpdateData((prev) => ({ ...prev, block: val }))
                }
                disabled={updateData.district === "no_change" || blockOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select block" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">No change</SelectItem>
                  {blockOptions.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Block options depend on the selected district.
              </p>
            </div>

            
          </div>

          {/* ---------- New: Personal fields (Caste / Qualification / Current Work) ---------- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Caste</Label>
              <Select
                value={(updateData as any).castId}
                onValueChange={(val) =>
                  setUpdateData((prev) => ({ ...prev, castId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select caste" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">No change</SelectItem>
                  {castOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Qualification</Label>
              <Select
                value={(updateData as any).qualificationId}
                onValueChange={(val) =>
                  setUpdateData((prev) => ({ ...prev, qualificationId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select qualification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">No change</SelectItem>
                  {qualificationOptions.map((q) => (
                    <SelectItem key={q.value} value={q.value}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Current Work</Label>
              <Select
                value={(updateData as any).currentWorkId}
                onValueChange={(val) =>
                  setUpdateData((prev) => ({ ...prev, currentWorkId: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select current work" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">No change</SelectItem>
                  {currentWorkOptions.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ---------- New: Offer / Final status ---------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Offer Letter Status</Label>
              <Select
                value={updateData.offerLetterStatus}
                onValueChange={(val) =>
                  setUpdateData((prev) => ({ ...prev, offerLetterStatus: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select offer status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">No change</SelectItem>
                  <SelectItem value="Offer Pending">Offer Pending</SelectItem>
                  <SelectItem value="Offer Sent">Offer Sent</SelectItem>
                  <SelectItem value="Offer Accepted">Offer Accepted</SelectItem>
                  <SelectItem value="Offer Declined">Offer Declined</SelectItem>
                  <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Onboarded Status</Label>
              <Select
                value={updateData.onboardedStatus}
                onValueChange={(val) =>
                  setUpdateData((prev) => ({ ...prev, onboardedStatus: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select onboarded status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_change">No change</SelectItem>
                  <SelectItem value="Onboarded">Onboarded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Joining Date</Label>
            <Input
              type="date"
              value={updateData.joiningDate}
              onChange={(e: any) =>
                setUpdateData((prev) => ({ ...prev, joiningDate: e.target.value }))
              }
            />
          </div>

          <div>
            <Label>Final Notes</Label>
            <textarea
              value={updateData.finalNotes}
              onChange={(e) =>
                setUpdateData((prev) => ({ ...prev, finalNotes: e.target.value }))
              }
              rows={3}
              className="w-full border p-2 rounded"
              placeholder="Optional final notes"
            />
          </div>

          {/* Summary */}
          <div className="flex items-center justify-center py-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Bulk Update</span>
              <ArrowRight className="w-4 h-4" />
              <span className="font-medium">
                {(() => {
                  const parts: string[] = [];
                  if (updateData.statusId !== "no_change") {
                    const label =
                      statusOptions.find((s) => String(s.id) === updateData.statusId)
                        ?.status_name || updateData.statusId;
                    parts.push(`Status: ${label}`);
                  }
                  if (updateData.campusId !== "no_change") {
                    const label =
                      campusOptions.find((c) => String(c.id) === updateData.campusId)
                        ?.campus_name || updateData.campusId;
                    parts.push(`Campus: ${label}`);
                  }
                  if (updateData.state !== "no_change") {
                    parts.push(`State: ${stateOptions.find(s => s.value === updateData.state)?.label || updateData.state}`);
                  }
                  if (updateData.district !== "no_change") {
                    parts.push(`District: ${districtOptions.find(d => d.value === updateData.district)?.label || updateData.district}`);
                  }
                  if (updateData.block !== "no_change") {
                    parts.push(`Block: ${blockOptions.find(b => b.value === updateData.block)?.label || updateData.block}`);
                  }
         
                  if (updateData.offerLetterStatus !== "no_change") parts.push(`Offer: ${updateData.offerLetterStatus}`);
                  if (updateData.onboardedStatus !== "no_change") parts.push(`Onboarded: ${updateData.onboardedStatus}`);
                  if (updateData.joiningDate) parts.push(`Joining: ${updateData.joiningDate}`);
                  if (updateData.finalNotes) parts.push(`Notes: ${updateData.finalNotes.slice(0, 30)}${updateData.finalNotes.length > 30 ? "..." : ""}`);
                  return parts.length ? parts.join(", ") : "Select fields to update";
                })()}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={
                loading ||
                (
                  updateData.stageId === "no_change" &&
                  updateData.campusId === "no_change" &&
                  updateData.state === "no_change" &&
                  updateData.district === "no_change" &&
                  updateData.block === "no_change" &&
            
                  (updateData as any).castId === "no_change" &&
                  (updateData as any).qualificationId === "no_change" &&
                  (updateData as any).currentWorkId === "no_change" &&
                  updateData.offerLetterStatus === "no_change" &&
                  updateData.onboardedStatus === "no_change" &&
                  !updateData.joiningDate &&
                  !updateData.finalNotes
                )
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
