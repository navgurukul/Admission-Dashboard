
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { EditableCell } from "./EditableCell";
import { StatusDropdown } from "./StatusDropdown";
import { StageDropdown } from "./StageDropdown";
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
  return (
    <TableRow key={applicant.id}>
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(applicant.id)}
          aria-label={`Select ${applicant.name}`}
        />
      </TableCell>
      <TableCell className="min-w-[200px] max-w-[250px]">
        <EditableCell 
          applicant={applicant} 
          field="name" 
          displayValue={applicant.name || "No name"} 
          onUpdate={onUpdate}
          showPencil={true}
        />
      </TableCell>
      <TableCell className="min-w-[140px] max-w-[180px]">
        <div className="truncate">
          <EditableCell 
            applicant={applicant} 
            field="mobile_no" 
            displayValue={applicant.mobile_no} 
            onUpdate={onUpdate}
            showPencil={true}
          />
        </div>
      </TableCell>
      <TableCell className="min-w-[140px] max-w-[180px]">
        <div className="truncate">
          <CampusSelector
            currentCampus={applicant.campus}
            applicantId={applicant.id}
            onCampusChange={onCampusChange}
          />
        </div>
      </TableCell>
      <TableCell className="min-w-[120px] max-w-[160px]">
        <StageDropdown applicant={applicant} onUpdate={onUpdate} />
      </TableCell>
      <TableCell className="min-w-[180px] max-w-[220px]">
        <StatusDropdown applicant={applicant} onUpdate={onUpdate} />
      </TableCell>
      <TableCell className="w-24">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-background border border-border shadow-lg z-50">
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
