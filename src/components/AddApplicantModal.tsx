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
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  User,
  FileText,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";

import {
  createStudent,
  getAllCasts,
  getAllQualification,
  getAllStates,
  getBlocksByDistrict,
  getDistrictsByState,
  submitScreeningRound,
  uploadProfileImage,
  getPartners,
  getAllDonors,
} from "@/utils/api";

const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

// interface Campus {
//   id: number;
//   campus_name: string;
// }

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
  // campusList: Campus[];
  schoolList: School[];
  currentstatusList: CurrentStatus[];
  religionList: religion[];
  questionSetList: QuestionSet[];
}

export function AddApplicantModal({
  isOpen,
  onClose,
  onSuccess,
  // campusList,
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
  const [partnerList, setPartnerList] = useState<any[]>([]);
  const [donorList, setDonorList] = useState<any[]>([]);
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    image_url: "",
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
    partner_id: "",
    donor_id: "",
    qualifying_school_id: "",
    // campus_id: "",
    school_medium: "",
    status: "",
    is_passed: false,
    question_set_id: "",
    total_marks: 36,
    obtained_marks: "",
    exam_centre: "",
    date_of_test: "",
    communication_notes: "",
  });

  const resetForm = () => {
    setFormData({
      image_url: "",
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
      // campus_id: "",
      qualification_id: "",
      current_status_id: "",
      qualifying_school_id: "",
      religion_id: "",
      partner_id: "",
      donor_id: "",
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
    setImagePreview(null);
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
    const fetchPartners = async () => {
      try {
        const response = await getPartners();
        setPartnerList(response || []);
      } catch (error) {
        // console.error("Error fetching partners:", error);
      }
    };

    fetchPartners();
  }, []);

  useEffect(() => {
    const fetchDonors = async () => {
      try {
        const response = await getAllDonors();
        setDonorList(response || []);
      } catch (error) {
        // console.error("Error fetching donors:", error);
      }
    };

    fetchDonors();
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
    // Handle name fields - only allow letters and spaces (no numbers)
    if ((field === "first_name" || field === "middle_name" || field === "last_name") && typeof value === "string") {
      const lettersOnly = value.replace(/[0-9]/g, "");
      setFormData((prev) => ({
        ...prev,
        [field]: lettersOnly,
      }));
    }
    // Handle PIN code - only allow 6 digits
    else if (field === "pin_code" && typeof value === "string") {
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

        // Find state label directly from the response data
        const stateLabel = stateOptions.find((s) => s.value === selectedState)?.label || selectedState;
        
        setFormData((prev) => ({
          ...prev,
          district: "",
          districtCode: "",
          block: "",
          blockCode: "",
          state: stateLabel,
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
  }, [selectedState]); // Removed stateOptions from dependencies

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
        
        // Use id as value and block_name as label
        const mappedBlocks = blocks.map((b: any) => ({
          value: String(b.id), // Use id as value since block_code is not available
          label: b.block_name, // Use block_name for display
        }));
        
        setBlockOptions(mappedBlocks);
        setSelectedBlock(""); // Clear selected block when district changes

        // Find district label directly from the current districtOptions state
        const districtLabel = districtOptions.find((d) => d.value === selectedDistrict)?.label || selectedDistrict;

        setFormData((prev) => ({
          ...prev,
          district: districtLabel,
          districtCode: selectedDistrict,
          block: "",
          blockCode: "",
        }));
      } catch (err) {
        setBlockOptions([]);
      } finally {
        setIsLoadingBlocks(false);
      }
    };

    fetchBlocks();
  }, [selectedDistrict]); // districtOptions not in dependencies - using current state value

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Show loading toast
        toast({
          title: "Uploading...",
          description: "Please wait while we upload the image...",
        });

        const uploadResult = await uploadProfileImage(file);

        setFormData((prev) => ({
          ...prev,
          image_url: uploadResult.url,
        }));

        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        toast({
          title: "✅ Image Uploaded",
          description: "Profile image uploaded successfully!",
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "❌ Upload Failed",
          description: getFriendlyErrorMessage(error),
          variant: "destructive",
          className: "border-red-500 bg-red-50 text-red-900",
        });
        e.target.value = "";
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.image_url) {
      newErrors.image_url = "Profile image is required";
    }

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.phone_number)) {
      newErrors.phone_number = "Mobile number must be 10 digits";
    }

    if (!formData.whatsapp_number.trim()) {
      newErrors.whatsapp_number = "WhatsApp number is required";
    } else if (!/^\d{10}$/.test(formData.whatsapp_number)) {
      newErrors.whatsapp_number = "WhatsApp number must be 10 digits";
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

    if (!selectedState) {
      newErrors.state = "State is required";
    }

    // District is required only if districts are available
    if (districtOptions.length > 0 && !selectedDistrict) {
      newErrors.district = "District is required";
    }

    // Block is required only if blocks are available
    if (blockOptions.length > 0 && !formData.block) {
      newErrors.block = "Block is required";
    }

    if (!formData.pin_code.trim()) {
      newErrors.pin_code = "PIN Code is required";
    } else if (formData.pin_code.length !== 6) {
      newErrors.pin_code = "PIN Code must be 6 digits";
    }

    if (!formData.cast_id) {
      newErrors.cast_id = "Caste is required";
    }

    if (!formData.qualification_id) {
      newErrors.qualification_id = "Qualification is required";
    }

    if (!formData.current_status_id) {
      newErrors.current_status_id = "Current work is required";
    }

    // if (!formData.campus_id) {
    //   newErrors.campus_id = "Campus is required";
    // }

    if (!formData.religion_id) {
      newErrors.religion_id = "Religion is required";
    }

    if (!formData.communication_notes.trim()) {
      newErrors.communication_notes = "Communication notes are required";
    }

    // Screening section validation: These fields are always mandatory
    if (!formData.question_set_id) {
      newErrors.question_set_id = "Question set is required";
    }

    if (!formData.exam_centre || !formData.exam_centre.trim()) {
      newErrors.exam_centre = "Exam centre is required";
    }

    if (!formData.date_of_test) {
      newErrors.date_of_test = "Date of test is required";
    }

    if (!formData.obtained_marks || formData.obtained_marks === "") {
      newErrors.obtained_marks = "Obtained marks is required";
    } else if (Number(formData.obtained_marks) < 0) {
      newErrors.obtained_marks = "Obtained marks cannot be negative";
    } else if (
      formData.total_marks &&
      Number(formData.obtained_marks) > Number(formData.total_marks)
    ) {
      newErrors.obtained_marks = "Obtained marks cannot exceed total marks";
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async () => {
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      // Check if screening validation failed
      const hasScreeningErrors = Object.keys(formErrors).some((key) =>
        [
          "question_set_id",
          "exam_centre",
          "date_of_test",
          "obtained_marks",
        ].includes(key),
      );

      toast({
        title: "⚠️ Required Fields Missing",
        description: hasScreeningErrors
          ? "Please complete all required screening fields"
          : "Please fill all required fields",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    setLoading(true);
    try {
      // console.log("Submitting form data:", formData);
      // Step 1: Create student with basic details only
      const studentData = {
        image_url: formData.image_url || null,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        gender: formData.gender || null,
        dob: formData.dob || null,
        email: formData.email || null,
        phone_number: formData.phone_number,
        whatsapp_number: formData.whatsapp_number || null,
        state: formData.state || null, // Send NAME instead of code
        city: formData.city || null,
        district: formData.district || null, // Send NAME instead of code
        block: formData.block || null, // Send NAME instead of code
        pin_code: formData.pin_code || null,
        cast_id: formData.cast_id ? Number(formData.cast_id) : null,
        qualification_id: formData.qualification_id
          ? Number(formData.qualification_id)
          : null,
        current_status_id: formData.current_status_id
          ? Number(formData.current_status_id)
          : null,
        religion_id: formData.religion_id ? Number(formData.religion_id) : null,
        partner_id: formData.partner_id ? Number(formData.partner_id) : null,
        donor_id: formData.donor_id ? Number(formData.donor_id) : null,
        school_medium: formData.school_medium || null,
        communication_notes: formData.communication_notes || "",
        // campus_id: formData.campus_id ? Number(formData.campus_id) : null,
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
        // campus_id: response?.data?.campus_id || response?.campus_id,
        // campus:
        //   campusList?.find(
        //     (c) =>
        //       Number(c.id) ===
        //       Number(response?.data?.campus_id || response?.campus_id),
        //   )?.campus_name || "",
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
        title: "✅ Applicant Created Successfully",
        description: "The applicant has been added to the system",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });

      onSuccess?.(response?.data);
      resetForm();
      onClose();
    } catch (error: any) {
      // console.error("Error creating student:", error);
      toast({
        title: "❌ Unable to Create Applicant",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
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
          formData.image_url &&
          formData.first_name &&
          formData.phone_number &&
          formData.whatsapp_number &&
          formData.gender &&
          formData.dob &&
          formData.email &&
          selectedState &&
          selectedDistrict &&
          formData.block &&
          formData.pin_code &&
          formData.cast_id &&
          formData.qualification_id &&
          formData.current_status_id &&
          // formData.campus_id &&
          formData.religion_id &&
          formData.communication_notes
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
                  {/* <User className="w-5 h-5 mr-2 text-blue-600" /> */}
                  {/* Applicant Information */}
                </h3>

                {/* Profile Image Upload */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative group">
                    <div
                      className={cn(
                        "w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center",
                        errors.image_url ? "border-red-500" : "border-white",
                      )}
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                      )}
                    </div>
                    <label
                      htmlFor="profile-image"
                      className="absolute bottom-0 right-0 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-md cursor-pointer transition-colors"
                    >
                      <div className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-full h-full"
                        >
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                          <circle cx="12" cy="13" r="4" />
                        </svg>
                      </div>
                      <input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {errors.image_url && (
                    <p className="text-red-500 text-xs flex items-center mt-2">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.image_url}
                    </p>
                  )}
                </div>

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
                      className={errors.last_name ? "border-red-500" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-sm font-medium">
                      Phone Number *
                    </Label>
                    <Input
                      id="mobile"
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        handleInputChange("phone_number", digitsOnly.slice(0, 10));
                      }}
                      placeholder="Enter 10-digit phone number"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
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
                      WhatsApp Number *
                    </Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={formData.whatsapp_number}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        handleInputChange("whatsapp_number", digitsOnly.slice(0, 10));
                      }}
                      placeholder="Enter WhatsApp number"
                      maxLength={10}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={
                        errors.whatsapp_number ? "border-red-500" : ""
                      }
                    />
                    {errors.whatsapp_number && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.whatsapp_number}
                      </p>
                    )}
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
                    <Combobox
                      options={[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other" },
                      ]}
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange("gender", value)}
                      placeholder="Select gender"
                      searchPlaceholder="Search gender..."
                      emptyText="No gender found."
                      className={cn(
                        "h-10 border shadow-sm hover:bg-accent",
                        errors.gender && "border-red-500"
                      )}
                    />
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
                      State *
                    </Label>
                    <Combobox
                      options={stateOptions}
                      value={selectedState}
                      onValueChange={(value) => {
                        if (selectedDistrict || formData.block) {
                          setShowLocationWarning({
                            district: !!selectedDistrict,
                            block: !!formData.block,
                          });
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
                      }}
                      placeholder="Select state"
                      searchPlaceholder="Search state..."
                      emptyText="No state found."
                      className={cn(
                        "h-10 border shadow-sm hover:bg-accent",
                        errors.state && "border-red-500"
                      )}
                    />
                    {errors.state && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.state}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-sm font-medium">
                      District
                      {districtOptions.length > 0 && <span className="text-red-500"> *</span>}
                    </Label>
                    <Combobox
                      options={districtOptions}
                      value={selectedDistrict}
                      onValueChange={(value) => {
                        if (selectedBlock) {
                          setShowLocationWarning({
                            district: false,
                            block: true,
                          });
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
                      }}
                      placeholder={
                        isLoadingDistricts
                          ? "Loading districts..."
                          : !selectedState
                          ? "Select state first"
                          : "Select district"
                      }
                      searchPlaceholder="Search district..."
                      emptyText="No district found."
                      disabled={!selectedState || isLoadingDistricts}
                      className={cn(
                        "h-10 border shadow-sm hover:bg-accent",
                        showLocationWarning.district && "border-red-500",
                        errors.district && "border-red-500"
                      )}
                    />
                    {errors.district && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.district}
                      </p>
                    )}
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
                      {blockOptions.length > 0 && <span className="text-red-500"> *</span>}
                    </Label>
                    <Combobox
                      options={blockOptions}
                      value={selectedBlock}
                      onValueChange={(value) => {
                        setSelectedBlock(value);
                        const blockLabel = blockOptions.find((b) => b.value === value)?.label || value;
                        setFormData((prev) => ({
                          ...prev,
                          block: blockLabel,
                          blockCode: value,
                        }));
                      }}
                      placeholder={
                        isLoadingBlocks
                          ? "Loading blocks..."
                          : !selectedDistrict
                          ? "Select district first"
                          : blockOptions.length === 0
                          ? "No blocks available"
                          : "Select block"
                      }
                      searchPlaceholder="Search block..."
                      emptyText="No block found."
                      disabled={!selectedDistrict || isLoadingBlocks}
                      className={cn(
                        "h-10 border shadow-sm hover:bg-accent",
                        (showLocationWarning.block || errors.block) && "border-red-500"
                      )}
                    />
                    {errors.block && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.block}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pin_code" className="text-sm font-medium">
                      PIN Code *
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
                      className={errors.pin_code ? "border-red-500" : ""}
                    />
                    {errors.pin_code && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.pin_code}
                      </p>
                    )}
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
                      Caste *
                    </Label>
                    <Combobox
                      options={casteList?.map((caste) => ({
                        value: String(caste.id),
                        label: caste.cast_name,
                      })) || []}
                      value={formData.cast_id ? String(formData.cast_id) : ""}
                      onValueChange={(value) =>
                        handleInputChange("cast_id", value === "none" ? "" : value)
                      }
                      placeholder="Select caste"
                      searchPlaceholder="Search caste..."
                      emptyText="No caste found."
                      className={cn(
                        "h-10 border shadow-sm hover:bg-accent",
                        errors.cast_id && "border-red-500"
                      )}
                    />
                    {errors.cast_id && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.cast_id}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="qualification_id"
                      className="text-sm font-medium"
                    >
                      Qualification *
                    </Label>
                    <Combobox
                      options={qualificationList?.map((q) => ({
                        value: String(q.id),
                        label: q.qualification_name,
                      })) || []}
                      value={
                        formData.qualification_id
                          ? String(formData.qualification_id)
                          : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange(
                          "qualification_id",
                          value === "none" ? "" : value
                        )
                      }
                      placeholder="Select qualification"
                      searchPlaceholder="Search qualification..."
                      emptyText="No qualification found."
                      className={cn(
                        "h-10 border shadow-sm hover:bg-accent",
                        errors.qualification_id && "border-red-500"
                      )}
                    />
                    {errors.qualification_id && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.qualification_id}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="current_work"
                      className="text-sm font-medium"
                    >
                      Current Work *
                    </Label>
                    <Combobox
                      options={currentstatusList?.map((work) => ({
                        value: String(work.id),
                        label: work.current_status_name,
                      })) || []}
                      value={
                        formData.current_status_id
                          ? String(formData.current_status_id)
                          : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange(
                          "current_status_id",
                          value === "none" ? "" : value
                        )
                      }
                      placeholder="Select current work"
                      searchPlaceholder="Search current work..."
                      emptyText="No current work found."
                      className={cn(
                        "h-10 border shadow-sm hover:bg-accent",
                        errors.current_status_id && "border-red-500"
                      )}
                    />
                    {errors.current_status_id && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.current_status_id}
                      </p>
                    )}
                  </div>
{/* 
                  <div className="space-y-2">
                    <Label htmlFor="campus_id" className="text-sm font-medium">
                      Campus *
                    </Label>
                    <Combobox
                      options={campusList?.map((q) => ({
                        value: String(q.id),
                        label: q.campus_name,
                      })) || []}
                      value={
                        formData.campus_id ? String(formData.campus_id) : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange(
                          "campus_id",
                          value === "none" ? "" : value
                        )
                      }
                      placeholder="Select Campus"
                      searchPlaceholder="Search campus..."
                      emptyText="No campus found."
                      className={cn(
                        "h-10 border shadow-sm hover:bg-accent",
                        errors.campus_id && "border-red-500"
                      )}
                    />
                    {errors.campus_id && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.campus_id}
                      </p>
                    )}
                  </div> */}

                  <div className="space-y-2">
                    <Label
                      htmlFor="religion_id"
                      className="text-sm font-medium"
                    >
                      Religion *
                    </Label>
                    <Combobox
                      options={religionList?.map((r) => ({
                        value: String(r.id),
                        label: r.religion_name,
                      })) || []}
                      value={
                        formData.religion_id ? String(formData.religion_id) : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange(
                          "religion_id",
                          value === "none" ? "" : value
                        )
                      }
                      placeholder="Select religion"
                      searchPlaceholder="Search religion..."
                      emptyText="No religion found."
                      className={cn(
                        "h-10 border shadow-sm hover:bg-accent",
                        errors.religion_id && "border-red-500"
                      )}
                    />
                    {errors.religion_id && (
                      <p className="text-red-500 text-xs flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.religion_id}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="partner_id"
                      className="text-sm font-medium"
                    >
                      Partner
                    </Label>
                    <Combobox
                      options={partnerList?.map((p) => ({
                        value: String(p.id),
                        label: p.partner_name,
                      })) || []}
                      value={
                        formData.partner_id ? String(formData.partner_id) : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange(
                          "partner_id",
                          value === "none" ? "" : value
                        )
                      }
                      placeholder="Select partner"
                      searchPlaceholder="Search partner..."
                      emptyText="No partner found."
                      className="h-10 border shadow-sm hover:bg-accent"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="donor_id"
                      className="text-sm font-medium"
                    >
                      Donor
                    </Label>
                    <Combobox
                      options={donorList?.map((d) => ({
                        value: String(d.id),
                        label: d.donor_name,
                      })) || []}
                      value={
                        formData.donor_id ? String(formData.donor_id) : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange(
                          "donor_id",
                          value === "none" ? "" : value
                        )
                      }
                      placeholder="Select donor"
                      searchPlaceholder="Search donor..."
                      emptyText="No donor found."
                      className="h-10 border shadow-sm hover:bg-accent"
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label
                    htmlFor="communication_notes"
                    className="text-sm font-medium"
                  >
                    Communication Notes *
                  </Label>
                  <Textarea
                    id="communication_notes"
                    value={formData.communication_notes}
                    onChange={(e) =>
                      handleInputChange("communication_notes", e.target.value)
                    }
                    placeholder="Enter communication notes"
                    rows={3}
                    className={
                      errors.communication_notes
                        ? "resize-none border-red-500"
                        : "resize-none"
                    }
                  />
                  {errors.communication_notes && (
                    <p className="text-red-500 text-xs flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {errors.communication_notes}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="screening" className="space-y-4 sm:space-y-6">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 sm:p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-orange-600" />
                  Screening Details
                </h3>
                <p className="text-sm text-gray-600 mb-4 bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                  <AlertCircle className="w-4 h-4 inline mr-1 text-blue-600" />
                  <strong>Note:</strong> For screening students, if you enter marks, the screening status and school will be automatically updated based on the obtained marks.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="screening_status"
                      className="text-sm font-medium"
                    >
                      Screening Status
                    </Label>
                    <Combobox
                      options={[
                        { value: "Screening Test Pass", label: "Screening Test Pass" },
                        { value: "Screening Test Fail", label: "Screening Test Fail" },
                        { value: "Created Student Without Exam", label: "Created Student Without Exam" },
                      ]}
                      value={formData.status}
                      onValueChange={(value) =>
                        handleInputChange(
                          "status",
                          value === "none" ? "" : value
                        )
                      }
                      placeholder="Select screening status"
                      searchPlaceholder="Search status..."
                      emptyText="No status found."
                      className={cn(
                        "h-10 border shadow-sm hover:bg-accent",
                        errors.status && "border-red-500"
                      )}
                    />
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
                      Question Set *
                    </Label>
                    <Combobox
                      options={questionSetList?.map((set) => ({
                        value: String(set.id),
                        label: set.name,
                      })) || []}
                      value={
                        formData.question_set_id
                          ? String(formData.question_set_id)
                          : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange(
                          "question_set_id",
                          value === "none" ? "" : value
                        )
                      }
                      placeholder="Select question set"
                      searchPlaceholder="Search question set..."
                      emptyText="No question set found."
                      className={cn(
                        "h-10 border shadow-sm hover:bg-accent",
                        errors.question_set_id && "border-red-500"
                      )}
                    />
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
                      Exam Centre *
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
                      Date of Testing *
                    </Label>
                    <Input
                      id="date_of_test"
                      type="date"
                      value={formData.date_of_test}
                      max={new Date().toISOString().split('T')[0]}
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
                      Obtained Marks *
                    </Label>
                    <Input
                      id="obtained_marks"
                      type="number"
                      value={formData.obtained_marks}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = Number(value);
                        const maxMarks = Number(formData.total_marks);
                        
                        // Only allow if value is empty, or within valid range
                        if (value === "" || (numValue >= 0 && numValue <= maxMarks)) {
                          handleInputChange("obtained_marks", value);
                          // Clear error if within range
                          if (errors.obtained_marks && numValue <= maxMarks) {
                            setErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.obtained_marks;
                              return newErrors;
                            });
                          }
                        } else if (numValue > maxMarks) {
                          // Show error but don't update value
                          setErrors((prev) => ({
                            ...prev,
                            obtained_marks: `Obtained marks cannot exceed total marks (${maxMarks})`,
                          }));
                        }
                      }}
                      placeholder="Enter obtained marks"
                      min="0"
                      max={formData.total_marks || undefined}
                      className={errors.obtained_marks ? "border-red-500" : ""}
                    />
                    {errors.obtained_marks && (
                      <p className="text-xs text-red-500">
                        {errors.obtained_marks}
                      </p>
                    )}
                    {formData.total_marks > 0 && (
                      <p className="text-xs text-gray-500">
                        Maximum marks: {formData.total_marks}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="qualifying_school_id"
                      className="text-sm font-medium"
                    >
                      Qualifying School
                    </Label>
                    <Combobox
                      options={schoolList?.map((school) => ({
                        value: String(school.id),
                        label: school.school_name,
                      })) || []}
                      value={
                        formData.qualifying_school_id
                          ? String(formData.qualifying_school_id)
                          : ""
                      }
                      onValueChange={(value) =>
                        handleInputChange(
                          "qualifying_school_id",
                          value === "none" ? "" : value
                        )
                      }
                      placeholder="Select qualifying school"
                      searchPlaceholder="Search school..."
                      emptyText="No school found."
                      className={cn(
                        "h-10 border shadow-sm hover:bg-accent",
                        errors.qualifying_school_id && "border-red-500"
                      )}
                    />
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
