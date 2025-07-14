
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StageDropdownProps {
  applicant: any;
  onUpdate: () => void;
}

export const StageDropdown = ({ applicant, onUpdate }: StageDropdownProps) => {
  const { toast } = useToast();

  const handleStageChange = async (value: string) => {
    const { error } = await supabase
      .from("admission_dashboard")
      .update({ 
        stage: value,
        status: null,
        last_updated: new Date().toISOString()
      })
      .eq("id", applicant.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update stage",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Stage Updated",
        description: "Successfully updated stage",
      });
      onUpdate();
    }
  };

  return (
    <Select
      value={applicant.stage || "sourcing"}
      onValueChange={handleStageChange}
    >
      <SelectTrigger className="w-full h-8 text-xs">
        <SelectValue placeholder="Select a stage" />
      </SelectTrigger>
      <SelectContent className="bg-background border border-border shadow-lg z-50">
        <SelectItem value="sourcing">Sourcing</SelectItem>
        <SelectItem value="screening">Screening</SelectItem>
        <SelectItem value="interviews">Interviews</SelectItem>
        <SelectItem value="decision">Final Decision</SelectItem>
        <SelectItem value="onboarded">Onboarded</SelectItem>
      </SelectContent>
    </Select>
  );
};
