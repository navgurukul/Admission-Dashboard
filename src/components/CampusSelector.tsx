import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { updateApplicant } from "@/utils/localStorage";

interface CampusOption {
  id: string;
  name: string;
  is_active: boolean;
}

interface CampusSelectorProps {
  currentCampus: string | null;
  applicantId: string;
  onCampusChange?: (campus: string | null) => void;
}

export function CampusSelector({
  currentCampus,
  applicantId,
  onCampusChange,
}: CampusSelectorProps) {
  const [campusOptions, setCampusOptions] = useState<CampusOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCampusOptions();
  }, []);

  const fetchCampusOptions = async () => {
    try {
      // const { data, error } = await supabase
      //   .from('campus_options')
      //   .select('*')
      //   .eq('is_active', true)
      //   .order('name');
      // if (error) throw error;
      // setCampusOptions(data || []);
    } catch (error) {
      console.error("Error fetching campus options:", error);
    }
  };

  const handleCampusChange = async (campusName: string) => {
    if (campusName === "unassigned") {
      campusName = null as any;
    }

    setLoading(true);
    try {
      // Save to localStorage first
      updateApplicant(applicantId, { campus: campusName });

      // Also save to Supabase for persistence
      const { error } = await supabase
        .from("admission_dashboard")
        .update({
          campus: campusName,
          last_updated: new Date().toISOString(),
        })
        .eq("id", applicantId);

      if (error) {
        console.warn(
          "Supabase update failed, but data saved to localStorage:",
          error,
        );
      }

      toast({
        title: "✅ Campus Updated",
        description: `Campus ${campusName ? `updated to ${campusName}` : "cleared"} successfully`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });

      // Immediately update the UI
      onCampusChange?.(campusName);
    } catch (error) {
      console.error("Error updating campus:", error);
      toast({
        title: "❌ Unable to Update Campus",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={
        currentCampus && currentCampus !== "" ? currentCampus : "unassigned"
      }
      onValueChange={handleCampusChange}
      disabled={loading}
    >
      <SelectTrigger className="w-32 h-8 text-xs">
        <SelectValue placeholder="Select campus" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Not assigned</SelectItem>
        {campusOptions.map((campus) => (
          <SelectItem key={campus.id} value={campus.name || campus.id}>
            {campus.name || "Unnamed Campus"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
