import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, MessageSquare, Pencil } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { InlineEditModal } from "./InlineEditModal";
import { ApplicantCommentsModal } from "./ApplicantCommentsModal";
import StageDropdown from "./applicant-table/StageDropdown";
import StatusDropdown from "./applicant-table/StatusDropdown";
import { EditableCell } from "./applicant-table/EditableCell";
import {
  getAllCasts,
  getAllQualification,
  getAllStatuses,
  getAllSchools,
  getCampusesApi,
  getStudentById,
} from "@/utils/api";
import { states } from "@/utils/mockApi";

interface ApplicantModalProps {
  applicant: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicantModal({
  applicant,
  isOpen,
  onClose,
}: ApplicantModalProps) {
  const [currentApplicant, setCurrentApplicant] = useState(applicant);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [castes, setCastes] = useState<any[]>([]);
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [currentWorks, setCurrentWorks] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [stateOptions, setStateOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [campus, setCampus] = useState<any[]>([]);

  useEffect(() => {
    setCurrentApplicant(applicant);
  }, [applicant]);

  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const [casteRes, qualRes, workRes, schoolRes, campusRes] =
          await Promise.all([
            getAllCasts(),
            getAllQualification(),
            getAllStatuses(),
            getAllSchools(),
            getCampusesApi(),
          ]);

        // Set manual states
        setStateOptions(states);

        // Map API responses
        setCampus(
          (campusRes || []).map((c: any) => ({
            value: c.id.toString(),
            label: c.campus_name,
          }))
        );

        setSchools(
          (schoolRes || []).map((c: any) => ({
            value: c.id.toString(),
            label: c.school_name,
          }))
        );

        setCastes(
          (casteRes || []).map((c: any) => ({
            value: c.id.toString(),
            label: c.cast_name,
          }))
        );

        setQualifications(
          (qualRes || []).map((q: any) => ({
            value: q.id.toString(),
            label: q.qualification_name,
          }))
        );

        setCurrentWorks(
          (workRes || []).map((w: any) => ({
            value: w.id.toString(),
            label: w.current_status_name,
          }))
        );
      } catch (err) {
        console.error("Failed to load dropdown data", err);
      }
    }

