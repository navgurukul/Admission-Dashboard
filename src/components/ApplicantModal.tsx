import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { 
  User, 
  Phone, 
  MapPin, 
  Building, 
  GraduationCap,
  Calendar,
  MessageSquare,
  Trophy,
  FileText
} from "lucide-react";

interface ApplicantModalProps {
  applicant: {
    id: string;
    name: string;
    phone: string;
    city: string;
    state: string;
    partnerNgo: string;
    currentStage: string;
    currentStatus: any;
    assignedTo: string;
    lastInteraction: string;
    examScore: number | null;
    qualifiedProgram: string | null;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ApplicantModal({ applicant, isOpen, onClose }: ApplicantModalProps) {
  if (!applicant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-medium">
                {applicant.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{applicant.name}</h3>
              <p className="text-sm text-muted-foreground">ID: {applicant.id}</p>
            </div>
            <StatusBadge status={applicant.currentStatus} />
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="contact" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="screening">Screening</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="decision">Decision</TabsTrigger>
            <TabsTrigger value="communication">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="contact" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Personal Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Full Name:</span>
                    <span className="font-medium">{applicant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{applicant.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{applicant.city}, {applicant.state}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Partnership Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Partner NGO:</span>
                    <span className="font-medium">{applicant.partnerNgo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assigned To:</span>
                    <span className="font-medium">{applicant.assignedTo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Contact:</span>
                    <span className="font-medium">{applicant.lastInteraction}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="screening" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <GraduationCap className="w-4 h-4 mr-2" />
                Screening Test Results
              </h4>
              
              {applicant.examScore ? (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Test Score:</span>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {applicant.examScore}/20
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Qualified Program:</span>
                    <Badge className="bg-primary/10 text-primary">
                      {applicant.qualifiedProgram}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Test Status:</span>
                    <StatusBadge status={applicant.currentStatus} />
                  </div>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-4 text-center text-muted-foreground">
                  <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No screening test data available</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="interviews" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <MessageSquare className="w-4 h-4 mr-2" />
                Interview Progress
              </h4>
              
              <div className="space-y-4">
                {/* Learning Round */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">Learning Round (LR)</h5>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Interviewer: Not assigned</p>
                    <p>Scheduled: Not scheduled</p>
                    <p>Status: Awaiting screening results</p>
                  </div>
                </div>

                {/* Cultural Fit Round */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">Cultural Fit Round (CFR)</h5>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Interviewer: Not assigned</p>
                    <p>Scheduled: Pending LR completion</p>
                    <p>Status: Awaiting LR results</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="decision" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                Final Decision Status
              </h4>
              
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <div className="space-y-3">
                  <StatusBadge status={applicant.currentStatus} />
                  <p className="text-sm text-muted-foreground">
                    Current stage: {applicant.currentStage}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Next action depends on interview completion
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="communication" className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Communication History
              </h4>
              
              <div className="space-y-3">
                <div className="border-l-2 border-primary/20 pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Initial Contact</span>
                    <span className="text-xs text-muted-foreground">{applicant.lastInteraction}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    First outreach completed via WhatsApp. Basic details collected successfully.
                  </p>
                </div>
                
                <div className="border-l-2 border-muted pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Application Submitted</span>
                    <span className="text-xs text-muted-foreground">3 days ago</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complete application form received. Ready for screening test.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}