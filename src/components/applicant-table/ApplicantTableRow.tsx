import { useState, useEffect, useCallback, useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";
import { EditableCell } from "./EditableCell";
import StatusDropdown from "./StatusDropdown";
import StageDropdown from "./StageDropdown";
import { CampusSelector } from "../CampusSelector";
import { getDistrictsByState, getBlocksByDistrict } from "@/utils/api";

// ✅ MANDATORY: Cache for getByState API to prevent repeated calls
const districtCache = new Map<string, { data: any[]; timestamp: number }>();
const blockCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedDistricts = async (stateCode: string) => {
  const cached = districtCache.get(stateCode);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const response = await getDistrictsByState(stateCode);
  const districts = response?.data || response || [];
  districtCache.set(stateCode, { data: districts, timestamp: Date.now() });
  return districts;
};

const getCachedBlocks = async (districtCode: string) => {
  const cached = blockCache.get(districtCode);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const response = await getBlocksByDistrict(districtCode);
  const blocks = response?.data || response || [];
  blockCache.set(districtCode, { data: blocks, timestamp: Date.now() });
  return blocks;
};
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePermissions } from "@/hooks/usePermissions";

interface ApplicantTableRowProps {
  applicant: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: () => void;
  onViewDetails: (applicant: any) => void;
  onViewComments: (applicant: any) => void;
  onCampusChange: () => void;
  ensureReferenceDataLoaded?: () => void; // NEW: Callback to load all reference data
  ensureFieldDataLoaded?: (field: string) => Promise<void>; // NEW: Callback to load specific field data
  isLoadingReferenceData?: boolean; // NEW: Loading state for reference data

  campusList: any[];
  schoolList: any[];
  religionList: any[];
  // casteList: any[];
  currentstatusList: any[];
  stageStatusList?: any[];
  questionSetList: any[];
  partnerList?: any[];
  donorList?: any[];
  castList?: any[];
  qualificationList?: any[];
  stateList?: any[];
  districtList?: any[];
  blockList?: any[];
  isColumnVisible: (columnId: string) => boolean;
}

