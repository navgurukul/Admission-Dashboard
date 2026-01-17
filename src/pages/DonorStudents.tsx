import React, { useEffect, useState, useMemo } from "react";
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
import { ArrowLeft, Eye } from "lucide-react";
import { getStudentsByDonorId, getDonorById } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ApplicantModal } from "@/components/ApplicantModal";
import { Label } from "@/components/ui/label";

const DonorStudents = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [students, setStudents] = useState([]);
    const [donor, setDonor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalStudents, setTotalStudents] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            loadData();
            loadDonorDetails();
        }
    }, [id, currentPage, itemsPerPage]);

    const loadDonorDetails = async () => {
        try {
            const data = await getDonorById(id);
            let d = data.data || data;
            if (Array.isArray(d)) d = d[0];
            setDonor(d);
        } catch (error) {
            console.error("Failed to load donor details", error);
        }
    }

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getStudentsByDonorId(id, currentPage, itemsPerPage);
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
            toast({ title: "❌ Unable to Load Students", description: getFriendlyErrorMessage(error), variant: "destructive", className: "border-red-500 bg-red-50 text-red-900" });
        } finally {
            setLoading(false);
        }
    };

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    // Calculate pagination values
    const showingStart = students.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const showingEnd = Math.min(currentPage * itemsPerPage, totalStudents);

    return (
        <div className="min-h-screen bg-muted/40 flex">
            <AdmissionsSidebar />
            <main className="md:ml-64 flex-1 p-6 overflow-y-auto h-screen">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => navigate("/donor")}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                {donor ? `${donor.donor_name || donor.name} Students` : "Donor Students"}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                View and manage students associated with this donor
                            </p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Student List</CardTitle>
                            <CardDescription>
                                {totalStudents} {totalStudents === 1 ? 'student' : 'students'} associated with this donor
                            </CardDescription>
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
                                            <TableRow>
                                                <TableCell colSpan={7} className="h-24 text-center">Loading...</TableCell>
                                            </TableRow>
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
                                                        {student.current_status || student.status || "N/A"}
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
                            {!loading && students.length > 0 && (
                                <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/20 mt-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing <strong>{showingStart}</strong> - <strong>{showingEnd}</strong> of <strong>{totalStudents}</strong>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="flex items-center gap-2">
                                            <Label className="text-sm text-muted-foreground whitespace-nowrap">Rows:</Label>
                                            <select
                                                value={itemsPerPage}
                                                onChange={(e) => {
                                                    setItemsPerPage(Number(e.target.value));
                                                    setCurrentPage(1);
                                                }}
                                                className="border rounded px-2 py-1 text-sm h-8"
                                            >
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                        </div>
                                        <span className="text-sm text-muted-foreground px-2">
                                            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="h-8"
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="h-8"
                                        >
                                            Next
                                        </Button>
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

export default DonorStudents;
