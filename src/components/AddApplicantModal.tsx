import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AddApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddApplicantModal({ isOpen, onClose, onSuccess }: AddApplicantModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [testDate, setTestDate] = useState<Date>();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    mobile_no: "",
    whatsapp_number: "",
    city: "",
    block: "",
    caste: "",
    gender: "",
    qualification: "",
    current_work: "",
    unique_number: "",
    set_name: "",
    exam_centre: "",
    date_of_testing: "",
    final_marks: "",
    qualifying_school: "",
    lr_status: "",
    lr_comments: "",
    cfr_status: "",
    cfr_comments: "",
    offer_letter_status: "",
    allotted_school: "",
    joining_status: "",
    final_notes: "",
    triptis_notes: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.mobile_no.trim()) {
      toast({
        title: "Error",
        description: "Mobile number is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dataToInsert = {
        ...formData,
        date_of_testing: testDate ? testDate.toISOString().split('T')[0] : null,
        final_marks: formData.final_marks ? parseFloat(formData.final_marks) : null,
      };

      const { error } = await supabase
        .from('admission_dashboard')
        .insert([dataToInsert]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Applicant added successfully",
      });
      
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        name: "",
        mobile_no: "",
        whatsapp_number: "",
        city: "",
        block: "",
        caste: "",
        gender: "",
        qualification: "",
        current_work: "",
        unique_number: "",
        set_name: "",
        exam_centre: "",
        date_of_testing: "",
        final_marks: "",
        qualifying_school: "",
        lr_status: "",
        lr_comments: "",
        cfr_status: "",
        cfr_comments: "",
        offer_letter_status: "",
        allotted_school: "",
        joining_status: "",
        final_notes: "",
        triptis_notes: "",
      });
      setTestDate(undefined);
    } catch (error) {
      console.error('Error adding applicant:', error);
      toast({
        title: "Error",
        description: "Failed to add applicant",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Applicant</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="screening">Screening</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="final">Final Status</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Phone Number *</Label>
                <Input
                  id="mobile"
                  value={formData.mobile_no}
                  onChange={(e) => handleInputChange('mobile_no', e.target.value)}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp_number}
                  onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  placeholder="Enter WhatsApp number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block">Block</Label>
                <Input
                  id="block"
                  value={formData.block}
                  onChange={(e) => handleInputChange('block', e.target.value)}
                  placeholder="Enter block"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="caste">Caste</Label>
                <Input
                  id="caste"
                  value={formData.caste}
                  onChange={(e) => handleInputChange('caste', e.target.value)}
                  placeholder="Enter caste"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) => handleInputChange('qualification', e.target.value)}
                  placeholder="Enter qualification"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_work">Current Work</Label>
                <Input
                  id="current_work"
                  value={formData.current_work}
                  onChange={(e) => handleInputChange('current_work', e.target.value)}
                  placeholder="Enter current work"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unique_number">Unique Number</Label>
                <Input
                  id="unique_number"
                  value={formData.unique_number}
                  onChange={(e) => handleInputChange('unique_number', e.target.value)}
                  placeholder="Enter unique number"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="triptis_notes">Communication Notes</Label>
              <Textarea
                id="triptis_notes"
                value={formData.triptis_notes}
                onChange={(e) => handleInputChange('triptis_notes', e.target.value)}
                placeholder="Enter communication notes"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="screening" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="set_name">Set Name</Label>
                <Input
                  id="set_name"
                  value={formData.set_name}
                  onChange={(e) => handleInputChange('set_name', e.target.value)}
                  placeholder="Enter set name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam_centre">Exam Centre</Label>
                <Input
                  id="exam_centre"
                  value={formData.exam_centre}
                  onChange={(e) => handleInputChange('exam_centre', e.target.value)}
                  placeholder="Enter exam centre"
                />
              </div>
              <div className="space-y-2">
                <Label>Date of Testing</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !testDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {testDate ? format(testDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={testDate}
                      onSelect={setTestDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="final_marks">Final Marks</Label>
                <Input
                  id="final_marks"
                  type="number"
                  value={formData.final_marks}
                  onChange={(e) => handleInputChange('final_marks', e.target.value)}
                  placeholder="Enter final marks"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualifying_school">Qualifying School</Label>
                <Input
                  id="qualifying_school"
                  value={formData.qualifying_school}
                  onChange={(e) => handleInputChange('qualifying_school', e.target.value)}
                  placeholder="Enter qualifying school"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="interviews" className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lr_status">LR Status</Label>
                  <Select value={formData.lr_status} onValueChange={(value) => handleInputChange('lr_status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select LR status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pass">Pass</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cfr_status">CFR Status</Label>
                  <Select value={formData.cfr_status} onValueChange={(value) => handleInputChange('cfr_status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select CFR status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pass">Pass</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lr_comments">LR Comments</Label>
                <Textarea
                  id="lr_comments"
                  value={formData.lr_comments}
                  onChange={(e) => handleInputChange('lr_comments', e.target.value)}
                  placeholder="Enter LR comments"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cfr_comments">CFR Comments</Label>
                <Textarea
                  id="cfr_comments"
                  value={formData.cfr_comments}
                  onChange={(e) => handleInputChange('cfr_comments', e.target.value)}
                  placeholder="Enter CFR comments"
                  rows={2}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="final" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="offer_letter_status">Offer Letter Status</Label>
                <Select value={formData.offer_letter_status} onValueChange={(value) => handleInputChange('offer_letter_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select offer letter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sent">Sent</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="joining_status">Joining Status</Label>
                <Select value={formData.joining_status} onValueChange={(value) => handleInputChange('joining_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select joining status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Joined">Joined</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allotted_school">Allotted School</Label>
                <Input
                  id="allotted_school"
                  value={formData.allotted_school}
                  onChange={(e) => handleInputChange('allotted_school', e.target.value)}
                  placeholder="Enter allotted school"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="final_notes">Final Notes</Label>
              <Textarea
                id="final_notes"
                value={formData.final_notes}
                onChange={(e) => handleInputChange('final_notes', e.target.value)}
                placeholder="Enter final notes"
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Applicant"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}