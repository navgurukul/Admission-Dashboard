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
import { ArrowLeft, Download } from "lucide-react";
import { getStudentsByPartnerId, getPartnerById } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PartnerStudents = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [students, setStudents] = useState([]);
    const [partner, setPartner] = useState(null); // To show partner name header
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        if (id) {
            loadData();
            loadPartnerDetails();
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

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getStudentsByPartnerId(id, page, 50); // Fetch more per page for full view
            let studentList = [];
            let totalCount = 0;

            if (data && data.data && Array.isArray(data.data)) {
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
            toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                                        </TableRow>
                                    ) : students.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No students found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        students.map((student, idx) => (
                                            <TableRow key={student.id || idx}>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell>{student.email}</TableCell>
                                                <TableCell>{student.mobile || "-"}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-normal">
                                                        {student.current_status || "N/A"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{student.stage || "-"}</TableCell>
                                                <TableCell>{student.total_score || "-"}</TableCell>
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
        </div>
    );
};

export default PartnerStudents;
