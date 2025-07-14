
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, MessageSquare, Pencil } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { InlineEditModal } from "./InlineEditModal";
import { ApplicantCommentsModal } from "./ApplicantCommentsModal";
import { StageDropdown } from "./applicant-table/StageDropdown";
import { StatusDropdown } from "./applicant-table/StatusDropdown";
import { EditableCell } from "./applicant-table/EditableCell";

interface ApplicantModalProps {
  applicant: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicantModal({ applicant, isOpen, onClose }: ApplicantModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (!applicant) return null;

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleCommentsClick = () => {
    setShowCommentsModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

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
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="name" 
                    displayValue={applicant.name || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="mobile_no" 
                    displayValue={applicant.mobile_no} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">WhatsApp Number</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="whatsapp_number" 
                    displayValue={applicant.whatsapp_number || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gender</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="gender" 
                    displayValue={applicant.gender || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Caste</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="caste" 
                    displayValue={applicant.caste || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">City</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="city" 
                    displayValue={applicant.city || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Block</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="block" 
                    displayValue={applicant.block || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">District</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="district" 
                    displayValue={applicant.district || "Not provided"} 
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
                  <label className="text-sm font-medium text-muted-foreground">Qualification</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="qualification" 
                    displayValue={applicant.qualification || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Work</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="current_work" 
                    displayValue={applicant.current_work || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Qualifying School</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="qualifying_school" 
                    displayValue={applicant.qualifying_school || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Final Marks</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="final_marks" 
                    displayValue={applicant.final_marks || "Not provided"} 
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
                  <label className="text-sm font-medium text-muted-foreground">Stage</label>
                  <StageDropdown applicant={applicant} onUpdate={handleUpdate} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <StatusDropdown applicant={applicant} onUpdate={handleUpdate} />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Campus</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="campus" 
                    displayValue={applicant.campus || "Not assigned"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unique Number</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="unique_number" 
                    displayValue={applicant.unique_number || "Not provided"} 
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
                  <label className="text-sm font-medium text-muted-foreground">Set Name</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="set_name" 
                    displayValue={applicant.set_name || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Exam Centre</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="exam_centre" 
                    displayValue={applicant.exam_centre || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Testing</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="date_of_testing" 
                    displayValue={applicant.date_of_testing || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Exam Mode</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="exam_mode" 
                    displayValue={applicant.exam_mode || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
              </div>
            </div>

            {/* Interview Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold">Interview Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">LR Status</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="lr_status" 
                    displayValue={applicant.lr_status || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CFR Status</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="cfr_status" 
                    displayValue={applicant.cfr_status || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Interview Mode</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="interview_mode" 
                    displayValue={applicant.interview_mode || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">LR Comments</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="lr_comments" 
                    displayValue={applicant.lr_comments || "No comments"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CFR Comments</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="cfr_comments" 
                    displayValue={applicant.cfr_comments || "No comments"} 
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
                  <label className="text-sm font-medium text-muted-foreground">Offer Letter Status</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="offer_letter_status" 
                    displayValue={applicant.offer_letter_status || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Allotted School</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="allotted_school" 
                    displayValue={applicant.allotted_school || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Joining Status</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="joining_status" 
                    displayValue={applicant.joining_status || "Not provided"} 
                    onUpdate={handleUpdate}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold">Notes</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Final Notes</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="final_notes" 
                    displayValue={applicant.final_notes || "No final notes"} 
                    onUpdate={handleUpdate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Triptis Notes</label>
                  <EditableCell 
                    applicant={applicant} 
                    field="triptis_notes" 
                    displayValue={applicant.triptis_notes || "No triptis notes"} 
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
                  <label className="text-sm font-medium text-muted-foreground">Created At</label>
                  <p className="text-sm">{applicant.created_at ? new Date(applicant.created_at).toLocaleString() : "Not available"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                  <p className="text-sm">{applicant.updated_at ? new Date(applicant.updated_at).toLocaleString() : "Not available"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">{applicant.last_updated ? new Date(applicant.last_updated).toLocaleString() : "Not available"}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showEditModal && (
        <InlineEditModal
          applicant={applicant}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {showCommentsModal && (
        <ApplicantCommentsModal
          applicantId={applicant.id || ""}
          applicantName={applicant.name || ""}
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
        />
      )}
    </>
  );
}
