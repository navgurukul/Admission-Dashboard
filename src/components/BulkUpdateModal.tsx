
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CampusOption {
  id: string;
  name: string;
  is_active: boolean;
}

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
    stage: 'no_change',
    status: 'no_change',
    campus: 'no_change'
  });
  const [campusOptions, setCampusOptions] = useState<CampusOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchCampusOptions();
    }
  }, [isOpen]);

  const fetchCampusOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('campus_options')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCampusOptions(data || []);
    } catch (error) {
      console.error('Error fetching campus options:', error);
    }
  };

  const handleStageChange = (stage: string) => {
    setUpdateData(prev => ({ 
      ...prev,
      stage, 
      status: stage === 'contact' ? 'no_change' : 'pending'
    }));
  };

  const handleBulkUpdate = async () => {
    if (updateData.stage === 'no_change' && updateData.campus === 'no_change') {
      toast({
        title: "Error",
        description: "Please select at least a stage or campus to update",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updates: any = {
        last_updated: new Date().toISOString()
      };

      // Only add stage/status if stage is selected
      if (updateData.stage !== 'no_change') {
        updates.stage = updateData.stage;
        if (updateData.status !== 'no_change' && updateData.stage !== 'contact') {
          updates.status = updateData.status;
        } else if (updateData.stage === 'contact') {
          updates.status = null;
        }
      }

      // Only add campus if selected
      if (updateData.campus !== 'no_change') {
        updates.campus = updateData.campus === 'unassigned' ? null : updateData.campus;
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
      setUpdateData({ stage: 'no_change', status: 'no_change', campus: 'no_change' });
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
              This will update the selected fields for {selectedApplicants.length} selected applicant(s). Leave fields empty to keep them unchanged.
            </p>
          </div>

          <div>
            <Label>Stage (Optional)</Label>
            <Select value={updateData.stage} onValueChange={handleStageChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select new stage (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">No change</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="interviews">Interviews</SelectItem>
                <SelectItem value="decision">Decision</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {availableStatuses.length > 0 && updateData.stage !== 'no_change' && (
            <div>
              <Label>Status</Label>
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

          <div>
            <Label>Campus (Optional)</Label>
            <Select value={updateData.campus} onValueChange={(value) => setUpdateData(prev => ({ ...prev, campus: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select new campus (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_change">No change</SelectItem>
                <SelectItem value="unassigned">Not assigned</SelectItem>
                {campusOptions.map((campus) => (
                  <SelectItem key={campus.id} value={campus.name}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {updateData.stage === 'contact' && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                Contact stage doesn't have status options. Status will be cleared for selected applicants.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center py-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Bulk Update</span>
              <ArrowRight className="w-4 h-4" />
              <span className="font-medium">
                {updateData.stage !== 'no_change' || updateData.campus !== 'no_change' ? 
                  `${updateData.stage !== 'no_change' ? `Stage: ${updateData.stage.charAt(0).toUpperCase() + updateData.stage.slice(1)}` : ''}${updateData.stage !== 'no_change' && updateData.campus !== 'no_change' ? ', ' : ''}${updateData.campus !== 'no_change' ? `Campus: ${updateData.campus === 'unassigned' ? 'Not assigned' : updateData.campus}` : ''}` 
                  : 'Select fields to update'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleBulkUpdate} disabled={loading || (updateData.stage === 'no_change' && updateData.campus === 'no_change')}>
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
