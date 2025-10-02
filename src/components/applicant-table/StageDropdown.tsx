
// import React from "react";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { supabase } from "@/integrations/supabase/client";
// import { useToast } from "@/hooks/use-toast";
// import { STAGE_DEFAULT_STATUS } from "./StatusDropdown";
// import { updateApplicant } from "@/utils/localStorage";

// interface StageDropdownProps {
//   applicant: any;
//   onUpdate: () => void;
// }

// const STAGE_OPTIONS = [
//   { value: "sourcing", label: "Sourcing" },
//   { value: "screening", label: "Screening" },
// ];

// const StageDropdown = ({ applicant, onUpdate }: StageDropdownProps) => {
//   const { toast } = useToast();

//   const handleStageChange = async (value: string) => {
//     console.log('Changing stage to:', value);
//     try {
//       const defaultStatus = STAGE_DEFAULT_STATUS[value as keyof typeof STAGE_DEFAULT_STATUS];
//       console.log('Setting default status to:', defaultStatus);
      
//       // Save to localStorage first
//       updateApplicant(applicant.id, { 
//         stage: value,
//         status: defaultStatus 
//       });

//       // Also save to Supabase for persistence
//       const { error } = await supabase
//         .from("admission_dashboard")
//         .update({ 
//           stage: value,
//           status: defaultStatus,
//           last_updated: new Date().toISOString()
//         })
//         .eq("id", applicant.id);

//       if (error) {
//         console.warn('Supabase update failed, but data saved to localStorage:', error);
//       }

//       toast({
//         title: "Stage Updated",
//         description: "Stage updated and saved to localStorage",
//       });
//       // Immediately update the UI
//       onUpdate();
//     } catch (error) {
//       console.error('Error updating stage:', error);
//       toast({
//         title: "Error",
//         description: "Failed to update stage",
//         variant: "destructive",
//       });
//     }
//   };

//   const currentStage = applicant.stage || "sourcing";
//   console.log('Current stage:', currentStage);

//   return (
//     <Select
//       value={currentStage}
//       onValueChange={handleStageChange}
//     >
//       <SelectTrigger className="w-full h-8 text-xs bg-background border border-border">
//         <SelectValue placeholder="Select a stage" />
//       </SelectTrigger>
//       <SelectContent className="bg-background border border-border shadow-lg z-50">
//         {STAGE_OPTIONS.map((option) => (
//           <SelectItem 
//             key={option.value} 
//             value={option.value}
//             className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground"
//           >
//             {option.label}
//           </SelectItem>
//         ))}
//       </SelectContent>
//     </Select>
//   );
// };

// // export default React.memo(StageDropdown);
// import React from "react";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { useToast } from "@/hooks/use-toast";
// import { STAGE_DEFAULT_STATUS } from "./StatusDropdown";

// interface StageDropdownProps {
//   applicant: any;
//   onUpdate: () => void; // ye tum ApplicantTableRow se already pass kar rahe ho
// }

// // Sirf 2 stage rakhne hain abhi
// const STAGE_OPTIONS = [
//   { value: "cultural_fit", label: "Cultural Fit Interview Pass" },
//   { value: "screening", label: "Screening" },
// ];

// const StageDropdown = ({ applicant, onUpdate }: StageDropdownProps) => {
//   const { toast } = useToast();

//   const handleStageChange = async (value: string) => {
//     console.log("Changing stage to:", value);

//     try {
//       const defaultStatus =
//         STAGE_DEFAULT_STATUS[value as keyof typeof STAGE_DEFAULT_STATUS];

//       // yaha tumhari API call function ko use karo (jo EditableCell me bhi use hota hai)
//        onUpdate();

//       toast({
//         title: "Stage Updated",
//         description: `Stage set to ${value}, status set to ${defaultStatus}`,
//       });
//     } catch (error) {
//       console.error("Error updating stage:", error);
//       toast({
//         title: "Error",
//         description: "Failed to update stage",
//         variant: "destructive",
//       });
//     }
//   };

//   const currentStage = applicant.stage || "cultural_fit";

//   return (
//     <Select
//       value={currentStage}
//       onValueChange={(value) => handleStageChange(value)} // yaha explicit value pass
//     >
//       <SelectTrigger className="w-full h-8 text-xs bg-background border border-border">
//         <SelectValue placeholder="Select a stage" />
//       </SelectTrigger>
//       <SelectContent className="bg-background border border-border shadow-lg z-50">
//         {STAGE_OPTIONS.map((option) => (
//           <SelectItem
//             key={option.value}
//             value={option.value}
//             className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground"
//           >
//             {option.label}
//           </SelectItem>
//         ))}
//       </SelectContent>
//     </Select>
//   );
// };

// export default React.memo(StageDropdown);



import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateStudent } from "@/utils/api";
import { STAGE_DEFAULT_STATUS } from "./StatusDropdown";

interface StageDropdownProps {
  applicant: any;
  onUpdate: () => void;
}

const STAGE_OPTIONS = [
  { value: "Cultural Fit Interview Pass", label: "Cultural Fit Interview Pass" },
  { value: "screening", label: "Screening" },
];

const StageDropdown = ({ applicant, onUpdate }: StageDropdownProps) => {
  const { toast } = useToast();

  const handleStageChange = async (value: string) => {
    console.log('Changing stage to:', value);
    try {
      const defaultStatus = STAGE_DEFAULT_STATUS[value as keyof typeof STAGE_DEFAULT_STATUS];
      console.log('Setting default status to:', defaultStatus);
      
      // Update via API
      await updateStudent(applicant.id, { 
        stage: value,
        status: defaultStatus 
      });

      toast({
        title: "Stage Updated",
        description: `Stage changed to ${value}`,
      });
      
      // Refresh UI
      onUpdate();
    } catch (error) {
      console.error('Error updating stage:', error);
      toast({
        title: "Error",
        description: "Failed to update stage",
        variant: "destructive",
      });
    }
  };

  const currentStage = applicant.stage || "screening";
  console.log('Current stage:', currentStage);

  return (
    <Select
      value={currentStage}
      onValueChange={handleStageChange}
    >
      <SelectTrigger className="w-full h-8 text-xs bg-white border border-gray-300">
        <SelectValue placeholder="Select a stage" />
      </SelectTrigger>
      <SelectContent className="bg-white border border-gray-300 shadow-lg z-50">
        {STAGE_OPTIONS.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="text-xs cursor-pointer hover:bg-gray-100"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default React.memo(StageDropdown);