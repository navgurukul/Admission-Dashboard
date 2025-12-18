import { useState, useEffect, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, MessageSquare, Pencil, ChevronsUpDown, Check } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { InlineEditModal } from "./InlineEditModal";
import { ApplicantCommentsModal } from "./ApplicantCommentsModal";
import { Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { EditableCell } from "./applicant-table/EditableCell";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import {
  updateStudent,
  getStudentById,
  API_MAP,
  submitFinalDecision,
  getBlocksByDistrict,
  getDistrictsByState,
} from "@/utils/api";
import { InlineSubform } from "@/components/Subform";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import StageDropdown, {
  STAGE_STATUS_MAP,
} from "./applicant-table/StageDropdown";
import { Value } from "@radix-ui/react-select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ApplicantModalProps {
  applicant: any;
  isOpen: boolean;
  onClose: () => void;
  // Pre-fetched data from parent
  castList?: any[];
  qualificationList?: any[];
  currentstatusList?: any[];
  schoolList?: any[];
  campusList?: any[];
  questionSetList?: any[];
  stageList?: any[];
  partnerList?: any[];
  donorList?: any[];
  stateList?: { value: string; label: string }[];
}

export function ApplicantModal({
  applicant,
  isOpen,
  onClose,
  castList = [],
  qualificationList = [],
  currentstatusList = [],
  schoolList = [],
  campusList = [],
  questionSetList = [],
  stageList = [],
  partnerList = [],
  donorList = [],
  stateList = [],
}: ApplicantModalProps) {
  const { toast } = useToast();
  const { hasEditAccess } = usePermissions();
  const [currentApplicant, setCurrentApplicant] = useState(applicant);
  const [showEditModal, setShowEditModal] = useState(false);
  // const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [joiningDate, setJoiningDate] = useState("");
  const [districtOptions, setDistrictOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [blockOptions, setBlockOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  
  // Refs to track previous values and prevent unnecessary API calls
  const prevStateRef = useRef<string | null>(null);
  const prevDistrictRef = useRef<string | null>(null);
  
  const [openComboboxes, setOpenComboboxes] = useState({
    state: false,
    district: false,
    block: false,
  });

  // Transform props data to the format expected by the component
  const castes = useMemo(() => 
    (castList || []).map((c: any) => ({
      value: c.id?.toString(),
      label: c.cast_name,
    })), [castList]);

  const qualifications = useMemo(() => 
    (qualificationList || []).map((q: any) => ({
      value: q.id?.toString(),
      label: q.qualification_name,
    })), [qualificationList]);

  const currentWorks = useMemo(() => 
    (currentstatusList || []).map((w: any) => ({
      value: w.id?.toString(),
      label: w.current_status_name,
    })), [currentstatusList]);

  const schools = useMemo(() => 
    (schoolList || []).map((c: any) => ({
      value: c.id?.toString(),
      label: c.school_name,
    })), [schoolList]);

  const campus = useMemo(() => 
    (campusList || []).map((c: any) => ({
      value: c.id?.toString(),
      label: c.campus_name,
    })), [campusList]);

  const questionSets = useMemo(() => 
    (questionSetList || []).map((qs: any) => ({
      value: qs.id?.toString(),
      label: qs.name,
    })), [questionSetList]);

  const stages = useMemo(() => 
    (stageList || []).map((s: any) => ({
      id: s.id,
      name: s.stage_name || s.name,
    })), [stageList]);

  const partners = useMemo(() => 
    (partnerList || []).map((p: any) => ({
      value: p.id?.toString(),
      label: p.partner_name,
    })), [partnerList]);

  const donors = useMemo(() => 
    (donorList || []).map((d: any) => ({
      value: d.id?.toString(),
      label: d.donor_name,
    })), [donorList]);

  const stateOptions = useMemo(() => stateList || [], [stateList]);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Confirmation dialog state for "Offer Sent"
  const [showOfferSentConfirmation, setShowOfferSentConfirmation] = useState(false);
  const [pendingOfferLetterValue, setPendingOfferLetterValue] = useState<string | null>(null);

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

  // Helper to convert state name to state code (if needed)
  const getStateCodeFromNameOrCode = (value: string) => {
    if (!value) return null;

    // Try to find by matching the code first (exact match)
    const byCode = stateOptions.find((opt) => opt.value === value);
    if (byCode) return value;

    // Try to find the state_code by matching the name (case-insensitive)
    const byName = stateOptions.find(
      (opt) => opt.label.toUpperCase() === value.toUpperCase()
    );

    return byName ? byName.value : value;
  };

  // Helper to convert district name to district code (if needed)
  const getDistrictCodeFromNameOrCode = (value: string) => {
    if (!value) return null;

    // Try to find by matching the code first (exact match)
    const byCode = districtOptions.find((opt) => opt.value === value);
    if (byCode) return value;

    // Try to find the district_code by matching the name (case-insensitive)
    const byName = districtOptions.find(
      (opt) => opt.label.toUpperCase() === value.toUpperCase()
    );

    return byName ? byName.value : value;
  };

  // Initialize selected state and district from applicant data
  useEffect(() => {
    if (applicant?.id) {
      setCurrentApplicant(applicant);
      if (applicant.state) {
        const stateCode = getStateCodeFromNameOrCode(applicant.state);
        setSelectedState(stateCode);
      }
      if (applicant.district) {
        const districtCode = getDistrictCodeFromNameOrCode(applicant.district);
        setSelectedDistrict(districtCode);
      }
    }
  }, [applicant]); //, stateOptions, districtOptions

  // Fetch student data on modal open
  useEffect(() => {
    if (isOpen && applicant?.id) {
      const fetchStudent = async () => {
        try {
          const response = await getStudentById(applicant.id);
          let updated: any = response;
          if (response && typeof response === "object" && "data" in response) {
            updated = (response as any).data;
          }
          if (updated?.id) {
            setCurrentApplicant(updated);
            if (updated.state) {
              const stateCode = getStateCodeFromNameOrCode(updated.state);
              setSelectedState(stateCode);
            }
            if (updated.district) {
              const districtCode = getDistrictCodeFromNameOrCode(
                updated.district
              );
              setSelectedDistrict(districtCode);
            }
          } else {
            // console.error("Invalid response - no ID found:", response);
          }
        } catch (err) {
          // console.error("Failed to fetch student data", err);
        }
      };
      fetchStudent();
    }
  }, [isOpen, applicant?.id, refreshKey]); // Removed stateOptions and districtOptions to prevent unnecessary API calls

  // Set joining date from current applicant
  // useEffect(() => {
  //   if (currentApplicant?.joining_date) {
  //     setJoiningDate(currentApplicant.joining_date.split("T")[0]);
  //   }
  // }, [currentApplicant?.joining_date]);

  // Fix: Load joining date from nested final_decisions if available
  useEffect(() => {
    const jd =
      currentApplicant?.final_decisions?.[0]?.joining_date ||
      currentApplicant?.joining_date ||
      "";
    setJoiningDate(jd ? jd.split("T")[0] : "");
  }, [currentApplicant]);

  // Fetch districts when state changes
  useEffect(() => {
    if (!selectedState) {
      setDistrictOptions([]);
      setBlockOptions([]);
      prevStateRef.current = null;
      return;
    }

    // Skip if state hasn't actually changed (prevents duplicate calls)
    if (prevStateRef.current === selectedState) {
      return;
    }
    prevStateRef.current = selectedState;

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
      } catch (err) {
        // console.error("Failed to fetch districts:", err);
        setDistrictOptions([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, [selectedState]);

  // Fetch blocks when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setBlockOptions([]);
      prevDistrictRef.current = null;
      return;
    }

    // Skip if district hasn't actually changed (prevents duplicate calls)
    if (prevDistrictRef.current === selectedDistrict) {
      return;
    }
    prevDistrictRef.current = selectedDistrict;

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
      } catch (err) {
        // console.error("Failed to fetch blocks:", err);
        setBlockOptions([]);
      } finally {
        setIsLoadingBlocks(false);
      }
    };

    fetchBlocks();
  }, [selectedDistrict]);

  // Handler for "Offer Sent" confirmation
  const handleOfferLetterStatusChange = async (value: any) => {
    if (value === "Offer Sent") {
      // Show confirmation dialog before proceeding
      setPendingOfferLetterValue(value);
      setShowOfferSentConfirmation(true);
      return;
    }
    // For other values, proceed directly
    await handleFinalDecisionUpdate("offer_letter_status", value);
  };

  // Confirm "Offer Sent" selection
  const confirmOfferSent = async () => {
    if (pendingOfferLetterValue) {
      await handleFinalDecisionUpdate("offer_letter_status", pendingOfferLetterValue);
    }
    setShowOfferSentConfirmation(false);
    setPendingOfferLetterValue(null);
  };

  // Cancel "Offer Sent" selection
  const cancelOfferSent = () => {
    setShowOfferSentConfirmation(false);
    setPendingOfferLetterValue(null);
  };

  const handleFinalDecisionUpdate = async (field: string, value: any) => {
    if (!currentApplicant?.id) return;

    // Validation: Campus must be selected before setting offer letter status
    if (field === "offer_letter_status" && !currentApplicant?.campus_id) {
      toast({
        title: "Alert",
        description: "Please select a Campus first before setting Offer Letter Status.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use existing local state instead of fetching again
      const existingDecision = currentApplicant?.final_decisions?.[0] || {};

      // Get the current joining_date - prioritize the state value
      let currentJoiningDate = joiningDate;
      if (!currentJoiningDate && existingDecision.joining_date) {
        currentJoiningDate = existingDecision.joining_date.split("T")[0];
      }

      // Create payload with ALL existing values preserved
      const payload: Record<string, any> = {
        student_id: currentApplicant.id,
        id: existingDecision.id,
        // Preserve ALL existing values
        offer_letter_status: existingDecision.offer_letter_status ?? null,
        onboarded_status: existingDecision.onboarded_status ?? null,
        final_notes: existingDecision.final_notes ?? null,
        joining_date: currentJoiningDate || null,
        stage_id: existingDecision.stage_id ?? null,
      };

      // Override with the new value being updated
      if (field === "joining_date") {
        payload.joining_date = value !== "" ? value : null;
      } else {
        payload[field] = value;
      }

      // Determine stage_id based on offer_letter_status and onboarded_status
      const offerLetterStatus = payload.offer_letter_status;
      const onboardedStatus = payload.onboarded_status;

      // Find stage IDs by name
      const finalDecisionStage = stages.find(
        (s) => s.name === "Final Decision"
      );
      const onboardedStage = stages.find((s) => s.name === "Onboarded");

      let newStageId = payload.stage_id; // Keep existing stage by default

      if (offerLetterStatus != null && onboardedStatus != null) {
        // Both offer letter and onboarded exist -> stage 5 (Onboarded)
        newStageId = onboardedStage?.id || 5;
      } else if (offerLetterStatus != null && onboardedStatus == null) {
        // Only offer letter exists -> stage 4 (Final Decision)
        newStageId = finalDecisionStage?.id || 4;
      } else if (onboardedStatus != null) {
        // Only onboarded exists -> stage 5 (Onboarded)
        newStageId = onboardedStage?.id || 5;
      }
      // else: keep existing stage (newStageId remains payload.stage_id)

      payload.stage_id = newStageId;

      await submitFinalDecision(payload);

      // Update local state immediately - no need for extra API call
      setCurrentApplicant((prev) => ({
        ...prev,
        final_decisions: [
          {
            ...existingDecision,
            [field]: value,
            joining_date: field === "joining_date" ? value : currentJoiningDate,
            stage_id: newStageId,
          },
        ],
      }));

      // Also update joiningDate state if that's what was changed
      if (field === "joining_date") {
        setJoiningDate(value);
      }

      toast({
        title: "Success",
        description: "Final decision updated successfully.",
      });
    } catch (err) {
      console.error("Failed to update final decision", err);
      toast({
        title: "Error",
        description: "Failed to update final decision. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  // const handleCommentsClick = () => {
  //   setShowCommentsModal(true);
  // };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setRefreshKey((prev) => prev + 1);
  };

  const handleUpdate = async () => {
    if (!currentApplicant?.id) return;
    try {
      const response = await getStudentById(currentApplicant.id);

      let updated: any = response;
      if (response && typeof response === "object" && "data" in response) {
        updated = (response as any).data;
      }

      if (updated?.id) {
        setCurrentApplicant(updated);
      } else {
        // console.error("Invalid response - no ID found:", response);
      }
    } catch (err) {
      // console.error("Failed to refresh applicant", err);
    }
  };

  const getLabel = (
    options: { value: string; label: string }[],
    id: any,
    defaultLabel = ""
  ) => {
    // If no id provided, return default
    if (!id) return defaultLabel;
    
    // Try to find matching option
    const matchedOption = options.find((o) => o.value === id?.toString());
    
    // If found, return the label; otherwise return the id itself as fallback
    return matchedOption?.label || id?.toString() || defaultLabel;
  };

  // Helper to convert name back to code (for dropdown value matching)
  const getCode = (options: Array<{ value: string; label: string }>, name: string | null | undefined): string | null => {
    if (!name) return null;
    const matchedOption = options.find((o) => o.label === name);
    return matchedOption?.value || null;
  };

  const handleStateChange = async (value: string) => {
    setSelectedState(value);
    setSelectedDistrict(null);
    setDistrictOptions([]);
    setBlockOptions([]);

    // Convert state code to name before sending to API
    const stateName = stateOptions.find((opt) => opt.value === value)?.label || value;
    
    if (currentApplicant?.id) {
      await updateStudent(currentApplicant.id, { 
        state: stateName,  // Send NAME to API (e.g., "Tripura")
        district: null,
        block: null
      });
    }

    await handleUpdate();
  };

  const handleDistrictChange = async (value: string) => {
    setSelectedDistrict(value);
    setBlockOptions([]);

    // Convert district code to name before sending to API
    const districtName = districtOptions.find((opt) => opt.value === value)?.label || value;
    
    if (currentApplicant?.id) {
      await updateStudent(currentApplicant.id, { 
        district: districtName,  // Send NAME to API (e.g., "North District")
        block: null
      });
    }

    await handleUpdate();
  };

  const handleBlockChange = async (value: string) => {
    if (!currentApplicant?.id) return;
    
    try {
      // Convert block id to name before sending to API
      const blockName = blockOptions.find((opt) => opt.value === value)?.label || value;
      
      await updateStudent(currentApplicant.id, { 
        block: blockName  // Send NAME to API (e.g., "Block A")
      });
      
      // Refresh applicant data
      await handleUpdate();
      
      toast({ 
        title: "Success", 
        description: "Block updated successfully" 
      });
    } catch (error) {
      console.error("Failed to update block:", error);
      toast({
        title: "Error",
        description: "Failed to update block",
        variant: "destructive",
      });
    }
  };

  const examSession = currentApplicant?.exam_sessions?.[0] ?? null;

  const screeningFields = [
    {
      name: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "Screening Test Pass", label: "Screening Test Pass" },
        { value: "Screening Test Fail", label: "Screening Test Fail" },
        {
          value: "Created Student Without Exam",
          label: "Created Student Without Exam",
        },
      ],
    },
    {
      name: "question_set_id",
      label: "Set Name *",
      type: "select" as const,
      options: questionSets,
    },
    {
      name: "obtained_marks",
      label: "Obtained Marks * (Max: 36)",
      type: "component" as const,
      component: ({ row, updateRow, disabled }: any) => {
        const maxMarks = 36;
        return (
          <div className="w-full">
            <input
              type="number"
              value={row?.obtained_marks || ""}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = Number(value);
                
                // Only allow if value is empty, or within valid range (0 to maxMarks)
                if (value === "" || (numValue >= 0 && numValue <= maxMarks)) {
                  updateRow?.("obtained_marks", value);
                }
                // If value exceeds max, don't update (block the input)
              }}
              className={`border p-1 rounded w-full ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={!!disabled}
              min="0"
              max={maxMarks}
              placeholder="0-36"
            />
          </div>
        );
      },
    },
    {
      name: "school_id",
      label: "Qualifying School",
      type: "select" as const,
      options: schools,
    },
    {
      name: "exam_centre",
      label: "Exam Centre *",
      type: "readonly" as const,
    },
    {
      name: "date_of_test",
      label: "Date of Testing *",
      type: "component" as const,
      component: ({ row, updateRow, disabled }: any) => {
        const today = new Date().toISOString().split('T')[0];
        return (
          <input
            type="date"
            value={row?.date_of_test || ""}
            onChange={(e) => updateRow?.("date_of_test", e.target.value)}
            className="border p-1 rounded w-full"
            disabled={!!disabled}
            max={today}
          />
        );
      },
    },
    {
      name: "audit_info",
      label: "Audit Info",
      type: "readonly" as const,
    },
  ];

  const initialScreeningData = useMemo(
    () =>
      currentApplicant?.exam_sessions?.map((session) => ({
        id: session.id,
        status: session.status ?? currentApplicant.status ?? "",
        question_set_id: session.question_set_id?.toString() || "",
        obtained_marks:
          session.obtained_marks !== null && session.obtained_marks !== undefined
            ? session.obtained_marks.toString()
            : "",
        school_id:
          session.school_id !== null && session.school_id !== undefined
            ? session.school_id.toString()
            : "",
        exam_centre: session.exam_centre || "",
        date_of_test: session.date_of_test?.split("T")[0] || "",
        audit_info: {
          created_at: session.created_at || "",
          updated_at: session.updated_at || "",
          last_updated_by: session.last_updated_by || "",
        },
      })) || [],
    [currentApplicant]
  );

  // Map learning round data with audit info
  const initialLearningData = useMemo(
    () =>
      (currentApplicant?.interview_learner_round || []).map((round: any) => ({
        ...round,
        audit_info: {
          created_at: round.created_at || "",
          updated_at: round.updated_at || "",
          last_updated_by: round.last_updated_by || "",
        },
      })),
    [currentApplicant]
  );

  // Map cultural fit round data with audit info
  const initialCulturalData = useMemo(
    () =>
      (currentApplicant?.interview_cultural_fit_round || []).map((round: any) => ({
        ...round,
        audit_info: {
          created_at: round.created_at || "",
          updated_at: round.updated_at || "",
          last_updated_by: round.last_updated_by || "",
        },
      })),
    [currentApplicant]
  );

  // Early return AFTER all hooks
  if (!applicant || !currentApplicant) return null;

  const screeningSubmit =
    API_MAP?.screening?.submit ??
    (async (payload: any) => {
      // console.error("API_MAP.screening.submit is not available", payload);
      throw new Error("screening submit API not available");
    });

  const screeningUpdate =
    API_MAP?.screening?.update ??
    (async (id: any, payload: any) => {
      // console.error("API_MAP.screening.update is not available", id, payload);
      throw new Error("screening update API not available");
    });

  const isStageDisabled = (applicant: any, stage: string) => {
    // Check if screening passed (check all sessions)
    const examSessions = applicant?.exam_sessions || [];
    const screeningPassed = examSessions.some((session: any) => {
      const status = session?.status || "";
      return (
        status.toLowerCase().includes("pass") ||
        status === "Created Student Without Exam"
      );
    });

    // Check if learning round passed (check all rounds)
    const learnerRounds = applicant?.interview_learner_round || [];
    const learningPassed = learnerRounds.some((round: any) => {
      const status = round?.learning_round_status || "";
      return status.toLowerCase().includes("pass");
    });

    // Check if CFR passed (check all rounds)
    const cfrRounds = applicant?.interview_cultural_fit_round || [];
    const cfrPassed = cfrRounds.some((round: any) => {
      const status = round?.cultural_fit_status || "";
      return status.toLowerCase().includes("pass");
    });

    if (stage === "LR") {
      // Learning Round is disabled if Screening did NOT pass
      return !screeningPassed;
    }

    if (stage === "CFR") {
      // CFR is disabled if Screening did NOT pass OR Learning Round did NOT pass
      return !screeningPassed || !learningPassed;
    }

    if (stage === "OFFER") {
      // Offer Letter is disabled if any of the stages did NOT pass
      return !screeningPassed || !learningPassed || !cfrPassed;
    }

    return false;
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <DialogTitle className="text-lg sm:text-xl">Applicant Details</DialogTitle>
            <div className="flex items-center gap-2">
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleCommentsClick}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Comments
              </Button> */}
              {/* <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Details
              </Button> */}
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    First Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="first_name"
                    displayValue={
                      currentApplicant?.first_name || ""
                    }
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Middle Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="middle_name"
                    displayValue={
                      currentApplicant?.middle_name || ""
                    }
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Name
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="last_name"
                    displayValue={currentApplicant?.last_name || ""}
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                 <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="email"
                    displayValue={currentApplicant.email || ""}
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Mobile Number
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="phone_number"
                    displayValue={currentApplicant.phone_number}
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    WhatsApp Number
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="whatsapp_number"
                    displayValue={
                      currentApplicant.whatsapp_number || ""
                    }
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
    
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Gender
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="gender"
                    displayValue={currentApplicant.gender || ""}
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "other", label: "Other" },
                    ]}
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Cast
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="cast_id"
                    value={currentApplicant.cast_id}
                    displayValue={getLabel(castes, currentApplicant.cast_id)}
                    onUpdate={handleUpdate}
                    options={castes}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Qualification
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="qualification_id"
                    value={currentApplicant.qualification_id}
                    displayValue={getLabel(
                      qualifications,
                      currentApplicant.qualification_id
                    )}
                    onUpdate={handleUpdate}
                    options={qualifications}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Work
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="current_status_id"
                    displayValue={
                      currentWorks.find(
                        (w) =>
                          w.value ===
                          currentApplicant.current_status_id?.toString()
                      )?.label || ""
                    }
                    onUpdate={handleUpdate}
                    options={currentWorks}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    State
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="state"
                    displayValue={currentApplicant.state}
                    value={getCode(stateOptions, currentApplicant.state) || ""}
                    onUpdate={handleStateChange}
                    options={stateOptions}
                    disabled={!hasEditAccess}
                  />
                </div>
                {/* <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    City
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="city"
                    displayValue={currentApplicant.city || "Not provided"}
                    onUpdate={handleUpdate}
                  />
                </div> */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    District
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="district"
                    displayValue={currentApplicant.district || ""}
                    value={getCode(districtOptions, currentApplicant.district) || ""}
                    onUpdate={handleDistrictChange}
                    options={districtOptions}
                    disabled={
                      !hasEditAccess || !selectedState || isLoadingDistricts
                    }
                    placeholder={!selectedState ? "Select state first" : "Select district"}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Block
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="block"
                    displayValue={currentApplicant.block || ""}
                    value={getCode(blockOptions, currentApplicant.block) || ""}
                    onUpdate={handleBlockChange}
                    options={blockOptions}
                    disabled={
                      !hasEditAccess || !selectedDistrict || isLoadingBlocks
                    }
                    placeholder={!selectedDistrict ? "Select district first" : "Select block"}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Pincode
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="pin_code"
                    displayValue={currentApplicant.pin_code || ""}
                    onUpdate={handleUpdate}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Partner
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="partner_id"
                    value={currentApplicant.partner_id}
                    displayValue={getLabel(
                      partners,
                      currentApplicant.partner_id
                    )}
                    onUpdate={handleUpdate}
                    options={partners}
                    disabled={!hasEditAccess}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Donor
                  </label>
                  <EditableCell
                    applicant={currentApplicant}
                    field="donor_id"
                    value={currentApplicant.donor_id}
                    displayValue={getLabel(
                      donors,
                      currentApplicant.donor_id
                    )}
                    onUpdate={handleUpdate}
                    options={donors}
                    disabled={!hasEditAccess}
                  />
                </div>
              </div>
            </div>

            {/* Timestamps for Personal Details */}
            <div className="space-y-3 pt-4">
              <h4 className="text-sm font-semibold text-muted-foreground">Timestamps for Personal Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Created At
                  </label>
                  <p className="text-sm">
                    {currentApplicant.created_at
                      ? new Date(currentApplicant.created_at).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Last Updated At
                  </label>
                  <p className="text-sm">
                    {currentApplicant.updated_at
                      ? new Date(currentApplicant.updated_at).toLocaleString()
                      : "Not available"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">
                    Last Updated By
                  </label>
                  <p className="text-sm">
                    {currentApplicant.last_updated_by
                      ? currentApplicant.last_updated_by
                      : "Not available"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <InlineSubform
            title="Screening Round"
            studentId={currentApplicant.id}
            initialData={initialScreeningData}
            fields={screeningFields}
            submitApi={screeningSubmit}
            updateApi={screeningUpdate}
            onSave={handleUpdate}
          />

          {/* Learning & Cultural Fit Rounds */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            <div className="col-span-full w-full">
              <InlineSubform
                title="Learning Round"
                studentId={currentApplicant.id}
                initialData={initialLearningData}
                fields={[
                  {
                    name: "learning_round_status",
                    label: "Status *",
                    type: "select" as const,
                    disabled: isStageDisabled(currentApplicant, "LR"),
                    options: [
                      {
                        value: "Learner Round Pass",
                        label: "Learner Round Pass",
                      },
                      {
                        value: "Learner Round Fail",
                        label: "Learner Round Fail",
                      },
                      { value: "Reschedule", label: "Reschedule" },
                      { value: "No Show", label: "No Show" },
                    ],
                  },
                  {
                    name: "comments",
                    label: "Comments *",
                    type: "text" as const,
                    disabled: isStageDisabled(currentApplicant, "LR"),
                  },
                  {
                    name: "audit_info",
                    label: "Audit Info",
                    type: "readonly" as const,
                  },
                ]}
                submitApi={API_MAP.learning.submit}
                updateApi={API_MAP.learning.update}
                onSave={handleUpdate}
                disabled={isStageDisabled(currentApplicant, "LR")}
                disabledReason=" Student need to pass Screening Round"
              />
            </div>
            <div className="col-span-full w-full">
              <InlineSubform
                title="Cultural Fit Round"
                studentId={currentApplicant.id}
                initialData={initialCulturalData}
                fields={[
                  {
                    name: "cultural_fit_status",
                    label: "Status *",
                    type: "select" as const,
                    disabled: isStageDisabled(currentApplicant, "CFR"),
                    options: [
                      {
                        value: "Cultural Fit Interview Pass",
                        label: "Cultural Fit Interview Pass",
                      },
                      {
                        value: "Cultural Fit Interview Fail",
                        label: "Cultural Fit Interview Fail",
                      },
                      { value: "Reschedule", label: "Reschedule" },
                      { value: "No Show", label: "No Show" },
                    ],
                  },
                  {
                    name: "comments",
                    label: "Comments *",
                    type: "text" as const,
                    disabled: isStageDisabled(currentApplicant, "LR"),
                  },

                  {
                    name: "audit_info",
                    label: "Audit Info",
                    type: "readonly" as const,
                  }
                ]}
                submitApi={API_MAP.cultural.submit}
                updateApi={API_MAP.cultural.update}
                onSave={handleUpdate}
                disabled={isStageDisabled(currentApplicant, "CFR")}
                disabledReason="Student need to pass Learning Round"
              />
            </div>

            {/* Offer and Final Status */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-semibold">Offer & Final Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Campus
                  </label>
                  {isStageDisabled(currentApplicant, "OFFER") &&
                    !currentApplicant.campus_id ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <EditableCell
                              applicant={currentApplicant}
                              field="campus_id"
                              value={currentApplicant.campus_id}
                              displayValue={getLabel(
                                campus,
                                currentApplicant.campus_id
                              )}
                              onUpdate={handleUpdate}
                              options={campus}
                              disabled={true}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>All rounds should be passed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <EditableCell
                      applicant={currentApplicant}
                      field="campus_id"
                      value={currentApplicant.campus_id}
                      displayValue={getLabel(
                        campus,
                        currentApplicant.campus_id
                      )}
                      onUpdate={handleUpdate}
                      options={campus}
                      disabled={!hasEditAccess}
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Offer Letter Status
                  </label>
                  {isStageDisabled(currentApplicant, "OFFER") &&
                    !currentApplicant.final_decisions?.[0]
                      ?.offer_letter_status ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <EditableCell
                              applicant={currentApplicant}
                              field="offer_letter_status"
                              value={
                                currentApplicant.final_decisions?.[0]
                                  ?.offer_letter_status
                              }
                              displayValue={
                                currentApplicant.final_decisions?.[0]
                                  ?.offer_letter_status || ""
                              }
                              options={[
                                {
                                  value: "Offer Pending",
                                  label: "Offer Pending",
                                },
                                { value: "Offer Sent", label: "Offer Sent" },
                                {
                                  value: "Offer Accepted",
                                  label: "Offer Accepted",
                                },
                                {
                                  value: "Offer Declined",
                                  label: "Offer Declined",
                                },
                                { value: "Waitlisted", label: "Waitlisted" },
                                {
                                  value: "Selected but not joined",
                                  label: "Selected but not joined",
                                },
                              ]}
                              disabled={true}
                              onUpdate={async (value) => {
                                await handleOfferLetterStatusChange(value);
                              }}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>All rounds should be passed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <EditableCell
                      applicant={currentApplicant}
                      field="offer_letter_status"
                      value={
                        currentApplicant.final_decisions?.[0]
                          ?.offer_letter_status
                      }
                      displayValue={
                        currentApplicant.final_decisions?.[0]
                          ?.offer_letter_status || ""
                      }
                      options={[
                        { value: "Offer Pending", label: "Offer Pending" },
                        { value: "Offer Sent", label: "Offer Sent" },
                        { value: "Offer Accepted", label: "Offer Accepted" },
                        { value: "Offer Declined", label: "Offer Declined" },
                        { value: "Waitlisted", label: "Waitlisted" },
                        {
                          value: "Selected but not joined",
                          label: "Selected but not joined",
                        },
                      ]}
                      disabled={!hasEditAccess}
                      onUpdate={async (value) => {
                        await handleOfferLetterStatusChange(value);
                      }}
                    />
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Onboarded Status
                  </label>
                  {isStageDisabled(currentApplicant, "OFFER") &&
                    !currentApplicant.final_decisions?.[0]?.onboarded_status ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <EditableCell
                              applicant={currentApplicant}
                              field="onboarded_status"
                              value={
                                currentApplicant.final_decisions?.[0]
                                  ?.onboarded_status
                              }
                              displayValue={
                                currentApplicant.final_decisions?.[0]
                                  ?.onboarded_status || ""
                              }
                              options={[
                                { value: "Onboarded", label: "Onboarded" },
                              ]}
                              disabled={true}
                              onUpdate={async (value) => {
                                await handleFinalDecisionUpdate(
                                  "onboarded_status",
                                  value
                                );
                              }}
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>All rounds should be passed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <EditableCell
                      applicant={currentApplicant}
                      field="onboarded_status"
                      value={
                        currentApplicant.final_decisions?.[0]
                          ?.onboarded_status
                      }
                      displayValue={
                        currentApplicant.final_decisions?.[0]
                          ?.onboarded_status || ""
                      }
                      options={[{ value: "Onboarded", label: "Onboarded" }]}
                      disabled={!hasEditAccess}
                      onUpdate={async (value) => {
                        await handleFinalDecisionUpdate(
                          "onboarded_status",
                          value
                        );
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="w-full">
                <label className="text-sm font-medium text-muted-foreground">
                  Joining Date
                </label>
                {isStageDisabled(currentApplicant, "OFFER") &&
                  !currentApplicant.final_decisions?.[0]?.joining_date ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <input
                            type="date"
                            className="border rounded px-2 py-1 w-full cursor-not-allowed opacity-60"
                            value=""
                            disabled={true}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>All rounds should be passed</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-full text-sm sm:text-base"
                    value={
                      joiningDate ||
                      currentApplicant.final_decisions?.[0]?.joining_date?.split(
                        "T"
                      )[0] ||
                      ""
                    }
                    disabled={!hasEditAccess}
                    onChange={async (e) => {
                      const selectedDate = e.target.value;
                      setJoiningDate(selectedDate);

                      try {
                        // Call API immediately when date changes
                        await handleFinalDecisionUpdate(
                          "joining_date",
                          selectedDate || null
                        );

                        // Immediately sync
                        setCurrentApplicant((prev) => ({
                          ...prev,
                          final_decisions: [
                            {
                              ...(prev.final_decisions?.[0] || {}),
                              joining_date: selectedDate,
                            },
                          ],
                        }));
                      } catch (err) {
                        // console.error("Failed to update joining date:", err);
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              {/* Final Note - Full Width */}
              <div className="w-full">
                <label className="text-sm font-medium text-muted-foreground">
                  Final Note
                </label>
                <EditableCell
                  applicant={currentApplicant}
                  field="final_notes"
                  value={
                    currentApplicant.final_decisions?.[0]?.final_notes || ""
                  }
                  displayValue={
                    currentApplicant.final_decisions?.[0]?.final_notes ||
                    "No final note"
                  }
                  renderInput={({ value, onChange }) => (
                    <textarea
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      rows={4}
                      className="border rounded px-2 py-1 w-full resize-y"
                      placeholder="Enter final notes here..."
                    />
                  )}
                  onUpdate={async (value) => {
                    await handleFinalDecisionUpdate("final_notes", value);
                  }}
                />
              </div>

              {/* Audit Information - Below Final Note */}
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-semibold text-muted-foreground">Timestamps for Offer Letter</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Created At
                    </label>
                    <p className="text-sm mt-1">
                      {currentApplicant.final_decisions?.[0]?.created_at
                        ? new Date(currentApplicant.final_decisions[0].created_at).toLocaleString()
                        : "Not available"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Updated At
                    </label>
                    <p className="text-sm mt-1">
                      {currentApplicant.final_decisions?.[0]?.updated_at
                        ? new Date(currentApplicant.final_decisions[0].updated_at).toLocaleString()
                        : "Not available"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Updated By
                    </label>
                    <p className="text-sm mt-1">
                      {currentApplicant.final_decisions?.[0]?.last_status_updated_by || "Not available"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showEditModal && (
        <InlineEditModal
          applicant={currentApplicant}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Confirmation Dialog for "Offer Sent" */}
      <AlertDialog open={showOfferSentConfirmation} onOpenChange={setShowOfferSentConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Offer Sent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this offer as "Offer Sent"? This action will update the applicant's offer letter status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelOfferSent}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOfferSent}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* {showCommentsModal && (
        <ApplicantCommentsModal
          applicantId={currentApplicant.id || ""}
          applicantName={currentApplicant.name || ""}
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
        />
      )} */}
    </>
  );
}


