import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, X, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";

type ApplicantData = {
  id: string;
  mobile_no: string;
  name: string | null;
  city: string | null;
  stage: string | null;
  status: string | null;
  whatsapp_number: string | null;
  campus: string | null;
};

interface CampusOption {
  id: string;
  name: string;
  is_active: boolean;
}

interface InlineEditModalProps {
  applicant: ApplicantData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Stage-status hierarchy
const STAGE_STATUS_OPTIONS = {
  contact: [],
  screening: [
    { value: "pending", label: "Pending" },
    { value: "pass", label: "Pass" },
    { value: "fail", label: "Fail" },
  ],
  interviews: [
    { value: "pending", label: "Pending" },
    { value: "booked", label: "Booked" },
    { value: "rescheduled", label: "Rescheduled" },
    { value: "lr_qualified", label: "LR Qualified" },
    { value: "lr_failed", label: "LR Failed" },
    { value: "offer_pending", label: "Offer Pending" },
    { value: "cfr_failed", label: "CFR Failed" },
  ],
  decision: [
    { value: "offer_pending", label: "Offer Pending" },
    { value: "offer_sent", label: "Offer Sent" },
    { value: "offer_rejected", label: "Offer Rejected" },
    { value: "offer_accepted", label: "Offer Accepted" },
  ],
};

export function InlineEditModal({
  applicant,
  isOpen,
  onClose,
  onSuccess,
}: InlineEditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    mobile_no: "",
    whatsapp_number: "",
    city: "",
    stage: "contact",
    status: "none",
    campus: "none",
  });
  const [originalData, setOriginalData] = useState(formData);
  const [campusOptions, setCampusOptions] = useState<CampusOption[]>([]);
  const [loading, setSaving] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (applicant && isOpen) {
      const data = {
        name: applicant.name || "",
        mobile_no: applicant.mobile_no || "",
        whatsapp_number: applicant.whatsapp_number || "",
        city: applicant.city || "",
        stage: applicant.stage || "contact",
        status: applicant.status || "none",
        campus: applicant.campus || "none",
      };
      setFormData(data);
      setOriginalData(data);
      setShowUndo(false);
      if (undoTimer) {
        clearTimeout(undoTimer);
        setUndoTimer(null);
      }
    }
  }, [applicant, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchCampusOptions();
    }
  }, [isOpen]);

  const fetchCampusOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("campus_options")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCampusOptions(data || []);
    } catch (error) {
      console.error("Error fetching campus options:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStageChange = (stage: string) => {
    setFormData((prev) => ({
      ...prev,
      stage,
      status: stage === "contact" ? "none" : "pending",
    }));
  };

  const handleSave = async () => {
    if (!applicant) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("admission_dashboard")
        .update({
          name: formData.name || null,
          mobile_no: formData.mobile_no,
          whatsapp_number: formData.whatsapp_number || null,
          city: formData.city || null,
          stage: formData.stage,
          status: formData.status === "none" ? null : formData.status,
          campus: formData.campus === "none" ? null : formData.campus,
          last_updated: new Date().toISOString(),
        })
        .eq("id", applicant.id);

      if (error) throw error;

      toast({
        title: "✅ Applicant Updated",
        description: "Applicant updated successfully",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });

      // Show undo option for 5 seconds
      setShowUndo(true);
      const timer = setTimeout(() => {
        setShowUndo(false);
        setUndoTimer(null);
      }, 5000);
      setUndoTimer(timer);

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating applicant:", error);
      toast({
        title: "❌ Unable to Update Applicant",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    if (!applicant) return;

    try {
      const { error } = await supabase
        .from("admission_dashboard")
        .update({
          name: originalData.name || null,
          mobile_no: originalData.mobile_no,
          whatsapp_number: originalData.whatsapp_number || null,
          city: originalData.city || null,
          stage: originalData.stage,
          status: originalData.status === "none" ? null : originalData.status,
          campus: originalData.campus === "none" ? null : originalData.campus,
          last_updated: new Date().toISOString(),
        })
        .eq("id", applicant.id);

      if (error) throw error;

      toast({
        title: "✅ Changes Reverted",
        description: "Changes have been reverted successfully",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });

      setShowUndo(false);
      if (undoTimer) {
        clearTimeout(undoTimer);
        setUndoTimer(null);
      }

      onSuccess();
    } catch (error) {
      console.error("Error undoing changes:", error);
      toast({
        title: "❌ Unable to Undo Changes",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const availableStatuses =
    STAGE_STATUS_OPTIONS[formData.stage as keyof typeof STAGE_STATUS_OPTIONS] ||
    [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Quick Edit - {applicant?.name || "Applicant"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter name"
              />
            </div>

            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={formData.mobile_no}
                onChange={(e) => handleInputChange("mobile_no", e.target.value)}
                placeholder="Enter mobile number"
                required
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp_number}
                onChange={(e) =>
                  handleInputChange("whatsapp_number", e.target.value)
                }
                placeholder="Enter WhatsApp number"
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Enter city"
              />
            </div>

            <div>
              <Label>Stage</Label>
              <Select value={formData.stage} onValueChange={handleStageChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interviews">Interviews</SelectItem>
                  <SelectItem value="decision">Decision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {availableStatuses.length > 0 && (
              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Campus</Label>
              <Select
                value={formData.campus}
                onValueChange={(value) => handleInputChange("campus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select campus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {campusOptions.map((campus) => (
                    <SelectItem key={campus.id} value={campus.name}>
                      {campus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Undo Toast */}
      {showUndo && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg shadow-lg p-4 flex items-center space-x-3 z-50">
          <span className="text-sm">Changes saved successfully</span>
          <Button variant="outline" size="sm" onClick={handleUndo}>
            <Undo2 className="w-4 h-4 mr-1" />
            Undo
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowUndo(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  );
}
