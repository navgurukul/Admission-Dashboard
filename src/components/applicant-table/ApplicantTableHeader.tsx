import {
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

interface ApplicantTableHeaderProps {
  selectedRows: string[];
  filteredApplicants: any[];
  handleSelectAllRows: () => void;
  isColumnVisible: (columnId: string) => boolean;
}

export const ApplicantTableHeader = ({
  selectedRows,
  filteredApplicants,
  handleSelectAllRows,
  isColumnVisible,
}: ApplicantTableHeaderProps) => {
  return (
    <TableHeader className="sticky top-0 bg-background z-10 border-b">
      <TableRow>
        {isColumnVisible('checkbox') && (
          <TableHead className="sticky left-0 bg-background z-10 w-12 px-2">
            <Checkbox
              checked={
                filteredApplicants.length > 0 &&
                selectedRows.length === filteredApplicants.length
              }
              onCheckedChange={handleSelectAllRows}
              aria-label="Select all applicants"
            />
          </TableHead>
        )}
        {isColumnVisible('image') && (
          <TableHead className="font-bold w-12 px-3">Image</TableHead>
        )}
        {isColumnVisible('name') && (
          <TableHead className="sticky left-12 bg-background z-10 min-w-[150px] px-3">
            Full Name
          </TableHead>
        )}
        {isColumnVisible('email') && (
          <TableHead className="font-bold min-w-[120px] max-w-[220px] px-3">
            Email
          </TableHead>
        )}
        {isColumnVisible('phone') && (
          <TableHead className="font-bold min-w-[110px] max-w-[130px] px-3">
            Phone Number
          </TableHead>
        )}
        {isColumnVisible('whatsapp') && (
          <TableHead className="font-bold min-w-[140px] max-w-[180px] px-3">
            WhatsApp Number
          </TableHead>
        )}
        {isColumnVisible('gender') && (
          <TableHead className="font-bold min-w-[80px] max-w-[100px] px-3">
            Gender
          </TableHead>
        )}
        {isColumnVisible('dob') && (
          <TableHead className="font-bold min-w-[100px] max-w-[120px] px-3">
            DOB
          </TableHead>
        )}
        {isColumnVisible('state') && (
          <TableHead className="font-bold min-w-[100px] max-w-[120px] px-3">
            State
          </TableHead>
        )}
        {isColumnVisible('district') && (
          <TableHead className="font-bold min-w-[100px] max-w-[120px] px-3">
            District
          </TableHead>
        )}
        {isColumnVisible('block') && (
          <TableHead className="font-bold min-w-[100px] max-w-[120px] px-3">
            Block
          </TableHead>
        )}
        {isColumnVisible('pincode') && (
          <TableHead className="font-bold min-w-[80px] max-w-[100px] px-3">
            Pincode
          </TableHead>
        )}
        {isColumnVisible('cast') && (
          <TableHead className="font-bold min-w-[100px] max-w-[120px] px-3">
            Cast
          </TableHead>
        )}
        {isColumnVisible('religion') && (
          <TableHead className="font-bold min-w-[100px] max-w-[120px] px-3">
            Religion
          </TableHead>
        )}
        {isColumnVisible('qualification') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Qualification
          </TableHead>
        )}
        {isColumnVisible('current_status') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Current Status
          </TableHead>
        )}
        {isColumnVisible('status') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Stage
          </TableHead>
        )}
        {isColumnVisible('campus') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Campus
          </TableHead>
        )}
        {isColumnVisible('partner') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Partner
          </TableHead>
        )}
        {isColumnVisible('donor') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Donor
          </TableHead>
        )}
        {isColumnVisible('school') && (
          <TableHead className="font-bold min-w-[140px] max-w-[180px] px-3">
            Qualifying School
          </TableHead>
        )}
        {/* Screening Round Fields */}
        {isColumnVisible('screening_status') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Screening Status
          </TableHead>
        )}
        {isColumnVisible('screening_obtained_marks') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Screening Marks
          </TableHead>
        )}
        {isColumnVisible('screening_exam_centre') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Screening Centre
          </TableHead>
        )}
        {isColumnVisible('screening_audit') && (
          <TableHead className="font-bold min-w-[150px] max-w-[200px] px-3">
            Screening Audit
          </TableHead>
        )}
        {/* Learning Round Fields */}
        {isColumnVisible('lr_status') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            LR Status
          </TableHead>
        )}
        {isColumnVisible('lr_comments') && (
          <TableHead className="font-bold min-w-[150px] max-w-[200px] px-3">
            LR Comments
          </TableHead>
        )}
        {isColumnVisible('lr_audit') && (
          <TableHead className="font-bold min-w-[150px] max-w-[200px] px-3">
            LR Audit
          </TableHead>
        )}
        {/* CFR Round Fields */}
        {isColumnVisible('cfr_status') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            CFR Status
          </TableHead>
        )}
        {isColumnVisible('cfr_comments') && (
          <TableHead className="font-bold min-w-[150px] max-w-[200px] px-3">
            CFR Comments
          </TableHead>
        )}
        {isColumnVisible('cfr_audit') && (
          <TableHead className="font-bold min-w-[150px] max-w-[200px] px-3">
            CFR Audit
          </TableHead>
        )}
        {/* Final Decision Fields */}
        {isColumnVisible('offer_letter_status') && (
          <TableHead className="font-bold min-w-[140px] max-w-[180px] px-3">
            Offer Letter Status
          </TableHead>
        )}
        {isColumnVisible('onboarded_status') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Onboarded Status
          </TableHead>
        )}
        {isColumnVisible('final_notes') && (
          <TableHead className="font-bold min-w-[150px] max-w-[200px] px-3">
            Final Notes
          </TableHead>
        )}
        {isColumnVisible('joining_date') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Joining Date
          </TableHead>
        )}
        {isColumnVisible('offer_sent_by') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Offer Sent By
          </TableHead>
        )}
        {isColumnVisible('offer_audit') && (
          <TableHead className="font-bold min-w-[150px] max-w-[200px] px-3">
            Offer Audit
          </TableHead>
        )}

        {isColumnVisible('notes') && (
          <TableHead className="font-bold min-w-[150px] max-w-[200px] px-3">
            Communication Notes
          </TableHead>
        )}
        {isColumnVisible('created_at') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Created At
          </TableHead>
        )}
        {isColumnVisible('updated_at') && (
          <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
            Updated At
          </TableHead>
        )}
        {isColumnVisible('actions') && (
          <TableHead className="w-16 font-bold px-3">Actions</TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
};
