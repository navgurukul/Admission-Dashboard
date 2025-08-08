
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

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

export function CampusSelector({ currentCampus, applicantId, onCampusChange }: CampusSelectorProps) {
  const [campusOptions, setCampusOptions] = useState<CampusOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCampusOptions();
  }, []);

  const fetchCampusOptions = async () => {
    // For now, use some default campus options since we're in localStorage mode
    const defaultCampusOptions = [
      { id: '1', name: 'Delhi', is_active: true },
      { id: '2', name: 'Mumbai', is_active: true },
      { id: '3', name: 'Bangalore', is_active: true },
      { id: '4', name: 'Chennai', is_active: true },
      { id: '5', name: 'Kolkata', is_active: true },
    ];
    setCampusOptions(defaultCampusOptions);
  };

  const handleCampusChange = async (campusName: string) => {
    if (campusName === 'unassigned') {
      campusName = null as any;
    }

    setLoading(true);
    try {
      // Get current data from localStorage
      const storedData = localStorage.getItem("applicants");
      let allData = [];
      
      if (storedData) {
        allData = JSON.parse(storedData);
      }
      
      // Find and update the specific applicant
      const updatedData = allData.map((applicant: any) => {
        if (applicant.id === applicantId) {
          return {
            ...applicant,
            campus: campusName,
            last_updated: new Date().toISOString()
          };
        }
        return applicant;
      });
      
      // Save back to localStorage
      localStorage.setItem("applicants", JSON.stringify(updatedData));

      toast({
        title: "Success",
        description: `Campus ${campusName ? `updated to ${campusName}` : 'cleared'}`,
      });

      onCampusChange?.(campusName);
    } catch (error) {
      console.error('Error updating campus:', error);
      toast({
        title: "Error",
        description: "Failed to update campus",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={currentCampus || 'unassigned'}
      onValueChange={handleCampusChange}
      disabled={loading}
    >
      <SelectTrigger className="w-32 h-8 text-xs">
        <SelectValue placeholder="Select campus" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">Not assigned</SelectItem>
        {campusOptions.map((campus) => (
          <SelectItem key={campus.id} value={campus.name}>
            {campus.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
