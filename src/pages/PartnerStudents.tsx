import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Eye, Search, X } from "lucide-react";
import { getStudentsByPartnerId, getPartnerById, getCampusesApi } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { ApplicantModal } from "@/components/ApplicantModal";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const LIFECYCLE_STATUSES = [
    "Culture fit round Pass",
    "Offer Letter Sent",
    "Pending Travel Plans",
    "Finalized Travel Plans",
    "Joined",
    "Deferred Joining",
    "Algebra Interview Pending (3rd Round)",
    "Screening Test Pass",
    "Learning Round Pass",
    "Pending Parent Conversations",
    "Became Disinterested",
    "Unreachable",
    "Screening Test Fail",
    "Learning round Fail",
    "Algebra Interview Failed",
    "Tution Group",
];

const COLORS = [
    "#92D050", // Culture fit round Pass
    "#C6E0B4", // Offer Letter Sent
    "#FFD966", // Pending Travel Plans
    "#D18E4E", // Finalized Travel Plans
    "#C00000", // Joined
    "#E06666", // Deferred Joining
    "#F6B26B", // Algebra Interview Pending (3rd Round)
    "#BC8E8E", // Screening Test Pass
    "#8E7CC3", // Learning Round Pass
    "#762A83", // Pending Parent Conversations
    "#6B3434", // Became Disinterested
    "#7F7F7F", // Unreachable
    "#A2AD91", // Screening Test Fail
    "#76A5AF", // Learning round Fail
    "#3D85C6", // Algebra Interview Failed
    "#54B46E", // Tution Group
];

const RADIAN = Math.PI / 180;

