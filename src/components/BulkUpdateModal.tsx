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
  getStudentById,
  bulkUpdateStudents
} from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  const [updateData, setUpdateData] = useState({
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

  const [statusOptions, setStatusOptions] = useState<Status[]>([]);
  const [campusOptions, setCampusOptions] = useState<CampusOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [stateOptions, setStateOptions] = useState<StateOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);
  const [blockOptions, setBlockOptions] = useState<BlockOption[]>([]);

  const [castOptions, setCastOptions] = useState<{ value: string; label: string }[]>([]);
  const [qualificationOptions, setQualificationOptions] = useState<{ value: string; label: string }[]>([]);
  const [currentWorkOptions, setCurrentWorkOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchCampuses();
      fetchStates();
      fetchDropdowns();
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

  const handleBulkUpdate = async () => {
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
        description: "Please select the field to update.",
        variant: "destructive",
      });
      return;
    }

    const payload: any = {
      student_ids: selectedApplicants.map(id => Number(id)),
    };

    if (updateData.campusId !== "no_change") {
      payload.campus_id = updateData.campusId === "unassigned" ? null : Number(updateData.campusId);
    }
    if (updateData.state !== "no_change") {
      payload.state = updateData.state;
    }
    if (updateData.district !== "no_change") {
      payload.district = updateData.district;
    }
    if (updateData.block !== "no_change") {
      payload.block = updateData.block;
    }
    if (updateData.castId !== "no_change") {
      payload.cast_id = Number(updateData.castId);
    }
    if (updateData.qualificationId !== "no_change") {
      payload.qualification_id = Number(updateData.qualificationId);
    }
    if (updateData.currentWorkId !== "no_change") {
      payload.current_status_id = Number(updateData.currentWorkId);
    }
    if (updateData.offerLetterStatus !== "no_change") {
      payload.offer_letter_status = updateData.offerLetterStatus;
    }
    if (updateData.onboardedStatus !== "no_change") {
      payload.onboarded_status = updateData.onboardedStatus;
    }
    if (updateData.joiningDate) {
      payload.joining_date = updateData.joiningDate;
    }

    setLoading(true);

    try {
      await bulkUpdateStudents(payload);

      toast({
        title: "Success",
        description: `Updated ${selectedApplicants.length} applicant(s) successfully.`,
      });

      onSuccess();
      onClose();

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Update - {selectedApplicants.length} Applicant(s)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              Update selected fields for {selectedApplicants.length} applicant(s). Fields set to "No change" will remain unchanged.
            </p>
          </div>

          {/* Campus Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Campus Assignment</h3>
            <div>
              <Label>Campus</Label>
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
          </div>

          {/* Location Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Location Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>State</Label>
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
              </div>

              <div>
                <Label>District</Label>
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
              </div>

              <div>
                <Label>Block</Label>
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
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Caste</Label>
                <Select
                  value={updateData.castId}
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
                  value={updateData.qualificationId}
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
                  value={updateData.currentWorkId}
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
          </div>

          {/* Onboarding Status Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Onboarding Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={(e) =>
                  setUpdateData((prev) => ({ ...prev, joiningDate: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Final Notes</Label>
              <Textarea
                value={updateData.finalNotes}
                onChange={(e) =>
                  setUpdateData((prev) => ({ ...prev, finalNotes: e.target.value }))
                }
                rows={3}
                placeholder="Add any additional notes (optional)"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpdate}
              disabled={loading}
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
