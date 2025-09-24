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

interface AddApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newApplicant: any) => void;
  campusList: Campus[];
  schoolList: School[];
  currentstatusList: CurrentStatus[];
  religionList: religion[];
}

// const STAGE_STATUS_MAP = {
//   sourcing: [
//     "Enrollment Key Generated",
//     "Basic Details Entered",
//     "Duplicate",
//     "Unreachable",
//     "Became Disinterested",
//   ],
//   screening: [
//     "Screening Test Pass",
//     "Screening Test Fail",
//     "Created Student Without Exam",
//   ],
//   interviews: [
//     "Learner Round Pass",
//     "Learner Round Fail",
//     "Cultural Fit Interview Pass",
//     "Cultural Fit Interview Fail",
//     "Reschedule",
//     "No Show",
//   ],
//   decision: [
//     "Offer Pending",
//     "Offer Sent",
//     "Offer Accepted",
//     "Offer Declined",
//     "Waitlisted",
//     "Selected but not joined",
//   ],
//   onboarded: ["Onboarded"],
// };

export function AddApplicantModal({
  isOpen,
  onClose,
  onSuccess,
  campusList,
  schoolList,
  currentstatusList,
  religionList,
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
    mobile_no: "",
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
    current_work_id: "",
    unique_number: "",
    religion_id: "",

    // Campus / School
    campus_id: "",
    school_id: "",

    // Screening
    set_name: "",
    exam_centre: "",
    date_of_testing: "",
    final_marks: "",
    qualifying_school: "",

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
    stage_id: "",
    status_id: "",
    screening_status: "",
    interviews_status: "",
    decision_status: "",
  });

  const resetForm = () => {
    setFormData({
      first_name: "",
      middle_name: "",
      last_name: "",
      mobile_no: "",
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
      current_work_id: "",
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
      stage_id: "",
      status_id: "",
      screening_status: "",
      interviews_status: "",
      decision_status: "",
      religion_id: "",
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

  const handleInputChange = (field: string, value: string) => {
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

    if (!formData.mobile_no.trim()) {
      newErrors.mobile_no = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile_no)) {
      newErrors.mobile_no = "Mobile number must be 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Map frontend form data to API schema
      const dataToInsert = {
        // Basic details
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        gender: formData.gender || null,
        dob: formData.dob || null,
        email: formData.email || `${formData.mobile_no}@example.com`,
        phone_number: formData.mobile_no,
        whatsapp_number: formData.whatsapp_number || null,

        // Location details
        state: formData.state || null,
        city: formData.city || null,
        block: formData.block || null,
        district: formData.district || null,
        pin_code: formData.pin_code || null,

        // Additional details
        cast_id: formData.cast_id ? Number(formData.cast_id) : null,
        qualification_id: formData.qualification_id
          ? Number(formData.qualification_id)
          : null,
        current_status_id: formData.current_work_id
          ? Number(formData.current_work_id)
          : null,

        campus_id: formData.campus_id ? Number(formData.campus_id) : null,
        school_id: formData.school_id ? Number(formData.school_id) : null,
        religion_id: formData.religion_id ? Number(formData.religion_id) : null,

        // Optional fields that can be null
        evaluation: null,
        redflag: null,
        image_url: null,
        gps_lat: null,
        gps_long: null,
        school_medium: null,
        percentage_in10th: null,
        math_marks_in10th: null,
        percentage_in12th: null,
        math_marks_in12th: null,
        // religion_id: nul
        partner_id: null,
        other_activities: null,
        last_updated: null,
        current_owner_id: null,
        partner_refer: null,
        school_stage_id: null,
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
        campus:
          campusList?.find((c) => Number(c.id) === Number(response.campus_id))
            ?.campus_name || "",

        //  School
        school_id: response.school_id,
        school:
          schoolList?.find((s) => s.id === response.school_id)?.school_name ||
          "",

        gender: response.gender,
        qualification_id: response.qualification_id,
        qualification:
          qualificationList?.find((q) => q.id === response.qualification_id)
            ?.name || "",
        current_status_id: response.current_status_id,
        current_work:
          currentstatusList?.find((c) => c.id === response.current_status_id)
            ?.current_status_name || "",
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

  // const getCurrentStatusOptions = (stage: string) => {
  //   return STAGE_STATUS_MAP[stage as keyof typeof STAGE_STATUS_MAP] || [];
  // };

  // const getCurrentStatus = (stage: string) => {
  //   switch (stage) {
  //     case "sourcing":
  //       return formData.status;
  //     case "screening":
  //       return formData.screening_status;
  //     case "interviews":
  //       return formData.interviews_status;
  //     case "decision":
  //       return formData.decision_status;
  //     case "onboarded":
  //       return "Onboarded";
  //     default:
  //       return "";
  //   }
  // };

  // const handleStatusChange = (stage: string, value: string) => {
  //   switch (stage) {
  //     case "sourcing":
  //       handleInputChange("status", value);
  //       break;
  //     case "screening":
  //       handleInputChange("screening_status", value);
  //       break;
  //     case "interviews":
  //       handleInputChange("interviews_status", value);
  //       break;
  //     case "decision":
  //       handleInputChange("decision_status", value);
  //       break;
  //   }
  // };

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
        return formData.first_name && formData.mobile_no && formData.stage_id;
      case "screening":
        return formData.stage_id !== "screening" || formData.screening_status;
      case "interviews":
        return formData.stage_id !== "interviews" || formData.interviews_status;
      case "final":
        return formData.stage_id !== "decision" || formData.decision_status;
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
            <div className="flex space-x-2 sm:space-x-4">
              {["basic", "screening", "interviews", "final"].map(
                (tab, index) => {
                  const Icon = getTabIcon(tab);
                  const isCompleted = isTabCompleted(tab);
                  const isCurrent = activeTab === tab;

                  return (
                    <div key={tab} className="flex items-center">
                      <div
                        className={cn(
                          "flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-colors",
                          isCurrent
                            ? "bg-orange-500 border-orange-500 text-white"
                            : isCompleted
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "border-gray-300 text-gray-400"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-3 h-3 sm:w-5 sm:h-5" />
                        ) : (
                          <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                        )}
                      </div>
                      {index < 3 && (
                        <div
                          className={cn(
                            "w-6 sm:w-12 h-0.5 mx-1 sm:mx-2",
                            isCompleted ? "bg-orange-400" : "bg-orange-300"
                          )}
                        />
                      )}
                    </div>
                  );
                }
              )}
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
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 sm:mb-8 h-auto">
              <TabsTrigger
                value="basic"
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3"
              >
                <User className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Basic</span>
              </TabsTrigger>
              <TabsTrigger
                value="screening"
                className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 p-2 sm:p-3"
              >
                <FileText className="w-4 h-4" />
                <span className="text-xs sm:text-sm">Screening</span>
              </TabsTrigger>
              <TabsTrigger
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
              </TabsTrigger>
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
                      value={formData.mobile_no}
                      onChange={(e) =>
                        handleInputChange("mobile_no", e.target.value)
                      }
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                      className={errors.mobile_no ? "border-red-500" : ""}
                    />
                    {errors.mobile_no && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.mobile_no}
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
                        formData.current_work_id
                          ? String(formData.current_work_id)
                          : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange("current_work_id", value)
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

                  <div className="space-y-2">
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
                  </div>

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
                    id="triptis_notes"
                    value={formData.triptis_notes}
                    onChange={(e) =>
                      handleInputChange("triptis_notes", e.target.value)
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
                  <div className="space-y-2">
                    <Label
                      htmlFor="screening_status"
                      className="text-sm font-medium"
                    >
                      Screening Status
                    </Label>
                    <Select
                      value={formData.screening_status}
                      onValueChange={(value) =>
                        handleInputChange("screening_status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select screening status" />
                      </SelectTrigger>
                      {/* <SelectContent>
                        {STAGE_STATUS_MAP.screening.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent> */}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="set_name" className="text-sm font-medium">
                      Set Name
                    </Label>
                    <Input
                      id="set_name"
                      value={formData.set_name}
                      onChange={(e) =>
                        handleInputChange("set_name", e.target.value)
                      }
                      placeholder="Enter set name"
                    />
                  </div>
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
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label className="text-sm font-medium">
                      Date of Testing
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !testDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {testDate ? (
                            format(testDate, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={testDate}
                          onSelect={(date) => {
                            setTestDate(date);
                            handleInputChange(
                              "date_of_testing",
                              date ? format(date, "yyyy-MM-dd") : ""
                            );
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="final_marks"
                      className="text-sm font-medium"
                    >
                      Final Marks
                    </Label>
                    <Input
                      id="final_marks"
                      type="number"
                      value={formData.final_marks}
                      onChange={(e) =>
                        handleInputChange("final_marks", e.target.value)
                      }
                      placeholder="Enter final marks"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="qualifying_school"
                      className="text-sm font-medium"
                    >
                      Qualifying School
                    </Label>
                    <Input
                      id="qualifying_school"
                      value={formData.qualifying_school}
                      onChange={(e) =>
                        handleInputChange("qualifying_school", e.target.value)
                      }
                      placeholder="Enter qualifying school"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ---- Interviews Tab ---- */}
            <TabsContent value="interviews" className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-teal-600" />
                  Interview Details
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="interviews_status"
                      className="text-sm font-medium"
                    >
                      Interview Status
                    </Label>
                    <Select
                      value={formData.interviews_status}
                      onValueChange={(value) =>
                        handleInputChange("interviews_status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select interview status" />
                      </SelectTrigger>
                      {/* <SelectContent>
                        {STAGE_STATUS_MAP.interviews.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent> */}
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="lr_status"
                        className="text-sm font-medium"
                      >
                        Learner Round Status
                      </Label>
                      <Input
                        id="lr_status"
                        value={formData.lr_status}
                        onChange={(e) =>
                          handleInputChange("lr_status", e.target.value)
                        }
                        placeholder="Enter learner round status"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="lr_comments"
                        className="text-sm font-medium"
                      >
                        Learner Round Feedback
                      </Label>
                      <Textarea
                        id="lr_comments"
                        value={formData.lr_comments}
                        onChange={(e) =>
                          handleInputChange("lr_comments", e.target.value)
                        }
                        placeholder="Enter learner round feedback"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="cfr_status"
                        className="text-sm font-medium"
                      >
                        Cultural Fit Round Status
                      </Label>
                      <Input
                        id="cfr_status"
                        value={formData.cfr_status}
                        onChange={(e) =>
                          handleInputChange("cfr_status", e.target.value)
                        }
                        placeholder="Enter cultural fit round status"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="cfr_comments"
                        className="text-sm font-medium"
                      >
                        Cultural Fit Round Feedback
                      </Label>
                      <Textarea
                        id="cfr_comments"
                        value={formData.cfr_comments}
                        onChange={(e) =>
                          handleInputChange("cfr_comments", e.target.value)
                        }
                        placeholder="Enter cultural fit round Feedback"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ---- Final Stage Tab ---- */}
            <TabsContent value="final" className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Trophy className="w-5 h-5 mr-2 text-yellow-600" />
                  Final Stage Details
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="decision_status"
                      className="text-sm font-medium"
                    >
                      Final Decision Status
                    </Label>
                    <Select
                      value={formData.decision_status}
                      onValueChange={(value) =>
                        handleInputChange("decision_status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select decision status" />
                      </SelectTrigger>
                      {/* <SelectContent>
                        {STAGE_STATUS_MAP.decision.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent> */}
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="offer_letter_status"
                        className="text-sm font-medium"
                      >
                        Offer Letter Status
                      </Label>
                      <Input
                        id="offer_letter_status"
                        value={formData.offer_letter_status}
                        onChange={(e) =>
                          handleInputChange(
                            "offer_letter_status",
                            e.target.value
                          )
                        }
                        placeholder="Enter offer letter status"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="allotted_school"
                        className="text-sm font-medium"
                      >
                        Allotted School
                      </Label>
                      <Input
                        id="allotted_school"
                        value={formData.allotted_school}
                        onChange={(e) =>
                          handleInputChange("allotted_school", e.target.value)
                        }
                        placeholder="Enter allotted school"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="joining_status"
                        className="text-sm font-medium"
                      >
                        Joining Status
                      </Label>
                      <Input
                        id="joining_status"
                        value={formData.joining_status}
                        onChange={(e) =>
                          handleInputChange("joining_status", e.target.value)
                        }
                        placeholder="Enter joining status"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="final_notes"
                        className="text-sm font-medium"
                      >
                        Final Notes
                      </Label>
                      <Textarea
                        id="final_notes"
                        value={formData.final_notes}
                        onChange={(e) =>
                          handleInputChange("final_notes", e.target.value)
                        }
                        placeholder="Enter final notes"
                        rows={3}
                      />
                    </div>
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