// Simplified version for all labels to be visible always
const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, value, fill, payload, index } = props;
    const name = payload.name;
    const RADIAN = Math.PI / 180;

    // Adjust these values to position labels further out
    const radius = outerRadius + 60;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    const textAnchor = x > cx ? 'start' : 'end';

    // Create lines to labels
    const sx = cx + outerRadius * Math.cos(-midAngle * RADIAN);
    const sy = cy + outerRadius * Math.sin(-midAngle * RADIAN);
    const mx = cx + (outerRadius + 30) * Math.cos(-midAngle * RADIAN);
    const my = cy + (outerRadius + 30) * Math.sin(-midAngle * RADIAN);
    const ex = x > cx ? mx + 20 : mx - 20;
    const ey = my;

    return (
        <g>
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <rect
                x={x > cx ? ex : ex - 180}
                y={ey - 10}
                width={180}
                height={20}
                fill={fill}
                rx={2}
            />
            <text
                x={x > cx ? ex + 5 : ex - 5}
                y={ey}
                dy={4}
                textAnchor={textAnchor}
                fill="white"
                fontSize={10}
                fontWeight="bold"
            >
                {`${value} ${name} (${(percent * 100).toFixed(2)}%)`}
            </text>
        </g>
    );
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PartnerStudents = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [students, setStudents] = useState([]);
    const [chartStudents, setChartStudents] = useState([]); // Separate state for full data (chart)
    const [partner, setPartner] = useState(null); // To show partner name header
    const [campuses, setCampuses] = useState<{ id: number; campus_name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Use debounce hook for search
    const { debouncedValue: debouncedSearch, isPending: isSearchPending } = useDebounce(searchQuery, 500);

    useEffect(() => {
        if (id) {
            loadData();
            loadPartnerDetails();
            loadChartData();
            loadCampuses();
        }
    }, [id, currentPage, itemsPerPage, debouncedSearch]);

    const loadCampuses = async () => {
        try {
            const data = await getCampusesApi();
            setCampuses(data || []);
        } catch (error) {
            console.error("Failed to load campuses", error);
        }
    };

    const loadPartnerDetails = async () => {
        try {
            const data = await getPartnerById(id);
            // Handle various responses: data.data, data[0], or raw object
            let p = data.data || data;
            if (Array.isArray(p)) p = p[0];
            setPartner(p);
        } catch (error) {
            console.error("Failed to load partner details", error);
        }
    }

    const loadChartData = async () => {
        setChartLoading(true);
        try {
            const data = await getStudentsByPartnerId(id, 1, 2500);
            let fullList = [];
            if (data?.data?.data && Array.isArray(data.data.data)) {
                fullList = data.data.data;
            } else if (data && data.data && Array.isArray(data.data)) {
                fullList = data.data;
            } else if (Array.isArray(data)) {
                fullList = data;
            } else if (data && data.students && Array.isArray(data.students)) {
                fullList = data.students;
            }
            setChartStudents(fullList);
        } catch (error) {
            console.error("Failed to load chart data", error);
        } finally {
            setChartLoading(false);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getStudentsByPartnerId(id, currentPage, itemsPerPage, debouncedSearch);
            let studentList = [];
            let totalCount = 0;
            let pages = 0;

            if (data?.data?.data && Array.isArray(data.data.data)) {
                studentList = data.data.data;
                totalCount = data.data.total || data.total || studentList.length;
                pages = data.data.totalPages || Math.ceil(totalCount / itemsPerPage);
            } else if (data && data.data && Array.isArray(data.data)) {
                studentList = data.data;
                totalCount = data.total || studentList.length;
                pages = Math.ceil(totalCount / itemsPerPage);
            } else if (Array.isArray(data)) {
                studentList = data;
                totalCount = data.length;
                pages = Math.ceil(totalCount / itemsPerPage);
            } else if (data && data.students && Array.isArray(data.students)) {
                studentList = data.students;
                totalCount = data.total || data.students.length;
                pages = Math.ceil(totalCount / itemsPerPage);
            }

            setStudents(studentList);
            setTotalStudents(totalCount);
            setTotalPages(pages);
        } catch (error) {
            toast({
                title: "❌ Unable to Load Students",
                description: getFriendlyErrorMessage(error),
                variant: "destructive",
                className: "border-red-500 bg-red-50 text-red-900"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    // Helper to process data for charts
    // Unified lifecycle status helper
    const getLifecycleStatus = (student: any) => {
        const onboardedStatus = student.final_decisions?.[0]?.onboarded_status;
        const offerStatus = student.final_decisions?.[0]?.offer_letter_status;
        const cultureStatus = student.interview_cultural_fit_round?.[0]?.cultural_fit_status;
        const learningStatus = student.interview_learner_round?.[0]?.learning_round_status;
        const screeningStatus = student.exam_sessions?.[0]?.status;

        // Joined / Onboarded
        if (onboardedStatus === "Onboarded") return "Joined";
        if (offerStatus === "Offer Accepted") return "Joined";

        // Offer statuses
        if (offerStatus === "Offer Sent") return "Offer Letter Sent";
        if (offerStatus === "Offer Declined") return "Became Disinterested";
        if (offerStatus === "Deferred Joining") return "Deferred Joining";

        // Culture fit
        if (cultureStatus?.toLowerCase().includes("pass")) return "Culture fit round Pass";
        if (cultureStatus?.toLowerCase().includes("fail")) return "Became Disinterested";

        // Learning round
        if (learningStatus?.toLowerCase().includes("pass")) return "Learning Round Pass";
        if (learningStatus?.toLowerCase().includes("fail")) return "Learning round Fail";

        // Screening
        if (screeningStatus?.toLowerCase().includes("pass")) return "Screening Test Pass";
        if (screeningStatus?.toLowerCase().includes("fail")) return "Screening Test Fail";

        // Fallbacks based on current_status or stage
        const currStatus = student.current_status || "";
        if (currStatus.includes("Algebra Interview Pending")) return "Algebra Interview Pending (3rd Round)";
        if (currStatus.includes("Travel Plans Pending")) return "Pending Travel Plans";
        if (currStatus.includes("Unreachable")) return "Unreachable";
        if (currStatus.includes("Parent Conversation")) return "Pending Parent Conversations";
        if (currStatus.includes("Disinterested")) return "Became Disinterested";
        if (currStatus.includes("Tution Group")) return "Tution Group";

        return "Unreachable"; // Default fallback
    };

    const lifecycleData = React.useMemo(() => {
        const counts: Record<string, number> = {};
        LIFECYCLE_STATUSES.forEach(status => counts[status] = 0);

        chartStudents.forEach(student => {
            const status = getLifecycleStatus(student);
            if (counts[status] !== undefined) {
                counts[status]++;
            }
        });

        return LIFECYCLE_STATUSES.map(status => ({
            name: status,
            value: counts[status]
        }));
    }, [chartStudents]);

    const campusData = React.useMemo(() => {
        const dataMap: Record<string, number> = {};
        chartStudents.forEach((student) => {
            // Check for various possible campus name fields
            let campusName = student.campus_name || student.campus?.campus_name || student.campus?.name;

            // If name is still missing and we have an ID, try mapping from campuses list
            if (!campusName && student.campus_id) {
                const matchedCampus = campuses.find(c => String(c.id) === String(student.campus_id));
                if (matchedCampus) {
                    campusName = matchedCampus.campus_name;
                } else {
                    campusName = `ID: ${student.campus_id}`;
                }
            }

            const finalKey = campusName || "No Campus Assigned";
            dataMap[finalKey] = (dataMap[finalKey] || 0) + 1;
        });
        return Object.keys(dataMap).map((key) => ({
            name: key,
            value: dataMap[key],
        }));
    }, [chartStudents, campuses]);

    const renderCampusChart = () => (
        <div className="flex flex-col items-center w-full">
            <div className="flex flex-col items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-semibold text-center">Campus-wise Students Distribution</h2>
                <span className="text-xs sm:text-sm text-muted-foreground mt-1 bg-orange-100 text-orange-700 px-2 sm:px-3 py-1 rounded-full font-bold">
                    Total Campuses: {campusData.length}
                </span>
            </div>
            <div className="h-[400px] sm:h-[500px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={campusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            paddingAngle={2}
                        >
                            {campusData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Campus Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-2 mt-4 sm:mt-8 max-w-5xl mx-auto text-xs px-2">
                {campusData.map((data, index) => (
                    <div key={data.name} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-muted-foreground font-medium">({data.value})</span>
                        <span className="text-muted-foreground truncate">{data.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderUnifiedChart = () => (
        <div className="flex flex-col items-center">
            <div className="flex flex-col items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-semibold text-center">Progress Made Graph</h2>
                <span className="text-xs sm:text-sm text-muted-foreground mt-1 bg-orange-100 text-orange-700 px-2 sm:px-3 py-1 rounded-full font-bold">
                    Total Students: {chartStudents.length}
                </span>
            </div>
            <div className="h-[500px] sm:h-[600px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={lifecycleData}
                            cx="50%"
                            cy="45%"
                            labelLine={false}
                            label={renderCustomizedLabel}
                            innerRadius={60}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                            paddingAngle={1}
                        >
                            {lifecycleData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Custom Premium Legend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-8 gap-y-2 mt-4 sm:mt-8 max-w-5xl mx-auto text-xs px-2">
                {lifecycleData.map((data, index) => (
                    <div key={data.name} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 flex-shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-muted-foreground font-medium">({data.value})</span>
                        <span className="text-muted-foreground truncate">{data.name}</span>
                    </div>
                ))}
            </div>

            {/* Added Campus Chart hidden in unified call since we use tabs now */}
        </div>
    );

    return (
        <div className="min-h-screen bg-muted/40 flex">
            <AdmissionsSidebar />
            <main className="md:ml-64 flex-1 p-3 sm:p-6 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                    {/* Back Button - Centered at Top */}
                    <div className="flex justify-center">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigate("/partners")}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Partners</span>
                        </Button>
                    </div>

                    {/* Page Header */}
                    <div className="text-center">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            {partner ? `${partner.partner_name || partner.name} Students` : "Partner Students"}
                        </h1>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                            View and manage students associated with this partner
                        </p>
                    </div>

                    {/* Charts Section with Tabs */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl">Comprehensive Progress Reports (Total: {chartStudents.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {chartLoading ? (
                                <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    Loading chart data...
                                </div>
                            ) : chartStudents.length > 0 ? (
                                <Tabs defaultValue="graph" className="w-full">
                                    <TabsList className="grid w-full sm:w-fit grid-cols-2 mb-4 sm:mb-8 mx-auto border border-orange-200">
                                        <TabsTrigger
                                            value="graph"
                                            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-none px-6 sm:px-12 text-xs sm:text-sm"
                                        >
                                            GRAPH DATA
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="campus"
                                            className="data-[state=active]:bg-orange-500 data-[state=active]:text-white rounded-none px-6 sm:px-12 text-xs sm:text-sm"
                                        >
                                            CAMPUS DATA
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="graph" className="py-4">
                                        {renderUnifiedChart()}
                                    </TabsContent>

                                    <TabsContent value="campus" className="py-4">
                                        {renderCampusChart()}
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                <div className="h-24 flex items-center justify-center text-muted-foreground">
                                    Not enough data to display chart.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl">Student List ({totalStudents})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Search Bar */}
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search by name, email, or phone..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1); // Reset to first page on search
                                        }}
                                        className="pl-10 pr-10"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => {
                                                setSearchQuery("");
                                                setCurrentPage(1);
                                            }}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                    {isSearchPending && (
                                        <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                                {searchQuery && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {isSearchPending ? "Searching..." : `Found ${totalStudents} result${totalStudents !== 1 ? 's' : ''}`}
                                    </p>
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Stage</TableHead>
                                            <TableHead>Score</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                                            </TableRow>
                                        ) : students.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No students found.</TableCell>
                                            </TableRow>
                                        ) : (
                                            students.map((student, idx) => (
                                                <TableRow key={student.id || idx}>
                                                    <TableCell className="font-medium">
                                                        {student.name ||
                                                            `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.trim() ||
                                                            "N/A"}
                                                    </TableCell>
                                                    <TableCell>{student.email || "-"}</TableCell>
                                                    <TableCell>{student.mobile || student.phone_number || student.whatsapp_number || "-"}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="font-normal">
                                                            {student.current_status || "N/A"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{student.stage || "-"}</TableCell>
                                                    <TableCell>{student.total_score || "-"}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => handleViewStudent(student)}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {loading ? (
                                    <div className="h-24 flex items-center justify-center text-muted-foreground">Loading...</div>
                                ) : students.length === 0 ? (
                                    <div className="h-24 flex items-center justify-center text-muted-foreground">No students found.</div>
                                ) : (
                                    students.map((student, idx) => (
                                        <Card key={student.id || idx} className="p-4">
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-base">
                                                            {student.name ||
                                                                `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.trim() ||
                                                                "N/A"}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground mt-1">{student.email || "-"}</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => handleViewStudent(student)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Phone:</span>
                                                        <p className="font-medium">{student.mobile || student.phone_number || student.whatsapp_number || "-"}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Stage:</span>
                                                        <p className="font-medium">{student.stage || "-"}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Score:</span>
                                                        <p className="font-medium">{student.total_score || "-"}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Status:</span>
                                                        <div className="mt-1">
                                                            <Badge variant="secondary" className="font-normal text-xs">
                                                                {student.current_status || "N/A"}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>

                            {/* Pagination Controls */}
                            {!loading && students.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-4 py-4 border-t bg-muted/20 mt-4">
                                    <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                                        Showing <strong>{Math.min((currentPage - 1) * itemsPerPage + 1, totalStudents)}</strong> - <strong>{Math.min(currentPage * itemsPerPage, totalStudents)}</strong> of <strong>{totalStudents}</strong>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:space-x-2">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Rows:</Label>
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    setItemsPerPage(Number(e.target.value));
                                                    setCurrentPage(1);
                                                }}
                                                className="border rounded px-2 py-1 text-xs sm:text-sm h-8"
                                            >
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>
                                        <span className="text-xs sm:text-sm text-muted-foreground px-2">
                                            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="h-8 text-xs sm:text-sm"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages || totalPages === 0}
                                                className="h-8 text-xs sm:text-sm"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>

            <ApplicantModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                applicant={selectedStudent}
            />
        </div>
    );
};

export default PartnerStudents;
