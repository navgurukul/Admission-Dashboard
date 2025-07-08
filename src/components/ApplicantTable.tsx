import { useState } from "react";
import { Search, Filter, Plus, MoreHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "./StatusBadge";
import { ApplicantModal } from "./ApplicantModal";

// Mock data - in real app this would come from API/database
const mockApplicants = [
  {
    id: "NGK001",
    name: "Priya Sharma",
    phone: "+91 9876543210",
    city: "Mumbai",
    state: "Maharashtra",
    partnerNgo: "Teach for India",
    currentStage: "Screening",
    currentStatus: "screening-test-pass" as const,
    assignedTo: "Admin User",
    lastInteraction: "2 hours ago",
    examScore: 16,
    qualifiedProgram: "School of Programming"
  },
  {
    id: "NGK002", 
    name: "Rajesh Kumar",
    phone: "+91 8765432109",
    city: "Delhi",
    state: "Delhi",
    partnerNgo: "Smile Foundation",
    currentStage: "Interview",
    currentStatus: "learner-round-pass" as const,
    assignedTo: "Interview Team",
    lastInteraction: "1 day ago",
    examScore: 14,
    qualifiedProgram: "School of Business"
  },
  {
    id: "NGK003",
    name: "Anjali Patel",
    phone: "+91 7654321098", 
    city: "Ahmedabad",
    state: "Gujarat",
    partnerNgo: "CRY",
    currentStage: "Final Decision",
    currentStatus: "offer-sent" as const,
    assignedTo: "Admissions Team",
    lastInteraction: "3 hours ago",
    examScore: 18,
    qualifiedProgram: "School of Programming"
  },
  {
    id: "NGK004",
    name: "Vikram Singh",
    phone: "+91 6543210987",
    city: "Jaipur", 
    state: "Rajasthan",
    partnerNgo: "Akshaya Patra",
    currentStage: "Sourcing",
    currentStatus: "basic-details-entered" as const,
    assignedTo: "Outreach Team",
    lastInteraction: "5 hours ago",
    examScore: null,
    qualifiedProgram: null
  },
  {
    id: "NGK005",
    name: "Meera Reddy",
    phone: "+91 5432109876",
    city: "Hyderabad",
    state: "Telangana", 
    partnerNgo: "Goonj",
    currentStage: "Final Decision",
    currentStatus: "onboarded" as const,
    assignedTo: "Onboarding Team",
    lastInteraction: "1 hour ago",
    examScore: 17,
    qualifiedProgram: "School of Programming"
  }
];

export function ApplicantTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplicant, setSelectedApplicant] = useState<typeof mockApplicants[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredApplicants = mockApplicants.filter(applicant =>
    applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    applicant.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    applicant.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewApplicant = (applicant: typeof mockApplicants[0]) => {
    setSelectedApplicant(applicant);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-card rounded-xl shadow-soft border border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">All Applicants</h2>
            <p className="text-muted-foreground text-sm">Manage and track applicant progress</p>
          </div>
          <Button className="bg-gradient-primary hover:bg-primary/90 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Applicant
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search applicants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">#</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Applicant Name</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Applicant ID</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Current Stage</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Location</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Last Interaction</th>
              <th className="text-left p-4 font-medium text-muted-foreground text-sm">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApplicants.map((applicant, index) => (
              <tr 
                key={applicant.id} 
                className="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => handleViewApplicant(applicant)}
              >
                <td className="p-4 text-sm text-muted-foreground">{index + 1}</td>
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary text-sm font-medium">
                        {applicant.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{applicant.name}</p>
                      <p className="text-sm text-muted-foreground">{applicant.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm font-mono text-foreground">{applicant.id}</td>
                <td className="p-4 text-sm text-foreground">{applicant.currentStage}</td>
                <td className="p-4">
                  <StatusBadge status={applicant.currentStatus} />
                </td>
                <td className="p-4 text-sm text-foreground">
                  {applicant.city}, {applicant.state}
                </td>
                <td className="p-4 text-sm text-muted-foreground">{applicant.lastInteraction}</td>
                <td className="p-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewApplicant(applicant);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <ApplicantModal
        applicant={selectedApplicant}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}