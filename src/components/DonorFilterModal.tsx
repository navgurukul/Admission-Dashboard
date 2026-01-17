import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DonorFilterState {
  city: string;
  state: string;
  country: string;
}

interface DonorFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: DonorFilterState) => void;
  currentFilters: DonorFilterState;
  donors: any[];
}

export function DonorFilterModal({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  donors,
}: DonorFilterModalProps) {
  const [filters, setFilters] = useState<DonorFilterState>(currentFilters);
  
  // Extract unique values from donors for filter options
  const [filterOptions, setFilterOptions] = useState({
    cities: [] as string[],
    states: [] as string[],
    countries: [] as string[],
  });

  useEffect(() => {
    // Extract unique cities, states, and countries from donors
    const cities = new Set<string>();
    const states = new Set<string>();
    const countries = new Set<string>();

    donors.forEach((donor) => {
      if (donor.donor_city) cities.add(donor.donor_city);
      if (donor.donor_state) states.add(donor.donor_state);
      if (donor.donor_country) countries.add(donor.donor_country);
    });

    setFilterOptions({
      cities: Array.from(cities).sort(),
      states: Array.from(states).sort(),
      countries: Array.from(countries).sort(),
    });
  }, [donors]);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters, isOpen]);

  useEffect(() => {
    console.log("DonorFilterModal - isOpen changed to:", isOpen);
  }, [isOpen]);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: DonorFilterState = {
      city: "all",
      state: "all",
      country: "all",
    };
    setFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.city && filters.city !== "all") count++;
    if (filters.state && filters.state !== "all") count++;
    if (filters.country && filters.country !== "all") count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Filter Donors
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount} active
                </Badge>
              )}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Country Filter */}
          <div className="space-y-2">
            <Label htmlFor="country-filter" className="text-sm font-medium">
              Country
            </Label>
            <Select
              value={filters.country}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, country: value }))
              }
            >
              <SelectTrigger id="country-filter">
                <SelectValue placeholder="Select country..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {filterOptions.countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* State Filter */}
          <div className="space-y-2">
            <Label htmlFor="state-filter" className="text-sm font-medium">
              State
            </Label>
            <Select
              value={filters.state}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, state: value }))
              }
            >
              <SelectTrigger id="state-filter">
                <SelectValue placeholder="Select state..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {filterOptions.states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City Filter */}
          <div className="space-y-2">
            <Label htmlFor="city-filter" className="text-sm font-medium">
              City
            </Label>
            <Select
              value={filters.city}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, city: value }))
              }
            >
              <SelectTrigger id="city-filter">
                <SelectValue placeholder="Select city..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {filterOptions.cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Active Filters:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 text-xs"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.country && filters.country !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Country: {filters.country}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, country: "all" }))
                      }
                    />
                  </Badge>
                )}
                {filters.state && filters.state !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    State: {filters.state}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, state: "all" }))
                      }
                    />
                  </Badge>
                )}
                {filters.city && filters.city !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    City: {filters.city}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, city: "all" }))
                      }
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply Filters
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
