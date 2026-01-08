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
}

export const ApplicantTableHeader = ({
  selectedRows,
  filteredApplicants,
  handleSelectAllRows,
}: ApplicantTableHeaderProps) => {
  return (
    <TableHeader className="sticky top-0 bg-background z-10 border-b">
      <TableRow>
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
        <TableHead className="font-bold w-12 px-3">Image</TableHead>
        <TableHead className="sticky left-12 bg-background z-10 min-w-[150px] px-3">
          Full Name
        </TableHead>
        <TableHead className="font-bold min-w-[120px] max-w-[220px] px-3">
          Email
        </TableHead>
        <TableHead className="font-bold min-w-[80px] max-w-[100px] px-3">
          Marks
        </TableHead>
        <TableHead className="font-bold min-w-[110px] max-w-[130px] px-3">
          Phone Number
        </TableHead>
        {/* <TableHead className="font-bold min-w-[140px] max-w-[180px] px-3">
          WhatsApp Number
        </TableHead> */}
        <TableHead className="font-bold min-w-[80px] max-w-[100px] px-3">
          Gender
        </TableHead>
        {/* <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
          Campus
        </TableHead> */}

        <TableHead className="font-bold min-w-[120px] max-w-[150px] px-3">
          Status
        </TableHead>
        <TableHead className="font-bold min-w-[140px] max-w-[180px] px-3">
          Qualifying School
        </TableHead>
        <TableHead className="w-16 font-bold px-3">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};
