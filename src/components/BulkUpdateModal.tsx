import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Users, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
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
  bulkUpdateStudents,
  getAllDonors,
  getAllPartners,
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
    state: "no_change",          // Store CODE for UI
    district: "no_change",       // Store CODE for UI
    block: "no_change",          // Store ID for UI
    city: "",
    castId: "no_change",
    qualificationId: "no_change",
    currentWorkId: "no_change",
    partnerId: "no_change",
    donorId: "no_change",
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
  const [loadingStates, setLoadingStates] = useState(false);

  const [castOptions, setCastOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [qualificationOptions, setQualificationOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [currentWorkOptions, setCurrentWorkOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [partnerOptions, setPartnerOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [donorOptions, setDonorOptions] = useState<
    { value: string; label: string }[]
  >([]);

  // Track which dropdowns have been loaded
  const [loadedDropdowns, setLoadedDropdowns] = useState({
    cast: false,
    qualification: false,
    currentWork: false,
    partner: false,
    donor: false,
  });

  // Initialize dropdown options when modal opens - all loaded on demand
  useEffect(() => {
    if (isOpen) {
      // Reset loaded flags when modal opens
      setLoadedDropdowns({
        cast: false,
        qualification: false,
        currentWork: false,
        partner: false,
        donor: false,
      });

      // Fetch campus and state immediately (needed for basic selection)
      fetchCampuses();
      fetchStates();

      // Clear options for lazy-loaded dropdowns
      setCastOptions([]);
      setQualificationOptions([]);
      setCurrentWorkOptions([]);
      setPartnerOptions([]);
      setDonorOptions([]);
    }
  }, [isOpen]); // Only depend on isOpen

  const fetchCampuses = async () => {
    try {
      const campuses = await getCampusesApi();
      setCampusOptions(campuses);
    } catch (err) {
      console.error("Error fetching campuses:", err);
    }
  };

  const fetchStates = async () => {
    setLoadingStates(true);
    try {
      console.log("🔄 Fetching states...");
      const res = await getAllStates();
      console.log("✅ States response:", res);
      
      const states = (res?.data || res || []).map((s: any) => ({
        value: s.state_code,
        label: s.state_name,
      }));
      
      console.log("📍 Mapped states:", states);
      setStateOptions(states);
    } catch (err) {
      console.error("❌ Error fetching states:", err);
      setStateOptions([]);
      toast({
        title: "Failed to load states",
        description: "Unable to fetch state list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingStates(false);
    }
  };

  // Lazy load functions for each dropdown
  const fetchCastOptions = async () => {
    if (loadedDropdowns.cast) return; // Already loaded
    
    try {
      const castsRes = await getAllCasts();
      setCastOptions(
        (castsRes || [])
          .filter((c: any) => c && c.id)
          .map((c: any) => ({
            value: String(c.id),
            label: String(c.cast_name || c.name || `Cast #${c.id}`),
          }))
          .filter((opt) => opt.value && opt.label) // Extra safety
      );
      setLoadedDropdowns(prev => ({ ...prev, cast: true }));
    } catch (err) {
      console.error("Error fetching casts:", err);
      setCastOptions([]);
    }
  };

  const fetchQualificationOptions = async () => {
    if (loadedDropdowns.qualification) return; // Already loaded
    
    try {
      const qualsRes = await getAllQualification();
      setQualificationOptions(
        (qualsRes || [])
          .filter((q: any) => q && q.id)
          .map((q: any) => ({
            value: String(q.id),
            label: String(q.qualification_name || q.name || `Qualification #${q.id}`),
          }))
          .filter((opt) => opt.value && opt.label) // Extra safety
      );
      setLoadedDropdowns(prev => ({ ...prev, qualification: true }));
    } catch (err) {
      console.error("Error fetching qualifications:", err);
      setQualificationOptions([]);
    }
  };

  const fetchCurrentWorkOptions = async () => {
    if (loadedDropdowns.currentWork) return; // Already loaded
    
    try {
      const statusRes = await getAllStatus();
      setCurrentWorkOptions(
        (statusRes || [])
          .filter((s: any) => s && s.id)
          .map((s: any) => ({
            value: String(s.id),
            label: String(s.current_status_name || s.name || `Status #${s.id}`),
          }))
          .filter((opt) => opt.value && opt.label) // Extra safety
      );
      setLoadedDropdowns(prev => ({ ...prev, currentWork: true }));
    } catch (err) {
      console.error("Error fetching current work status:", err);
      setCurrentWorkOptions([]);
    }
  };

  const fetchPartnerOptions = async () => {
    if (loadedDropdowns.partner) return; // Already loaded
    
    try {
      const partnersRes = await getAllPartners();
      setPartnerOptions(
        (partnersRes || [])
          .filter((p: any) => p && p.id)
          .map((p: any) => ({
            value: String(p.id),
            label: String(p.partner_name || p.name || `Partner #${p.id}`),
          }))
          .filter((opt) => opt.value && opt.label) // Extra safety
      );
      setLoadedDropdowns(prev => ({ ...prev, partner: true }));
    } catch (err) {
      console.error("Error fetching partners:", err);
      setPartnerOptions([]);
    }
  };

  const fetchDonorOptions = async () => {
    if (loadedDropdowns.donor) return; // Already loaded
    
    try {
      const donorsRes = await getAllDonors();
      setDonorOptions(
        (donorsRes || [])
          .filter((d: any) => d && d.id)
          .map((d: any) => ({
            value: String(d.id),
            label: String(d.donor_name || d.name || `Donor #${d.id}`),
          }))
          .filter((opt) => opt.value && opt.label) // Extra safety
      );
      setLoadedDropdowns(prev => ({ ...prev, donor: true }));
    } catch (err) {
      console.error("Error fetching donors:", err);
      setDonorOptions([]);
    }
  };

  const handleStateChange = async (stateCode: string) => {
    // Store the CODE for UI (so Combobox selection works)
    setUpdateData((prev) => ({
      ...prev,
      state: stateCode,          // Store CODE for UI display
      district: "no_change",
      block: "no_change",
    }));
    setDistrictOptions([]);
    setBlockOptions([]);

    // Don't fetch districts if "no_change" is selected
    if (stateCode === "no_change") {
      return;
    }


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
    // Store the CODE for UI (so Combobox selection works)
    setUpdateData((prev) => ({
      ...prev,
      district: districtCode,    // Store CODE for UI display
      block: "no_change",
    }));
    setBlockOptions([]);

    // Don't fetch blocks if "no_change" is selected
    if (districtCode === "no_change") {
      return;
    }

    try {
      const res = await getBlocksByDistrict(districtCode);
      const blocks = (res?.data || res || []).map((b: any) => ({
        value: String(b.id), // Use id as value since block_code is not available
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
      updateData.partnerId === "no_change" &&
      updateData.donorId === "no_change" &&
      updateData.offerLetterStatus === "no_change" &&
      updateData.onboardedStatus === "no_change" &&
      !updateData.joiningDate &&
      !updateData.finalNotes;

    if (isNoChange) {
      toast({
        title: "⚠️ No Fields Selected",
        description: "Please select at least one field to update.",
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    const payload: any = {
      student_ids: selectedApplicants.map((id) => Number(id)),
    };

    if (updateData.campusId !== "no_change") {
      payload.campus_id =
        updateData.campusId === "unassigned"
          ? null
          : Number(updateData.campusId);
    }
    if (updateData.state !== "no_change") {
      // Convert state code to name before sending to API
      const stateName = stateOptions.find((opt) => opt.value === updateData.state)?.label || updateData.state;
      payload.state = stateName;  // Send NAME to API (e.g., "Tripura")
    }
    if (updateData.district !== "no_change") {
      // Convert district code to name before sending to API
      const districtName = districtOptions.find((opt) => opt.value === updateData.district)?.label || updateData.district;
      payload.district = districtName;  // Send NAME to API (e.g., "North District")
    }
    if (updateData.block !== "no_change") {
      // Convert block id to name before sending to API
      const blockName = blockOptions.find((opt) => opt.value === updateData.block)?.label || updateData.block;
      payload.block = blockName;  // Send NAME to API (e.g., "Block A")
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
    if (updateData.partnerId !== "no_change") {
      payload.partner_id = Number(updateData.partnerId);
    }
    if (updateData.donorId !== "no_change") {
      payload.donor_id = Number(updateData.donorId);
    }
    // Note: offer_letter_status, onboarded_status, joining_date, and final_notes
    // are handled separately through submitFinalDecision API

    setLoading(true);

    try {
      // First, update student fields (campus, location, qualifications, etc.)
      await bulkUpdateStudents(payload);

      // If final decision fields are present, update them separately
      if (
        updateData.finalNotes ||
        updateData.offerLetterStatus !== "no_change" ||
        updateData.onboardedStatus !== "no_change" ||
        updateData.joiningDate
      ) {
        // Update final decision for each student
        const finalDecisionPromises = selectedApplicants.map((studentId) => {
          const finalDecisionPayload: any = {
            student_id: Number(studentId),
          };

          if (updateData.finalNotes) {
            finalDecisionPayload.final_notes = updateData.finalNotes;
          }
          if (updateData.offerLetterStatus !== "no_change") {
            finalDecisionPayload.offer_letter_status =
              updateData.offerLetterStatus;
          }
          if (updateData.onboardedStatus !== "no_change") {
            finalDecisionPayload.onboarded_status = updateData.onboardedStatus;
          }
          if (updateData.joiningDate) {
            finalDecisionPayload.joining_date = updateData.joiningDate;
          }

          return submitFinalDecision(finalDecisionPayload);
        });

        await Promise.all(finalDecisionPromises);
      }

      toast({
        title: "✅ Bulk Update Successful",
        description: `Successfully updated ${selectedApplicants.length} applicant${selectedApplicants.length > 1 ? 's' : ''}.`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
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
        partnerId: "no_change",
        donorId: "no_change",
        offerLetterStatus: "no_change",
        onboardedStatus: "no_change",
        joiningDate: "",
        finalNotes: "",
      });
    } catch (err: any) {
      console.error("Bulk update failure:", err);
      toast({
        title: "❌ Unable to Update",
        description: getFriendlyErrorMessage(err),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
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
              Update selected fields for {selectedApplicants.length}{" "}
              applicant(s). Fields set to "No change" will remain unchanged.
            </p>
          </div>

          {/* Campus Assignment Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
              Campus Assignment
            </h3>
            <div>
              <Label>Campus</Label>
              <Combobox
                options={[
                  { value: "no_change", label: "No change" },
                  { value: "unassigned", label: "Not assigned" },
                  ...campusOptions.map((campus) => ({
                    value: String(campus.id),
                    label: campus.campus_name,
                  })),
                ]}
                value={updateData.campusId}
                onValueChange={(val) =>
                  setUpdateData((prev) => ({ ...prev, campusId: val }))
                }
                placeholder="Select campus"
                searchPlaceholder="Search campus..."
                emptyText="No campus found."
              />
            </div>
          </div>

          {/* Partner and Donor Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
              Partner & Donor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Partner</Label>
                <Combobox
                  options={[
                    { value: "no_change", label: "No change" },
                    ...partnerOptions.map((partner) => ({
                      value: partner.value,
                      label: partner.label,
                    })),
                  ]}
                  value={updateData.partnerId}
                  onValueChange={(val) =>
                    setUpdateData((prev) => ({ ...prev, partnerId: val }))
                  }
                  onOpen={fetchPartnerOptions}
                  placeholder="Select partner"
                  searchPlaceholder="Search partner..."
                  emptyText="No partner found."
                />
              </div>

              <div>
                <Label>Donor</Label>
                <Combobox
                  options={[
                    { value: "no_change", label: "No change" },
                    ...donorOptions.map((donor) => ({
                      value: donor.value,
                      label: donor.label,
                    })),
                  ]}
                  value={updateData.donorId}
                  onValueChange={(val) =>
                    setUpdateData((prev) => ({ ...prev, donorId: val }))
                  }
                  onOpen={fetchDonorOptions}
                  placeholder="Select donor"
                  searchPlaceholder="Search donor..."
                  emptyText="No donor found."
                />
              </div>
            </div>
          </div>

          {/* Location Details Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
              Location Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>State</Label>
                <Combobox
                  options={[
                    { value: "no_change", label: "No change" },
                    ...stateOptions.map((s) => ({
                      value: s.value,
                      label: s.label,
                    })),
                  ]}
                  value={updateData.state}
                  onValueChange={(val) => handleStateChange(val)}
                  placeholder={loadingStates ? "Loading states..." : "Select state"}
                  searchPlaceholder="Search state..."
                  emptyText={loadingStates ? "Loading..." : "No state found."}
                  disabled={loadingStates}
                />
              </div>

              <div>
                <Label>District</Label>
                <Combobox
                  options={[
                    { value: "no_change", label: "No change" },
                    ...districtOptions.map((d) => ({
                      value: d.value,
                      label: d.label,
                    })),
                  ]}
                  value={updateData.district}
                  onValueChange={(val) => handleDistrictChange(val)}
                  placeholder={
                    updateData.state === "no_change" || !updateData.state
                      ? "Select state first"
                      : districtOptions.length === 0
                        ? "No districts available"
                        : "Select district"
                  }
                  searchPlaceholder="Search district..."
                  emptyText="No district found."
                  disabled={
                    !updateData.state ||
                    updateData.state === "no_change"
                  }
                />
              </div>

              <div>
                <Label>Block</Label>
                <Combobox
                  options={[
                    { value: "no_change", label: "No change" },
                    ...blockOptions.map((b) => ({
                      value: b.value,
                      label: b.label,
                    })),
                  ]}
                  value={updateData.block}
                  onValueChange={(val) => {
                    // Store the ID for UI (so Combobox selection works)
                    setUpdateData((prev) => ({ ...prev, block: val }));
                  }}
                  placeholder={
                    updateData.district === "no_change" || !updateData.district
                      ? "Select district first"
                      : blockOptions.length === 0
                        ? "No blocks available"
                        : "Select block"
                  }
                  searchPlaceholder="Search block..."
                  emptyText="No block found."
                  disabled={
                    !updateData.district ||
                    updateData.district === "no_change"
                  }
                />
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Caste</Label>
                <Combobox
                  options={[
                    { value: "no_change", label: "No change" },
                    ...castOptions.map((c) => ({
                      value: c.value,
                      label: c.label,
                    })),
                  ]}
                  value={updateData.castId}
                  onValueChange={(val) =>
                    setUpdateData((prev) => ({ ...prev, castId: val }))
                  }
                  onOpen={fetchCastOptions}
                  placeholder="Select caste"
                  searchPlaceholder="Search caste..."
                  emptyText="No caste found."
                />
              </div>

              <div>
                <Label>Qualification</Label>
                <Combobox
                  options={[
                    { value: "no_change", label: "No change" },
                    ...qualificationOptions.map((q) => ({
                      value: q.value,
                      label: q.label,
                    })),
                  ]}
                  value={updateData.qualificationId}
                  onValueChange={(val) =>
                    setUpdateData((prev) => ({ ...prev, qualificationId: val }))
                  }
                  onOpen={fetchQualificationOptions}
                  placeholder="Select qualification"
                  searchPlaceholder="Search qualification..."
                  emptyText="No qualification found."
                />
              </div>

              <div>
                <Label>Current Work</Label>
                <Combobox
                  options={[
                    { value: "no_change", label: "No change" },
                    ...currentWorkOptions.map((w) => ({
                      value: w.value,
                      label: w.label,
                    })),
                  ]}
                  value={updateData.currentWorkId}
                  onValueChange={(val) =>
                    setUpdateData((prev) => ({ ...prev, currentWorkId: val }))
                  }
                  onOpen={fetchCurrentWorkOptions}
                  placeholder="Select current work"
                  searchPlaceholder="Search current work..."
                  emptyText="No current work found."
                />
              </div>
            </div>
          </div>

          {/* Onboarding Status Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">
              Onboarding Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Offer Letter Status</Label>
                <Select
                  value={updateData.offerLetterStatus}
                  onValueChange={(val) =>
                    setUpdateData((prev) => ({
                      ...prev,
                      offerLetterStatus: val,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select offer status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no_change">No change</SelectItem>
                    <SelectItem value="Offer Pending">Offer Pending</SelectItem>
                    <SelectItem value="Offer Accepted">
                      Offer Accepted
                    </SelectItem>
                    <SelectItem value="Offer Declined">
                      Offer Declined
                    </SelectItem>
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
                  setUpdateData((prev) => ({
                    ...prev,
                    joiningDate: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label>Final Notes</Label>
              <Textarea
                value={updateData.finalNotes}
                onChange={(e) =>
                  setUpdateData((prev) => ({
                    ...prev,
                    finalNotes: e.target.value,
                  }))
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
            <Button onClick={handleBulkUpdate} disabled={loading}>
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
