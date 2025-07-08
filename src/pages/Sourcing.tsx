import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Upload, Plus, Phone, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";

const mockSourcingData = [
  {
    id: "NGK001",
    name: "Priya Sharma",
    phone: "+91 9876543210",
    city: "Mumbai",
    state: "Maharashtra",
    partnerNgo: "Teach for India",
    status: "basic-details-entered" as const,
    lastContact: "2 hours ago",
    notes: "Interested in programming course"
  },
  {
    id: "NGK004",
    name: "Vikram Singh",
    phone: "+91 6543210987",
    city: "Jaipur",
    state: "Rajasthan",
    partnerNgo: "Akshaya Patra",
    status: "basic-details-entered" as const,
    lastContact: "5 hours ago",
    notes: "Needs follow-up call"
  },
  {
    id: "NGK006",
    name: "Rahul Gupta",
    phone: "+91 9988776655",
    city: "Lucknow",
    state: "Uttar Pradesh",
    partnerNgo: "Smile Foundation",
    status: "unreachable" as const,
    lastContact: "2 days ago",
    notes: "Phone not reachable, try alternate number"
  }
];

const Sourcing = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <AdmissionsSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Sourcing & Outreach
            </h1>
            <p className="text-muted-foreground">
              Manage initial applicant outreach and data collection
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">New Leads</p>
                  <p className="text-2xl font-bold text-foreground">42</p>
                </div>
                <div className="w-12 h-12 bg-status-pending/10 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-status-pending" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Contacted</p>
                  <p className="text-2xl font-bold text-foreground">156</p>
                </div>
                <div className="w-12 h-12 bg-status-active/10 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-status-active" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-soft border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Details Completed</p>
                  <p className="text-2xl font-bold text-foreground">89</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-soft border border-border">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Sourcing Pipeline</h2>
                <div className="flex space-x-3">
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CSV
                  </Button>
                  <Button className="bg-gradient-primary hover:bg-primary/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Applicant
                  </Button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Applicant</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Contact</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Location</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Partner NGO</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Last Contact</th>
                    <th className="text-left p-4 font-medium text-muted-foreground text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockSourcingData.map((applicant) => (
                    <tr key={applicant.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-primary text-sm font-medium">
                              {applicant.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{applicant.name}</p>
                            <p className="text-sm text-muted-foreground">{applicant.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{applicant.phone}</span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-foreground">
                        {applicant.city}, {applicant.state}
                      </td>
                      <td className="p-4 text-sm text-foreground">{applicant.partnerNgo}</td>
                      <td className="p-4">
                        <StatusBadge status={applicant.status} />
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{applicant.lastContact}</td>
                      <td className="p-4">
                        <Button variant="outline" size="sm">
                          Contact
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Sourcing;