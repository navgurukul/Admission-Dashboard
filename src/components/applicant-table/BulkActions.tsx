import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Mail, Trash2 } from "lucide-react";

interface BulkActionsProps {
  selectedRowsCount: number;
  onBulkUpdate: () => void;
  onSendOfferLetters: () => void;
  onBulkDelete: () => void;
}

export const BulkActions = ({
  selectedRowsCount,
  onBulkUpdate,
  onSendOfferLetters,
  onBulkDelete,
}: BulkActionsProps) => {
  if (selectedRowsCount === 0) return null;

  return (
    <div className="flex items-center gap-2 mr-4">
      <Badge variant="secondary">{selectedRowsCount} selected</Badge>
      <Button variant="outline" size="sm" onClick={onBulkUpdate}>
        <Edit className="h-4 w-4 mr-2" />
        Bulk Update
      </Button>
      <Button variant="outline" size="sm" onClick={onSendOfferLetters}>
        <Mail className="h-4 w-4 mr-2" />
        Send Offer Letters
      </Button>
      <Button variant="outline" size="sm" onClick={onBulkDelete}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>
    </div>
  );
};
