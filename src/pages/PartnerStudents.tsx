import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ColumnVisibility, ColumnConfig } from "@/components/applicant-table/ColumnVisibility";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

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

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState<ColumnConfig[]>(() => {
        // Try to load from localStorage with versioning
        const saved = localStorage.getItem('partnerStudentsColumns_v1');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved columns:', e);
            }
        }
        
        // Default columns configuration
        return [
            { id: 'name', label: 'Name', visible: true },
            { id: 'email', label: 'Email', visible: true },
            { id: 'phone', label: 'Phone', visible: true },
            { id: 'whatsapp', label: 'WhatsApp', visible: false },
            { id: 'gender', label: 'Gender', visible: false },
            { id: 'dob', label: 'DOB', visible: false },
            { id: 'cast', label: 'Cast', visible: false },
            { id: 'religion', label: 'Religion', visible: false },
            { id: 'qualification', label: 'Qualification', visible: false },
            { id: 'state', label: 'State', visible: false },
            { id: 'district', label: 'District', visible: false },
            { id: 'block', label: 'Block', visible: false },
            { id: 'pincode', label: 'Pincode', visible: false },
            { id: 'donor', label: 'Donor', visible: false },
            { id: 'stage', label: 'Stage', visible: true },
            { id: 'screening_score', label: 'Screening Round Score', visible: true },
            { id: 'screening_status', label: 'Screening Status', visible: false },
            { id: 'screening_exam_centre', label: 'Screening Centre', visible: false },
            { id: 'lr_status', label: 'LR Status', visible: false },
            { id: 'lr_comments', label: 'LR Comments', visible: false },
            { id: 'cfr_status', label: 'CFR Status', visible: false },
            { id: 'cfr_comments', label: 'CFR Comments', visible: false },
            { id: 'offer_letter_status', label: 'Offer Letter Status', visible: false },
            { id: 'onboarded_status', label: 'Onboarded Status', visible: false },
            { id: 'joining_date', label: 'Joining Date', visible: false },
            { id: 'campus', label: 'Campus', visible: false },
            { id: 'school', label: 'School', visible: false },
            { id: 'notes', label: 'Communication Notes', visible: false },
            { id: 'created_at', label: 'Created At', visible: false },
            { id: 'updated_at', label: 'Updated At', visible: false },
            { id: 'actions', label: 'Actions', visible: true, locked: true },
        ];
    });

    // Clean up old localStorage keys on mount
    useEffect(() => {
        const oldKeys = ['partnerStudentsColumns'];
        oldKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                localStorage.removeItem(key);
            }
        });
    }, []);

    // Save column visibility to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('partnerStudentsColumns_v1', JSON.stringify(visibleColumns));
    }, [visibleColumns]);

    // Column visibility handlers
    const handleColumnToggle = useCallback((columnId: string) => {
        setVisibleColumns((prev) =>
            prev.map((col) =>
                col.id === columnId && !col.locked
                    ? { ...col, visible: !col.visible }
                    : col
            )
        );
    }, []);

    const handleResetToDefault = useCallback(() => {
        const defaultColumns: ColumnConfig[] = [
            { id: 'name', label: 'Name', visible: true },
            { id: 'email', label: 'Email', visible: true },
            { id: 'phone', label: 'Phone', visible: true },
            { id: 'whatsapp', label: 'WhatsApp', visible: false },
            { id: 'gender', label: 'Gender', visible: false },
            { id: 'dob', label: 'DOB', visible: false },
            { id: 'cast', label: 'Cast', visible: false },
            { id: 'religion', label: 'Religion', visible: false },
            { id: 'qualification', label: 'Qualification', visible: false },
            { id: 'state', label: 'State', visible: false },
            { id: 'district', label: 'District', visible: false },
            { id: 'block', label: 'Block', visible: false },
            { id: 'pincode', label: 'Pincode', visible: false },
            { id: 'donor', label: 'Donor', visible: false },
            { id: 'stage', label: 'Stage', visible: true },
            { id: 'screening_score', label: 'Screening Round Score', visible: true },
            { id: 'screening_status', label: 'Screening Status', visible: false },
            { id: 'screening_exam_centre', label: 'Screening Centre', visible: false },
            { id: 'lr_status', label: 'LR Status', visible: false },
            { id: 'lr_comments', label: 'LR Comments', visible: false },
            { id: 'cfr_status', label: 'CFR Status', visible: false },
            { id: 'cfr_comments', label: 'CFR Comments', visible: false },
            { id: 'offer_letter_status', label: 'Offer Letter Status', visible: false },
            { id: 'onboarded_status', label: 'Onboarded Status', visible: false },
            { id: 'joining_date', label: 'Joining Date', visible: false },
            { id: 'campus', label: 'Campus', visible: false },
            { id: 'school', label: 'School', visible: false },
            { id: 'notes', label: 'Communication Notes', visible: false },
            { id: 'created_at', label: 'Created At', visible: false },
            { id: 'updated_at', label: 'Updated At', visible: false },
            { id: 'actions', label: 'Actions', visible: true, locked: true },
        ];
        setVisibleColumns(defaultColumns);
        localStorage.setItem('partnerStudentsColumns_v1', JSON.stringify(defaultColumns));
        toast({
            title: "✅ Columns Reset",
            description: "Column visibility has been reset to default settings.",
        });
    }, [toast]);

    const isColumnVisible = useCallback((columnId: string) => {
        const column = visibleColumns.find((col) => col.id === columnId);
        return column ? column.visible : false;
    }, [visibleColumns]);

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

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedStudent(null);
        // Reload data to reflect any changes made in the modal
        loadData();
    };

    // Helper function to get cell value for a given column
    const getCellValue = useCallback((student: any, columnId: string) => {
        const fullName = student.name ||
            `${student.first_name || ""} ${student.middle_name || ""} ${student.last_name || ""}`.trim() ||
            "N/A";

        switch (columnId) {
            case 'name':
                return fullName;
            case 'email':
                return student.email || "-";
            case 'phone':
                return student.phone_number || "-";
            case 'whatsapp':
                return student.whatsapp_number || "-";
            case 'gender':
                return student.gender || "-";
            case 'dob':
                return student.dob ? new Date(student.dob).toLocaleDateString("en-GB") : "-";
            case 'cast':
                return student.cast_name || student.cast || "-";
            case 'religion':
                return student.religion_name || student.religion || "-";
            case 'qualification':
                return student.qualification_name || student.qualification || "-";
            case 'state':
                return student.state_name || student.state || "-";
            case 'district':
                return student.district_name || student.district || "-";
            case 'block':
                return student.block_name || student.block || "-";
            case 'pincode':
                return student.pincode || "-";
            case 'donor':
                return student.donor_name || student.donor?.donor_name || "-";
            case 'stage':
                return student.stage_name || student.stage || "-";
            case 'screening_score':
                return getStudentScore(student);
            case 'screening_status':
                return student.exam_sessions?.[0]?.status || "-";
            case 'screening_exam_centre':
                return student.exam_sessions?.[0]?.exam_centre || "-";
            case 'lr_status':
                return student.interview_learner_round?.[0]?.learning_round_status || "-";
            case 'lr_comments':
                return student.interview_learner_round?.[0]?.comments || "-";
            case 'cfr_status':
                return student.interview_cultural_fit_round?.[0]?.cultural_fit_status || "-";
            case 'cfr_comments':
                return student.interview_cultural_fit_round?.[0]?.comments || "-";
            case 'offer_letter_status':
                return student.final_decisions?.[0]?.offer_letter_status || "-";
            case 'onboarded_status':
                return student.final_decisions?.[0]?.onboarded_status || "-";
            case 'final_notes':
                return student.final_decisions?.[0]?.final_notes || "-";
            case 'joining_date':
                return student.final_decisions?.[0]?.joining_date 
                    ? new Date(student.final_decisions[0].joining_date).toLocaleDateString("en-GB")
                    : "-";
            case 'campus':
                return student.campus_name || student.campus?.campus_name || "-";
            case 'school':
                return student.school_name || student.school?.name || "-";
            case 'notes':
                return student.notes || "-";
            case 'created_at':
                return student.created_at ? new Date(student.created_at).toLocaleDateString("en-GB") : "-";
            case 'updated_at':
                return student.updated_at ? new Date(student.updated_at).toLocaleDateString("en-GB") : "-";
            default:
                return "-";
        }
    }, []);

    // Helper function to get student status
    const getStudentStatus = (student) => {
        // Check current_status_name first (if directly available)
        // if (student.current_status_name) return student.current_status_name;
        
        // Determine status based on stage
        const stage = (student.stage_name || student.stage || "").toLowerCase();
        
        // Special case: If stage is Onboarded, status should also be Onboarded
        if (stage.includes("onboarded")) {
            return "Onboarded";
        }
        
        // 1. Screening Round - get status from exam_sessions
        if (stage.includes("screening") || stage.includes("exam")) {
            if (student.exam_sessions && student.exam_sessions.length > 0) {
                const latestExam = student.exam_sessions[0];
                if (latestExam.status) return latestExam.status;
            }
        }
        
        // 2. Interview Round - check learning round and cultural fit round
        if (stage.includes("interview")) {

                // Check cultural fit round status
            if (student.interview_cultural_fit_round && student.interview_cultural_fit_round.length > 0) {
                const culturalRound = student.interview_cultural_fit_round[0];
                if (culturalRound.cultural_fit_status) return culturalRound.cultural_fit_status;
            }
            // Check learning round status
            if (student.interview_learner_round && student.interview_learner_round.length > 0) {
                const learningRound = student.interview_learner_round[0];
                if (learningRound.learning_round_status) return learningRound.learning_round_status;
            }
            
               }
        
        // 3. Final Decision - check offer letter and onboarding status
        if (stage.includes("final") || stage.includes("decision") || stage.includes("offer")) {
            if (student.final_decisions && student.final_decisions.length > 0) {
                const finalDecision = student.final_decisions[0];
                
                // Onboarding status has higher priority
                if (finalDecision.onboarded_status) return finalDecision.onboarded_status;
                
                // Offer letter status
                if (finalDecision.offer_letter_status) return finalDecision.offer_letter_status;
            }
        }
        
        // Fallback to current_status if nothing else found
        if (student.current_status) return student.current_status;
        
        return "N/A";
    };

    // Helper function to get student score from last screening round
    const getStudentScore = (student) => {
        // Check if total_score exists
        if (student.total_score !== null && student.total_score !== undefined) {
            return student.total_score;
        }
        
        // Check exam sessions for obtained marks
        if (student.exam_sessions && student.exam_sessions.length > 0) {
            const latestExam = student.exam_sessions[0];
            if (latestExam.obtained_marks !== null && latestExam.obtained_marks !== undefined) {
                return latestExam.obtained_marks;
            }
        }
        
        return "-";
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
                <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 mt-12 md:mt-0">
                    {/* Page Header */}
                    <div className="flex flex-col gap-3">
                         {/* Back button */}
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigate("/partners")}
                            className="flex items-center gap-2 w-fit"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                                {partner ? `${partner.partner_name || partner.name} Students` : "Partner Students"}
                            </h1>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                            View and manage students associated with this partner
                            </p>
                        </div>
                        {/* Back button - shown on desktop */}
                        {/* <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => navigate("/partners")}
                            className="hidden md:flex items-center gap-2 shrink-0"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Partners
                        </Button> */}
                    </div>                    {/* Charts Section with Tabs */}
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
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
                                <div className="flex flex-col">
                                    <CardTitle className="text-lg sm:text-xl">Student List ({totalStudents})</CardTitle>
                                    <CardDescription className="text-xs sm:text-sm mt-1">
                                        View and manage students from this partner
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ColumnVisibility
                                        columns={visibleColumns}
                                        onColumnToggle={handleColumnToggle}
                                        onResetToDefault={handleResetToDefault}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Search Bar */}
                            <div className="mb-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search by name"
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
                                            {isColumnVisible('name') && <TableHead className="font-bold min-w-[150px]">Name</TableHead>}
                                            {isColumnVisible('email') && <TableHead className="font-bold min-w-[180px] sticky left-0 bg-background z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Email</TableHead>}
                                            {isColumnVisible('phone') && <TableHead className="font-bold min-w-[120px]">Phone</TableHead>}
                                            {isColumnVisible('whatsapp') && <TableHead className="font-bold min-w-[120px]">WhatsApp</TableHead>}
                                            {isColumnVisible('gender') && <TableHead className="font-bold min-w-[80px]">Gender</TableHead>}
                                            {isColumnVisible('dob') && <TableHead className="font-bold min-w-[100px]">DOB</TableHead>}
                                            {isColumnVisible('cast') && <TableHead className="font-bold min-w-[100px]">Cast</TableHead>}
                                            {isColumnVisible('religion') && <TableHead className="font-bold min-w-[100px]">Religion</TableHead>}
                                            {isColumnVisible('qualification') && <TableHead className="font-bold min-w-[120px]">Qualification</TableHead>}
                                            {isColumnVisible('state') && <TableHead className="font-bold min-w-[100px]">State</TableHead>}
                                            {isColumnVisible('district') && <TableHead className="font-bold min-w-[100px]">District</TableHead>}
                                            {isColumnVisible('block') && <TableHead className="font-bold min-w-[100px]">Block</TableHead>}
                                            {isColumnVisible('pincode') && <TableHead className="font-bold min-w-[80px]">Pincode</TableHead>}
                                            {isColumnVisible('donor') && <TableHead className="font-bold min-w-[120px]">Donor</TableHead>}
                                            {isColumnVisible('stage') && <TableHead className="font-bold min-w-[120px]">Stage</TableHead>}
                                            {isColumnVisible('screening_score') && <TableHead className="font-bold min-w-[100px]">Screening Score</TableHead>}
                                            {isColumnVisible('screening_status') && <TableHead className="font-bold min-w-[120px]">Screening Status</TableHead>}
                                            {isColumnVisible('screening_exam_centre') && <TableHead className="font-bold min-w-[120px]">Screening Centre</TableHead>}
                                            {isColumnVisible('lr_status') && <TableHead className="font-bold min-w-[100px]">LR Status</TableHead>}
                                            {isColumnVisible('lr_comments') && <TableHead className="font-bold min-w-[150px]">LR Comments</TableHead>}
                                            {isColumnVisible('cfr_status') && <TableHead className="font-bold min-w-[100px]">CFR Status</TableHead>}
                                            {isColumnVisible('cfr_comments') && <TableHead className="font-bold min-w-[150px]">CFR Comments</TableHead>}
                                            {isColumnVisible('offer_letter_status') && <TableHead className="font-bold min-w-[120px]">Offer Letter Status</TableHead>}
                                            {isColumnVisible('onboarded_status') && <TableHead className="font-bold min-w-[120px]">Onboarded Status</TableHead>}
                                            {isColumnVisible('final_notes') && <TableHead className="font-bold min-w-[150px]">Final Notes</TableHead>}
                                            {isColumnVisible('joining_date') && <TableHead className="font-bold min-w-[100px]">Joining Date</TableHead>}
                                            {isColumnVisible('campus') && <TableHead className="font-bold min-w-[120px]">Campus</TableHead>}
                                            {isColumnVisible('school') && <TableHead className="font-bold min-w-[120px]">School</TableHead>}
                                            {isColumnVisible('notes') && <TableHead className="font-bold min-w-[150px]">Notes</TableHead>}
                                            {isColumnVisible('created_at') && <TableHead className="font-bold min-w-[100px]">Created At</TableHead>}
                                            {isColumnVisible('updated_at') && <TableHead className="font-bold min-w-[100px]">Updated At</TableHead>}
                                            {isColumnVisible('actions') && <TableHead className="font-bold min-w-[80px]">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={visibleColumns.filter(col => col.visible).length} className="h-24 text-center">Loading...</TableCell>
                                            </TableRow>
                                        ) : students.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={visibleColumns.filter(col => col.visible).length} className="h-24 text-center text-muted-foreground">No students found.</TableCell>
                                            </TableRow>
                                        ) : (
                                            students.map((student, idx) => (
                                                <TableRow key={student.id || idx}>
                                                    {isColumnVisible('name') && (
                                                        <TableCell className="font-medium">
                                                            {getCellValue(student, 'name')}
                                                        </TableCell>
                                                    )}
                                                    {isColumnVisible('email') && (
                                                        <TableCell className="sticky left-0 bg-background z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{getCellValue(student, 'email')}</TableCell>
                                                    )}
                                                    {isColumnVisible('phone') && (
                                                        <TableCell>{getCellValue(student, 'phone')}</TableCell>
                                                    )}
                                                    {isColumnVisible('whatsapp') && (
                                                        <TableCell>{getCellValue(student, 'whatsapp')}</TableCell>
                                                    )}
                                                    {isColumnVisible('gender') && (
                                                        <TableCell>{getCellValue(student, 'gender')}</TableCell>
                                                    )}
                                                    {isColumnVisible('dob') && (
                                                        <TableCell>{getCellValue(student, 'dob')}</TableCell>
                                                    )}
                                                    {isColumnVisible('cast') && (
                                                        <TableCell>{getCellValue(student, 'cast')}</TableCell>
                                                    )}
                                                    {isColumnVisible('religion') && (
                                                        <TableCell>{getCellValue(student, 'religion')}</TableCell>
                                                    )}
                                                    {isColumnVisible('qualification') && (
                                                        <TableCell>{getCellValue(student, 'qualification')}</TableCell>
                                                    )}
                                                    {isColumnVisible('state') && (
                                                        <TableCell>{getCellValue(student, 'state')}</TableCell>
                                                    )}
                                                    {isColumnVisible('district') && (
                                                        <TableCell>{getCellValue(student, 'district')}</TableCell>
                                                    )}
                                                    {isColumnVisible('block') && (
                                                        <TableCell>{getCellValue(student, 'block')}</TableCell>
                                                    )}
                                                    {isColumnVisible('pincode') && (
                                                        <TableCell>{getCellValue(student, 'pincode')}</TableCell>
                                                    )}
                                                    {isColumnVisible('donor') && (
                                                        <TableCell>{getCellValue(student, 'donor')}</TableCell>
                                                    )}
                                                    {isColumnVisible('stage') && (
                                                        <TableCell>{getCellValue(student, 'stage')}</TableCell>
                                                    )}
                                                    {isColumnVisible('screening_score') && (
                                                        <TableCell>{getCellValue(student, 'screening_score')}</TableCell>
                                                    )}
                                                    {isColumnVisible('screening_status') && (
                                                        <TableCell>{getCellValue(student, 'screening_status')}</TableCell>
                                                    )}
                                                    {isColumnVisible('screening_exam_centre') && (
                                                        <TableCell>{getCellValue(student, 'screening_exam_centre')}</TableCell>
                                                    )}
                                                    {isColumnVisible('lr_status') && (
                                                        <TableCell>{getCellValue(student, 'lr_status')}</TableCell>
                                                    )}
                                                    {isColumnVisible('lr_comments') && (
                                                        <TableCell className="max-w-[200px] truncate">{getCellValue(student, 'lr_comments')}</TableCell>
                                                    )}
                                                    {isColumnVisible('cfr_status') && (
                                                        <TableCell>{getCellValue(student, 'cfr_status')}</TableCell>
                                                    )}
                                                    {isColumnVisible('cfr_comments') && (
                                                        <TableCell className="max-w-[200px] truncate">{getCellValue(student, 'cfr_comments')}</TableCell>
                                                    )}
                                                    {isColumnVisible('offer_letter_status') && (
                                                        <TableCell>{getCellValue(student, 'offer_letter_status')}</TableCell>
                                                    )}
                                                    {isColumnVisible('onboarded_status') && (
                                                        <TableCell>{getCellValue(student, 'onboarded_status')}</TableCell>
                                                    )}
                                                    {isColumnVisible('final_notes') && (
                                                        <TableCell className="max-w-[200px] truncate">{getCellValue(student, 'final_notes')}</TableCell>
                                                    )}
                                                    {isColumnVisible('joining_date') && (
                                                        <TableCell>{getCellValue(student, 'joining_date')}</TableCell>
                                                    )}
                                                    {isColumnVisible('campus') && (
                                                        <TableCell>{getCellValue(student, 'campus')}</TableCell>
                                                    )}
                                                    {isColumnVisible('school') && (
                                                        <TableCell>{getCellValue(student, 'school')}</TableCell>
                                                    )}
                                                    {isColumnVisible('notes') && (
                                                        <TableCell className="max-w-[200px] truncate">{getCellValue(student, 'notes')}</TableCell>
                                                    )}
                                                    {isColumnVisible('created_at') && (
                                                        <TableCell>{getCellValue(student, 'created_at')}</TableCell>
                                                    )}
                                                    {isColumnVisible('updated_at') && (
                                                        <TableCell>{getCellValue(student, 'updated_at')}</TableCell>
                                                    )}
                                                    {isColumnVisible('actions') && (
                                                        <TableCell>
                                                            <Button variant="ghost" size="icon" onClick={() => handleViewStudent(student)}>
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    )}
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
                                                        <p className="font-medium">{student.phone_number || student.whatsapp_number || "-"}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Stage:</span>
                                                        <p className="font-medium">{student.stage_name || student.stage || "-"}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Screening Round Score:</span>
                                                        <p className="font-medium">{getStudentScore(student)}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Status:</span>
                                                        <div className="mt-1">
                                                            <Badge variant="secondary" className="font-normal text-xs">
                                                                {getStudentStatus(student)}
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
                onClose={handleCloseModal}
                applicant={selectedStudent}
            />
        </div>
    );
};

export default PartnerStudents;
