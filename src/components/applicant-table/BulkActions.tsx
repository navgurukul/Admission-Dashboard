import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyMinus, Edit, Mail, Trash2 } from "lucide-react";

interface BulkActionsProps {
  selectedRowsCount: number;
  onBulkUpdate: () => void;
  onMarkDuplicate: () => void;
  onSendOfferLetters: () => void;
  onBulkDelete: () => void;
}

export const BulkActions = ({
  selectedRowsCount,
  onBulkUpdate,
  onMarkDuplicate,
  onSendOfferLetters,
  onBulkDelete,
}: BulkActionsProps) => {
  if (selectedRowsCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="secondary" className="flex-shrink-0">
        {selectedRowsCount} selected
      </Badge>
      <Button variant="outline" size="sm" onClick={onBulkUpdate} className="flex-shrink-0">
        <Edit className="h-4 w-4 md:mr-2" />
        <span className="hidden sm:inline">Bulk Update</span>
      </Button>
      <Button variant="outline" size="sm" onClick={onMarkDuplicate} className="flex-shrink-0">
        <CopyMinus className="h-4 w-4 md:mr-2" />
        <span className="hidden sm:inline">Mark Duplicate</span>
      </Button>
      <Button variant="outline" size="sm" onClick={onSendOfferLetters} className="flex-shrink-0">
        <Mail className="h-4 w-4 md:mr-2" />
        <span className="hidden sm:inline">Send Offers</span>
      </Button>
      <Button variant="outline" size="sm" onClick={onBulkDelete} className="flex-shrink-0">
        <Trash2 className="h-4 w-4 md:mr-2" />
        <span className="hidden sm:inline">Delete</span>
      </Button>
    </div>
  );
};
