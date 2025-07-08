import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { DashboardStats } from "@/components/DashboardStats";
import { ApplicantTable } from "@/components/ApplicantTable";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AdmissionsSidebar />
      
      {/* Main Content */}
      <main className="ml-64 overflow-auto h-screen">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Admissions Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track and manage applicant progress through Navgurukul's admission process
            </p>
          </div>

          {/* Stats Cards */}
          <div className="mb-8">
            <DashboardStats />
          </div>

          {/* Applicants Table */}
          <ApplicantTable />
        </div>
      </main>
    </div>
  );
};

export default Index;
