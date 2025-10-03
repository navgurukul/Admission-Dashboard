import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  CheckCircle2,
  Circle,
  AlertCircle,
  User,
  FileText,
  MessageSquare,
  Trophy,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import { createStudent, getAllCasts, getAllQualification } from "@/utils/api";
import { string } from "zod";
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

const format = (date: Date, formatStr: string) => {
  if (formatStr === "PPP") {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  if (formatStr === "yyyy-MM-dd") {
    return date.toISOString().split("T")[0];
  }
  return date.toLocaleDateString();
};

interface Campus {
  id: number;
  campus_name: string;
}

interface School {
  id: number;
  school_name: string;
}

interface religion {
  id: number;
  religion_name: string;
}

interface CurrentStatus {
  id: number;
  current_status_name: string;
}

interface QuestionSet {
  id: number;
  name: string;
  description: string;
  status: boolean;
  maximumMarks: number;
  created_at: string;
  updated_at: string;
}

interface AddApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newApplicant: any) => void;
  campusList: Campus[];
  schoolList: School[];
  currentstatusList: CurrentStatus[];
  religionList: religion[];
  questionSetList: QuestionSet[];
}

export function AddApplicantModal({
  isOpen,
  onClose,
  onSuccess,
  campusList,
  schoolList,
  currentstatusList,
  religionList,
  questionSetList,
}: AddApplicantModalProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [testDate, setTestDate] = useState<Date>();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [casteList, setCasteList] = useState<any[]>([]);
  const [qualificationList, setQualificationList] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    // Basic Info
    first_name: "",
    middle_name: "",
    last_name: "",
    phone_number: "",
    whatsapp_number: "",
    email: "",
    dob: "",
    city: "",
    block: "",
    state: "",
    district: "",
    pin_code: "",
    cast_id: "",
    gender: "",
    qualification_id: "",
    current_status_id: "",
    religion_id: "",
    qualifying_school_id: "",

    // Campus / School
    campus_id: "",
    school_id: "",
    school_medium: "",

    // Screening
    status: "",
    is_passed: false,
    question_set_id: "",
    total_marks: 0,
    obtained_marks: "",
    exam_centre: "",
    date_of_test: "",
    communication_notes: "",

    // Interview
    lr_status: "",
    lr_comments: "",
    cfr_status: "",
    cfr_comments: "",

    // Final
    offer_letter_status: "",
    allotted_school: "",
    joining_status: "",
    final_notes: "",
    triptis_notes: "",

    // Stage management
    stage: "",
    status_id: "",
    interviews_status: "",
    decision_status: "",
  });

  const resetForm = () => {
    setFormData({
      first_name: "",
      middle_name: "",
      last_name: "",
      phone_number: "",
      whatsapp_number: "",
      email: "",
      dob: "",
      city: "",
      block: "",
      state: "",
      district: "",
      pin_code: "",
      cast_id: "",
      gender: "",
      campus_id: "",
      school_id: "",
      qualification_id: "",
      current_status_id: "",
      qualifying_school_id: "",
      lr_status: "",
      lr_comments: "",
      cfr_status: "",
      cfr_comments: "",
      offer_letter_status: "",
      allotted_school: "",
      joining_status: "",
      final_notes: "",
      triptis_notes: "",
      stage: "",
      status_id: "",
      interviews_status: "",
      decision_status: "",
      religion_id: "",
      status: "",
      is_passed: false,
      question_set_id: "",
      total_marks: 0,
      obtained_marks: "",
      exam_centre: "",
      date_of_test: "",
      communication_notes: "",
      school_medium: "",
    });
    setTestDate(undefined);
    setActiveTab("basic");
    setErrors({});
  };

  useEffect(() => {
    const fetchCasteList = async () => {
      try {
        const response = await getAllCasts();
        setCasteList(response || []);
      } catch (error) {
        console.error("Error fetching castes:", error);
      }
    };

    fetchCasteList();
  }, []);

  useEffect(() => {
    const fetchQualifications = async () => {
      try {
        const response = await getAllQualification();
        setQualificationList(response || []);
      } catch (error) {
        console.error("Error fetching qualifications:", error);
      }
    };

    fetchQualifications();
  }, []);

  useEffect(() => {
    if (formData.question_set_id && questionSetList.length > 0) {
      const selectedQuestionSet = questionSetList.find(
        (set) => set.id === Number(formData.question_set_id)
      );
      if (selectedQuestionSet) {
        setFormData((prev) => ({
          ...prev,
          total_marks: selectedQuestionSet.maximumMarks,
        }));
      }
    }
  }, [formData.question_set_id, questionSetList]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Mobile number must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill the required fields first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const dataToInsert = {
        // Basic details
        image_url: null,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        gender: formData.gender || null,
        dob: formData.dob || null,
        email: formData.email || `${formData.phone_number}@example.com`,
        phone_number: formData.phone_number,
        whatsapp_number: formData.whatsapp_number || null,

        // Location details
        state: formData.state || null,
        city: formData.city || null,
        district: formData.district || null,
        pin_code: formData.pin_code || null,

        // Additional details
        cast_id: formData.cast_id ? Number(formData.cast_id) : null,
        qualification_id: formData.qualification_id? Number(formData.qualification_id): null,
        current_status_id: formData.current_status_id? Number(formData.current_status_id): null,
        religion_id: formData.religion_id ? Number(formData.religion_id) : null,
        school_medium: formData.school_medium || null,

        // Communication notes
        communication_notes: formData.communication_notes || "",
        campus_id: formData.campus_id ? Number(formData.campus_id) : null,
        school_id: formData.school_id ? Number(formData.school_id) : null,
        qualifying_school_id: formData.qualifying_school_id ? Number(formData.qualifying_school_id) : null, 


        // Exam Session Data
        question_set_id: formData.question_set_id
          ? Number(formData.question_set_id)
          : 1,
        total_marks: formData.total_marks ? Number(formData.total_marks) : 0,
        obtained_marks: formData.obtained_marks
          ? Number(formData.obtained_marks)
          : 0,
        is_passed: Boolean(formData.is_passed),
        status: formData.status || null,
        exam_centre: formData.exam_centre || null,
        date_of_test: formData.date_of_test || null,
      };

      // API Call
      const response = await createStudent(dataToInsert);

      // Transform the response to match your table structure
      const transformedApplicant = {
        id: response.id,
        name:
          response.first_name +
          (response.middle_name ? ` ${response.middle_name}` : "") +
          (response.last_name ? ` ${response.last_name}` : ""),
        mobile_no: response.phone_number,
        whatsapp_number: response.whatsapp_number,
        email: response.email,
        city: response.city,

        campus_id: response.campus_id,
        campus:campusList?.find((c) => Number(c.id) === Number(response.campus_id))?.campus_name || "",

        //  School
        school_id: response.school_id,
        school:schoolList?.find((s) => s.id === response.school_id)?.school_name ||"",

        gender: response.gender,
        qualification_id: response.qualification_id,
        qualification:qualificationList?.find((q) => q.id === response.qualification_id) ?.name || "",
        current_status_id: response.current_status_id,
        current_work:currentstatusList?.find((c) => c.id === response.current_status_id) ?.current_status_name || "",
        is_passed: response.is_passed,
        status: response.status,
        total_marks: response.total_marks,
        obtained_marks: response.obtained_marks,
        question_set_id: response.question_set_id,
        exam_centre: response.exam_centre,
        date_of_test: response.date_of_test,
        communication_notes: response.communication_notes,
      };

      toast({
        title: "Success! ",
        description: "Applicant created successfully",
      });

      onSuccess(transformedApplicant);
      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Error creating student:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create student",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTabIcon = (tabValue: string) => {
    const icons = {
      basic: User,
      screening: FileText,
      interviews: MessageSquare,
      final: Trophy,
    };
    return icons[tabValue as keyof typeof icons] || Circle;
  };

  const isTabCompleted = (tabValue: string) => {
    switch (tabValue) {
      case "basic":
        return (
          formData.first_name && formData.phone_number && formData.stage
        );
      case "screening":
        return formData.stage !== "screening" || formData.status;
      // case "interviews":
      //   return formData.stage_id !== "interviews" || formData.interviews_status;
      // case "final":
      //   return formData.stage_id !== "decision" || formData.decision_status;
      default:
        return false;
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getNextTab = () => {
    const tabs = ["basic", "screening", "interviews", "final"];
    const currentIndex = tabs.indexOf(activeTab);
    return currentIndex < tabs.length - 1 ? tabs[currentIndex + 1] : null;
  };

  const getPreviousTab = () => {
    const tabs = ["basic", "screening", "interviews", "final"];
    const currentIndex = tabs.indexOf(activeTab);
    return currentIndex > 0 ? tabs[currentIndex - 1] : null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-5xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0 sm:p-6">
        <DialogHeader className="pb-4 sm:pb-6 px-4 sm:px-0 pt-4 sm:pt-0 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            Add New Applicant
          </DialogTitle>

          {/* Mobile-friendly progress indicator */}
          <div className="flex justify-center mt-3 sm:mt-4">
            <div className="flex item-center space-x-4 sm:space-x-6 justify-between">
              {["basic", "screening"].map((tab, index, arr) => {
                const Icon = getTabIcon(tab);
                const isCompleted = isTabCompleted(tab);
                const isCurrent = activeTab === tab;

                return (
                  <div key={tab} className="flex items-center">
                    <div
                      className={cn(
                        "flex items-center justify-center w-8 h-8 sm:w-8 sm:h-8 rounded-full border-2 transition-colors",
                        isCurrent
                          ? "bg-orange-500 border-orange-500 text-white"
                          : isCompleted
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "border-gray-300 text-gray-400"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      ) : (
                        <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                      )}
                    </div>
                    {index < arr.length - 1 && (
                      <div
                        className={cn(
                          "w-6 sm:w-12 h-0.5 mx-1 sm:mx-2",
                          isCompleted ? "bg-orange-400" : "bg-orange-300"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* Mobile-friendly tab list */}
            <TabsList className="flex w-full justify-between mb-4 sm:mb-8 h-auto">
              <TabsTrigger
                value="basic"
                className="flex-1 flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3"
              >
                <User className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Basic</span>
              </TabsTrigger>
              <TabsTrigger
                value="screening"
                className="flex-1 flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3"
              >
                <FileText className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Screening</span>
              </TabsTrigger>
              {/* <TabsTrigger
                value="interviews"
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Interviews</span>
              </TabsTrigger>
              <TabsTrigger
                value="final"
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3"
              >
                <Trophy className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Final</span>
              </TabsTrigger> */}
            </TabsList>

            <TabsContent value="basic" className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-indigo-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Applicant Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm font-medium">
                      First Name *
                    </Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) =>
                        handleInputChange("first_name", e.target.value)
                      }
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="middle_name"
                      className="text-sm font-medium"
                    >
                      Middle Name
                    </Label>
                    <Input
                      id="middle_name"
                      value={formData.middle_name}
                      onChange={(e) =>
                        handleInputChange("middle_name", e.target.value)
                      }
                      placeholder="Enter middle name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm font-medium">
                      Last Name *
                    </Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) =>
                        handleInputChange("last_name", e.target.value)
                      }
                      placeholder="Enter last name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-sm font-medium">
                      Phone Number *
                    </Label>
                    <Input
                      id="mobile"
                      value={formData.phone_number}
                      onChange={(e) =>
                        handleInputChange("phone_number", e.target.value)
                      }
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                      className={errors.phone_number ? "border-red-500" : ""}
                    />
                    {errors.phone_number && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.phone_number}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-sm font-medium">
                      WhatsApp Number
                    </Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp_number}
                      onChange={(e) =>
                        handleInputChange("whatsapp_number", e.target.value)
                      }
                      placeholder="Enter WhatsApp number"
                      maxLength={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-sm font-medium">
                      Date of Birth
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium">
                      Gender
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleInputChange("gender", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-emerald-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Location Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium">
                      State
                    </Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                      placeholder="Enter state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-sm font-medium">
                      District
                    </Label>
                    <Input
                      id="district"
                      value={formData.district}
                      onChange={(e) =>
                        handleInputChange("district", e.target.value)
                      }
                      placeholder="Enter district"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="block" className="text-sm font-medium">
                      Block
                    </Label>
                    <Input
                      id="block"
                      value={formData.block}
                      onChange={(e) =>
                        handleInputChange("block", e.target.value)
                      }
                      placeholder="Enter block"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin_code" className="text-sm font-medium">
                      PIN Code
                    </Label>
                    <Input
                      id="pin_code"
                      value={formData.pin_code}
                      onChange={(e) =>
                        handleInputChange("pin_code", e.target.value)
                      }
                      placeholder="Enter PIN code"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Additional Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* ---- Caste ---- */}
                  <div className="space-y-2">
                    <Label htmlFor="caste_id" className="text-sm font-medium">
                      Caste
                    </Label>
                    <Select
                      value={formData.cast_id ? String(formData.cast_id) : ""}
                      onValueChange={(value) =>
                        handleInputChange("cast_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select caste" />
                      </SelectTrigger>
                      <SelectContent>
                        {casteList?.map((caste) => (
                          <SelectItem key={caste.id} value={String(caste.id)}>
                            {caste.cast_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ---- Qualification ---- */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="qualification_id"
                      className="text-sm font-medium"
                    >
                      Qualification
                    </Label>
                    <Select
                      value={
                        formData.qualification_id
                          ? String(formData.qualification_id)
                          : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange("qualification_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select qualification" />
                      </SelectTrigger>
                      <SelectContent>
                        {qualificationList?.map((q) => (
                          <SelectItem key={q.id} value={String(q.id)}>
                            {q.qualification_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ---- Current Work ---- */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="current_work"
                      className="text-sm font-medium"
                    >
                      Current Work
                    </Label>
                    <Select
                      value={
                        formData.current_status_id
                          ? String(formData.current_status_id)
                          : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange("current_status_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select current work" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentstatusList?.map((work) => (
                          <SelectItem key={work.id} value={String(work.id)}>
                            {work.current_status_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* <div className="space-y-2">
                    <Label htmlFor="school_id" className="text-sm font-medium">
                      School
                    </Label>
                    <Select
                      value={
                        formData.school_id ? String(formData.school_id) : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange("school_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolList?.map((q) => (
                          <SelectItem key={q.id} value={String(q.id)}>
                            {q.school_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div> */}

                  <div className="space-y-2">
                    <Label htmlFor="campus_id" className="text-sm font-medium">
                      Campus
                    </Label>
                    <Select
                      value={
                        formData.campus_id ? String(formData.campus_id) : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange("campus_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Campus" />
                      </SelectTrigger>
                      <SelectContent side="bottom" align="end">
                        {campusList?.map((q) => (
                          <SelectItem key={q.id} value={String(q.id)}>
                            {q.campus_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="religion_id"
                      className="text-sm font-medium"
                    >
                      Religion
                    </Label>
                    <Select
                      value={
                        formData.religion_id ? String(formData.religion_id) : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange("religion_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                      <SelectContent>
                        {religionList?.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.religion_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label
                    htmlFor="triptis_notes"
                    className="text-sm font-medium"
                  >
                    Communication Notes
                  </Label>
                  <Textarea
                    id="communication_notes"
                    value={formData.communication_notes}
                    onChange={(e) =>
                      handleInputChange("communication_notes", e.target.value)
                    }
                    placeholder="Enter communication notes"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="screening" className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-orange-600" />
                  Screening Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  {/* Screening Status */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="screening_status"
                      className="text-sm font-medium"
                    >
                      Screening Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select screening status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Screening Test Pass">
                          Screening Test Pass
                        </SelectItem>
                        <SelectItem value="Screening Test Fail">
                          Screening Test Fail
                        </SelectItem>
                        <SelectItem value="Created Student Without Exam">
                          Created Student Without Exam
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* Question Set */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="question_set_id"
                      className="text-sm font-medium"
                    >
                      Question Set
                    </Label>
                    <Select
                      value={
                        formData.question_set_id
                          ? String(formData.question_set_id)
                          : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange("question_set_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select question set" />
                      </SelectTrigger>
                      <SelectContent>
                        {questionSetList?.map((set) => (
                          <SelectItem key={set.id} value={String(set.id)}>
                            {set.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Exam Centre */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="exam_centre"
                      className="text-sm font-medium"
                    >
                      Exam Centre
                    </Label>
                    <Input
                      id="exam_centre"
                      value={formData.exam_centre}
                      onChange={(e) =>
                        handleInputChange("exam_centre", e.target.value)
                      }
                      placeholder="Enter exam centre"
                    />
                  </div>

                  {/* Date of Test */}
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label
                      htmlFor="date_of_test"
                      className="text-sm font-medium"
                    >
                      Date of Testing
                    </Label>
                    <Input
                      id="date_of_test"
                      type="date"
                      value={formData.date_of_test}
                      onChange={(e) =>
                        handleInputChange("date_of_test", e.target.value)
                      }
                    />
                  </div>

                  {/* Total Marks */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="total_marks"
                      className="text-sm font-medium"
                    >
                      Total Marks
                    </Label>
                    <Input
                      id="total_marks"
                      type="number"
                      value={formData.total_marks}
                      onChange={(e) =>
                        handleInputChange("total_marks", e.target.value)
                      }
                      placeholder="Enter total marks"
                    />
                    {formData.question_set_id && (
                      <p className="text-xs text-gray-500">
                        {questionSetList.find(
                          (q) => q.id === Number(formData.question_set_id)
                        )?.name || "Selected Question Set"}
                      </p>
                    )}
                  </div>

                  {/* Obtained Marks */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="obtained_marks"
                      className="text-sm font-medium"
                    >
                      Obtained Marks
                    </Label>
                    <Input
                      id="obtained_marks"
                      type="number"
                      value={formData.obtained_marks}
                      onChange={(e) =>
                        handleInputChange("obtained_marks", e.target.value)
                      }
                      placeholder="Enter obtained marks"
                      min="0"
                    />
                  </div>

                  {/* Qualifying School */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="qualifying_school_id"
                      className="text-sm font-medium"
                    >
                      Qualifying School
                    </Label>
                    <Select
                      value={
                        formData.qualifying_school_id
                          ? String(formData.qualifying_school_id)
                          : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange("qualifying_school_id", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select qualifying school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schoolList?.map((school) => (
                          <SelectItem key={school.id} value={String(school.id)}>
                            {school.school_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Is Passed */}
                  <div className="space-y-2">
                    <Label htmlFor="is_passed" className="text-sm font-medium">
                      Is Passed
                    </Label>
                    <Select
                      value={formData.is_passed ? "true" : "false"}
                      onValueChange={(value) =>
                        handleInputChange("is_passed", value === "true")
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder="Select pass status"
                          className="text-left"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Yes</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Fixed bottom buttons */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 p-4 sm:pt-4 border-t bg-white">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "Saving..." : "Save Applicant"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
