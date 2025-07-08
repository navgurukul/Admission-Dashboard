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
    mobile_no: string;
    unique_number: string | null;
    name: string | null;
    city: string | null;
    block: string | null;
    date_of_testing: string | null;
    final_marks: number | null;
    qualifying_school: string | null;
    lr_status: string | null;
    lr_comments: string | null;
    cfr_status: string | null;
    cfr_comments: string | null;
    offer_letter_status: string | null;
    allotted_school: string | null;
    joining_status: string | null;
    final_notes: string | null;
    triptis_notes: string | null;
    whatsapp_number: string | null;
    caste: string | null;
    gender: string | null;
    qualification: string | null;
    current_work: string | null;
    set_name: string | null;
    exam_centre: string | null;
    created_at: string;
    updated_at: string;
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
                {applicant.name ? applicant.name.split(' ').map(n => n[0]).join('') : 'N/A'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{applicant.name || 'N/A'}</h3>
            </div>
            <StatusBadge status={(applicant.offer_letter_status || applicant.joining_status || 'pending') as any} />
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
                    <span className="font-medium">{applicant.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mobile No:</span>
                    <span className="font-medium">{applicant.mobile_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WhatsApp:</span>
                    <span className="font-medium">{applicant.whatsapp_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{applicant.city ? `${applicant.city}${applicant.block ? `, ${applicant.block}` : ''}` : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gender:</span>
                    <span className="font-medium">{applicant.gender || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Caste:</span>
                    <span className="font-medium">{applicant.caste || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center">
                  <Building className="w-4 h-4 mr-2" />
                  Additional Details
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Qualification:</span>
                    <span className="font-medium">{applicant.qualification || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Work:</span>
                    <span className="font-medium">{applicant.current_work || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exam Centre:</span>
                    <span className="font-medium">{applicant.exam_centre || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Test Date:</span>
                    <span className="font-medium">{applicant.date_of_testing ? new Date(applicant.date_of_testing).toLocaleDateString() : 'N/A'}</span>
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
              
              {applicant.final_marks ? (
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Final Marks:</span>
                    <Badge variant="secondary" className="text-lg font-bold">
                      {applicant.final_marks}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Qualifying School:</span>
                    <Badge className="bg-primary/10 text-primary">
                      {applicant.qualifying_school || 'N/A'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Set:</span>
                    <span className="font-medium">{applicant.set_name || 'N/A'}</span>
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
                    <Badge variant={applicant.lr_status === 'Pass' ? 'default' : 'outline'}>
                      {applicant.lr_status || 'Pending'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Status: {applicant.lr_status || 'Not started'}</p>
                    <p>Comments: {applicant.lr_comments || 'No comments'}</p>
                  </div>
                </div>

                {/* Cultural Fit Round */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">Cultural Fit Round (CFR)</h5>
                    <Badge variant={applicant.cfr_status === 'Pass' ? 'default' : 'outline'}>
                      {applicant.cfr_status || 'Pending'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Status: {applicant.cfr_status || 'Not started'}</p>
                    <p>Comments: {applicant.cfr_comments || 'No comments'}</p>
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
              
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Offer Letter Status:</span>
                  <Badge variant="outline">{applicant.offer_letter_status || 'Pending'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Allotted School:</span>
                  <span className="font-medium">{applicant.allotted_school || 'Not assigned'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Joining Status:</span>
                  <Badge variant={applicant.joining_status === 'Joined' ? 'default' : 'outline'}>
                    {applicant.joining_status || 'Pending'}
                  </Badge>
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
                    <span className="text-sm font-medium">Final Notes</span>
                    <span className="text-xs text-muted-foreground">{new Date(applicant.updated_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {applicant.final_notes || 'No final notes available'}
                  </p>
                </div>
                
                <div className="border-l-2 border-muted pl-4 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Tripti's Notes</span>
                    <span className="text-xs text-muted-foreground">{new Date(applicant.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {applicant.triptis_notes || 'No notes from Tripti available'}
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
