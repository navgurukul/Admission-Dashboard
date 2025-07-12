
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, User, Calendar } from "lucide-react";

interface ApplicantLogsModalProps {
  applicantId: string;
  applicantName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ApplicantLogsModal = ({ 
  applicantId, 
  applicantName, 
  isOpen, 
  onClose 
}: ApplicantLogsModalProps) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['system-logs', applicantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('entity_id', applicantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen
  });

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'comment_added':
        return 'bg-blue-100 text-blue-800';
      case 'comment_deleted':
        return 'bg-red-100 text-red-800';
      case 'status_updated':
        return 'bg-green-100 text-green-800';
      case 'stage_updated':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity Log for {applicantName}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Loading logs...</div>
            ) : logs?.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No activity logs found for this applicant.
              </div>
            ) : (
              logs?.map((log) => (
                <Card key={log.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(log.action_type)}>
                          {log.action_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <User className="h-3 w-3" />
                          {log.user_name || 'System'}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{log.description}</p>
                    {log.metadata && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
