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
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Combobox } from "@/components/ui/combobox";
import { getPartners, createPartner, updatePartner, deletePartner, Partner, getStudentsByPartnerId, getAllStates, getDistrictsByState, getAllQuestionSets, createQuestionSet } from "@/utils/api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const columns = [
  "Partner",
  "Contact Info",
  "Districts",
  "Slug",
  "Actions",
];

const ROWS_PER_PAGE = 10;

const defaultPartnerForm = {
  name: "",
  emails: [""],
  // notes: "",
  slug: "",
  districts: [""],
  state: "",
};


const PartnerPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  // States data
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  // Question Sets State
  const [questionSets, setQuestionSets] = useState([]);
  const [newAssessmentName, setNewAssessmentName] = useState("");
  const [loadingQuestionSets, setLoadingQuestionSets] = useState(false);
  const [partnerSets, setPartnerSets] = useState([]);

  // State for Create Assessment Form
  const [assessmentFormData, setAssessmentFormData] = useState({
    name: "",
    description: "",
    nameType: "random", // Fixed to random for now
    isRandom: true
  });

  // Cleaned up old picker states
  // const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  // const [pendingAssessment, setPendingAssessment] = useState<any>(null);

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

      // Normalize districts to be always an array
      partnersArray = partnersArray.map(p => ({
        ...p,
        districts: Array.isArray(p.districts)
          ? p.districts
          : (typeof p.districts === 'string' ? (p.districts as string).split(',').map(d => d.trim()) : [])
      }));

      setPartners(partnersArray);
      setLoading(false);
    } catch (error) {
      toast({
        title: "❌ Unable to Load Partners",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
    loadStates();
  }, []);

  const loadStates = async () => {
    try {
      const data = await getAllStates();
      // Handle different response formats
      let statesArray = [];
      if (Array.isArray(data)) {
        statesArray = data;
      } else if (data && Array.isArray(data.data)) {
        statesArray = data.data;
      } else if (data && data.data && Array.isArray(data.data.data)) {
        statesArray = data.data.data;
      }
      setStates(statesArray);
    } catch (error) {
      console.error("Failed to load states:", error);
      toast({
        title: "❌ Unable to Load States",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
    }
  };

  const loadDistricts = async (stateCode: string) => {
    try {
      const data = await getDistrictsByState(stateCode);
      // Handle different response formats
      let districtsArray = [];
      if (Array.isArray(data)) {
        districtsArray = data;
      } else if (data && Array.isArray(data.data)) {
        districtsArray = data.data;
      } else if (data && data.data && Array.isArray(data.data.data)) {
        districtsArray = data.data.data;
      }
      setDistricts(districtsArray);
    } catch (error) {
      console.error("Failed to load districts:", error);
      toast({
        title: "❌ Unable to Load Districts",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
      setDistricts([]);
    }
  };

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
      // "Notes",
      "Meraki Link"
    ];
    const rows = paginatedPartners.map((partner) => [
      partner.partner_name,
      partner.email,
      partner.slug,
      (partner.districts || []).join("; "),
      // partner.notes,
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
      title: "✅ CSV Downloaded",
      description: "CSV file downloaded successfully",
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900"
    });
  };

  // Logic handlers
  const handleCreateMerakiLink = (idx) => {
    setPartners((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        meraki_link: `${window.location.origin}/partnerLanding/${updated[idx].slug}`,
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
        // notes: partner.notes || "",
        slug: partner.slug || "",
        districts:
          partner.districts && partner.districts.length > 0
            ? [...partner.districts]
            : [""],
        state: partner.state || "",
      },
    });

    // Load districts if state exists
    if (partner.state) {
      // partner.state is already state_code
      loadDistricts(partner.state);
    }
  };

  const closeEditDialog = () => {
    setEditDialog({ open: false, idx: null, form: defaultPartnerForm });
  };

  const handleEditFormChange = (field, value) => {
    setEditDialog((d) => {
      const newForm = { ...d.form, [field]: value };

      // Load districts when state changes
      if (field === "state" && value) {
        // value is already state_code
        loadDistricts(value);
        // Reset districts when state changes
        newForm.districts = [""];
      }

      return { ...d, form: newForm };
    });
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

    // Validate all fields
    const hasValidEmail = editDialog.form.emails.some(e => e.trim() !== "");
    const hasValidDistrict = editDialog.form.districts.some(d => d.trim() !== "");

    // Collect missing fields
    const missingFields: string[] = [];
    if (!editDialog.form.name.trim()) missingFields.push("Partner Name");
    if (!editDialog.form.slug.trim()) missingFields.push("Slug");
    if (!hasValidEmail) missingFields.push("Email");
    if (!editDialog.form.state.trim()) missingFields.push("State");
    if (!hasValidDistrict) missingFields.push("District");
    // if (!editDialog.form.notes.trim()) missingFields.push("Notes");

    if (missingFields.length > 0) {
      toast({
        title: "⚠️ Missing Required Fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmail = editDialog.form.emails.find(e => e.trim() !== "" && !emailRegex.test(e.trim()));
    if (invalidEmail) {
      toast({
        title: "⚠️ Invalid Email Format",
        description: `"${invalidEmail}" is not a valid email address. Please use format: example@domain.com`,
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
      return;
    }

    // Find partner by index in the main array
    const partnerToUpdate = partners[idx];
    if (!partnerToUpdate || !partnerToUpdate.id) return;

    try {
      await updatePartner(partnerToUpdate.id, {
        partner_name: editDialog.form.name,
        slug: editDialog.form.slug,
        email: editDialog.form.emails[0], // API expects single email string? Adjust if array.
        state: editDialog.form.state,
        districts: editDialog.form.districts.filter(d => d.trim() !== "").join(',') as any, // Send as string
        // notes: editDialog.form.notes,
      });
      toast({
        title: "✅ Partner Updated",
        description: "Partner details updated successfully.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900"
      });
      closeEditDialog();
      loadPartners();
    } catch (error) {
      toast({
        title: "❌ Unable to Update Partner",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
    }
  };

  // Add Dialog
  const openAddDialog = () => setAddDialog({ open: true, form: defaultPartnerForm });
  const closeAddDialog = () => setAddDialog({ open: false, form: defaultPartnerForm });
  const handleAddFormChange = (field: string, value: string) => {
    setAddDialog((d) => {
      const newForm = { ...d.form, [field]: value };

      // Auto-generate slug from name if the field being changed is 'name'
      if (field === "name") {
        newForm.slug = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphens
          .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
      }

      // Load districts when state changes
      if (field === "state" && value) {
        // value is already state_code
        loadDistricts(value);
        // Reset districts when state changes
        newForm.districts = [""];
      }

      return { ...d, form: newForm };
    });
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
    const hasValidEmail = addDialog.form.emails.some(e => e.trim() !== "");
    const hasValidDistrict = addDialog.form.districts.some(d => d.trim() !== "");

    // Collect missing fields
    const missingFields: string[] = [];
    if (!addDialog.form.name.trim()) missingFields.push("Partner Name");
    if (!addDialog.form.slug.trim()) missingFields.push("Slug");
    if (!hasValidEmail) missingFields.push("Email");
    if (!addDialog.form.state.trim()) missingFields.push("State");
    if (!hasValidDistrict) missingFields.push("District");
    // if (!addDialog.form.notes.trim()) missingFields.push("Notes");

    if (missingFields.length > 0) {
      toast({
        title: "⚠️ Missing Required Fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmail = addDialog.form.emails.find(e => e.trim() !== "" && !emailRegex.test(e.trim()));
    if (invalidEmail) {
      toast({
        title: "⚠️ Invalid Email Format",
        description: `"${invalidEmail}" is not a valid email address. Please use format: example@domain.com`,
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
      return;
    }

    try {
      const cleanDistricts = addDialog.form.districts.filter(d => d.trim() !== "").join(',');

      await createPartner({
        partner_name: addDialog.form.name,
        slug: addDialog.form.slug,
        email: addDialog.form.emails[0],
        state: addDialog.form.state,
        districts: cleanDistricts as any, // Send as string
        // notes: addDialog.form.notes,
      });
      toast({
        title: "✅ Partner Added",
        description: "Partner added successfully!",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900"
      });
      closeAddDialog();
      loadPartners();
    } catch (error) {
      toast({
        title: "❌ Unable to Create Partner",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
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
      toast({
        title: "❌ Unable to Load Students",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
      setPartnerStudents([]);
      setStudentsLoading(false);
    }
  };

  const handleViewAssessments = async (partner) => {
    setSelectedPartner(partner);
    setShowAssessmentModal(true);
    setStudentsPage(1);
    loadPartnerStudents(partner.id, 1);

    try {
      const allSets = await getAllQuestionSets();
      console.log("All Sets:", allSets); // Debug

      const filtered = allSets.filter((s: any) => {
        // Check partnerId if it exists (loose equality for string/number safety)
        // Checking both camelCase and snake_case to be safe with API response
        const idMatch = (s.partnerId && s.partnerId == partner.id) || (s.partner_id && s.partner_id == partner.id);

        // Check description for partner name (case insensitive)
        const descMatch = s.description && s.description.toLowerCase().includes(partner.partner_name.toLowerCase());

        return idMatch || descMatch;
      });

      console.log("Filtered Sets:", filtered); // Debug
      setPartnerSets(filtered);
    } catch (e: any) {
      console.error("Failed to load assessments:", e);
      toast({
        title: "❌ Unable to Load Assessments",
        description: getFriendlyErrorMessage(e),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
    }
  };
  const handleCreateAssessment = async (partner) => {
    setSelectedPartner(partner);
    setShowCreateModal(true);
    setNewAssessmentName("");
  };

  const handleDeletePartner = async (id) => {
    if (!confirm("Are you sure you want to delete this partner?")) return;
    try {
      await deletePartner(id);
      toast({
        title: "✅ Partner Deleted",
        description: "Partner deleted successfully.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900"
      });
      loadPartners();
    } catch (error) {
      toast({
        title: "❌ Unable to Delete Partner",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
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
              {/* <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleDownloadCSV} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button onClick={openAddDialog} size="sm" className="bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Partner
                </Button>
              </div> */}
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
              <div className="flex flex-row justify-between items-center">
                <CardTitle className="text-base font-medium">Filters & Search</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleDownloadCSV} size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="outline" onClick={() => setFilterDialog(true)} size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced Filters
                  </Button>
                  {Object.values(filters).some(Boolean) && (
                    <Button variant="ghost" size="sm" onClick={() => setFilters({ district: "", slug: "", emailDomain: "" })}>
                      Clear
                    </Button>
                  )}
                  <Button onClick={openAddDialog} size="sm" className="bg-primary text-primary-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Partner
                  </Button>
                </div>
              </div>
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
                {/* <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setFilterDialog(true)}>
                    <Filter className="w-4 h-4 mr-2" />
                    Advanced Filters
                  </Button>
                  {Object.values(filters).some(Boolean) && (
                    <Button variant="ghost" onClick={() => setFilters({ district: "", slug: "", emailDomain: "" })}>
                      Clear
                    </Button>
                  )}
                </div> */}
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
                    <TableHead>View Assessment</TableHead>
                    <TableHead>Create Assessment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          Loading data...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
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
                            {/* <span className="text-xs text-muted-foreground truncate max-w-[200px]">{partner.notes || "No notes"}</span> */}
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
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewAssessments(partner)} className="h-8 px-2 text-primary hover:text-primary/80">
                            <Eye className="mr-2 h-4 w-4" /> View
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleCreateAssessment(partner)} className="h-8 px-2 text-primary hover:text-primary/80">
                            <FileText className="mr-2 h-4 w-4" /> Create
                          </Button>
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
                              <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDeletePartner(partner.id)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Partner
                              </DropdownMenuItem>
                              {partner.meraki_link ? (
                                <DropdownMenuItem onClick={() => {
                                  navigator.clipboard.writeText(partner.meraki_link);
                                  toast({
                                    title: "✅ Link Copied",
                                    description: "Link copied to clipboard.",
                                    variant: "default",
                                    className: "border-green-500 bg-green-50 text-green-900"
                                  });
                                }}>
                                  <ExternalLink className="mr-2 h-4 w-4" /> Copy Test Link
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
            <form onSubmit={handleAddSubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="grid gap-2">
                  <Label htmlFor="name">Partner Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    value={addDialog.form.name}
                    onChange={(e) => handleAddFormChange("name", e.target.value)}
                    placeholder="e.g. NavGurukul"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Emails <span className="text-destructive">*</span></Label>
                  {addDialog.form.emails.map((email, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => handleAddArrayChange("emails", i, e.target.value)}
                        placeholder="contact@example.com"
                        required
                      />
                      {addDialog.form.emails.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAddArrayItem("emails", i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {/* <Button variant="link" size="sm" onClick={() => addAddArrayItem("emails")} className="justify-start px-0 text-primary">+ Add another email</Button> */}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug <span className="text-destructive">*</span></Label>
                  <Input
                    id="slug"
                    value={addDialog.form.slug}
                    onChange={(e) => handleAddFormChange("slug", e.target.value)}
                    placeholder="unique-slug-id"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Auto-generated from name. Must be unique.</p>
                </div>
                {/* <div className="grid gap-2">
                <Label htmlFor="notes">Notes <span className="text-destructive">*</span></Label>
                <Input
                  id="notes"
                  value={addDialog.form.notes}
                  onChange={(e) => handleAddFormChange("notes", e.target.value)}
                  placeholder="Additional details..."
                  required
                />
              </div> */}
                <div className="grid gap-2">
                  <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                  <Combobox
                    options={states.map((state) => ({
                      value: state.state_code,
                      label: state.state_name,
                    }))}
                    value={addDialog.form.state}
                    onValueChange={(value) => handleAddFormChange("state", value)}
                    placeholder="Select a state"
                    searchPlaceholder="Search states..."
                    emptyText="No state found."
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Districts <span className="text-destructive">*</span></Label>
                  {addDialog.form.districts.map((d, i) => (
                    <div key={i} className="flex gap-2">
                      <Combobox
                        options={districts.map((district) => ({
                          value: district.district_code,
                          label: district.district_name,
                        }))}
                        value={d}
                        onValueChange={(value) => handleAddArrayChange("districts", i, value)}
                        placeholder={!addDialog.form.state ? "Select state first" : districts.length === 0 ? "Loading districts..." : "Select district"}
                        searchPlaceholder="Search districts..."
                        emptyText="No district found."
                        disabled={!addDialog.form.state || districts.length === 0}
                        className="flex-1"
                      />
                      {addDialog.form.districts.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeAddArrayItem("districts", i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="link" size="sm" onClick={() => addAddArrayItem("districts")} className="justify-start px-0 text-primary">+ Add another district</Button>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeAddDialog}>Cancel</Button>
                <Button type="submit">Add Partner</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* EDIT PARTNER DIALOG */}
        <Dialog open={editDialog.open} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Partner</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Partner Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit-name"
                    value={editDialog.form.name}
                    onChange={(e) => handleEditFormChange("name", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Emails <span className="text-destructive">*</span></Label>
                  {editDialog.form.emails.map((email, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => handleEditArrayChange("emails", i, e.target.value)}
                        placeholder="contact@example.com"
                        required
                      />
                      {editDialog.form.emails.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeEditArrayItem("emails", i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {/* <Button variant="link" size="sm" onClick={() => addEditArrayItem("emails")} className="justify-start px-0 text-primary">+ Add another email</Button> */}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-slug">Slug <span className="text-destructive">*</span></Label>
                  <Input
                    id="edit-slug"
                    value={editDialog.form.slug}
                    onChange={(e) => handleEditFormChange("slug", e.target.value)}
                    required
                  />
                </div>
                {/* <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-notes"
                  value={editDialog.form.notes}
                  onChange={(e) => handleEditFormChange("notes", e.target.value)}
                  required
                />
              </div> */}
                <div className="grid gap-2">
                  <Label htmlFor="edit-state">State <span className="text-destructive">*</span></Label>
                  <Combobox
                    options={states.map((state) => ({
                      value: state.state_code,
                      label: state.state_name,
                    }))}
                    value={editDialog.form.state}
                    onValueChange={(value) => handleEditFormChange("state", value)}
                    placeholder="Select a state"
                    searchPlaceholder="Search states..."
                    emptyText="No state found."
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Districts <span className="text-destructive">*</span></Label>
                  {editDialog.form.districts.map((d, i) => (
                    <div key={i} className="flex gap-2">
                      <Combobox
                        options={districts.map((district) => ({
                          value: district.district_code,
                          label: district.district_name,
                        }))}
                        value={d}
                        onValueChange={(value) => handleEditArrayChange("districts", i, value)}
                        placeholder={!editDialog.form.state ? "Select state first" : districts.length === 0 ? "Loading districts..." : "Select district"}
                        searchPlaceholder="Search districts..."
                        emptyText="No district found."
                        disabled={!editDialog.form.state || districts.length === 0}
                        className="flex-1"
                      />
                      {editDialog.form.districts.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeEditArrayItem("districts", i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button type="button" variant="link" size="sm" onClick={() => addEditArrayItem("districts")} className="justify-start px-0 text-primary">+ Add another district</Button>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeEditDialog}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
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
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Details for {selectedPartner?.partner_name}</DialogTitle>
              <DialogDescription>View students and assessments associated with this partner.</DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-auto py-4 space-y-6">
              {/* Section 1: Assesssments */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Created Assessments
                </h3>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Assessment Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {partnerSets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground h-20">
                            No assessments created for this partner yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        partnerSets.map((set: any) => (
                          <TableRow key={set.id}>
                            <TableCell className="font-medium">{set.name}</TableCell>
                            <TableCell>{set.description}</TableCell>
                            <TableCell>{set.created_at ? new Date(set.created_at).toLocaleDateString() : "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>


            </div>

          </DialogContent>
        </Dialog>

        {/* CREATE ASSESSMENT MODAL PLACEHOLDER */}
        <Dialog open={showCreateModal} onOpenChange={(open) => {
          setShowCreateModal(open);
          if (open) {
            // Reset form on open
            setAssessmentFormData({
              name: "",
              description: "",
              nameType: "random",
              isRandom: true
            });
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Assessment for {selectedPartner?.partner_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">

              {/* Generation Method (Random Only) */}
              <div>
                <Label className="mb-2 block">Set Generation Method</Label>
                <RadioGroup
                  value={assessmentFormData.nameType}
                  onValueChange={(val) => {
                    // Keep it read-only or forced for now if user requested "Only random hi show hona chiye"
                    // But strictly implementing Radio logic if they want to see it selected
                    setAssessmentFormData(prev => ({ ...prev, nameType: val, isRandom: val === "random" }));
                  }}
                  className="flex items-center gap-4 mb-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="random" id="r-random" />
                    <Label htmlFor="r-random">Random</Label>
                  </div>
                  {/* Hiding Custom option as per request */}
                  {/* <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="r-custom" disabled />
                      <Label htmlFor="r-custom" className="text-gray-400">Custom Name</Label>
                    </div> */}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="assessmentName">Assessment Name</Label>
                <Input
                  id="assessmentName"
                  value={assessmentFormData.name}
                  onChange={(e) => setAssessmentFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter assessment name"
                />
              </div>

              <div>
                <Label htmlFor="assessmentDesc">Description</Label>
                <Textarea
                  id="assessmentDesc"
                  value={assessmentFormData.description}
                  onChange={(e) => setAssessmentFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description (optional)"
                />
              </div>

            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!assessmentFormData.name.trim()) {
                  toast({
                    title: "⚠️ Assessment Name Required",
                    description: "Please enter an assessment name",
                    variant: "default",
                    className: "border-orange-500 bg-orange-50 text-orange-900"
                  });
                  return;
                }

                try {
                  const payload = {
                    name: assessmentFormData.name,
                    description: assessmentFormData.description || `Created for partner: ${selectedPartner?.partner_name}`,
                    partnerId: selectedPartner?.id ? parseInt(selectedPartner.id) : undefined,
                    partner_name: selectedPartner?.partner_name,
                    isRandom: true, // Force Random
                  };

                  console.log("Creating Random Assessment Payload:", payload);

                  // Create new question set linked to partner
                  await createQuestionSet(payload as any);

                  toast({
                    title: "✅ Assessment Created",
                    description: `Assessment "${assessmentFormData.name}" created for ${selectedPartner?.partner_name}`,
                    variant: "default",
                    className: "border-green-500 bg-green-50 text-green-900"
                  });
                  setShowCreateModal(false);
                  setAssessmentFormData({ name: "", description: "", nameType: "random", isRandom: true });
                } catch (e: any) {
                  toast({
                    title: "❌ Unable to Create Assessment",
                    description: getFriendlyErrorMessage(e),
                    variant: "destructive",
                    className: "border-red-500 bg-red-50 text-red-900"
                  });
                }
              }}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default PartnerPage;
