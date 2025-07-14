
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { InlineEditModal } from "./InlineEditModal";

interface ApplicantModalProps {
  applicant: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicantModal({ applicant, isOpen, onClose }: ApplicantModalProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  if (!applicant) return null;

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    // The parent component will refetch data
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Applicant Details</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditClick}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Details
            </Button>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-sm">{applicant.name || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                  <p className="text-sm">{applicant.mobile_no}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">WhatsApp Number</label>
                  <p className="text-sm">{applicant.whatsapp_number || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gender</label>
                  <p className="text-sm">{applicant.gender || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Caste</label>
                  <p className="text-sm">{applicant.caste || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">City</label>
                  <p className="text-sm">{applicant.city || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Block</label>
                  <p className="text-sm">{applicant.block || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">District</label>
                  <p className="text-sm">{applicant.district || "Not provided"}</p>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Academic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Qualification</label>
                  <p className="text-sm">{applicant.qualification || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Current Work</label>
                  <p className="text-sm">{applicant.current_work || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Qualifying School</label>
                  <p className="text-sm">{applicant.qualifying_school || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Final Marks</label>
                  <p className="text-sm">{applicant.final_marks || "Not provided"}</p>
                </div>
              </div>
            </div>

            {/* Application Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Application Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stage</label>
                  <Badge variant="outline" className="mt-1">
                    {applicant.stage || "contact"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <StatusBadge status={applicant.status || "pending"} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Campus</label>
                  <p className="text-sm">{applicant.campus || "Not assigned"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unique Number</label>
                  <p className="text-sm">{applicant.unique_number || "Not provided"}</p>
                </div>
              </div>
            </div>

            {/* Exam Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Exam Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Set Name</label>
                  <p className="text-sm">{applicant.set_name || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Exam Centre</label>
                  <p className="text-sm">{applicant.exam_centre || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date of Testing</label>
                  <p className="text-sm">{applicant.date_of_testing || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Exam Mode</label>
                  <p className="text-sm">{applicant.exam_mode || "Not provided"}</p>
                </div>
              </div>
            </div>

            {/* Interview Information */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold">Interview Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">LR Status</label>
                  <p className="text-sm">{applicant.lr_status || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CFR Status</label>
                  <p className="text-sm">{applicant.cfr_status || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Interview Mode</label>
                  <p className="text-sm">{applicant.interview_mode || "Not provided"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">LR Comments</label>
                  <p className="text-sm bg-muted p-2 rounded min-h-[60px]">
                    {applicant.lr_comments || "No comments"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CFR Comments</label>
                  <p className="text-sm bg-muted p-2 rounded min-h-[60px]">
                    {applicant.cfr_comments || "No comments"}
                  </p>
                </div>
              </div>
            </div>

            {/* Offer and Final Status */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold">Offer & Final Status</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Offer Letter Status</label>
                  <p className="text-sm">{applicant.offer_letter_status || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Allotted School</label>
                  <p className="text-sm">{applicant.allotted_school || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Joining Status</label>
                  <p className="text-sm">{applicant.joining_status || "Not provided"}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4 md:col-span-2">
              <h3 className="text-lg font-semibold">Notes</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Final Notes</label>
                  <p className="text-sm bg-muted p-3 rounded min-h-[80px]">
                    {applicant.final_notes || "No final notes"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Triptis Notes</label>
                  <p className="text-sm bg-muted p-3 rounded min-h-[80px]">
                    {applicant.triptis_notes || "No triptis notes"}
                  </p>
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
    </>
  );
}
