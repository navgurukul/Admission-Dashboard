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
import { ArrowLeft, Download, Eye } from "lucide-react";
import { getStudentsByPartnerId, getPartnerById } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicantModal } from "@/components/ApplicantModal";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const COLORS = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d",
    "#a4de6c", "#d0ed57", "#ffc658", "#ff8042", "#ffbb28", "#8dd1e1",
    "#83a6ed", "#8e44ad", "#e74c3c", "#3498db", "#2ecc71", "#f1c40f"
];

const RADIAN = Math.PI / 180;

// Simplified version for all labels to be visible always
const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, index, value, fill, payload } = props;
    const name = props.name || payload?.name || "Unknown";
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius) * cos;
    const sy = cy + (outerRadius) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={4} textAnchor={textAnchor} fill="#333" fontSize={10}>
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
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            loadData();
            loadPartnerDetails();
            loadChartData();
        }
    }, [id, page]);

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
            const data = await getStudentsByPartnerId(id, page, 50);
            let studentList = [];
            let totalCount = 0;
            if (data?.data?.data && Array.isArray(data.data.data)) {
                studentList = data.data.data;
                totalCount = data.data.total || data.total || studentList.length;
            } else if (data && data.data && Array.isArray(data.data)) {
                studentList = data.data;
                totalCount = data.total || studentList.length;
            } else if (Array.isArray(data)) {
                studentList = data;
                totalCount = data.length;
            } else if (data && data.students && Array.isArray(data.students)) {
                studentList = data.students;
                totalCount = data.total || data.students.length;
            }
            setStudents(studentList);
            setTotal(totalCount);
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
    const processChartData = (getDataFn: (student: any) => string) => {
        const dataMap = {};
        chartStudents.forEach((student) => {
            const key = getDataFn(student) || "Unknown/Pending";
            dataMap[key] = (dataMap[key] || 0) + 1;
        });
        return Object.keys(dataMap).map((key) => ({
            name: key,
            value: dataMap[key],
        }));
    };

    const statusData = React.useMemo(() => processChartData(s => s.current_status), [chartStudents]);
    const stageData = React.useMemo(() => processChartData(s => s.stage), [chartStudents]);

    // Detailed lifecycle data
    const screeningData = React.useMemo(() => processChartData(s => s.exam_sessions?.[0]?.status), [chartStudents]);
    const learningData = React.useMemo(() => processChartData(s => s.interview_learner_round?.[0]?.learning_round_status), [chartStudents]);
    const cultureData = React.useMemo(() => processChartData(s => s.interview_cultural_fit_round?.[0]?.cultural_fit_status), [chartStudents]);
    const offerData = React.useMemo(() => processChartData(s => s.final_decisions?.[0]?.offer_letter_status), [chartStudents]);

    const renderPieChart = (data: any[]) => (
        <div className="h-[500px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        innerRadius={80}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="square" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );

    return (
        <div className="min-h-screen bg-muted/40 flex">
            <AdmissionsSidebar />
            <main className="md:ml-64 flex-1 p-6 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate("/partners")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {partner ? `${partner.partner_name || partner.name} Students` : "Partner Students"}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                View and manage students associated with this partner
                            </p>
                        </div>
                    </div>

                    {/* Charts Section with Tabs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Comprehensive Progress Reports (Total: {chartStudents.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {chartLoading ? (
                                <div className="h-64 flex items-center justify-center text-muted-foreground">
                                    Loading chart data...
                                </div>
                            ) : chartStudents.length > 0 ? (
                                <Tabs defaultValue="status" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 max-w-[800px] mb-8 mx-auto">
                                        <TabsTrigger value="status">Status</TabsTrigger>
                                        <TabsTrigger value="stage">Stage</TabsTrigger>
                                        <TabsTrigger value="screening">Screening</TabsTrigger>
                                        <TabsTrigger value="learning">Learning</TabsTrigger>
                                        <TabsTrigger value="culture">Culture Fit</TabsTrigger>
                                        <TabsTrigger value="offer">Offer</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="status" className="flex justify-center">
                                        {renderPieChart(statusData)}
                                    </TabsContent>
                                    <TabsContent value="stage" className="flex justify-center">
                                        {renderPieChart(stageData)}
                                    </TabsContent>
                                    <TabsContent value="screening" className="flex justify-center">
                                        {renderPieChart(screeningData)}
                                    </TabsContent>
                                    <TabsContent value="learning" className="flex justify-center">
                                        {renderPieChart(learningData)}
                                    </TabsContent>
                                    <TabsContent value="culture" className="flex justify-center">
                                        {renderPieChart(cultureData)}
                                    </TabsContent>
                                    <TabsContent value="offer" className="flex justify-center">
                                        {renderPieChart(offerData)}
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
                            <CardTitle>Student List ({total})</CardTitle>
                        </CardHeader>
                        <CardContent>
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
                            {/* Pagination Controls */}
                            <div className="flex items-center justify-end space-x-2 py-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => p + 1)}
                                    // Disable next if we fetched fewer than requested, implying end of list (or use total if reliable)
                                    disabled={students.length < 50}
                                >
                                    Next
                                </Button>
                            </div>
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
