import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import {
  Plus,
  X,
  Download,
  Eye,
  Search,
  Filter,
  MoreVertical,
  Trash2,
  ExternalLink,
  MapPin,
  FileText,
  Users,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPartners, createPartner, updatePartner, deletePartner, Partner, getStudentsByPartnerId } from "@/utils/api";

const columns = [
  "Partner",
  "Contact Info",
  "Districts",
  "Slug",
  "Status", // Added for visual balance, though logic might not be real
  "Actions",
];

const ROWS_PER_PAGE = 10;

const defaultPartnerForm = {
  name: "",
  emails: [""],
  notes: "",
  slug: "",
  districts: [""],
};


const PartnerPage = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [page, setPage] = useState(1);
  const [editDialog, setEditDialog] = useState({
    open: false,
    idx: null,
    form: defaultPartnerForm,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDialog, setFilterDialog] = useState(false);
  const [filters, setFilters] = useState({
    district: "",
    slug: "",
    emailDomain: "",
  });
  const [addDialog, setAddDialog] = useState({
    open: false,
    form: defaultPartnerForm,
  });

  // Student View State
  const [partnerStudents, setPartnerStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsTotal, setStudentsTotal] = useState(0);

  const { toast } = useToast();

  const loadPartners = async () => {
    setLoading(true);
    try {
      const data = await getPartners();
      // Stronger check to ensure we get an array
      let partnersArray = [];
      if (Array.isArray(data)) {
        partnersArray = data;
      } else if (data && Array.isArray(data.data)) {
        partnersArray = data.data;
      }

      setPartners(partnersArray);
      setLoading(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch partners", variant: "destructive" });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  // Filter partners based on search query and filters
  const filteredPartners = partners.filter((partner) => {
    const matchesSearch =
      !searchQuery.trim() ||
      partner.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.slug?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = filters.district
      ? (partner.districts || []).some((d) =>
        d.toLowerCase().includes(filters.district.toLowerCase()),
      )
      : true;
    const matchesSlug = filters.slug
      ? partner.slug?.toLowerCase().includes(filters.slug.toLowerCase())
      : true;
    const matchesEmailDomain = filters.emailDomain
      ? partner.email?.toLowerCase().endsWith(filters.emailDomain.toLowerCase())
      : true;
    return (
      matchesSearch && matchesDistrict && matchesSlug && matchesEmailDomain
    );
  });

  // Reset page to 1 when search or filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, filters]);

  const paginatedPartners = filteredPartners.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE,
  );
  const totalPages = Math.ceil(filteredPartners.length / ROWS_PER_PAGE);

  // Stats
  const totalPartners = partners.length;
  const activeDistricts = new Set(
    partners.flatMap((p) => p.districts || []),
  ).size;
  const totalStudents = partners.reduce((acc, curr) => acc + (curr.student_count || 0), 0); // Assuming student_count exists or 0


  // CSV Download
  const handleDownloadCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Slug",
      "Districts",
      "Notes",
      "Meraki Link"
    ];
    const rows = paginatedPartners.map((partner) => [
      partner.partner_name,
      partner.email,
      partner.slug,
      (partner.districts || []).join("; "),
      partner.notes,
      partner.meraki_link || "-",
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "partners.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "CSV file downloaded successfully",
    });
  };

  // Logic handlers
  const handleCreateMerakiLink = (idx) => {
    setPartners((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        meraki_link: `https://dummy-meraki-link.com/partner/${updated[idx].id}`,
      };
      return updated;
    });
  };

  // Edit Dialog
  const openEditDialog = (idx) => {
    const realIdx = (page - 1) * ROWS_PER_PAGE + idx;
    const partner = paginatedPartners[idx]; // Use paginated index for display, but need real index for update if modifying 'partners' array directly.
    // Actually, simpler to find by ID if possible, but assuming index based on paginated view needs mapping.
    // Let's find the original index in `partners` array.
    const originalIndex = partners.findIndex(p => p.id === partner.id);

    setEditDialog({
      open: true,
      idx: originalIndex,
      form: {
        name: partner.partner_name || "",
        emails: partner.email ? [partner.email] : [""],
        notes: partner.notes || "",
        slug: partner.slug || "",
        districts:
          partner.districts && partner.districts.length > 0
            ? [...partner.districts]
            : [""],
      },
    });
  };

  const closeEditDialog = () => {
    setEditDialog({ open: false, idx: null, form: defaultPartnerForm });
  };

  const handleEditFormChange = (field, value) => {
    setEditDialog((d) => ({ ...d, form: { ...d.form, [field]: value } }));
  };
  // Simplified array handlers for edit
  const handleEditArrayChange = (field, i, value) => {
    setEditDialog(d => ({
      ...d,
      form: {
        ...d.form,
        [field]: d.form[field].map((item, idx) => idx === i ? value : item)
      }
    }))
  }
  const addEditArrayItem = (field) => {
    setEditDialog(d => ({
      ...d,
      form: { ...d.form, [field]: [...d.form[field], ""] }
    }))
  }
  const removeEditArrayItem = (field, i) => {
    setEditDialog(d => ({
      ...d,
      form: { ...d.form, [field]: d.form[field].filter((_, idx) => idx !== i) }
    }))
  }


  const handleEditSubmit = async (e) => {
    e.preventDefault();
    // Use the original index from the dialog
    const idx = editDialog.idx;
    if (idx === null || idx === undefined || idx < 0) return;

    // Find partner by index in the main array
    const partnerToUpdate = partners[idx];
    if (!partnerToUpdate || !partnerToUpdate.id) return;

    try {
      await updatePartner(partnerToUpdate.id, {
        partner_name: editDialog.form.name,
        slug: editDialog.form.slug,
        email: editDialog.form.emails[0], // API expects single email string? Adjust if array.
        districts: editDialog.form.districts,
        notes: editDialog.form.notes,
      });
      toast({ title: "Updated", description: "Partner details updated successfully." });
      closeEditDialog();
      loadPartners();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update partner", variant: "destructive" });
    }
  };

  // Add Dialog
  const openAddDialog = () => setAddDialog({ open: true, form: defaultPartnerForm });
  const closeAddDialog = () => setAddDialog({ open: false, form: defaultPartnerForm });
  const handleAddFormChange = (field, value) => {
    setAddDialog((d) => ({ ...d, form: { ...d.form, [field]: value } }));
  };
  const handleAddArrayChange = (field, i, value) => {
    setAddDialog(d => ({
      ...d,
      form: {
        ...d.form,
        [field]: d.form[field].map((item, idx) => idx === i ? value : item)
      }
    }))
  }
  const addAddArrayItem = (field) => {
    setAddDialog(d => ({
      ...d,
      form: { ...d.form, [field]: [...d.form[field], ""] }
    }))
  }
  const removeAddArrayItem = (field, i) => {
    setAddDialog(d => ({
      ...d,
      form: { ...d.form, [field]: d.form[field].filter((_, idx) => idx !== i) }
    }))
  }


  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (
      !addDialog.form.name.trim() ||
      !addDialog.form.slug.trim()
    ) {
      toast({ title: "Error", description: "Please fill in all required fields (Name and Slug).", variant: "destructive" });
      return;
    }

    try {
      await createPartner({
        partner_name: addDialog.form.name,
        slug: addDialog.form.slug,
        email: addDialog.form.emails[0],
        districts: addDialog.form.districts,
        notes: addDialog.form.notes,
      });
      toast({ title: "Success", description: "Partner added successfully!" });
      closeAddDialog();
      loadPartners();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create partner", variant: "destructive" });
    }
  };

  const loadPartnerStudents = async (partnerId, page = 1) => {
    setStudentsLoading(true);
    try {
      const data = await getStudentsByPartnerId(partnerId, page, 10);

      // Handle response structure variations
      let students = [];
      let total = 0;

      if (data && data.data && Array.isArray(data.data)) {
        students = data.data;
        total = data.total || data.count || data.data.length; // Adjust based on API
      } else if (Array.isArray(data)) {
        students = data;
        total = data.length;
      } else if (data && data.students && Array.isArray(data.students)) {
        students = data.students;
        total = data.total || data.students.length;
      }

      setPartnerStudents(students);
      setStudentsTotal(total);
      setStudentsLoading(false);
    } catch (error) {
      console.error("Failed to fetch students", error);
      toast({ title: "Error", description: "Failed to fetch students.", variant: "destructive" });
      setPartnerStudents([]);
      setStudentsLoading(false);
    }
  };

  const handleViewAssessments = (partner) => {
    setSelectedPartner(partner);
    setShowAssessmentModal(true);
    setStudentsPage(1);
    loadPartnerStudents(partner.id, 1);
  };
  const handleCreateAssessment = (partner) => {
    setSelectedPartner(partner);
    setShowCreateModal(true);
  };

  const handleDeletePartner = async (id) => {
    if (!confirm("Are you sure you want to delete this partner?")) return;
    try {
      await deletePartner(id);
      toast({ title: "Deleted", description: "Partner deleted successfully." });
      loadPartners();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete partner", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex">
      <AdmissionsSidebar />
      <main className="md:ml-64 flex-1 p-6 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header & Stats */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Partners</h1>
                <p className="text-muted-foreground mt-1">Manage network partners, track performance, and create assessments.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleDownloadCSV} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={openAddDialog} size="sm" className="bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Partner
                </Button>
              </div>
            </div>

            {/* KPI/Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalPartners}</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Districts</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeDistricts}</div>
                  <p className="text-xs text-muted-foreground">Across the country</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalStudents || "-"}</div>
                  <p className="text-xs text-muted-foreground">Registered via partners</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assessments</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">128</div>
                  <p className="text-xs text-muted-foreground">Completed this week</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters and Search */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium">Filters & Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, email, or slug..."
                    className="pl-9 bg-background"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  {/* Optional: Add Dropdown Filters here directly instead of modal if simple */}
                  <Button variant="outline" onClick={() => setFilterDialog(true)}>
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced Filters
                  </Button>
                  {Object.values(filters).some(Boolean) && (
                    <Button variant="ghost" onClick={() => setFilters({ district: "", slug: "", emailDomain: "" })}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Table */}
          <Card className="shadow-md border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[250px]">Partner Details</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Districts</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          Loading data...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No partners found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPartners.map((partner, idx) => (
                      <TableRow key={partner.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span
                              className="font-semibold text-foreground cursor-pointer hover:text-primary hover:underline"
                              onClick={() => navigate(`/partners/${partner.id}/students`)}
                            >
                              {partner.partner_name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{partner.notes || "No notes"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-foreground">
                            {partner.email || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(partner.districts || []).map((d, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0">{d}</Badge>
                            ))}
                            {(!partner.districts || partner.districts.length === 0) && <span className="text-xs text-muted-foreground">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 py-0.5 rounded border">{partner.slug || "N/A"}</code>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditDialog(idx)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewAssessments(partner)}>
                                <Eye className="mr-2 h-4 w-4" /> View Assessments
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCreateAssessment(partner)}>
                                <FileText className="mr-2 h-4 w-4" /> Create Assessment
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeletePartner(partner.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Partner
                              </DropdownMenuItem>
                              {partner.meraki_link ? (
                                <DropdownMenuItem onClick={() => {
                                  navigator.clipboard.writeText(partner.meraki_link);
                                  toast({ title: "Copied!", description: "Link copied to clipboard." });
                                }}>
                                  <ExternalLink className="mr-2 h-4 w-4" /> Copy Meraki Link
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleCreateMerakiLink((page - 1) * ROWS_PER_PAGE + idx)}>
                                  <ExternalLink className="mr-2 h-4 w-4" /> Generate Link
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/20">
              <div className="text-xs text-muted-foreground">
                Showing <strong>{(page - 1) * ROWS_PER_PAGE + 1}</strong> to <strong>{Math.min(page * ROWS_PER_PAGE, filteredPartners.length)}</strong> of <strong>{filteredPartners.length}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>

        </div>

        {/* ADD PARTNER DIALOG */}
        <Dialog open={addDialog.open} onOpenChange={(open) => !open && closeAddDialog()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Partner</DialogTitle>
              <DialogDescription>Enter the details of the new partner organization.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid gap-2">
                <Label htmlFor="name">Partner Name</Label>
                <Input id="name" value={addDialog.form.name} onChange={(e) => handleAddFormChange("name", e.target.value)} placeholder="e.g. NavGurukul" />
              </div>
              <div className="grid gap-2">
                <Label>Emails</Label>
                {addDialog.form.emails.map((email, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={email} onChange={(e) => handleAddArrayChange("emails", i, e.target.value)} placeholder="contact@example.com" />
                    {addDialog.form.emails.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeAddArrayItem("emails", i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="link" size="sm" onClick={() => addAddArrayItem("emails")} className="justify-start px-0 text-primary">+ Add another email</Button>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={addDialog.form.slug} onChange={(e) => handleAddFormChange("slug", e.target.value)} placeholder="unique-slug-id" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" value={addDialog.form.notes} onChange={(e) => handleAddFormChange("notes", e.target.value)} placeholder="Additional details..." />
              </div>
              <div className="grid gap-2">
                <Label>Districts</Label>
                {addDialog.form.districts.map((d, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={d} onChange={(e) => handleAddArrayChange("districts", i, e.target.value)} placeholder="District Name" />
                    {addDialog.form.districts.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeAddArrayItem("districts", i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="link" size="sm" onClick={() => addAddArrayItem("districts")} className="justify-start px-0 text-primary">+ Add another district</Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeAddDialog}>Cancel</Button>
              <Button onClick={handleAddSubmit}>Save Partner</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EDIT PARTNER DIALOG */}
        <Dialog open={editDialog.open} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Partner</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Partner Name</Label>
                <Input id="edit-name" value={editDialog.form.name} onChange={(e) => handleEditFormChange("name", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Emails</Label>
                {editDialog.form.emails.map((email, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={email} onChange={(e) => handleEditArrayChange("emails", i, e.target.value)} />
                    {editDialog.form.emails.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeEditArrayItem("emails", i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="link" size="sm" onClick={() => addEditArrayItem("emails")} className="justify-start px-0 text-primary">+ Add another email</Button>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-slug">Slug</Label>
                <Input id="edit-slug" value={editDialog.form.slug} onChange={(e) => handleEditFormChange("slug", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Input id="edit-notes" value={editDialog.form.notes} onChange={(e) => handleEditFormChange("notes", e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Districts</Label>
                {editDialog.form.districts.map((d, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={d} onChange={(e) => handleEditArrayChange("districts", i, e.target.value)} />
                    {editDialog.form.districts.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeEditArrayItem("districts", i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="link" size="sm" onClick={() => addEditArrayItem("districts")} className="justify-start px-0 text-primary">+ Add another district</Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeEditDialog}>Cancel</Button>
              <Button onClick={handleEditSubmit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Filter Dialog (reused simple dialog) */}
        <Dialog open={filterDialog} onOpenChange={setFilterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filter Partners</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>District</Label>
                <Input value={filters.district} onChange={(e) => setFilters(f => ({ ...f, district: e.target.value }))} placeholder="Filter by district" />
              </div>
              <div className="grid gap-2">
                <Label>Slug</Label>
                <Input value={filters.slug} onChange={(e) => setFilters(f => ({ ...f, slug: e.target.value }))} placeholder="Filter by slug" />
              </div>
              <div className="grid gap-2">
                <Label>Email Domain</Label>
                <Input value={filters.emailDomain} onChange={(e) => setFilters(f => ({ ...f, emailDomain: e.target.value }))} placeholder="e.g. gmail.com" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFilterDialog(false)}>Cancel</Button>
              <Button onClick={() => setFilterDialog(false)}>Apply Filters</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ASSESSMENT MODAL - REPURPOSED FOR STUDENTS LIST */}
        <Dialog open={showAssessmentModal} onOpenChange={setShowAssessmentModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Students / Assesssments - {selectedPartner?.partner_name}</DialogTitle>
              <DialogDescription>List of students associated with {selectedPartner?.partner_name}</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">Loading students...</TableCell>
                    </TableRow>
                  ) : partnerStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No students found.</TableCell>
                    </TableRow>
                  ) : (
                    partnerStudents.map((student: any, idx) => (
                      <TableRow key={student.id || idx}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell><Badge variant="outline">{student.current_status || "N/A"}</Badge></TableCell>
                        <TableCell>{student.stage || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Simple Pagination for Modal */}
            <div className="flex items-center justify-between border-t pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={studentsPage === 1 || studentsLoading}
                onClick={() => {
                  const newPage = studentsPage - 1;
                  setStudentsPage(newPage);
                  if (selectedPartner) loadPartnerStudents(selectedPartner.id, newPage);
                }}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {studentsPage}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={partnerStudents.length < 10 || studentsLoading} // Simple check, ideally use total count
                onClick={() => {
                  const newPage = studentsPage + 1;
                  setStudentsPage(newPage);
                  if (selectedPartner) loadPartnerStudents(selectedPartner.id, newPage);
                }}
              >
                Next
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* CREATE ASSESSMENT MODAL PLACEHOLDER */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assessment</DialogTitle>
              <DialogDescription>Create a new assessment for {selectedPartner?.name}</DialogDescription>
            </DialogHeader>
            <div className="py-10 text-center text-muted-foreground">
              Form to create assessment will appear here.
            </div>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default PartnerPage;
