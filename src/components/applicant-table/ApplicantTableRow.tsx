import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";
import { EditableCell } from "./EditableCell";
import StatusDropdown from "./StatusDropdown";
import StageDropdown from "./StageDropdown";
import { CampusSelector } from "../CampusSelector";

interface ApplicantTableRowProps {
  applicant: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: () => void;
  onViewDetails: (applicant: any) => void;
  onViewComments: (applicant: any) => void;
  onCampusChange: () => void;

  campusList: any[];
  schoolList: any[];
  religionList: any[];
  // casteList: any[];
  currentstatusList: any[];
  questionSetList: any[];
}

export const ApplicantTableRow = ({
  applicant,
  isSelected,
  onSelect,
  onUpdate,
  onViewDetails,
  onViewComments,
  onCampusChange,
  campusList,
  schoolList,
  religionList,
  // casteList,
  currentstatusList,
  questionSetList,
}: ApplicantTableRowProps) => {
  const fullName =
    [applicant.first_name, applicant.middle_name, applicant.last_name]
      .filter(Boolean)
      .join(" ") ||
    applicant.name ||
    "No name";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TableRow key={applicant.id}>
      {/* Checkbox */}
      <TableCell className="w-8 px-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(applicant.id)}
          aria-label={`Select ${fullName}`}
        />
      </TableCell>

      {/* Profile Image */}
      <TableCell className="w-12 px-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={applicant.image} alt={fullName} />
          <AvatarFallback className="text-xs">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
      </TableCell>

      {/* Full Name - Editable */}
      <TableCell className="min-w-[150px] max-w-[180px] px-2">
        <div className="truncate">
          <EditableCell
            applicant={applicant}
            field="first_name"
            displayValue={fullName}
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>

      {/* Phone Number - Simple text field */}
      <TableCell className="min-w-[110px] max-w-[130px] px-2">
        <div className="truncate">
          <EditableCell
            applicant={applicant}
            field="phone_number"
            displayValue={
              applicant.phone_number || applicant.mobile_no || "No phone"
            }
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>

      {/* WhatsApp Number - Simple text field */}
      <TableCell className="min-w-[110px] max-w-[130px] px-2">
        <div className="truncate">
          <EditableCell
            applicant={applicant}
            field="whatsapp_number"
            displayValue={applicant.whatsapp_number || "No WhatsApp"}
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>

      {/* Gender - Simple text field */}
      <TableCell className="min-w-[80px] max-w-[100px] px-2">
        <div className="truncate">
          <EditableCell
            applicant={applicant}
            field="gender"
            displayValue={applicant.gender || "Not specified"}
            options={[
              { id: "male", name: "Male" },
              { id: "female", name: "Female" },
              { id: "other", name: "Other" },
            ]}
            onUpdate={onUpdate}
            showPencil={false}
          />
        </div>
      </TableCell>

      {/* City - Simple text field */}
      <TableCell className="min-w-[90px] max-w-[120px] px-2">
        <div className="truncate">
          <EditableCell
            applicant={applicant}
            field="city"
            displayValue={applicant.city || "Not specified"}
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>

      {/* State - Simple text field */}
      <TableCell className="min-w-[100px] max-w-[140px] px-2">
        <div className="truncate">
          <EditableCell
            applicant={applicant}
            field="state"
            displayValue={applicant.state || "Not specified"}
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>

      {/* Pin Code - Simple text field */}
      <TableCell className="w-20 px-2">
        <div className="truncate">
          <EditableCell
            applicant={applicant}
            field="pin_code"
            displayValue={applicant.pin_code || "N/A"}
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>

      {/* School*/}
      <TableCell className="min-w-[120px] max-w-[150px] px-2">
        <div className="truncate">
          <EditableCell
            applicant={applicant}
            field="school_id"
            displayValue={applicant.school_name || "N/A"}
            value={applicant.school_id}
            onUpdate={onUpdate}
            options={schoolList.map((s) => ({ id: s.id, name: s.school_name }))}
            showPencil={false}
          />
        </div>
      </TableCell>

      {/* Campus  */}
      <TableCell className="min-w-[120px] max-w-[150px] px-2">
        <div className="truncate">
          <EditableCell
            applicant={applicant}
            field="campus_id"
            displayValue={applicant.campus_name || "N/A"}
            value={applicant.campus_id}
            onUpdate={onUpdate}
            options={campusList.map((c) => ({ id: c.id, name: c.campus_name }))}
            showPencil={false}
          />
        </div>
      </TableCell>
      {/* current status*/}
      <TableCell className="min-w-[100px] max-w-[120px] px-2">
        <div className="truncate">
          <EditableCell
            applicant={applicant}
            field="current_status_id"
            displayValue={applicant.current_status_name || "N/A"}
            value={applicant.current_status_id}
            onUpdate={onUpdate}
            options={currentstatusList.map((c) => ({
              id: c.id,
              name: c.current_status_name,
            }))}
            showPencil={false}
          />
        </div>
      </TableCell>

      <TableCell className="min-w-[100px] max-w-[120px] px-2">
        <div className="truncate">
          <EditableCell
            applicant={applicant}
            field="religion_id"
            displayValue={applicant.religion_name || "N/A"}
            value={applicant.religion_id}
            onUpdate={onUpdate}
            options={religionList.map((r) => ({
              id: r.id,
              name: r.religion_name,
            }))}
            showPencil={false}
          />
        </div>
      </TableCell>

      <TableCell className="min-w-[80px] max-w-[100px] px-2">
        <div className="truncate">
          <EditableCell
            applicant={applicant}
            field="is_passed"
            displayValue={
              applicant.is_passed === true
                ? "Yes"
                : applicant.is_passed === false
                ? "No"
                : "Not Set"
            }
            value={applicant.is_passed}
            onUpdate={onUpdate}
            options={[
              { id: "true", name: "Yes" },
              { id: "false", name: "No" },
            ]}
            showPencil={false}
          />
        </div>
      </TableCell>

      {/* Actions - Dropdown menu (... button) */}
      <TableCell className="w-16 px-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="bottom"
            sideOffset={5}
            className="bg-background border border-border shadow-lg z-50"
          >
            <DropdownMenuItem onClick={() => onViewDetails(applicant)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewComments(applicant)}>
              Comments
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};
