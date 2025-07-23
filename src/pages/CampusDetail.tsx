import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdmissionsSidebar } from "../components/AdmissionsSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { AdvancedFilterModal } from "@/components/AdvancedFilterModal";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "student", label: "Student Data" },
];

const STUDENT_COLUMNS = [
  "Name",
  "Number",
  "Alternative Number",
  "Email",
  "Joined Date",
  "Stage",
  "Job Kab Lagegi..",
  "Upload Documents",
  "Days Passed",
  "kitne Aur Din",
  "kitne Din Lagengе",
  "Qualification",
  "Partner Name",
  "Other Activities",
  "Evaluation",
  "Flag",
  "Survey Form"
];

const COLUMN_KEY_MAP = {
  "Name": "name",
  "Number": "contacts", // special
  "Alternative Number": "contacts", // special
  "Email": "email",
  "Joined Date": "joinedDate",
  "Stage": "stage", // special
  "Job Kab Lagegi..": "jobKabLagega",
  "Upload Documents": "studentDocuments", // special
  "Days Passed": "daysPassed", // custom
  "kitne Aur Din": "kitneAurDin", // custom
  "kitne Din Lagengе": "kitneDinLagenge", // custom
  "Qualification": "qualification",
  "Partner Name": "partner", // special
  "Other Activities": "other_activities",
  "Evaluation": "evaluation",
  "Flag": "redflag",
  "Survey Form": "surveyForm", // special
};

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
  const [filters, setFilters] = useState({
    stage: "all",
    status: "all",
    examMode: "all",
    interviewMode: "all",
    partner: [],
    district: [],
    market: [],
    dateRange: { type: "application" }
  });

  useEffect(() => {
    fetch("https://dev-join.navgurukul.org/api/campus")
      .then(res => res.json())
      .then(data => {
        const campus = data.data.find((c: any) => String(c.id) === String(id));
        setCampusName(campus ? campus.campus : "Campus");
      });
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (activeTab === "overview") {
      fetch(`https://dev-join.navgurukul.org/api/school/campus_school/${id}`)
        .then(res => res.json())
        .then(data => {
          setPrograms(data);
        })
        .catch(() => setError("Failed to fetch data"))
        .finally(() => setLoading(false));
    } else if (activeTab === "student") {
      fetch(`https://dev-join.navgurukul.org/api/campus/${id}/students`)
        .then(res => res.json())
        .then(data => {
          setStudents(data.data || []);
        })
        .catch(() => setError("Failed to fetch student data"))
        .finally(() => setLoading(false));
    }
  }, [id, activeTab]);

  const paginatedStudents = students.slice((studentPage - 1) * rowsPerPage, studentPage * rowsPerPage);
  const totalStudentPages = Math.ceil(students.length / rowsPerPage);
  const startIdx = students.length === 0 ? 0 : (studentPage - 1) * rowsPerPage + 1;
  const endIdx = Math.min(studentPage * rowsPerPage, students.length);

  // Filtered students based on search and filters
  const filteredStudents = paginatedStudents.filter(student => {
    // Search by name, email, or mobile
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (student.name && student.name.toLowerCase().includes(search)) ||
      (student.email && student.email.toLowerCase().includes(search)) ||
      (student.contacts?.[0]?.mobile && student.contacts[0].mobile.includes(search));
    // Filter logic (only stage for now, can expand)
    let matchesFilters = true;
    if (filters.stage !== "all" && student.stage?.stage !== filters.stage) matchesFilters = false;
    // Add more filter conditions as needed
    return matchesSearch && matchesFilters;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdmissionsSidebar />
      <main className="flex-1 p-8 ml-64">
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
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>S.No</TableHead>
                      <TableHead>School Name</TableHead>
                      <TableHead>Capacity of students</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programs.map((school, idx) => (
                      <TableRow key={school.school_id}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStudents.map((student, idx) => (
                    <div key={student.id || idx} className="bg-card rounded-xl p-6 shadow-soft border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-lg font-bold text-foreground mb-1">{student.name || "No Name"}</p>
                          <p className="text-xs text-muted-foreground">{student.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            setStudents(prev => prev.map((s, i) => i === ((studentPage - 1) * ROWS_PER_PAGE + idx) ? { ...s, redflag: s.redflag === "flagged" ? "" : "flagged" } : s));
                          }}
                          className="focus:outline-none"
                          title={student.redflag === "flagged" ? "Unflag" : "Flag"}
                        >
                          {student.redflag === "flagged" ? (
                            <span role="img" aria-label="Flag" style={{ color: 'red', fontSize: '1.5em' }}>🚩</span>
                          ) : (
                            <span role="img" aria-label="No Flag" style={{ color: '#ccc', fontSize: '1.5em' }}>⚑</span>
                          )}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div><span className="font-medium text-muted-foreground">Number:</span> {student.contacts?.[0]?.mobile || ""}</div>
                        <div><span className="font-medium text-muted-foreground">Alt Number:</span> {student.contacts?.[0]?.alt_mobile || ""}</div>
                        <div><span className="font-medium text-muted-foreground">Joined:</span> {student.joinedDate || ""}</div>
                        <div><span className="font-medium text-muted-foreground">Qualification:</span> {student.qualification || ""}</div>
                        <div><span className="font-medium text-muted-foreground">Partner:</span> {student.partner?.name || ""}</div>
                        <div><span className="font-medium text-muted-foreground">Job Kab Lagegi:</span> {student.jobKabLagega || ""}</div>
                        <div><span className="font-medium text-muted-foreground">Days Passed:</span> {typeof student.daysPassed === "object" && student.daysPassed !== null ? student.daysPassed.daysPassedInCampus ?? "" : ""}</div>
                        <div><span className="font-medium text-muted-foreground">kitne Aur Din:</span> {typeof student.daysPassed === "object" && student.daysPassed !== null ? student.daysPassed.kitneAurDin ?? "" : ""}</div>
                        <div><span className="font-medium text-muted-foreground">kitne Din Lagengе:</span> {typeof student.daysPassed === "object" && student.daysPassed !== null ? student.daysPassed.kitneDinLagenge ?? "" : ""}</div>
                        <div><span className="font-medium text-muted-foreground">Other Activities:</span> {student.other_activities || ""}</div>
                        <div><span className="font-medium text-muted-foreground">Evaluation:</span> {student.evaluation || ""}</div>
                        <div><span className="font-medium text-muted-foreground">Survey Form:</span> {student.surveyForm || ""}</div>
                        <div><span className="font-medium text-muted-foreground">Upload Documents:</span> {student.studentDocuments ? "UPLOAD" : ""}</div>
                        <div className="flex items-center gap-2"><span className="font-medium text-muted-foreground">Stage:</span>
                          <select
                            className="border rounded px-2 py-1 text-xs"
                            value={student.stage?.stage || ""}
                            onChange={e => {
                              const newStage = e.target.value;
                              setStudents(prev => prev.map((s, i) => i === ((studentPage - 1) * ROWS_PER_PAGE + idx) ? { ...s, stage: { ...s.stage, stage: newStage } } : s));
                            }}
                          >
                            <option value="">Select Stage</option>
                            <option value="contact">Contact</option>
                            <option value="screening">Screening</option>
                            <option value="interviews">Interviews</option>
                            <option value="decision">Decision</option>
                          </select>
                        </div>
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CampusDetail; 