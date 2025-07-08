import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { ApplicantTable } from "@/components/ApplicantTable";

const AllApplicants = () => {
  return (
    <div className="min-h-screen bg-background flex">
      <AdmissionsSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              All Applicants
            </h1>
            <p className="text-muted-foreground">
              Complete view of all applicants across all admission stages
            </p>
          </div>

          <ApplicantTable />
        </div>
      </main>
    </div>
  );
};

export default AllApplicants;