export const ApplicantTableRow = ({
  applicant,
  isSelected,
  onSelect,
  onUpdate,
  onViewDetails,
  onViewComments,
  onCampusChange,
  ensureReferenceDataLoaded, // Callback to load all reference data
  ensureFieldDataLoaded, // NEW: Callback to load specific field data
  isLoadingReferenceData = false, // Loading state
  campusList,
  schoolList,
  religionList,
  // casteList,
  currentstatusList,
  stageStatusList = [],
  questionSetList,
  partnerList = [],
  donorList = [],
  castList = [],
  qualificationList = [],
  stateList = [],
  districtList = [],
  blockList = [],
  isColumnVisible,
}: ApplicantTableRowProps) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const { hasEditAccess } = usePermissions();
  
  // State for dynamic district and block options
  const [districtOptions, setDistrictOptions] = useState<{ id: string | number; name: string }[]>([]);
  const [blockOptions, setBlockOptions] = useState<{ id: string | number; name: string }[]>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

  // ✅ FIXED: Fetch districts ONLY when user edits state field (on-demand)
  const fetchDistrictsForState = useCallback(async (stateName: string) => {
    if (!stateName) {
      setDistrictOptions([]);
      setBlockOptions([]);
      return;
    }

    setIsLoadingDistricts(true);
    try {
      const stateObj = stateList.find(
        (s: any) => 
          s.label === stateName || 
          s.state_name === stateName ||
          s.value === stateName ||
          s.state_code === stateName
      );
      
      const stateCode = stateObj?.value || stateObj?.state_code || stateName;
      
      // Use cached version to prevent repeated API calls
      const districts = await getCachedDistricts(stateCode);
      
      const mapped = districts.map((d: any) => ({
        id: d.district_code || d.value || d.id,
        name: d.district_name || d.label || d.name
      }));
      
      setDistrictOptions(mapped);
    } catch (error) {
      console.error("Failed to fetch districts:", error);
      setDistrictOptions([]);
    } finally {
      setIsLoadingDistricts(false);
    }
  }, [stateList]);

  // ✅ FIXED: Fetch blocks ONLY when user edits district field (on-demand)
  const fetchBlocksForDistrict = useCallback(async (districtName: string) => {
    if (!districtName || districtOptions.length === 0) {
      setBlockOptions([]);
      return;
    }

    setIsLoadingBlocks(true);
    try {
      const districtObj = districtOptions.find(
        (d: any) => 
          d.name === districtName ||
          d.district_name === districtName
      );
      
      const districtCode = String(districtObj?.id || districtName);
      
      // Use cached version to prevent repeated API calls
      const blocks = await getCachedBlocks(districtCode);
      
      const mapped = blocks.map((b: any) => ({
        id: b.id || b.block_code || b.value,
        name: b.block_name || b.label || b.name
      }));
      
      setBlockOptions(mapped);
    } catch (error) {
      console.error("Failed to fetch blocks:", error);
      setBlockOptions([]);
    } finally {
      setIsLoadingBlocks(false);
    }
  }, [districtOptions]);

  const fullName =
    [applicant.first_name, applicant.middle_name, applicant.last_name]
      .filter(Boolean)
      .join(" ") ||
    applicant.name ||
    "No name";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLatestStatus = (applicant: any) => {
    // 0. Stage Status Mapping (Priority)
    if (applicant.stage_status_id) {
      const statusObj = (stageStatusList || []).find(
        (s) => Number(s.id) === Number(applicant.stage_status_id)
      );
      if (statusObj?.status_name) return statusObj.status_name;
    }

    // 0.1. Directly provided status
    if (applicant.status && typeof applicant.status === "string" && applicant.status !== "N/A") {
      return applicant.status;
    }

    // 0.2. Mapped current status name (from ApplicantTable)
    if (applicant.current_status_name && applicant.current_status_name !== "N/A") {
      return applicant.current_status_name;
    }

    // 0.3. Stage name fallback (especially for Onboarded)
    if (applicant.stage_name && (applicant.stage_name.toLowerCase() === "onboarded" || applicant.stage_name.toLowerCase() === "onboard")) {
      return "Onboarded";
    }

    // 1. Onboarding Status
    const onboardedStatus = applicant.onboarded_status || applicant.final_decisions?.[0]?.onboarded_status;
    if (onboardedStatus) return onboardedStatus;

    // 2. Offer Letter Status
    const offerStatus = applicant.offer_letter_status || applicant.final_decisions?.[0]?.offer_letter_status;
    if (offerStatus) return offerStatus;

    // 3. Cultural Fit Round
    const cfrRounds = applicant.interview_cultural_fit_round || [];
    if (cfrRounds.length > 0) {
      const lastCfr = cfrRounds[cfrRounds.length - 1];
      if (lastCfr?.cultural_fit_status) return lastCfr.cultural_fit_status;
    }

    // 4. Learning Round
    const learnerRounds = applicant.interview_learner_round || [];
    if (learnerRounds.length > 0) {
      const lastLr = learnerRounds[learnerRounds.length - 1];
      if (lastLr?.learning_round_status) return lastLr.learning_round_status;
    }

    // 5. Screening Round
    const examSessions = applicant.exam_sessions || [];
    if (examSessions.length > 0) {
      const lastSession = examSessions[examSessions.length - 1];
      if (lastSession?.status) return lastSession.status;
    }

    // 6. Final Fallback: Show stage name if available (e.g., "Sourcing")
    if (applicant.stage_name && applicant.stage_name !== "N/A") {
      return applicant.stage_name;
    }

    return "N/A";
  };

  // Helper function to format audit information
  const formatAuditInfo = (data: any) => {
    if (!data) return "N/A";

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    const parts = [];
    
    if (data.created_at) {
      parts.push(`Created: ${formatDate(data.created_at)}`);
    }
    
    if (data.updated_at) {
      parts.push(`Updated: ${formatDate(data.updated_at)}`);
    }
    
    // Check for various user field names
    const userName = data.last_updated_by || 
                     data.last_status_updated_by || 
                     data.created_by || 
                     data.updated_by ||
                     data.user_name ||
                     data.username;
    
    if (userName) {
      parts.push(`By: ${userName}`);
    }
    
    return parts.length > 0 ? parts.join('\n') : 'N/A';
  };

  return (
    <TableRow key={applicant.id}>
      {/* Checkbox */}
      {isColumnVisible('checkbox') && (
        <TableCell className="sticky left-0 z-30 bg-white w-12 px-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(applicant.id)}
            aria-label={`Select ${fullName}`}
          />
        </TableCell>
      )}

      {/* Profile Image */}
      {isColumnVisible('image') && (
        <TableCell className="w-12 px-2">
          <Avatar
            className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all"
            onClick={() => setShowImageModal(true)}
          >
            <AvatarImage
              src={applicant.image_url || applicant.image}
              alt={fullName}
            />
            <AvatarFallback className="text-xs">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
        </TableCell>
      )}

      {/* Full Name - Editable */}
      {isColumnVisible('name') && (
        <TableCell className="sticky left-10  bg-white z-20 min-w-[150px] max-w-[180px] px-2">
          <div className="truncate">
            <EditableCell
              applicant={applicant}
              field="first_name"
              displayValue={fullName}
              onUpdate={onUpdate}
              disabled={true}
            />
          </div>
        </TableCell>
      )}

      {/* Email */}
      {isColumnVisible('email') && (
        <TableCell className="min-w-[120px] max-w-[220px] px-2">
          <div className="truncate">
            <EditableCell
              applicant={applicant}
              field="email"
              displayValue={applicant.email || "No Email"}
              onUpdate={onUpdate}
              showPencil={hasEditAccess}
              showActionButtons={false}
              disabled={!hasEditAccess}
            />
          </div>
        </TableCell>
      )}

      {/* Phone Number */}
      {isColumnVisible('phone') && (
        <TableCell className="min-w-[110px] max-w-[130px] px-2">
          <div className="truncate">
            <EditableCell
              applicant={applicant}
              field="phone_number"
              displayValue={
                applicant.phone_number || applicant.mobile_no || "No phone"
              }
              onUpdate={onUpdate}
              showPencil={hasEditAccess}
              showActionButtons={false}
              disabled={!hasEditAccess}
            />
          </div>
        </TableCell>
      )}

      {/* WhatsApp Number */}
      {isColumnVisible('whatsapp') && (
        <TableCell className="min-w-[110px] max-w-[130px] px-2">
          <div className="truncate">
            <EditableCell
              applicant={applicant}
              field="whatsapp_number"
              displayValue={applicant.whatsapp_number || "No WhatsApp"}
              onUpdate={onUpdate}
              showPencil={hasEditAccess}
              showActionButtons={false}
              disabled={!hasEditAccess}
            />
          </div>
        </TableCell>
      )}

      {/* Gender */}
      {isColumnVisible('gender') && (
        <TableCell className="min-w-[80px] max-w-[100px] px-2">
          <EditableCell
            applicant={applicant}
            field="gender"
            displayValue={applicant.gender || "N/A"}
            options={[
              { id: "male", name: "Male" },
              { id: "female", name: "Female" },
              { id: "other", name: "Other" },
            ]}
            onUpdate={onUpdate}
            forceTextDisplay={true}
            showPencil={hasEditAccess}
            showActionButtons={false}
            disabled={!hasEditAccess}
          />
        </TableCell>
      )}

      {/* DOB */}
      {isColumnVisible('dob') && (
        <TableCell className="min-w-[100px] max-w-[120px] px-2">
          <div className="truncate">
            <EditableCell
              applicant={applicant}
              field="dob"
              displayValue={applicant.dob && applicant.dob !== "N/A" && !isNaN(new Date(applicant.dob).getTime()) 
                ? new Date(applicant.dob).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) 
                : "N/A"}
              onUpdate={onUpdate}
              showPencil={hasEditAccess}
              showActionButtons={true}
              disabled={!hasEditAccess}
            />
          </div>
        </TableCell>
      )}

      {/* State */}
      {isColumnVisible('state') && (
        <TableCell className="min-w-[140px] px-2">
          <EditableCell
            applicant={applicant}
            field="state"
            displayValue={applicant.state || "Not specified"}
            onUpdate={(newState) => {
              // When state changes, fetch districts for the new state
              if (newState && newState !== applicant.state) {
                fetchDistrictsForState(newState);
              }
              onUpdate();
            }}
            onEditStart={() => ensureFieldDataLoaded?.('state')}
            isLoadingOptions={isLoadingReferenceData}
            options={stateList.map((s: any) => ({ 
              id: s.state_code || s.value || s.id, 
              name: s.state_name || s.label || s.name 
            }))}
            forceTextDisplay={true}
            showPencil={false}
            showActionButtons={false}
            disabled={true}
            tooltipMessage="Update state from Applicant Details view"
          />
        </TableCell>
      )}

      {/* District */}
      {isColumnVisible('district') && (
        <TableCell className="min-w-[140px] px-2">
          <EditableCell
            applicant={applicant}
            field="district"
            displayValue={isLoadingDistricts ? "Loading..." : (applicant.district || "N/A")}
            onUpdate={(newDistrict) => {
              // When district changes, fetch blocks for the new district
              if (newDistrict && newDistrict !== applicant.district) {
                fetchBlocksForDistrict(newDistrict);
              }
              onUpdate();
            }}
            onEditStart={() => {
              // Fetch districts when user starts editing (if not already loaded)
              if (applicant.state && districtOptions.length === 0) {
                fetchDistrictsForState(applicant.state);
              }
            }}
            isLoadingOptions={isLoadingDistricts}
            options={districtOptions}
            forceTextDisplay={true}
            showPencil={false}
            showActionButtons={false}
            disabled={true}
            tooltipMessage="Update district from Applicant Details view"
            placeholder={!applicant.state ? "Select state first" : "Select district"}
          />
        </TableCell>
      )}

      {/* Block */}
      {isColumnVisible('block') && (
        <TableCell className="min-w-[140px] px-2">
          <EditableCell
            applicant={applicant}
            field="block"
            displayValue={isLoadingBlocks ? "Loading..." : (applicant.block || "N/A")}
            onUpdate={onUpdate}
            onEditStart={() => {
              // Fetch blocks when user starts editing (if not already loaded)
              if (applicant.district && blockOptions.length === 0) {
                fetchBlocksForDistrict(applicant.district);
              }
            }}
            isLoadingOptions={isLoadingBlocks}
            options={blockOptions}
            forceTextDisplay={true}
            showPencil={false}
            showActionButtons={false}
            disabled={true}
            tooltipMessage="Update block from Applicant Details view"
            placeholder={!applicant.district ? "Select district first" : "Select block"}
          />
        </TableCell>
      )}

      {/* Pincode */}
      {isColumnVisible('pincode') && (
        <TableCell className="min-w-[80px] max-w-[100px] px-2">
          <div className="truncate">
            <EditableCell
              applicant={applicant}
              field="pin_code"
              displayValue={applicant.pin_code || "N/A"}
              onUpdate={onUpdate}
              showPencil={hasEditAccess}
              showActionButtons={false}
              disabled={!hasEditAccess}
            />
          </div>
        </TableCell>
      )}

      {/* Cast */}
      {isColumnVisible('cast') && (
        <TableCell className="min-w-[100px] max-w-[120px] px-2">
          <EditableCell
            applicant={applicant}
            field="cast_id"
            displayValue={applicant.cast_name || castList.find((c) => c.id === applicant.cast_id)?.cast_name || "N/A"}
            value={applicant.cast_id}
            onUpdate={onUpdate}
            onEditStart={() => ensureFieldDataLoaded?.('cast_id')}
            isLoadingOptions={isLoadingReferenceData}
            options={castList.map((c) => ({ id: c.id, name: c.cast_name }))}
            forceTextDisplay={true}
            showPencil={hasEditAccess}
            showActionButtons={false}
            disabled={!hasEditAccess}
          />
        </TableCell>
      )}

      {/* Religion */}
      {isColumnVisible('religion') && (
        <TableCell className="min-w-[100px] max-w-[120px] px-2">
          <EditableCell
            applicant={applicant}
            field="religion_id"
            displayValue={applicant.religion_name || "N/A"}
            value={applicant.religion_id}
            onUpdate={onUpdate}
            onEditStart={() => ensureFieldDataLoaded?.('religion_id')}
            isLoadingOptions={isLoadingReferenceData}
            options={religionList.map((r) => ({ id: r.id, name: r.religion_name }))}
            forceTextDisplay={true}
            showPencil={hasEditAccess}
            showActionButtons={false}
            disabled={!hasEditAccess}
          />
        </TableCell>
      )}

      {/* Qualification */}
      {isColumnVisible('qualification') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <EditableCell
            applicant={applicant}
            field="qualification_id"
            displayValue={applicant.qualification_name || qualificationList.find((q) => q.id === applicant.qualification_id)?.qualification_name || "N/A"}
            value={applicant.qualification_id}
            onUpdate={onUpdate}
            onEditStart={() => ensureFieldDataLoaded?.('qualification_id')}
            isLoadingOptions={isLoadingReferenceData}
            options={qualificationList.map((q) => ({ id: q.id, name: q.qualification_name }))}
            forceTextDisplay={true}
            showPencil={hasEditAccess}
            showActionButtons={false}
            disabled={!hasEditAccess}
          />
        </TableCell>
      )}

      {/* Current Status */}
      {isColumnVisible('current_status') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          {applicant.current_status_name ? (
            <EditableCell
              applicant={applicant}
              field="current_status_id"
              displayValue={applicant.current_status_name}
              value={applicant.current_status_id}
              onUpdate={onUpdate}
              onEditStart={() => ensureFieldDataLoaded?.('current_status_id')}
              isLoadingOptions={isLoadingReferenceData}
              options={currentstatusList.map((s) => ({ id: s.id, name: s.current_status_name }))}
              forceTextDisplay={true}
              showPencil={hasEditAccess}
              showActionButtons={false}
              disabled={!hasEditAccess}
            />
          ) : (
            <div className="text-muted-foreground text-sm">-</div>
          )}
        </TableCell>
      )}
       {/* Status - Display stage_name directly */}
      {isColumnVisible('status') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate text-sm cursor-help opacity-70">
                  {applicant.stage_name || "N/A"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stage: {applicant.stage_name || "Not Set"}</p>
                <p className="text-xs text-muted-foreground mt-1">Update stage from Applicant Details view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {/* Campus */}
      {isColumnVisible('campus') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <EditableCell
            applicant={applicant}
            field="campus_id"
            displayValue={applicant.campus_name || "N/A"}
            value={applicant.campus_id}
            onUpdate={onUpdate}
            onEditStart={() => ensureFieldDataLoaded?.('campus_id')}
            isLoadingOptions={isLoadingReferenceData}
            options={campusList.map((c) => ({ id: c.id, name: c.campus_name }))}
            forceTextDisplay={true}
            showPencil={hasEditAccess}
            showActionButtons={false}
            disabled={!hasEditAccess}
            tooltipMessage="Current stage update by student details"
          />
        </TableCell>
      )}

      {/* Partner */}
      {isColumnVisible('partner') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <EditableCell
            applicant={applicant}
            field="partner_id"
            displayValue={
              applicant.partner_name || 
              applicant.partner?.partner_name || 
              partnerList.find((p) => p.id === applicant.partner_id)?.partner_name || 
              "N/A"
            }
            value={applicant.partner_id}
            onUpdate={onUpdate}
            onEditStart={() => ensureFieldDataLoaded?.('partner_id')}
            isLoadingOptions={isLoadingReferenceData}
            options={partnerList.map((p) => ({ id: p.id, name: p.partner_name }))}
            forceTextDisplay={true}
            showPencil={hasEditAccess}
            showActionButtons={false}
            disabled={!hasEditAccess}
          />
        </TableCell>
      )}

      {/* Donor */}
      {isColumnVisible('donor') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <EditableCell
            applicant={applicant}
            field="donor_id"
            displayValue={
              applicant.donor_name || 
              applicant.donor?.donor_name || 
              donorList.find((d) => d.id === applicant.donor_id)?.donor_name || 
              "N/A"
            }
            value={applicant.donor_id}
            onUpdate={onUpdate}
            onEditStart={() => ensureFieldDataLoaded?.('donor_id')}
            isLoadingOptions={isLoadingReferenceData}
            options={donorList.map((d) => ({ id: d.id, name: d.donor_name }))}
            forceTextDisplay={true}
            showPencil={hasEditAccess}
            showActionButtons={false}
            disabled={!hasEditAccess}
          />
        </TableCell>
      )}

      {/* Qualifying School */}
      {isColumnVisible('school') && (
        <TableCell className="min-w-[140px] max-w-[180px] px-2">
          <EditableCell
            applicant={applicant}
            field="school_id"
            displayValue={applicant.school_name || "N/A"}
            value={applicant.school_id}
            onUpdate={onUpdate}
            onEditStart={() => ensureFieldDataLoaded?.('school_id')}
            isLoadingOptions={isLoadingReferenceData}
            options={schoolList.map((s) => ({ id: s.id, name: s.school_name }))}
            forceTextDisplay={true}
            showPencil={hasEditAccess}
            showActionButtons={false}
            disabled={!hasEditAccess}
          />
        </TableCell>
      )}

      {/* Screening Round Fields */}
      {isColumnVisible('screening_status') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-not-allowed opacity-70">
                  {applicant.exam_sessions?.[0]?.status || "N/A"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {isColumnVisible('screening_obtained_marks') && (
        <TableCell className="min-w-[100px] max-w-[120px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-not-allowed opacity-70">
                  {applicant.exam_sessions?.[0]?.obtained_marks ?? "N/A"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {isColumnVisible('screening_exam_centre') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-not-allowed opacity-70">
                  {applicant.exam_sessions?.[0]?.exam_centre || "N/A"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {isColumnVisible('screening_audit') && (
        <TableCell className="min-w-[200px] max-w-[250px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-not-allowed opacity-70 text-xs whitespace-pre-line">
                  {formatAuditInfo(applicant.exam_sessions?.[0])}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {/* Learning Round Fields */}
      {isColumnVisible('lr_status') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-not-allowed opacity-70">
                  {(() => {
                    // Check if there's an interview result
                    const result = applicant.interview_learner_round?.[0]?.learning_round_status;
                    if (result) return result;
                    
                    // Check if there are scheduled interviews
                    const schedules = applicant.interview_schedules_lr || [];
                    const activeSchedule = schedules.find((s: any) => 
                      s.status?.toLowerCase() === 'scheduled' || s.status?.toLowerCase() === 'rescheduled'
                    );
                    if (activeSchedule) {
                      return activeSchedule.status?.toLowerCase() === 'rescheduled' ? 'Rescheduled' : 'Scheduled';
                    }
                    
                    return "Not Scheduled";
                  })()}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {isColumnVisible('lr_comments') && (
        <TableCell className="min-w-[150px] max-w-[200px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-not-allowed opacity-70">
                  {applicant.interview_learner_round?.[0]?.comments || "N/A"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {isColumnVisible('lr_audit') && (
        <TableCell className="min-w-[200px] max-w-[250px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-not-allowed opacity-70 text-xs whitespace-pre-line">
                  {formatAuditInfo(applicant.interview_learner_round?.[0])}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {/* CFR Round Fields */}
      {isColumnVisible('cfr_status') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-not-allowed opacity-70">
                  {(() => {
                    // Check if there's an interview result
                    const result = applicant.interview_cultural_fit_round?.[0]?.cultural_fit_status;
                    if (result) return result;
                    
                    // Check if there are scheduled interviews
                    const schedules = applicant.interview_schedules_cfr || [];
                    const activeSchedule = schedules.find((s: any) => 
                      s.status?.toLowerCase() === 'scheduled' || s.status?.toLowerCase() === 'rescheduled'
                    );
                    if (activeSchedule) {
                      return activeSchedule.status?.toLowerCase() === 'rescheduled' ? 'Rescheduled' : 'Scheduled';
                    }
                    
                    return "Not Scheduled";
                  })()}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {isColumnVisible('cfr_comments') && (
        <TableCell className="min-w-[150px] max-w-[200px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-not-allowed opacity-70">
                  {applicant.interview_cultural_fit_round?.[0]?.comments || "N/A"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {isColumnVisible('cfr_audit') && (
        <TableCell className="min-w-[200px] max-w-[250px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-not-allowed opacity-70 text-xs whitespace-pre-line">
                  {formatAuditInfo(applicant.interview_cultural_fit_round?.[0])}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {/* Final Decision Fields */}
      {isColumnVisible('offer_letter_status') && (
        <TableCell className="min-w-[140px] max-w-[180px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-not-allowed opacity-70">
                  {applicant.final_decisions?.[0]?.offer_letter_status || "N/A"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {isColumnVisible('onboarded_status') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-not-allowed opacity-70">
                  {applicant.final_decisions?.[0]?.onboarded_status || "N/A"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {isColumnVisible('final_notes') && (
        <TableCell className="min-w-[150px] max-w-[200px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-not-allowed opacity-70">
                  {applicant.final_decisions?.[0]?.final_notes || "N/A"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {isColumnVisible('joining_date') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-not-allowed opacity-70">
                  {applicant.final_decisions?.[0]?.joining_date
                    ? new Date(applicant.final_decisions[0].joining_date).toLocaleDateString()
                    : "N/A"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {isColumnVisible('offer_sent_by') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="truncate cursor-not-allowed opacity-70">
                  {applicant.final_decisions?.[0]?.offer_letter_sent_by || "N/A"}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {isColumnVisible('offer_audit') && (
        <TableCell className="min-w-[200px] max-w-[250px] px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-not-allowed opacity-70 text-xs whitespace-pre-line">
                  {formatAuditInfo(applicant.final_decisions?.[0])}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>To update, please use detail view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}

      {/* Communication Notes */}
      {isColumnVisible('notes') && (
       
         
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <div className="truncate text-sm">
            {applicant.communication_notes || "N/A"}
          </div>
        </TableCell>
      )}

      {/* Created At */}
      {isColumnVisible('created_at') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <div className="truncate text-sm">
            {applicant.created_at ? new Date(applicant.created_at).toLocaleDateString() : "N/A"}
          </div>
        </TableCell>
      )}

      {/* Updated At */}
      {isColumnVisible('updated_at') && (
        <TableCell className="min-w-[120px] max-w-[150px] px-2">
          <div className="truncate text-sm">
            {applicant.updated_at ? new Date(applicant.updated_at).toLocaleDateString() : "N/A"}
          </div>
        </TableCell>
      )}

      {/* Actions - Dropdown menu (... button) */}
      {isColumnVisible('actions') && (
        <TableCell className="w-16 px-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="bottom"
              sideOffset={5}
              className="bg-background border border-border shadow-lg z-50"
            >
              <DropdownMenuItem onClick={() => onViewDetails(applicant)}>
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}

      {/* Image Preview Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{fullName}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center p-4">
            {applicant.image_url || applicant.image ? (
              <img
                src={applicant.image_url || applicant.image}
                alt={fullName}
                className="max-w-full max-h-[500px] rounded-lg object-contain"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-4xl text-gray-400">
                  {getInitials(fullName)}
                </span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TableRow>
  );
};
