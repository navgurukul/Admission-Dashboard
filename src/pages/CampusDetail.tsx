import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdmissionsSidebar } from "../components/AdmissionsSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { AdvancedFilterModal } from "@/components/AdvancedFilterModal";
import { getFilterStudent, getCampusById } from "@/utils/api";

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

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "student", label: "Student Data" },
];

const ROWS_PER_PAGE = 10;

const CampusDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [programs, setPrograms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campusName, setCampusName] = useState("");
  const navigate = useNavigate();
  const [studentPage, setStudentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    stage: "all",
    status: "all",
    examMode: "all",
    interviewMode: "all",
    partner: [],
    district: [],
    market: [],
    dateRange: { type: "application" }
  });

  // Fetch campus details
  useEffect(() => {
    if (!id) return;
    
    const fetchCampusDetails = async () => {
      try {
        const response = await getCampusById(Number(id));
        if (response.success && response.data) {
          setCampusName(response.data.campus_name);
        }
      } catch (error) {
        console.error("Failed to fetch campus details:", error);
      }
    };

    fetchCampusDetails();
  }, [id]);

  // Fetch students data (used for both overview and student tabs)
  useEffect(() => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    const fetchStudents = async () => {
      try {
        const studentsData = await getFilterStudent({ campus_id: Number(id) });
        setStudents(studentsData || []);
        
        // If on overview tab, calculate school capacities from student data
        if (activeTab === "overview") {
          const schoolMap = new Map<string, number>();
          let notAllottedCount = 0;
          
          studentsData.forEach((student: any) => {
            if (student.school_name) {
              schoolMap.set(student.school_name, (schoolMap.get(student.school_name) || 0) + 1);
            } else {
              notAllottedCount++;
            }
          });
          
          const schoolData = Array.from(schoolMap.entries()).map(([name, count]) => ({
            name: name,
            capacity: count
          }));
          
          // Add "Not Allotted Schools" if there are students without school
          if (notAllottedCount > 0) {
            schoolData.push({
              name: "Not Allotted Schools",
              capacity: notAllottedCount
            });
          }
          
          setPrograms(schoolData);
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Failed to fetch student data");
        setStudents([]);
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [id, activeTab]);

  const paginatedStudents = students.slice((studentPage - 1) * rowsPerPage, studentPage * rowsPerPage);
  const totalStudentPages = Math.ceil(students.length / rowsPerPage);
  const startIdx = students.length === 0 ? 0 : (studentPage - 1) * rowsPerPage + 1;
  const endIdx = Math.min(studentPage * rowsPerPage, students.length);

  // Filtered students based on search and filters
  const filteredStudents = paginatedStudents.filter(student => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (student.first_name && student.first_name.toLowerCase().includes(search)) ||
      (student.last_name && student.last_name.toLowerCase().includes(search)) ||
      (student.email && student.email.toLowerCase().includes(search)) ||
      (student.phone_number && student.phone_number.includes(search));
    
    let matchesFilters = true;
    if (filters.stage !== "all" && student.stage_name !== filters.stage) matchesFilters = false;
    if (filters.status !== "all" && student.current_status_name !== filters.status) matchesFilters = false;
    
    return matchesSearch && matchesFilters;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdmissionsSidebar />
      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8 md:ml-64">
        <h2 className="text-3xl font-bold text-center mb-6">{campusName} Campus</h2>
        <div className="flex justify-center mb-6 gap-2">
          {TABS.map(tab => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? "default" : "outline"}
              className={activeTab === tab.key ? "bg-orange-500 text-white" : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === "overview" ? "Programs offered" : "Student Data"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === "overview" && (
              loading ? (
                <p>Loading...</p>
              ) : error ? (
                <p className="text-red-500">{error}</p>
              ) : programs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No school data available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>School Name</TableHead>
                      <TableHead>Number of Students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map((school, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{school.name}</TableCell>
                        <TableCell>{school.capacity}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            )}
            {activeTab === "student" && (
              <>
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by name, email, or mobile..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 h-9"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="h-9" onClick={() => setShowFilterModal(true)}>
                    <Filter className="w-4 h-4 mr-2" />
                    Filter
                  </Button>
                </div>
                <AdvancedFilterModal
                  isOpen={showFilterModal}
                  onClose={() => setShowFilterModal(false)}
                  onApplyFilters={f => setFilters(f)}
                  currentFilters={filters}
                />
                {loading ? (
                  <p>Loading students...</p>
                ) : error ? (
                  <p className="text-red-500">{error}</p>
                ) : filteredStudents.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No students found</p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredStudents.map((student, idx) => (
                        <div key={student.id} className="bg-card rounded-xl p-6 shadow-soft border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-lg font-bold text-foreground mb-1">
                                {`${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.trim() || "No Name"}
                              </p>
                              <p className="text-xs text-muted-foreground">{student.email || "No email"}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div><span className="font-medium text-muted-foreground">Number:</span> {student.phone_number || "N/A"}</div>
                            <div><span className="font-medium text-muted-foreground">WhatsApp:</span> {student.whatsapp_number || "N/A"}</div>
                            <div><span className="font-medium text-muted-foreground">Gender:</span> {student.gender || "N/A"}</div>
                            <div><span className="font-medium text-muted-foreground">DOB:</span> {student.dob || "N/A"}</div>
                            <div><span className="font-medium text-muted-foreground">State:</span> {student.state || "N/A"}</div>
                            <div><span className="font-medium text-muted-foreground">District:</span> {student.district || "N/A"}</div>
                            <div><span className="font-medium text-muted-foreground">Cast:</span> {student.cast_name || "N/A"}</div>
                            <div><span className="font-medium text-muted-foreground">Religion:</span> {student.religion_name || "N/A"}</div>
                            <div><span className="font-medium text-muted-foreground">Qualification:</span> {student.qualification_name || "N/A"}</div>
                            <div><span className="font-medium text-muted-foreground">School:</span> {student.school_name || "N/A"}</div>
                            <div><span className="font-medium text-muted-foreground">Stage:</span> {student.stage_name || student.stage || "N/A"}</div>
                            <div><span className="font-medium text-muted-foreground">Current Work:</span> {student.current_status_name || "N/A"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center items-center gap-6 mt-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Rows per page:</span>
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={rowsPerPage}
                          onChange={e => {
                            setRowsPerPage(Number(e.target.value));
                            setStudentPage(1);
                          }}
                        >
                          {[10, 20, 50, 100].map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                      <span className="text-sm">
                        {startIdx}-{endIdx} of {students.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          className="px-2 py-1 rounded border border-gray-200 bg-white text-sm disabled:opacity-50"
                          onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                          disabled={studentPage === 1}
                          aria-label="Previous page"
                        >
                          &#60;
                        </button>
                        <button
                          className="px-2 py-1 rounded border border-gray-200 bg-white text-sm disabled:opacity-50"
                          onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                          disabled={studentPage === totalStudentPages}
                          aria-label="Next page"
                        >
                          &#62;
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CampusDetail;