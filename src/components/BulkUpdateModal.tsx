
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface BulkUpdateModalProps {
  selectedApplicants: string[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Stage-status hierarchy
const STAGE_STATUS_OPTIONS = {
  contact: [],
  screening: [
    { value: 'pending', label: 'Pending' },
    { value: 'pass', label: 'Pass' },
    { value: 'fail', label: 'Fail' }
  ],
  interviews: [
    { value: 'pending', label: 'Pending' },
    { value: 'booked', label: 'Booked' },
    { value: 'rescheduled', label: 'Rescheduled' },
    { value: 'lr_qualified', label: 'LR Qualified' },
    { value: 'lr_failed', label: 'LR Failed' },
    { value: 'cfr_qualified', label: 'CFR Qualified' },
    { value: 'cfr_failed', label: 'CFR Failed' }
  ],
  decision: [
    { value: 'offer_pending', label: 'Offer Pending' },
    { value: 'offer_sent', label: 'Offer Sent' },
    { value: 'offer_rejected', label: 'Offer Rejected' },
    { value: 'offer_accepted', label: 'Offer Accepted' }
  ]
};

export function BulkUpdateModal({ selectedApplicants, isOpen, onClose, onSuccess }: BulkUpdateModalProps) {
  const [updateData, setUpdateData] = useState({
    stage: '',
    status: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleStageChange = (stage: string) => {
    setUpdateData(prev => ({ 
      stage, 
      status: stage === 'contact' ? '' : 'pending'
    }));
  };

  const handleBulkUpdate = async () => {
    if (!updateData.stage) {
      toast({
        title: "Error",
        description: "Please select a stage",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updates: any = {
        stage: updateData.stage,
        last_updated: new Date().toISOString()
      };

      // Only add status if it's not empty and stage is not contact
      if (updateData.status && updateData.stage !== 'contact') {
        updates.status = updateData.status;
      } else if (updateData.stage === 'contact') {
        updates.status = null;
      }

      const { error } = await supabase
        .from('admission_dashboard')
        .update(updates)
        .in('id', selectedApplicants);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Updated ${selectedApplicants.length} applicant(s) successfully`,
      });

      onSuccess();
      onClose();
      
      // Reset form
      setUpdateData({ stage: '', status: '' });
    } catch (error) {
      console.error('Error bulk updating applicants:', error);
      toast({
        title: "Error",
        description: "Failed to update applicants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const availableStatuses = STAGE_STATUS_OPTIONS[updateData.stage as keyof typeof STAGE_STATUS_OPTIONS] || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bulk Update - {selectedApplicants.length} Applicant(s)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              This will update the stage and status for {selectedApplicants.length} selected applicant(s).
            </p>
          </div>

          <div>
            <Label>New Stage</Label>
            <Select value={updateData.stage} onValueChange={handleStageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select new stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="interviews">Interviews</SelectItem>
                <SelectItem value="decision">Decision</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {availableStatuses.length > 0 && (
            <div>
              <Label>New Status</Label>
              <Select value={updateData.status} onValueChange={(value) => setUpdateData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {updateData.stage === 'contact' && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                Contact stage doesn't have status options. Status will be cleared for selected applicants.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center py-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Current Stage/Status</span>
              <ArrowRight className="w-4 h-4" />
              <span className="font-medium">
                {updateData.stage ? 
                  `${updateData.stage.charAt(0).toUpperCase() + updateData.stage.slice(1)}${updateData.status ? ` (${availableStatuses.find(s => s.value === updateData.status)?.label || updateData.status})` : ''}` 
                  : 'Select stage'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleBulkUpdate} disabled={loading || !updateData.stage}>
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Updating...
              </>
            ) : (
              `Update ${selectedApplicants.length} Applicant(s)`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
