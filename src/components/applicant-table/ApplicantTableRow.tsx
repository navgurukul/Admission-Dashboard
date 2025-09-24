
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
}

export const ApplicantTableRow = ({ 
  applicant, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onViewDetails, 
  onViewComments,
  onCampusChange 
}: ApplicantTableRowProps) => {
  const fullName = [
    applicant.first_name,
    applicant.middle_name, 
    applicant.last_name
  ].filter(Boolean).join(' ') || applicant.name || "No name";

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <TableRow key={applicant.id}>
      {/* Checkbox */}
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(applicant.id)}
          aria-label={`Select ${fullName}`}
        />
      </TableCell>

      {/* Profile Image */}
      <TableCell className="w-16">
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={applicant.image} 
            alt={fullName}
          />
          <AvatarFallback className="text-xs">
            {getInitials(fullName)}
          </AvatarFallback>
        </Avatar>
      </TableCell>

      {/* Full Name - Editable */}
      <TableCell className="min-w-[200px] max-w-[250px]">
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
      <TableCell className="min-w-[140px] max-w-[180px]">
        <div className="truncate">
          <EditableCell 
            applicant={applicant} 
            field="phone_number" 
            displayValue={applicant.phone_number || applicant.mobile_no || "No phone"} 
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>

      {/* WhatsApp Number - Simple text field */}
      <TableCell className="min-w-[140px] max-w-[180px]">
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
      <TableCell className="min-w-[120px] max-w-[160px]">
        <div className="truncate">
          <EditableCell 
            applicant={applicant} 
            field="gender" 
            displayValue={applicant.gender || "Not specified"} 
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>

      {/* City - Simple text field */}
      <TableCell className="min-w-[120px] max-w-[160px]">
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
      <TableCell className="min-w-[180px] max-w-[220px]">
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
      <TableCell className="w-24">
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
      <TableCell className="w-24">
        <div className="truncate">
          <EditableCell 
            applicant={applicant} 
            field="school_name" 
            displayValue={applicant.school_name || "N/A"} 
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>
    
      {/* Campus  */}
      <TableCell className="w-24">
        <div className="truncate">
          <EditableCell 
            applicant={applicant} 
            field="campus_name" 
            displayValue={applicant.campus_name || "N/A"} 
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>
     {/* current status*/ }
      <TableCell className="w-24">
        <div className="truncate">
          <EditableCell 
            applicant={applicant} 
            field="current_status" 
            displayValue={applicant.current_status_name || "N/A"} 
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>

      <TableCell className="w-24">
        <div className="truncate">
          <EditableCell 
            applicant={applicant} 
            field="campus_name" 
            displayValue={applicant.religion_name || "N/A"} 
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>
      
      {/* Actions - Dropdown menu (... button) */}
      <TableCell className="w-24">
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