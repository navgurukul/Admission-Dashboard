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
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  User,
  FileText,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import {
  createStudent,
  getAllCasts,
  getAllQualification,
  getAllStates,
  getBlocksByDistrict,
  getDistrictsByState,
  submitScreeningRound,
} from "@/utils/api";

const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
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
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [casteList, setCasteList] = useState<any[]>([]);
  const [qualificationList, setQualificationList] = useState<any[]>([]);
  const [stateOptions, setStateOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [districtOptions, setDistrictOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [blockOptions, setBlockOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string>("");
  const [showLocationWarning, setShowLocationWarning] = useState({
    district: false,
    block: false,
  });

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    phone_number: "",
    whatsapp_number: "",
    email: "",
    dob: "",
    city: "",
    block: "",
    blockCode: "",
    state: "",
    stateCode: "",
    district: "",
    districtCode: "",
    pin_code: "",
    cast_id: "",
    gender: "",
    qualification_id: "",
    current_status_id: "",
    religion_id: "",
    qualifying_school_id: "",
    campus_id: "",
    school_medium: "",
    status: "",
    is_passed: false,
    question_set_id: "",
    total_marks: 0,
    obtained_marks: "",
    exam_centre: "",
    date_of_test: "",
    communication_notes: "",
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
      blockCode: "",
      state: "",
      stateCode: "",
      district: "",
      districtCode: "",
      pin_code: "",
      cast_id: "",
      gender: "",
      campus_id: "",
      qualification_id: "",
      current_status_id: "",
      qualifying_school_id: "",
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
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedBlock("");
    setDistrictOptions([]);
    setBlockOptions([]);
    setActiveTab("basic");
    setErrors({});
  };

  useEffect(() => {
    const fetchCasteList = async () => {
      try {
        const response = await getAllCasts();
        setCasteList(response || []);
      } catch (error) {
        // console.error("Error fetching castes:", error);
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
        // console.error("Error fetching qualifications:", error);
      }
    };

    fetchQualifications();
  }, []);

  useEffect(() => {
    if (formData.question_set_id && questionSetList.length > 0) {
      const selectedQuestionSet = questionSetList.find(
        (set) => set.id === Number(formData.question_set_id),
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
    // Handle PIN code - only allow 6 digits
    if (field === "pin_code" && typeof value === "string") {
      const digitsOnly = value.replace(/\D/g, "");
      const truncated = digitsOnly.slice(0, 6);
      setFormData((prev) => ({
        ...prev,
        [field]: truncated,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  useEffect(() => {
    const fetchStates = async () => {
      try {
        const statesRes = await getAllStates();
        const statesData = statesRes?.data || statesRes || [];
        const mappedStates = statesData.map((s: any) => ({
          value: s.state_code,
          label: s.state_name,
        }));
        setStateOptions(mappedStates);
      } catch (error) {
        // console.error("Failed to fetch states:", error);
        setStateOptions([
          { value: "S-UP", label: "Uttar Pradesh" },
          { value: "S-DL", label: "Delhi" },
        ]);
      }
    };

    if (isOpen) {
      fetchStates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!selectedState) {
      setDistrictOptions([]);
      setBlockOptions([]);
      setFormData((prev) => ({
        ...prev,
        district: "",
        block: "",
      }));
      return;
    }

    const fetchDistricts = async () => {
      setIsLoadingDistricts(true);
      try {
        const districtsRes = await getDistrictsByState(selectedState);
        const districts = districtsRes?.data || districtsRes || [];
        const mappedDistricts = districts.map((d: any) => ({
          value: d.district_code,
          label: d.district_name,
        }));
        setDistrictOptions(mappedDistricts);

        setFormData((prev) => ({
          ...prev,
          district: "",
          districtCode: "",
          block: "",
          blockCode: "",
          state:
            stateOptions.find((s) => s.value === selectedState)?.label ||
            selectedState,
          stateCode: selectedState,
        }));
      } catch (err) {
        // console.error("Failed to fetch districts:", err);
        setDistrictOptions([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [selectedState, stateOptions]);

  useEffect(() => {
    if (!selectedDistrict) {
      setBlockOptions([]);
      setSelectedBlock("");
      setFormData((prev) => ({
        ...prev,
        block: "",
        blockCode: "",
      }));
      return;
    }

    const fetchBlocks = async () => {
      setIsLoadingBlocks(true);
      try {
        const blocksRes = await getBlocksByDistrict(selectedDistrict);
        const blocks = blocksRes?.data || blocksRes || [];
        const mappedBlocks = blocks.map((b: any) => ({
          value: b.block_code,
          label: b.block_name,
        }));
        setBlockOptions(mappedBlocks);
        setSelectedBlock("");

        setFormData((prev) => ({
          ...prev,
          district:
            districtOptions.find((d) => d.value === selectedDistrict)?.label ||
            selectedDistrict,
          districtCode: selectedDistrict,
          block: "",
          blockCode: "",
        }));
      } catch (err) {
        // console.error("Failed to fetch blocks:", err);
        setBlockOptions([]);
      } finally {
        setIsLoadingBlocks(false);
      }
    };

    fetchBlocks();
  }, [selectedDistrict, districtOptions]);

  // Handle block selection - update formData with both code and label
  useEffect(() => {
    if (selectedBlock) {
      const selectedBlockOption = blockOptions.find(
        (b) => b.value === selectedBlock,
      );
      setFormData((prev) => ({
        ...prev,
        block: selectedBlockOption?.label || selectedBlock,
        blockCode: selectedBlock,
      }));
    }
  }, [selectedBlock, blockOptions]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Mobile number must be 10 digits";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    } else {
      const dobDate = new Date(formData.dob);
      const today = new Date();
      if (dobDate >= today) {
        newErrors.dob = "Date of birth cannot be today or in the future";
      }
    }
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    // Screening section validation: If any field is filled, all required fields must be filled
    const screeningFields = {
      status: formData.status,
      question_set_id: formData.question_set_id,
      exam_centre: formData.exam_centre,
      date_of_test: formData.date_of_test,
      obtained_marks: formData.obtained_marks,
      qualifying_school_id: formData.qualifying_school_id,
    };

    console.log(screeningFields);
    const hasAnyScreeningData = Object.values(screeningFields).some(
      (value) => value !== "" && value !== null && value !== undefined,
    );

    if (hasAnyScreeningData) {
      // If any screening field is filled, validate all required screening fields
      if (!formData.status) {
        newErrors.status =
          "Screening status is required when filling screening details";
      }

      if (!formData.question_set_id) {
        newErrors.question_set_id =
          "Question set is required when filling screening details";
      }

      if (!formData.exam_centre || !formData.exam_centre.trim()) {
        newErrors.exam_centre =
          "Exam centre is required when filling screening details";
      }

      if (!formData.date_of_test) {
        newErrors.date_of_test =
          "Date of test is required when filling screening details";
      }

      if (!formData.obtained_marks || formData.obtained_marks === "") {
        newErrors.obtained_marks =
          "Obtained marks is required when filling screening details";
      } else if (Number(formData.obtained_marks) < 0) {
        newErrors.obtained_marks = "Obtained marks cannot be negative";
      } else if (
        formData.total_marks &&
        Number(formData.obtained_marks) > Number(formData.total_marks)
      ) {
        newErrors.obtained_marks = "Obtained marks cannot exceed total marks";
      }

      if (!formData.qualifying_school_id) {
        newErrors.qualifying_school_id =
          "Qualifying school is required when filling screening details";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Check if screening validation failed
      const hasScreeningErrors = Object.keys(errors).some((key) =>
        [
          "status",
          "question_set_id",
          "exam_centre",
          "date_of_test",
          "obtained_marks",
          "qualifying_school_id",
        ].includes(key),
      );

      toast({
        title: "Validation Error",
        description: hasScreeningErrors
          ? "Please complete all required screening fields or leave the section empty"
          : "Please fill all required Basic section fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Submitting form data:", formData);
      // Step 1: Create student with basic details only
      const studentData = {
        image_url: null,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        gender: formData.gender || null,
        dob: formData.dob || null,
        email: formData.email || null,
        phone_number: formData.phone_number,
        whatsapp_number: formData.whatsapp_number || null,
        state: formData.stateCode || null, // Send code instead of label
        city: formData.city || null,
        district: formData.districtCode || null, // Send code instead of label
        block: formData.blockCode || null, // Send code instead of label
        pin_code: formData.pin_code || null,
        cast_id: formData.cast_id ? Number(formData.cast_id) : null,
        qualification_id: formData.qualification_id
          ? Number(formData.qualification_id)
          : null,
        current_status_id: formData.current_status_id
          ? Number(formData.current_status_id)
          : null,
        religion_id: formData.religion_id ? Number(formData.religion_id) : null,
        school_medium: formData.school_medium || null,
        communication_notes: formData.communication_notes || "",
        campus_id: formData.campus_id ? Number(formData.campus_id) : null,
      };

      // API Call - Create Student
      const response = await createStudent(studentData);

      // Extract student ID from response (handle different response structures)
      const studentId = response?.data?.id || response?.id;

      // Step 2: If screening data exists, submit it separately
      if (studentId && (formData.status || formData.question_set_id)) {
        const screeningData = {
          student_id: studentId,
          status: formData.status || null,
          question_set_id: formData.question_set_id
            ? Number(formData.question_set_id)
            : null,
          obtained_marks: formData.obtained_marks
            ? Number(formData.obtained_marks)
            : null,
          school_id: formData.qualifying_school_id
            ? Number(formData.qualifying_school_id)
            : null,
          exam_centre: formData.exam_centre || null,
          date_of_test: formData.date_of_test || null,
        };

        // Submit screening round data
        const screeningResponse = await submitScreeningRound(screeningData);
      }

      // Transform the response to match your table structure
      const transformedApplicant = {
        id: studentId,
        name:
          (response?.data?.first_name || response?.first_name || "") +
          (response?.data?.middle_name || response?.middle_name
            ? ` ${response?.data?.middle_name || response?.middle_name}`
            : "") +
          (response?.data?.last_name || response?.last_name
            ? ` ${response?.data?.last_name || response?.last_name}`
            : ""),
        mobile_no: response?.data?.phone_number || response?.phone_number,
        whatsapp_number:
          response?.data?.whatsapp_number || response?.whatsapp_number,
        email: response?.data?.email || response?.email,
        city: response?.data?.city || response?.city,
        campus_id: response?.data?.campus_id || response?.campus_id,
        campus:
          campusList?.find(
            (c) =>
              Number(c.id) ===
              Number(response?.data?.campus_id || response?.campus_id),
          )?.campus_name || "",
        school_id: response?.data?.school_id || response?.school_id,
        school:
          schoolList?.find(
            (s) => s.id === (response?.data?.school_id || response?.school_id),
          )?.school_name || "",
        gender: response?.data?.gender || response?.gender,
        qualification_id:
          response?.data?.qualification_id || response?.qualification_id,
        qualification:
          qualificationList?.find(
            (q) =>
              q.id ===
              (response?.data?.qualification_id || response?.qualification_id),
          )?.qualification_name || "",
        current_status_id:
          response?.data?.current_status_id || response?.current_status_id,
        current_work:
          currentstatusList?.find(
            (c) =>
              c.id ===
              (response?.data?.current_status_id ||
                response?.current_status_id),
          )?.current_status_name || "",
        status: formData.status,
        obtained_marks: formData.obtained_marks,
        question_set_id: formData.question_set_id,
        exam_centre: formData.exam_centre,
        date_of_test: formData.date_of_test,
        communication_notes:
          response?.data?.communication_notes || response?.communication_notes,
      };

      if (!response || response.status >= 400) {
        throw new Error(response?.message || "Failed to create student");
      }

      toast({
        title: "Success!",
        description: "Applicant created successfully",
      });

      onSuccess?.(response?.data);
      resetForm();
      onClose();
    } catch (error: any) {
      // console.error("Error creating student:", error);
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
    };
    return icons[tabValue as keyof typeof icons] || Circle;
  };

  const isTabCompleted = (tabValue: string) => {
    switch (tabValue) {
      case "basic":
        return (
          formData.first_name &&
          formData.phone_number &&
          formData.gender &&
          formData.dob &&
          formData.email
        );
      case "screening":
        return !!formData.status;
      default:
        return false;
    }
  };

  const getMaxDOB = () => {
    const today = new Date();
    today.setFullYear(today.getFullYear() - 16);
    today.setMonth(today.getMonth() - 6);
    return today.toISOString().split("T")[0];
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-5xl h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0 sm:p-6">
        <DialogHeader className="pb-4 sm:pb-6 px-4 sm:px-0 pt-4 sm:pt-0 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            Add New Applicant
          </DialogTitle>

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
                            : "border-gray-300 text-gray-400",
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
                          isCompleted ? "bg-orange-400" : "bg-orange-300",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
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
                      className={errors.first_name ? "border-red-500" : ""}
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.first_name}
                      </p>
                    )}
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
                      Last Name
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
                      Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="Enter email address"
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob" className="text-sm font-medium">
                      Date of Birth *
                    </Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      max={getMaxDOB()}
                      onChange={(e) => handleInputChange("dob", e.target.value)}
                      className={errors.dob ? "border-red-500" : ""}
                    />
                    {errors.dob && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.dob}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm font-medium">
                      Gender *
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleInputChange("gender", value)
                      }
                    >
                      <SelectTrigger
                        className={errors.gender ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.gender && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.gender}
                      </p>
                    )}
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
                    <Select
                      value={selectedState}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setSelectedState("");
                          setSelectedDistrict("");
                          setBlockOptions([]);
                          setFormData((prev) => ({
                            ...prev,
                            state: "",
                            district: "",
                            block: "",
                          }));
                          setShowLocationWarning({
                            district: false,
                            block: false,
                          });
                        } else {
                          // Show warning if district or block has values
                          if (selectedDistrict || formData.block) {
                            setShowLocationWarning({
                              district: !!selectedDistrict,
                              block: !!formData.block,
                            });
                            // Clear warning after 3 seconds
                            setTimeout(() => {
                              setShowLocationWarning({
                                district: false,
                                block: false,
                              });
                            }, 3000);
                          }
                          setSelectedState(value);
                          setSelectedDistrict("");
                          setBlockOptions([]);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-gray-400">
                          Select state
                        </SelectItem>
                        {stateOptions.map((state) => (
                          <SelectItem key={state.value} value={state.value}>
                            {state.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-sm font-medium">
                      District
                    </Label>
                    <Select
                      value={selectedDistrict}
                      onValueChange={(value) => {
                        if (value === "none") {
                          setSelectedDistrict("");
                          setFormData((prev) => ({
                            ...prev,
                            district: "",
                            block: "",
                          }));
                          setBlockOptions([]);
                          setShowLocationWarning({
                            district: false,
                            block: false,
                          });
                        } else {
                          // Show warning if block has value
                          if (selectedBlock) {
                            setShowLocationWarning({
                              district: false,
                              block: true,
                            });
                            // Clear warning after 3 seconds
                            setTimeout(() => {
                              setShowLocationWarning({
                                district: false,
                                block: false,
                              });
                            }, 3000);
                          }
                          setSelectedDistrict(value);
                          setFormData((prev) => ({
                            ...prev,
                            block: "",
                          }));
                        }
                      }}
                      disabled={!selectedState || isLoadingDistricts}
                    >
                      <SelectTrigger
                        className={
                          showLocationWarning.district ? "border-red-500" : ""
                        }
                      >
                        <SelectValue
                          placeholder={
                            isLoadingDistricts
                              ? "Loading districts..."
                              : !selectedState
                                ? "Select state first"
                                : "Select district"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedDistrict && (
                          <SelectItem value="none" className="text-gray-400">
                            Select district
                          </SelectItem>
                        )}
                        {districtOptions.map((district) => (
                          <SelectItem
                            key={district.value}
                            value={district.value}
                          >
                            {district.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* <div className="space-y-2">
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
                  </div> */}
                  <div className="space-y-2">
                    <Label htmlFor="block" className="text-sm font-medium">
                      Block
                    </Label>
                    <Select
                      value={selectedBlock}
                      onValueChange={setSelectedBlock}
                      disabled={!selectedDistrict || isLoadingBlocks}
                    >
                      <SelectTrigger
                        className={
                          showLocationWarning.block ? "border-red-500" : ""
                        }
                      >
                        {isLoadingBlocks ? (
                          <div className="flex items-center">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Loading blocks...
                          </div>
                        ) : (
                          <SelectValue
                            placeholder={
                              !selectedDistrict
                                ? "Select district first"
                                : "Select block"
                            }
                          />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {blockOptions.map((block) => (
                          <SelectItem key={block.value} value={block.value}>
                            {block.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin_code" className="text-sm font-medium">
                      PIN Code
                    </Label>
                    <Input
                      type="text"
                      id="pin_code"
                      value={formData.pin_code}
                      onChange={(e) =>
                        handleInputChange("pin_code", e.target.value)
                      }
                      placeholder="Enter PIN code"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Additional Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="caste_id" className="text-sm font-medium">
                      Caste
                    </Label>
                    <Select
                      value={formData.cast_id ? String(formData.cast_id) : ""}
                      onValueChange={(value) =>
                        handleInputChange(
                          "cast_id",
                          value === "none" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select caste" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.cast_id && (
                          <SelectItem value="none" className="text-gray-400">
                            Select caste
                          </SelectItem>
                        )}
                        {casteList?.map((caste) => (
                          <SelectItem key={caste.id} value={String(caste.id)}>
                            {caste.cast_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                        handleInputChange(
                          "qualification_id",
                          value === "none" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select qualification" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.qualification_id && (
                          <SelectItem value="none" className="text-gray-400">
                            Select qualification
                          </SelectItem>
                        )}
                        {qualificationList?.map((q) => (
                          <SelectItem key={q.id} value={String(q.id)}>
                            {q.qualification_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

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
                        handleInputChange(
                          "current_status_id",
                          value === "none" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select current work" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.current_status_id && (
                          <SelectItem value="none" className="text-gray-400">
                            Select current work
                          </SelectItem>
                        )}
                        {currentstatusList?.map((work) => (
                          <SelectItem key={work.id} value={String(work.id)}>
                            {work.current_status_name}
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
                        handleInputChange(
                          "campus_id",
                          value === "none" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Campus" />
                      </SelectTrigger>
                      <SelectContent side="bottom" align="end">
                        {formData.campus_id && (
                          <SelectItem value="none" className="text-gray-400">
                            Select Campus
                          </SelectItem>
                        )}
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
                        handleInputChange(
                          "religion_id",
                          value === "none" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select religion" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.religion_id && (
                          <SelectItem value="none" className="text-gray-400">
                            Select religion
                          </SelectItem>
                        )}
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
                    htmlFor="communication_notes"
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
                <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-orange-600" />
                  Screening Details
                </h3>
                <p className="text-sm text-gray-600 mb-4 bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <AlertCircle className="w-4 h-4 inline mr-1 text-blue-600" />
                  <strong>Note:</strong> If you fill any field in this section,
                  all screening fields are required.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="screening_status"
                      className="text-sm font-medium"
                    >
                      Screening Status
                      {errors.status && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange(
                          "status",
                          value === "none" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger
                        className={errors.status ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select screening status" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.status && (
                          <SelectItem value="none" className="text-gray-400">
                            Select screening status
                          </SelectItem>
                        )}
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
                    {errors.status && (
                      <p className="text-xs text-red-500">{errors.status}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="question_set_id"
                      className="text-sm font-medium"
                    >
                      Question Set
                      {errors.question_set_id && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Select
                      value={
                        formData.question_set_id
                          ? String(formData.question_set_id)
                          : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange(
                          "question_set_id",
                          value === "none" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger
                        className={
                          errors.question_set_id ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Select question set" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.question_set_id && (
                          <SelectItem value="none" className="text-gray-400">
                            Select question set
                          </SelectItem>
                        )}
                        {questionSetList?.map((set) => (
                          <SelectItem key={set.id} value={String(set.id)}>
                            {set.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.question_set_id && (
                      <p className="text-xs text-red-500">
                        {errors.question_set_id}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="exam_centre"
                      className="text-sm font-medium"
                    >
                      Exam Centre
                      {errors.exam_centre && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Input
                      id="exam_centre"
                      value={formData.exam_centre}
                      onChange={(e) =>
                        handleInputChange("exam_centre", e.target.value)
                      }
                      placeholder="Enter exam centre"
                      className={errors.exam_centre ? "border-red-500" : ""}
                    />
                    {errors.exam_centre && (
                      <p className="text-xs text-red-500">
                        {errors.exam_centre}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <Label
                      htmlFor="date_of_test"
                      className="text-sm font-medium"
                    >
                      Date of Testing
                      {errors.date_of_test && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Input
                      id="date_of_test"
                      type="date"
                      value={formData.date_of_test}
                      onChange={(e) =>
                        handleInputChange("date_of_test", e.target.value)
                      }
                      className={errors.date_of_test ? "border-red-500" : ""}
                    />
                    {errors.date_of_test && (
                      <p className="text-xs text-red-500">
                        {errors.date_of_test}
                      </p>
                    )}
                  </div>

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
                      disabled
                    />
                    {formData.question_set_id && (
                      <p className="text-xs text-gray-500">
                        Auto-filled from selected question set
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="obtained_marks"
                      className="text-sm font-medium"
                    >
                      Obtained Marks
                      {errors.obtained_marks && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
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
                      className={errors.obtained_marks ? "border-red-500" : ""}
                    />
                    {errors.obtained_marks && (
                      <p className="text-xs text-red-500">
                        {errors.obtained_marks}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="qualifying_school_id"
                      className="text-sm font-medium"
                    >
                      Qualifying School
                      {errors.qualifying_school_id && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Select
                      value={
                        formData.qualifying_school_id
                          ? String(formData.qualifying_school_id)
                          : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange(
                          "qualifying_school_id",
                          value === "none" ? "" : value,
                        )
                      }
                    >
                      <SelectTrigger
                        className={
                          errors.qualifying_school_id ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Select qualifying school" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.qualifying_school_id && (
                          <SelectItem value="none" className="text-gray-400">
                            Select qualifying school
                          </SelectItem>
                        )}
                        {schoolList?.map((school) => (
                          <SelectItem key={school.id} value={String(school.id)}>
                            {school.school_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.qualifying_school_id && (
                      <p className="text-xs text-red-500">
                        {errors.qualifying_school_id}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-shrink-0 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 p-4 sm:pt-4 border-t bg-white">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Applicant"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
