import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { AddApplicantModal } from "./AddApplicantModal";
import { AdvancedFilterModal } from "./AdvancedFilterModal";
import { BulkUpdateModal } from "./BulkUpdateModal";
import { ApplicantModal } from "./ApplicantModal";
import { ApplicantCommentsModal } from "./ApplicantCommentsModal";
import CSVImportModal from "./CSVImportModal";
import { useToast } from "@/hooks/use-toast";
import { BulkActions } from "./applicant-table/BulkActions";
import { TableActions } from "./applicant-table/TableActions";
import { ApplicantTableRow } from "./applicant-table/ApplicantTableRow";
import {
  getStudents,
  getAllSchools,
  getCampusesApi,
  getAllStatuses,
  getAllStages,
  deleteStudent,
  getAllReligions,
  getAllQuestionSets,
} from "@/utils/api";

const ApplicantTable = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);
  const [showCSVImport, setShowCSVImport] = useState(false);

  const [applicantToView, setApplicantToView] = useState<any | null>(null);
  const [applicantForComments, setApplicantForComments] = useState<any | null>(
    null
  );

  const [campusList, setCampusList] = useState<any[]>([]);
  const [schoolList, setSchoolsList] = useState<any[]>([]);
  const [currentstatusList, setcurrentstatusList] = useState<any[]>([]);
  const [stageList, setStageList] = useState<any[]>([]);
  const [religionList, setReligionList] = useState<any[]>([]);
  const [questionSetList, setQuestionSetList] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    stage: "all",
    status: "all",
    examMode: "all",
    interviewMode: "all",
    partner: [],
    district: [],
    market: [],
    dateRange: { type: "application" as const },
  });
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch all students at once
  const {
    data: studentsData,
    isLoading: isStudentsLoading,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await getStudents(); // should return all data
      return res;
    },
  });

  const students = studentsData?.data || [];

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [campuses, schools, religions] = await Promise.all([
          getCampusesApi(),
          getAllSchools(),
          getAllReligions(),
        ]);

        setCampusList(campuses || []);
        setSchoolsList(schools || []);
        setReligionList(religions || []);
      } catch (error) {
        console.error("Failed to fetch campuses/schools:", error);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [stages, statuses] = await Promise.all([
          getAllStages(),
          getAllStatuses(),
        ]);

        setStageList(stages || []);
        setcurrentstatusList(statuses || []);
      } catch (error) {
        console.error("Failed to fetch stages/statuses:", error);
      }
    };

    fetchOptions();
  }, []);

  useEffect(() => {
    const fetchQuestionSets = async () => {
      try {
        const response = await getAllQuestionSets();
        setQuestionSetList(response || []);
      } catch (error) {
        console.error("Error fetching question sets:", error);
      }
    };

    fetchQuestionSets();
  }, []);

  // Map phone to mobile_no if mobile_no is missing
  const applicants = useMemo(() => {
    return (students || []).map((student) => {
      const school = schoolList.find((s) => s.id === student.school_id);
      const campus = campusList.find((c) => c.id === student.campus_id);
      const current_status = currentstatusList.find(
        (s) => s.id === student.current_status_id
      );
      const religion = religionList.find((r) => r.id === student.religion_id);
      const questionSet = questionSetList.find(
        (q) => q.id === student.question_set_id
      );

      return {
        ...student,
        mobile_no: student.mobile_no || student.phone_number || "",
        name: `${student.first_name || ""} ${student.middle_name || ""} ${
          student.last_name || ""
        }`.trim(),
        school_name: school ? school.school_name : "N/A",
        campus_name: campus ? campus.campus_name : "N/A",
        current_status_name: current_status
          ? current_status.current_status_name
          : "N/A",
        religion_name: religion ? religion.religion_name : "N/A",
        question_set_name: questionSet ? questionSet.name : "N/A",
        maximumMarks: questionSet ? questionSet.maximumMarks : 0,
      };
    });
  }, [
    students,
    schoolList,
    campusList,
    currentstatusList,
    religionList,
    questionSetList,
  ]);

  // Filter by search
  const filteredApplicants = useMemo(() => {
    if (!applicants) return [];
    if (!searchTerm) return applicants;

    const searchRegex = new RegExp(searchTerm, "i");
    return applicants.filter(
      (a) =>
        searchRegex.test(a.name || "") ||
        searchRegex.test(a.mobile_no || "") ||
        searchRegex.test(a.unique_number || "")
    );
  }, [applicants, searchTerm]);

  // Slice data for the current page
  const paginatedApplicants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredApplicants.slice(start, end);
  }, [filteredApplicants, currentPage, itemsPerPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredApplicants.length / itemsPerPage)
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  const handleCheckboxChange = useCallback((id: string) => {
    setSelectedRows((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((rowId) => rowId !== id)
        : [...prevSelected, id]
    );
  }, []);

  const refreshData = useCallback(() => {
    setCurrentPage(1);
    refetchStudents();
  }, [refetchStudents]);

  const handleSelectAllRows = useCallback(() => {
    if (paginatedApplicants.length === selectedRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedApplicants.map((a) => a.id));
    }
  }, [paginatedApplicants, selectedRows.length]);

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select applicants to delete",
        variant: "destructive",
      });
      return;
    }
    try {
      await Promise.all(selectedRows.map((id) => deleteStudent(id)));
      toast({
        title: "Applicants Deleted",
        description: "Successfully deleted selected applicants",
      });
      setSelectedRows([]);
      refreshData();
    } catch (error) {
      console.error("Error deleting applicants:", error);
      toast({
        title: "Error",
        description: "Failed to delete applicants",
        variant: "destructive",
      });
    }
  };

  const handleSendOfferLetters = async () => {
    if (selectedRows.length === 0) {
      toast({
        title: "No Selection",
        description: "Please select applicants to send offer letters to",
        variant: "destructive",
      });
    }
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
  };

  const exportToCSV = () => {
    if (!filteredApplicants || filteredApplicants.length === 0) {
      toast({
        title: "No Data",
        description: "No applicants to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      // Personal Information
      "first_name",
      "middle_name",
      "last_name",
      "dob",
      "gender",
      "email",
      "phone_number",
      "whatsapp_number",
      "image",

      // Address Information
      "state",
      "district",
      "city",
      "pin_code",

      // Academic / School Information
      "school_medium",
      "qualification_id",
      "allotted_school",

      // Caste / Religion
      "cast_id",
      "religion_id",

      // Status Information
      "current_status_id",
      "lr_status",
      "lr_comments",
      "cfr_status",
      "cfr_comments",
      "decision_status",
      "offer_letter_status",
      "joining_status",
      "status",

      // Additional Notes
      "communication_notes",
      "final_notes",
      "is_passed",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredApplicants.map((applicant: any) =>
        headers
          .map((header) => {
            const value = applicant[header];
            if (value === null || value === undefined) return "";
            const s = String(value);
            return s.includes(",") ? `"${s}"` : s;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `applicants_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredApplicants.length} applicants to CSV`,
    });
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Applicants</CardTitle>
            <CardDescription>
              {searchTerm
                ? `${filteredApplicants.length} applicants found (filtered)`
                : `${students.length} total applicants`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <BulkActions
              selectedRowsCount={selectedRows.length}
              onBulkUpdate={() => setShowBulkUpdate(true)}
              onSendOfferLetters={handleSendOfferLetters}
              onBulkDelete={handleBulkDelete}
            />
            <TableActions
              onCSVImport={() => setShowCSVImport(true)}
              onExportCSV={exportToCSV}
              onShowFilters={() => setShowAdvancedFilters(true)}
              onAddApplicant={() => setShowAddModal(true)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="mb-4 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search applicants..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 border rounded-md overflow-hidden">
          <div className="h-full overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  <TableHead className="w-8 font-bold px-2">
                    <Checkbox
                      checked={
                        paginatedApplicants.length > 0 &&
                        selectedRows.length === paginatedApplicants.length
                      }
                      onCheckedChange={handleSelectAllRows}
                      aria-label="Select all applicants"
                    />
                  </TableHead>
                  <TableHead className="font-bold w-12 px-2">Image</TableHead>
                  <TableHead className="font-bold min-w-[150px] max-w-[180px] px-2">
                    Full Name
                  </TableHead>
                  <TableHead className="font-bold min-w-[110px] max-w-[130px] px-2">
                    Phone Number
                  </TableHead>
                  <TableHead className="font-bold min-w-[140px] max-w-[180px] px-2">
                    WhatsApp Number
                  </TableHead>
                  <TableHead className="font-bold min-w-[80px] max-w-[100px] px-2">
                    Gender
                  </TableHead>
                  <TableHead className="font-bold min-w-[90px] max-w-[120px] px-2">
                    City
                  </TableHead>
                  <TableHead className="font-bold min-w-[100px] max-w-[140px] px-2">
                    State
                  </TableHead>

                  <TableHead className="font-bold w-24">Pin Code</TableHead>

                  {/* School */}
                  <TableHead className="font-bold min-w-[120px] max-w-[150px] px-2">
                    School
                  </TableHead>

                  {/* Campus */}
                  <TableHead className="font-bold min-w-[120px] max-w-[150px] px-2">
                    Campus
                  </TableHead>

                  <TableHead className="font-bold min-w-[120px] max-w-[150px] px-2">
                    Current Status
                  </TableHead>
                  <TableHead className="font-bold min-w-[120px] max-w-[150px] px-2">
                    Religion
                  </TableHead>

                  <TableHead className="font-bold min-w-[120px] max-w-[150px] px-2">
                    Is Passed
                  </TableHead>

                  <TableHead className="w-16 font-bold px-2">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {isStudentsLoading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center">
                      Loading applicants...
                    </TableCell>
                  </TableRow>
                ) : paginatedApplicants.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={13}
                      className="text-center text-muted-foreground py-6"
                    >
                      No applicants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedApplicants.map((applicant) => (
                    <ApplicantTableRow
                      key={applicant.id}
                      applicant={applicant}
                      isSelected={selectedRows.includes(applicant.id)}
                      onSelect={handleCheckboxChange}
                      onUpdate={refreshData}
                      onViewDetails={setApplicantToView}
                      onViewComments={setApplicantForComments}
                      onCampusChange={refreshData}
                      schoolList={schoolList}
                      campusList={campusList}
                      religionList={religionList}
                      // casteList={campusList}
                      currentstatusList={currentstatusList}
                      questionSetList={questionSetList}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            {filteredApplicants.length === 0
              ? 0
              : (currentPage - 1) * itemsPerPage + 1}
            –{Math.min(currentPage * itemsPerPage, filteredApplicants.length)}{" "}
            of {filteredApplicants.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </CardContent>

      <AddApplicantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={refreshData}
        schoolList={schoolList}
        campusList={campusList}
        currentstatusList={currentstatusList}
        religionList={religionList}
        questionSetList={questionSetList}
      />

      <CSVImportModal
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onSuccess={refreshData}
      />

      <AdvancedFilterModal
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
        students={paginatedApplicants}
      />

      <BulkUpdateModal
        isOpen={showBulkUpdate}
        onClose={() => setShowBulkUpdate(false)}
        selectedApplicants={selectedRows}
        onSuccess={refreshData}
      />

      <ApplicantModal
        applicant={applicantToView}
        isOpen={!!applicantToView}
        onClose={() => setApplicantToView(null)}
      />

      <ApplicantCommentsModal
        applicantId={applicantForComments?.id || ""}
        applicantName={applicantForComments?.name || ""}
        isOpen={!!applicantForComments}
        onClose={() => setApplicantForComments(null)}
      />
    </Card>
  );
};

export default ApplicantTable;
