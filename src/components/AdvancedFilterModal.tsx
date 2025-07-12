
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Save, Filter } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface FilterState {
  stage: string;
  status: string;
  examMode: string;
  interviewMode: string;
  partner: string[];
  district: string[];
  market: string[];
  dateRange: {
    type: 'application' | 'lastUpdate' | 'interview';
    from?: Date;
    to?: Date;
  };
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterState) => void;
  currentFilters: FilterState;
}

const STAGE_STATUS_MAP = {
  contact: [],
  screening: ['pass', 'fail', 'pending'],
  interviews: ['booked', 'pending', 'rescheduled', 'lr_qualified', 'lr_failed', 'cfr_qualified', 'cfr_failed'],
  decision: ['offer_pending', 'offer_sent', 'offer_rejected', 'offer_accepted']
};

export function AdvancedFilterModal({ isOpen, onClose, onApplyFilters, currentFilters }: AdvancedFilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters);
  const [presetName, setPresetName] = useState("");
  const [savedPresets, setSavedPresets] = useState<any[]>([]);
  const [availableOptions, setAvailableOptions] = useState({
    partners: [] as string[],
    districts: [] as string[],
    markets: [] as string[]
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSavedPresets();
      loadAvailableOptions();
    }
  }, [isOpen]);

  const loadSavedPresets = async () => {
    try {
      const { data, error } = await supabase
        .from('filter_presets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedPresets(data || []);
    } catch (error) {
      console.error('Error loading presets:', error);
    }
  };

  const loadAvailableOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('admission_dashboard')
        .select('partner, district, market');

      if (error) throw error;

      const partners = [...new Set(data?.map(d => d.partner).filter(Boolean))] as string[];
      const districts = [...new Set(data?.map(d => d.district).filter(Boolean))] as string[];
      const markets = [...new Set(data?.map(d => d.market).filter(Boolean))] as string[];

      setAvailableOptions({ partners, districts, markets });
    } catch (error) {
      console.error('Error loading options:', error);
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a preset name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('filter_presets')
        .insert({
          name: presetName,
          filters: filters as any, // Cast to any to satisfy Json type
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Filter preset saved successfully",
      });

      setPresetName("");
      loadSavedPresets();
    } catch (error) {
      console.error('Error saving preset:', error);
      toast({
        title: "Error",
        description: "Failed to save preset",
        variant: "destructive",
      });
    }
  };

  const handleLoadPreset = (preset: any) => {
    setFilters(preset.filters);
  };

  const handleMultiSelectChange = (field: 'partner' | 'district' | 'market', value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const resetFilters = () => {
    setFilters({
      stage: '',
      status: '',
      examMode: '',
      interviewMode: '',
      partner: [],
      district: [],
      market: [],
      dateRange: { type: 'application' }
    });
  };

  const availableStatuses = filters.stage ? STAGE_STATUS_MAP[filters.stage as keyof typeof STAGE_STATUS_MAP] || [] : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stage & Status */}
          <div className="space-y-4">
            <h3 className="font-semibold">Stage & Status</h3>
            
            <div>
              <Label>Stage</Label>
              <Select value={filters.stage} onValueChange={(value) => setFilters(prev => ({ ...prev, stage: value, status: '' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Stages</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interviews">Interviews</SelectItem>
                  <SelectItem value="decision">Decision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {availableStatuses.length > 0 && (
              <div>
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    {availableStatuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Mode Filters */}
          <div className="space-y-4">
            <h3 className="font-semibold">Mode</h3>
            
            <div>
              <Label>Exam Mode</Label>
              <Select value={filters.examMode} onValueChange={(value) => setFilters(prev => ({ ...prev, examMode: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Modes</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Interview Mode</Label>
              <Select value={filters.interviewMode} onValueChange={(value) => setFilters(prev => ({ ...prev, interviewMode: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interview mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Modes</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Multi-select filters */}
          <div className="space-y-4">
            <h3 className="font-semibold">Partner</h3>
            <div className="max-h-32 overflow-y-auto border rounded p-2">
              {availableOptions.partners.map(partner => (
                <div key={partner} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={`partner-${partner}`}
                    checked={filters.partner.includes(partner)}
                    onCheckedChange={(checked) => handleMultiSelectChange('partner', partner, !!checked)}
                  />
                  <Label htmlFor={`partner-${partner}`} className="text-sm">{partner}</Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">District</h3>
            <div className="max-h-32 overflow-y-auto border rounded p-2">
              {availableOptions.districts.map(district => (
                <div key={district} className="flex items-center space-x-2 py-1">
                  <Checkbox
                    id={`district-${district}`}
                    checked={filters.district.includes(district)}
                    onCheckedChange={(checked) => handleMultiSelectChange('district', district, !!checked)}
                  />
                  <Label htmlFor={`district-${district}`} className="text-sm">{district}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-4 col-span-full">
            <h3 className="font-semibold">Date Range</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Date Type</Label>
                <Select 
                  value={filters.dateRange.type} 
                  onValueChange={(value: 'application' | 'lastUpdate' | 'interview') => 
                    setFilters(prev => ({ ...prev, dateRange: { ...prev.dateRange, type: value } }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application">Application Date</SelectItem>
                    <SelectItem value="lastUpdate">Last Update</SelectItem>
                    <SelectItem value="interview">Interview Date</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? format(filters.dateRange.from, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.from}
                      onSelect={(date) => setFilters(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, from: date } 
                      }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.to ? format(filters.dateRange.to, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.to}
                      onSelect={(date) => setFilters(prev => ({ 
                        ...prev, 
                        dateRange: { ...prev.dateRange, to: date } 
                      }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Save Preset */}
          <div className="space-y-4 col-span-full">
            <h3 className="font-semibold">Save Filter Preset</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter preset name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
              <Button onClick={handleSavePreset} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>
            </div>

            {savedPresets.length > 0 && (
              <div>
                <Label>Load Saved Preset</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {savedPresets.map(preset => (
                    <Button
                      key={preset.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadPreset(preset)}
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={resetFilters}>
            Reset All
          </Button>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => { onApplyFilters(filters); onClose(); }}>
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