    if (isOpen) fetchDropdowns();
  }, [isOpen]);

  if (!applicant || !currentApplicant) return null;

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleCommentsClick = () => {
    setShowCommentsModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setRefreshKey((prev) => prev + 1);
  };

  // Refetch applicant after update
  const handleUpdate = async () => {
    if (!currentApplicant?.id) return;
    try {
      const updated = await getStudentById(currentApplicant.id);
      console.log("done updated",updated)
      setCurrentApplicant(updated);
    } catch (err) {
      console.error("Failed to refresh applicant", err);
    }
  };

  if (!applicant) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Applicant Details</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCommentsClick}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Comments
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Details
              </Button>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="first_name"
                    displayValue={currentApplicant?.first_name || "Not provided"}
                    onUpdate={handleUpdate}
                  />
                </div>
                 <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Middle Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="middle_name"
                    displayValue={currentApplicant?.middle_name || "Not provided"}
                    onUpdate={handleUpdate}
                  />
                </div>
                 <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="last_name"
                    displayValue={currentApplicant?.last_name || "Not provided"}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Mobile Number
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="phone_number"
                    displayValue={currentApplicant.phone_number}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    WhatsApp Number
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="whatsapp_number"
                    displayValue={
                      currentApplicant.whatsapp_number || "Not provided"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Gender
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="gender"
                    displayValue={currentApplicant.gender || "Not provided"}
                    options={[
                      { value: "male", label: "M" },
                      { value: "female", label: "F" },
                      { value: "other", label: "Other" },
                    ]}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Caste
                  </label>
                  {/* Caste Dropdown */}
                  <EditableCell
                    applicant={currentApplicant}
                    field="cast_id"
                    displayValue={
                      castes.find(
                        (c) => c.value === currentApplicant.cast_id?.toString()
                      )?.label || "Not provided"
                    }
                    onUpdate={handleUpdate}
                    options={castes} // now as dropdown
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    States
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="stage"
                    displayValue={currentApplicant.stage || "Not provided"}
                    onUpdate={handleUpdate}
                    options={stateOptions}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    City
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="city"
                    displayValue={currentApplicant.city || "Not provided"}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    District
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="district"
                    displayValue={currentApplicant.district || "Not provided"}
                    onUpdate={handleUpdate}
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Academic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Qualification
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="qualification_id"
                    displayValue={
                      qualifications.find(
                        (q) =>
                          q.value === currentApplicant.qualification_id?.toString()
                      )?.label || "Not provided"
                    }
                    onUpdate={handleUpdate}
                    options={qualifications}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Work
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="current_work"
                    displayValue={
                      currentWorks.find(
                        (w) =>
                          w.value === currentApplicant.current_work?.toString()
                      )?.label || "Not provided"
                    }
                    onUpdate={handleUpdate}
                    options={currentWorks}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Qualifying School
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="qualifying_school"
                    displayValue={
                      schools.find(
                        (q) =>
                          q.value ===
                          currentApplicant.qualifying_school?.toString()
                      )?.label || "Not provided"
                    }
                    onUpdate={handleUpdate}
                    options={schools}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Final Marks
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="final_marks"
                    displayValue={
                      currentApplicant.final_marks || "Not provided"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
              </div>
            </div>

            {/* Application Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Application Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Stage
                  </label>
                  <StageDropdown
                    applicant={currentApplicant}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <StatusDropdown
                    applicant={currentApplicant}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Campus
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="campus"
                    displayValue={
                      campus.find(
                        (q) => q.value === currentApplicant.campus?.toString()
                      )?.label || "Not provided"
                    }
                    onUpdate={handleUpdate}
                    options={campus}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Unique Number
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="unique_number"
                    displayValue={
                      currentApplicant.unique_number || "Not provided"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
              </div>
            </div>

            {/* Exam Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Exam Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Set Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="set_name"
                    displayValue={currentApplicant.set_name || "Not provided"}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Exam Centre
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="exam_centre"
                    displayValue={
                      currentApplicant.exam_centre || "Not provided"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date of Testing
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="date_of_testing"
                    displayValue={
                      currentApplicant.date_of_testing || "Not provided"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
                {/* <div>
                  <label className="text-sm font-medium text-muted-foreground">Exam Mode</label>
                  <EditableCell 
                    applicant={currentApplicant} 
                    field="exam_mode" 
                    displayValue={currentApplicant.exam_mode || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div> */}
              </div>
            </div>

            {/* Interview Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold">Interview Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    LR Status
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="lr_status"
                    displayValue={currentApplicant.lr_status || "Not provided"}
                    onUpdate={handleUpdate}
                    options={[
                      { value: "Pending", label: "Pending" },
                      { value: "Cleared", label: "Cleared" },
                      { value: "Rejected", label: "Rejected" },
                    ]}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    CFR Status
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="cfr_status"
                    displayValue={currentApplicant.cfr_status || "Not provided"}
                    onUpdate={handleUpdate}
                    options={[
                      { value: "Pending", label: "Pending" },
                      { value: "Cleared", label: "Cleared" },
                      { value: "Rejected", label: "Rejected" },
                    ]}
                  />
                </div>
                {/* <div>
                  <label className="text-sm font-medium text-muted-foreground">Interview Mode</label>
                  <EditableCell 
                    applicant={currentApplicant} 
                    field="interview_mode" 
                    displayValue={currentApplicant.interview_mode || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div> */}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    LR Comments
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="lr_comments"
                    displayValue={currentApplicant.lr_comments || "No comments"}
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    CFR Comments
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="cfr_comments"
                    displayValue={
                      currentApplicant.cfr_comments || "No comments"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
              </div>
            </div>

            {/* Offer and Final Status */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold">Offer & Final Status</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Offer Letter Status
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="offer_letter_status"
                    displayValue={
                      currentApplicant.offer_letter_status || "Not provided"
                    }
                    onUpdate={handleUpdate}
                    options={[
                      { value: "Pending", label: "Pending" },
                      { value: "Sent", label: "Sent" },
                      { value: "Accepted", label: "Accepted" },
                      { value: "Rejected", label: "Rejected" },
                    ]}
                  />
                </div>
                {/* <div>
                  <label className="text-sm font-medium text-muted-foreground">Allotted School</label>
                  <EditableCell 
                    applicant={currentApplicant} 
                    field="allotted_school" 
                    displayValue={currentApplicant.allotted_school || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div> */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Onboarded Status
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="onboarded_status"
                    displayValue={
                      currentApplicant.onboarded_status || "Not provided"
                    }
                    onUpdate={handleUpdate}
                    options={[
                      { value: "Not Joined", label: "Not Joined" },
                      { value: "Joined", label: "Joined" },
                      { value: "Deferred", label: "Deferred" },
                      { value: "Rejected", label: "Rejected" },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold">Notes</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Final Notes
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="final_notes"
                    displayValue={
                      currentApplicant.final_notes || "No final notes"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Triptis Notes
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="triptis_notes"
                    displayValue={
                      currentApplicant.triptis_notes || "No triptis notes"
                    }
                    onUpdate={handleUpdate}
                  />
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold">Timestamps</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created At
                  </label>
                  <p className="text-sm">
                    {currentApplicant.created_at
                      ? new Date(currentApplicant.created_at).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Updated At
                  </label>
                  <p className="text-sm">
                    {currentApplicant.updated_at
                      ? new Date(currentApplicant.updated_at).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Updated
                  </label>
                  <p className="text-sm">
                    {currentApplicant.last_updated
                      ? new Date(currentApplicant.last_updated).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showEditModal && (
        <InlineEditModal
          applicant={currentApplicant}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {showCommentsModal && (
        <ApplicantCommentsModal
          applicantId={currentApplicant.id || ""}
          applicantName={currentApplicant.name || ""}
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
        />
      )}
    </>
  );
}
