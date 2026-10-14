import React, { useEffect, useMemo, useState } from "react";
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
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
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
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import {
  getPartners,
  getAllPartners,
  createPartner,
  updatePartner,
  deletePartner,
  Partner,
  getStudentsByPartnerId,
  getAllStates,
  getDistrictsByState,
  getAllQuestionSets,
  createQuestionSet,
  getQuestionsBySetName,
  getAuthHeaders,
  getTopics,
  TopicOption,
  getAllSchools,
} from "@/utils/api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  const [rowsPerPage, setRowsPerPage] = useState(10); // Add this state
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    partnerId: number | null; // Changed to support ID lookup
    form: typeof defaultPartnerForm;
    idx: number | null; // Kept for legacy compatibility if needed
  }>({
    open: false,
    partnerId: null,
    form: defaultPartnerForm,
    idx: null
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [partnerToDelete, setPartnerToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { debouncedValue: debouncedSearchQuery, isPending: isSearching } = useDebounce(searchQuery, 800);
  const [filterDialog, setFilterDialog] = useState(false);
  const [filters, setFilters] = useState({
    district: "",
    slug: "",
    emailDomain: "",
  });
  const [tempFilters, setTempFilters] = useState(filters);
  // Check if any client-side filters are active
  const isClientFiltered = Boolean(filters.district || filters.slug || filters.emailDomain);

  // Sync tempFilters with active filters when dialog opens
  useEffect(() => {
    if (filterDialog) {
      setTempFilters(filters);
    }
  }, [filterDialog]);
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
  const [partnerSets, setPartnerSets] = useState([]);
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedSetQuestions, setSelectedSetQuestions] = useState<any[]>([]);
  const [selectedSetName, setSelectedSetName] = useState<string>("");
  const [selectedSetId, setSelectedSetId] = useState<string | number>("");
  const [questionLanguage, setQuestionLanguage] = useState<"english" | "hindi" | "marathi">("english");

  // Random Question Set Creation State
  const [schools, setSchools] = useState<any[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [setFormData, setSetFormData] = useState({
    name: "",
    nameType: "random", // Only random
    isRandom: true,
    school_ids: [] as string[],
    randomConfig: [] as { topicId: number; easy: number; medium: number; hard: number }[],
  });

  const [totalPages, setTotalPages] = useState(1);
  const [totalPartnersCount, setTotalPartnersCount] = useState(0);
  const [allPartnersForStats, setAllPartnersForStats] = useState([]);
  const [loadingAbortController, setLoadingAbortController] = useState<AbortController | null>(null);

  // Track partners with existing assessments
  const [partnersWithAssessments, setPartnersWithAssessments] = useState<Set<number>>(new Set());
  const isTeamUser = useMemo(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return false;
      const parsedUser = JSON.parse(storedUser);
      const roleIdNum = Number(parsedUser?.user_role_id);
      const roleName = String(parsedUser?.role_name || "").toUpperCase();
      return roleIdNum === 3 || roleName === "TEAM";
    } catch (error) {
      console.error("Error parsing user for role checks:", error);
      return false;
    }
  }, []);

  const loadPartners = async (p = page, search = searchQuery) => {
    // Cancel previous request if still pending
    if (loadingAbortController) {
      loadingAbortController.abort();
    }

    const newAbortController = new AbortController();
    setLoadingAbortController(newAbortController);

    setLoading(true);
    try {
      // Trim the search query and only pass it if it's not empty
      const trimmedSearch = search?.trim() || "";

      // Pass search query to API only if it's not empty
      const response = await getPartners(p, rowsPerPage, trimmedSearch); // Use rowsPerPage state and search

      // Extract data based on typical API structure
      let partnersArray = [];
      let total = 0;
      let pages = 1;

      if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
        partnersArray = response.data.data;
        total = response.data.total || partnersArray.length;
        pages = response.data.totalPages || Math.ceil(total / rowsPerPage); // Use rowsPerPage
      } else if (response && response.data && Array.isArray(response.data)) {
        partnersArray = response.data;
        total = response.total || partnersArray.length;
        pages = response.totalPages || Math.ceil(total / rowsPerPage); // Use rowsPerPage
      } else if (Array.isArray(response)) {
        partnersArray = response;
        total = response.length;
        pages = 1;
      }

      // Filter out "No Partner Assigned" from backend response
      partnersArray = partnersArray.filter(p => p.partner_name !== "No Partner Assigned");

      // Normalize districts: 'districts' for IDs, 'displayDistricts' for Names
      const normalizedPartners = partnersArray.map(p => {
        const districtIds = Array.isArray(p.districts)
          ? p.districts.map(String)
          : (p.districts ? (typeof p.districts === 'string' ? p.districts.split(',').map(d => d.trim()).filter(Boolean) : [String(p.districts)]) : []);

        const displayDistricts = p.district_name
          ? (typeof p.district_name === 'string' ? p.district_name.split(',').map(d => d.trim()).filter(Boolean) : [p.district_name])
          : districtIds;

        return {
          ...p,
          districts: districtIds,
          displayDistricts: displayDistricts
        };
      });

      setPartners(normalizedPartners);
      // Adjust total count to exclude filtered partners
      setTotalPartnersCount(partnersArray.length);
      setTotalPages(Math.ceil(partnersArray.length / rowsPerPage));
      setLoading(false);
      setLoadingAbortController(null);
    } catch (error) {
      // Don't show error if request was aborted
      if (error.name === 'AbortError') {
        return;
      }
      toast({
        title: "❌ Unable to Load Partners",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
      setLoading(false);
      setLoadingAbortController(null);
    }
  };

  useEffect(() => {
    // Trim search queries to compare properly
    const trimmedDebounced = debouncedSearchQuery?.trim() || "";
    const trimmedCurrent = searchQuery?.trim() || "";

    // Reset to page 1 when search changes, but don't trigger extra load
    if (page !== 1 && trimmedDebounced !== trimmedCurrent) {
      setPage(1);
      return; // Skip this load, the page change will trigger it
    }
    loadPartners(page, debouncedSearchQuery);
  }, [page, rowsPerPage, debouncedSearchQuery]); // Use debouncedSearchQuery

  // Fetch global stats (all partners)
  const fetchAllPartners = async () => {
    try {
      const all = await getAllPartners();
      // Normalize districts for global stats as well
      const normalizedAll = (all || []).map(p => {
        const districtIds = Array.isArray(p.districts)
          ? p.districts.map(String)
          : (p.districts ? (typeof p.districts === 'string' ? p.districts.split(',').map(d => d.trim()).filter(Boolean) : [String(p.districts)]) : []);

        const displayDistricts = p.district_name
          ? (typeof p.district_name === 'string' ? p.district_name.split(',').map(d => d.trim()).filter(Boolean) : [p.district_name])
          : districtIds;

        return {
          ...p,
          districts: districtIds,
          displayDistricts: displayDistricts
        };
      });
      setAllPartnersForStats(normalizedAll);
    } catch (e) {
      console.error("Failed to load global stats", e);
    }
  };

  const loadExistingAssessmentStatus = async () => {
    try {
      const allSets = await getAllQuestionSets();
      setQuestionSets(allSets);

      const pWithSets = new Set<number>();
      allSets.forEach((s: any) => {
        const pId = s.partnerId || s.partner_id;
        if (pId) {
          pWithSets.add(Number(pId));
        }
      });
      setPartnersWithAssessments(pWithSets);
    } catch (e) {
      console.error("Failed to load existing assessment status:", e);
    }
  };

  const fetchSchools = async () => {
    try {
      const schoolsData = await getAllSchools();
      setSchools(schoolsData || []);
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  };

  const fetchTopics = async () => {
    try {
      const topicsData = await getTopics();
      setTopics((topicsData || []).filter((topic: any) => topic?.status !== false));
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  useEffect(() => {
    loadStates();
    // Load all partners once for global stats and districts filter
    fetchAllPartners();
    loadExistingAssessmentStatus();
    fetchSchools();
    fetchTopics();
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

  // Filter partners based on additional client-side filters (district, slug, email domain)
  // Search by name is handled server-side via API
  const filteredPartners = partners.filter((partner) => {
    // Hide "No Partner Assigned"
    if (partner.partner_name === "No Partner Assigned") {
      return false;
    }
    
    const matchesDistrict = filters.district
      ? (partner.displayDistricts || []).some((d) =>
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
      matchesDistrict && matchesSlug && matchesEmailDomain
    );
  });

  // Reset page to 1 when filters change (but not on search, handled above)
  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  let currentTableData = [];
  let displayTotalCount = 0;
  let displayTotalPages = 1;

  if (isClientFiltered) {
    // 1. Filter the Full List locally
    const matches = allPartnersForStats.filter((partner) => {
      // Hide "No Partner Assigned"
      if (partner.partner_name === "No Partner Assigned") {
        return false;
      }

      const q = searchQuery.toLowerCase();
      const matchesSearch = q ? partner.partner_name?.toLowerCase().includes(q) : true;

      const matchesDistrict = filters.district
        ? (partner.displayDistricts || []).some((d) => d.toLowerCase().includes(filters.district.toLowerCase()))
        : true;
      const matchesSlug = filters.slug
        ? partner.slug?.toLowerCase().includes(filters.slug.toLowerCase())
        : true;
      const matchesEmailDomain = filters.emailDomain
        ? partner.email?.toLowerCase().endsWith(filters.emailDomain.toLowerCase())
        : true;

      return matchesSearch && matchesDistrict && matchesSlug && matchesEmailDomain;
    });

    displayTotalCount = matches.length;
    displayTotalPages = Math.ceil(displayTotalCount / rowsPerPage) || 1;

    // 2. Slice for current page
    const start = (page - 1) * rowsPerPage;
    currentTableData = matches.slice(start, start + rowsPerPage);

  } else {
    // Server Side Mode
    currentTableData = filteredPartners;

    displayTotalCount = totalPartnersCount;
    displayTotalPages = totalPages;
  }

  const paginatedPartners = currentTableData;

  // Stats - Exclude "No Partner Assigned"
  const filteredPartnersForStats = allPartnersForStats.filter(p => p.partner_name !== "No Partner Assigned");
  const totalPartners = filteredPartnersForStats.length;
  const activeDistricts = new Set(
    filteredPartnersForStats.flatMap((p) => p.displayDistricts || []),
  ).size;
  const totalStudents = filteredPartnersForStats.reduce((acc, curr) => acc + (curr.student_count || 0), 0);


  // CSV Download
  const handleDownloadCSV = (mode: 'all' | 'filtered' = 'all') => {
    let dataToExport = [];
    let filename = "partners.csv";

    if (mode === 'all') {
      dataToExport = allPartnersForStats.filter(partner => partner.partner_name !== "No Partner Assigned");
      filename = "all_partners.csv";
    } else {
      // Get all matching partners from the full list
      const q = searchQuery.toLowerCase();
      dataToExport = allPartnersForStats.filter((partner) => {
        // Hide "No Partner Assigned"
        if (partner.partner_name === "No Partner Assigned") {
          return false;
        }
        
        const matchesSearch = q ? (partner.partner_name || "").toLowerCase().includes(q) : true;
        const matchesDistrict = filters.district
          ? (partner.displayDistricts || []).some((d: string) => d.toLowerCase().includes(filters.district.toLowerCase()))
          : true;
        const matchesSlug = filters.slug
          ? (partner.slug || "").toLowerCase().includes(filters.slug.toLowerCase())
          : true;
        const matchesEmailDomain = filters.emailDomain
          ? (partner.email || "").toLowerCase().endsWith(filters.emailDomain.toLowerCase())
          : true;

        return matchesSearch && matchesDistrict && matchesSlug && matchesEmailDomain;
      });
      filename = "filtered_partners.csv";
    }

    if (dataToExport.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no partners matching the selection.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Name",
      "Email",
      "Slug",
      "Districts",
      // "Notes",
      "Meraki Link"
    ];
    const rows = dataToExport.map((partner) => [
      partner.partner_name,
      partner.email,
      partner.slug,
      (partner.displayDistricts || []).join("; "),
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
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "✅ CSV Downloaded",
      description: `${dataToExport.length} partners exported successfully to ${filename}`,
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900"
    });
  };

  // Logic handlers
  const handleCreateMerakiLink = (idOrIdx) => {
    // If passed ID, find by ID. If passed index, fallback (though logic updated to pass ID now)
    const pId = typeof idOrIdx === 'object' ? idOrIdx.id : idOrIdx;

    setPartners((prev) => {
      return prev.map(p => {
        // Check if passed arg is ID
        if (p.id === idOrIdx) {
          return {
            ...p,
            meraki_link: `${window.location.origin}${import.meta.env.BASE_URL}partnerLanding/${p.slug}`,
          };
        }
        return p;
      })
    });

    // Also update global cache
    setAllPartnersForStats(prev => prev.map(p => p.id === idOrIdx ? { ...p, meraki_link: `${window.location.origin}${import.meta.env.BASE_URL}partnerLanding/${p.slug}` } : p));
    
    // Show success toast
    toast({
      title: "✅ Link Generated",
      description: "Test link has been generated successfully. You can now copy it from the actions menu.",
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900"
    });
  };

  // Edit Dialog
  const openEditDialog = (idx) => {
    const realIdx = (page - 1) * ROWS_PER_PAGE + idx;
    const partner = paginatedPartners[idx];
    // Use paginated index for display, but need real index for update if modifying 'partners' array directly.
    // Actually, simpler to find by ID if possible, but assuming index based on paginated view needs mapping.
    // Let's find the original index in `partners` array.
    const originalIndex = partners.findIndex(p => p.id === partner.id);

    // Try to find the state ID if we have codes
    const stateObj = states.find(s => s.state_code === partner.state || s.id == partner.state);
    const stateValue = stateObj ? String(stateObj.id) : (partner.state || "");

    setEditDialog({
      open: true,
      partnerId: partner.id,
      idx: idx, // Pass raw view index if needed (though risky if data source changes)
      form: {
        name: partner.partner_name || "",
        emails: partner.email ? [partner.email] : [""],
        // notes: partner.notes || "",
        slug: partner.slug || "",
        districts:
          partner.districts && partner.districts.length > 0
            ? [...partner.districts]
            : [""],
        state: stateValue,
      },
    });

    // Load districts if state exists
    if (stateValue) {
      // stateValue is now state numeric ID (as string)
      loadDistricts(stateValue);
    }
  };

  const closeEditDialog = () => {
    setEditDialog({ open: false, idx: null, partnerId: null, form: defaultPartnerForm });
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

    // Check partnerId first (new valid way), then fallback to index (old way)
    // We prefer ID because index might be from filtered view, not server array.
    let idToUpdate = editDialog.partnerId;

    if (!idToUpdate && editDialog.idx !== null && editDialog.idx >= 0 && partners[editDialog.idx]) {
      idToUpdate = partners[editDialog.idx].id;
    }

    if (!idToUpdate) return;

    try {
      await updatePartner(idToUpdate, {
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
      fetchAllPartners(); // Refresh cache
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
      fetchAllPartners(); // Refresh cache
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

  const handleViewAssessments = async (partner: any) => {
    setSelectedPartner(partner);
    setShowAssessmentModal(true);
    setStudentsPage(1);
    loadPartnerStudents(partner.id, 1);

    try {
      const allSets = await getAllQuestionSets();

      const filtered = allSets.filter((s: any) => {
        const idMatch = (s.partnerId && s.partnerId == partner.id) || (s.partner_id && s.partner_id == partner.id);
        const slugPrefixMatch = partner.slug && (s.name || "").toUpperCase().startsWith(`${partner.slug.toUpperCase()}-`);
        return Boolean(idMatch || slugPrefixMatch);
      });

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

  const addRandomConfigRow = () => {
    setSetFormData(prev => ({
      ...prev,
      randomConfig: [...(prev.randomConfig || []), { topicId: topics[0]?.id || 0, easy: 0, medium: 0, hard: 0 }]
    }));
  };

  const updateRandomConfigRow = (index: number, field: string, value: number) => {
    setSetFormData(prev => {
      const newConfig = [...(prev.randomConfig || [])];
      newConfig[index] = { ...newConfig[index], [field]: value };
      return { ...prev, randomConfig: newConfig };
    });
  };

  const removeRandomConfigRow = (index: number) => {
    setSetFormData(prev => ({
      ...prev,
      randomConfig: (prev.randomConfig || []).filter((_, i) => i !== index)
    }));
  };

  const useLastRandomConfig = () => {
    const lastConfigSet = questionSets.find((s: any) => s.random_config && s.random_config.length > 0);
    if (!lastConfigSet) {
      toast({
        title: "No Previous Configuration",
        description: "No previous random set configuration found in the database.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }
    setSetFormData(prev => ({ ...prev, randomConfig: lastConfigSet.random_config }));
    toast({
      title: "Configuration Loaded",
      description: `Loaded configuration from "${lastConfigSet.name}".`,
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900",
      duration: 2000,
    });
  };

  const handleCreateAssessment = (partner: any) => {
    setSelectedPartner(partner);
    setSetFormData({
      name: `${partner.partner_name} Set`,
      nameType: "random",
      isRandom: true,
      school_ids: [],
      randomConfig: [],
    });
    setShowCreateModal(true);
  };

  const handleCreateSetSubmit = async () => {
    const finalName = setFormData.name.trim();
    const finalDescription = "N/A";

    if (!finalName) {
      toast({
        title: "⚠️ Required Field Missing",
        description: "Please enter a set name",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (!setFormData.school_ids || setFormData.school_ids.length === 0) {
      toast({
        title: "⚠️ Required Field Missing",
        description: "Please select school",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (!setFormData.randomConfig || setFormData.randomConfig.length === 0) {
      toast({
        title: "⚠️ Configuration Missing",
        description: "Please click 'Add Topic' and configure at least one question topic.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    const totalQuestions = setFormData.randomConfig.reduce(
      (acc, curr) => acc + (Number(curr.easy) || 0) + (Number(curr.medium) || 0) + (Number(curr.hard) || 0),
      0
    );

    if (totalQuestions <= 0) {
      toast({
        title: "⚠️ Invalid Question Count",
        description: "Total questions configured across topics must be greater than 0",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    setIsCreatingSet(true);
    try {
      const payload = {
        name: finalName,
        description: finalDescription,
        isRandom: true,
        school_ids: setFormData.school_ids.map(Number),
        randomConfig: setFormData.randomConfig,
        partnerId: selectedPartner?.id ? Number(selectedPartner.id) : undefined,
        partner_name: selectedPartner?.partner_name,
        success: true,
      };

      const response = await createQuestionSet(payload as any);

      toast({
        title: "✅ Set Created",
        description: response.message || `Set "${finalName}" created successfully for ${selectedPartner?.partner_name}`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });

      setShowCreateModal(false);
      setSetFormData({
        name: "",
        nameType: "random",
        isRandom: true,
        school_ids: [],
        randomConfig: [],
      });

      if (selectedPartner?.id) {
        setPartnersWithAssessments(prev => new Set(prev).add(Number(selectedPartner.id)));
      }

      await loadExistingAssessmentStatus();

      const allSets = await getAllQuestionSets();
      if (selectedPartner?.id) {
        const filtered = allSets.filter((s: any) => {
          const idMatch = (s.partnerId && s.partnerId == selectedPartner.id) || (s.partner_id && s.partner_id == selectedPartner.id);
          return Boolean(idMatch);
        });
        setPartnerSets(filtered);
      }
    } catch (err: any) {
      console.error("Error creating set:", err);
      toast({
        title: "❌ Unable to create set",
        description: getFriendlyErrorMessage(err),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setIsCreatingSet(false);
    }
  };

  const handleDeletePartner = (id) => {
    setPartnerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDeletePartner = async () => {
    if (!partnerToDelete) return;
    try {
      await deletePartner(partnerToDelete);
      toast({
        title: "✅ Partner Deleted",
        description: "Partner deleted successfully.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900"
      });
      setDeleteDialogOpen(false);
      setPartnerToDelete(null);
      loadPartners();
      fetchAllPartners(); // Refresh cache
    } catch (error) {
      toast({
        title: "❌ Unable to Delete Partner",
        description: "This Partner cannot be deleted because it is linked to other records.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
    }
  };

  const handleDownloadPdf = async (language = "english") => {
    if (!selectedSetId) return;

    try {
      toast({
        title: "Exporting assessment…",
        description: "The assessment PDF is being generated.",
      });

      const query = language !== "english" ? `?language=${language}` : "";

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/questions/download-pdf/${selectedSetId}${query}`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to download PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedSetName.replace(/\s+/g, '_')}-${language}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export complete",
        description: "Assessment PDF downloaded successfully.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900"
      });

    } catch (e) {
      console.error(e);
      toast({
        title: "Export Failed",
        description: "Failed to download the assessment PDF.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex">
      <AdmissionsSidebar />
      <main className="md:ml-64 flex-1 p-6 overflow-y-auto h-screen pt-20 md:pt-6">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header & Stats */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Partners</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage network partners, track performance, and create assessments.</p>
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
              {/* <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Districts</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeDistricts}</div>
                  <p className="text-xs text-muted-foreground">Across the country</p>
                </CardContent>
              </Card> */}
              {/* <Card className="shadow-sm">
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
              </Card> */}
            </div>
          </div>

          {/* Filters and Search */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <CardTitle className="text-base font-medium">Filters & Search</CardTitle>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden xs:inline">Export CSV</span>
                        <span className="xs:hidden">Export</span>
                        <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownloadCSV('all')}>
                        <Download className="w-4 h-4 mr-2" />
                        Export All Data
                      </DropdownMenuItem>
                      {(searchQuery.trim() !== "" || Object.values(filters).some(Boolean)) && (
                        <DropdownMenuItem onClick={() => handleDownloadCSV('filtered')}>
                          <Download className="w-4 h-4 mr-2" />
                          Export Filtered Results ({(() => {
                            const q = searchQuery.toLowerCase();
                            return allPartnersForStats.filter((partner) => {
                              // Hide "No Partner Assigned"
                              if (partner.partner_name === "No Partner Assigned") {
                                return false;
                              }
                              
                              const matchesSearch = q ? (partner.partner_name || "").toLowerCase().includes(q) : true;
                              const matchesDistrict = filters.district
                                ? (partner.displayDistricts || []).some((d: string) => d.toLowerCase().includes(filters.district.toLowerCase()))
                                : true;
                              const matchesSlug = filters.slug
                                ? (partner.slug || "").toLowerCase().includes(filters.slug.toLowerCase())
                                : true;
                              const matchesEmailDomain = filters.emailDomain
                                ? (partner.email || "").toLowerCase().endsWith(filters.emailDomain.toLowerCase())
                                : true;
                              return matchesSearch && matchesDistrict && matchesSlug && matchesEmailDomain;
                            }).length;
                          })()})
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" onClick={() => setFilterDialog(true)} size="sm" className="text-xs sm:text-sm">
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Advanced Filters</span>
                    <span className="xs:hidden">Filters</span>
                  </Button>
                  {!isTeamUser && (
                    <Button onClick={openAddDialog} size="sm" className="bg-primary text-primary-foreground text-xs sm:text-sm">
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      <span className="hidden xs:inline">Add Partner</span>
                      <span className="xs:hidden">Add</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Active Filter Chips */}
              {Object.values(filters).some(Boolean) && (
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {filters.district && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full py-1.5 px-3 flex items-center gap-2 border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700 h-auto whitespace-nowrap min-w-fit"
                        onClick={() => setFilters(prev => ({ ...prev, district: "" }))}
                      >
                        <span className="text-xs inline-block">District: {filters.district}</span>
                        <X className="w-3 h-3 flex-shrink-0" />
                      </Button>
                    )}
                    {filters.slug && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full py-1.5 px-3 flex items-center gap-2 border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700 h-auto whitespace-nowrap min-w-fit"
                        onClick={() => setFilters(prev => ({ ...prev, slug: "" }))}
                      >
                        <span className="text-xs inline-block">Slug: {filters.slug}</span>
                        <X className="w-3 h-3 flex-shrink-0" />
                      </Button>
                    )}
                    {filters.emailDomain && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full py-1.5 px-3 flex items-center gap-2 border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700 h-auto whitespace-nowrap min-w-fit"
                        onClick={() => setFilters(prev => ({ ...prev, emailDomain: "" }))}
                      >
                        <span className="text-xs inline-block">Email Domain: {filters.emailDomain}</span>
                        <X className="w-3 h-3 flex-shrink-0" />
                      </Button>
                    )}
                    {/* Clear All Button - Right next to chips */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFilters({ district: "", slug: "", emailDomain: "" })}
                      className="rounded-full py-1.5 px-3 h-auto flex items-center gap-2 text-xs border border-pink-200 bg-pink-50 text-pink-700 hover:text-pink-80"
                    >
                      <X className="w-3 h-3" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name"
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
                    {!isTeamUser && <TableHead>Create Assessment</TableHead>}
                    {!isTeamUser && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading || isSearching ? (
                    <TableRow>
                      <TableCell colSpan={isTeamUser ? 5 : 8} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          {isSearching ? "Searching..." : "Loading data..."}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : paginatedPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isTeamUser ? 5 : 8} className="h-32 text-center text-muted-foreground">
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
                            {(partner.displayDistricts || []).map((d, i) => (
                              <Badge key={i} variant="secondary" className="text-[10px] px-1 py-0">{d}</Badge>
                            ))}
                            {(!partner.displayDistricts || partner.displayDistricts.length === 0) && <span className="text-xs text-muted-foreground">-</span>}
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
                        {!isTeamUser && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCreateAssessment(partner)}
                              className={`h-8 px-2 ${partnersWithAssessments.has(partner.id) ? 'text-green-600 hover:bg-green-50' : 'text-primary hover:text-primary/80'}`}
                              disabled={isCreatingSet || partnersWithAssessments.has(partner.id)}
                            >
                              {partnersWithAssessments.has(partner.id) ? (
                                <>
                                  <FileText className="mr-2 h-4 w-4" /> Created
                                </>
                              ) : (
                                <>
                                  <FileText className="mr-2 h-4 w-4" /> Create
                                </>
                              )}
                            </Button>
                          </TableCell>
                        )}
                        {!isTeamUser && (
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
                                  <DropdownMenuItem onClick={() => handleCreateMerakiLink(partner.id)}>
                                    <ExternalLink className="mr-2 h-4 w-4" /> Generate Link
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/20">
              <div className="text-sm text-muted-foreground">
                Showing <strong>{(page - 1) * rowsPerPage + 1}</strong> - <strong>{Math.min(page * rowsPerPage, displayTotalCount)}</strong> of <strong>{displayTotalCount}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground whitespace-nowrap">Rows:</Label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setPage(1); // Reset to first page when changing rows per page
                    }}
                    className="border rounded px-2 py-1 text-sm h-8"
                  >
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <span className="text-sm text-muted-foreground px-2">
                  Page <strong>{page}</strong> of <strong>{displayTotalPages}</strong>
                </span>
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
                  onClick={() => setPage((p) => Math.min(displayTotalPages, p + 1))}
                  disabled={page === displayTotalPages}
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
            <form onSubmit={handleAddSubmit} noValidate>
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
                      value: String(state.id),
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
                          value: String(district.id),
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

        {/* QUESTIONS VIEW MODAL */}
        <Dialog open={showQuestionsModal} onOpenChange={setShowQuestionsModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Questions for: {selectedSetName}</DialogTitle>
              <DialogDescription>Select language to view questions</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2 p-3 bg-muted/30 rounded-lg border border-border/50">
              <div className="flex flex-wrap items-center gap-4">

                <div className="flex items-center gap-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Language:</Label>
                  <div className="flex items-center bg-background border rounded-md p-0.5">
                    <Button
                      variant={questionLanguage === "english" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => setQuestionLanguage("english")}
                    >
                      English
                    </Button>
                    <Button
                      variant={questionLanguage === "hindi" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => setQuestionLanguage("hindi")}
                    >
                      Hindi
                    </Button>
                    <Button
                      variant={questionLanguage === "marathi" ? "default" : "ghost"}
                      size="sm"
                      className="h-7 text-xs px-3"
                      onClick={() => setQuestionLanguage("marathi")}
                    >
                      Marathi
                    </Button>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export Assessment
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownloadPdf("english")}> 📄 English  (PDF)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadPdf("hindi")}> 📄 Hindi  (PDF)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownloadPdf("marathi")}> 📄 Marathi  (PDF)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex-1 overflow-auto mt-4">
              {questionsLoading ? (
                <div className="text-center text-muted-foreground">Loading questions...</div>
              ) : selectedSetQuestions.length === 0 ? (
                <div className="text-center text-muted-foreground">No questions available for this assessment.</div>
              ) : (
                <div className="space-y-4">
                  {selectedSetQuestions.map((q: any, idx: number) => {
                    // Support different possible property names for question text
                    const questionText =
                      (questionLanguage === "english" ? (q.english_text || q.text || q.question || q.content) :
                        questionLanguage === "hindi" ? (q.hindi_text || q.text || q.question || q.content) :
                          (q.marathi_text || q.text || q.question || q.content)) || "No question text available";

                    // Support different possible property names for options
                    const optionsRaw = (questionLanguage === "english" ? q.english_options :
                      questionLanguage === "hindi" ? q.hindi_options :
                        q.marathi_options) || q.options || [];

                    const options = Array.isArray(optionsRaw) ? optionsRaw : [];
                    const diffLabel = q.difficulty_level === 1 ? "Easy" : q.difficulty_level === 2 ? "Medium" : q.difficulty_level === 3 ? "Hard" : "";

                    return (
                      <Card key={q.id || q.question_id || idx} className="shadow-sm border">
                        <CardHeader className="flex items-start justify-between py-2">
                          <CardTitle className="text-sm font-medium whitespace-pre-line">{idx + 1}. {questionText}</CardTitle>
                          <Badge className="text-xs" variant={q.difficulty_level === 1 ? "easy" : q.difficulty_level === 2 ? "medium" : "hard"}>{diffLabel}</Badge>
                        </CardHeader>
                        <CardContent className="pt-0 pb-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {options.map((opt: any, i: number) => (
                              <div key={i} className="p-2 border rounded-md bg-background hover:bg-primary/5 text-sm">
                                <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
                                <span className="text-sm whitespace-pre-line">{typeof opt === "object" && opt !== null ? (opt.text || opt.content || String(opt)) : opt}</span>
                              </div>
                            ))}
                          </div>
                          {q.answer_key && q.answer_key.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-3">Answer: {q.answer_key.map((a: any) => String.fromCharCode(64 + a)).join(", ")}</div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 border-t pt-4">
              <Button variant="outline" onClick={() => setShowQuestionsModal(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EDIT PARTNER DIALOG */}
        <Dialog open={editDialog.open} onOpenChange={(open) => !open && closeEditDialog()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Partner</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} noValidate>
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
                      value: String(state.id),
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
                          value: String(district.id),
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
                <Input value={tempFilters.district} onChange={(e) => setTempFilters(f => ({ ...f, district: e.target.value }))} placeholder="Filter by district" />
              </div>
              <div className="grid gap-2">
                <Label>Slug</Label>
                <Input value={tempFilters.slug} onChange={(e) => setTempFilters(f => ({ ...f, slug: e.target.value }))} placeholder="Filter by slug" />
              </div>
              <div className="grid gap-2">
                <Label>Email Domain</Label>
                <Input value={tempFilters.emailDomain} onChange={(e) => setTempFilters(f => ({ ...f, emailDomain: e.target.value }))} placeholder="e.g. gmail.com" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFilterDialog(false)}>Cancel</Button>
              <Button onClick={() => {
                setFilters(tempFilters);
                setFilterDialog(false);
              }}>Apply Filters</Button>
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
                            <TableCell className="font-medium">
                              <button
                                className="text-primary hover:text-primary/80"
                                onClick={async () => {
                                  const name = set.name || "";
                                  setSelectedSetName(name);
                                  setSelectedSetId(set.id);
                                  setShowQuestionsModal(true);
                                  setQuestionsLoading(true);
                                  try {
                                    const res = await getQuestionsBySetName(name);
                                    // Robust array extraction
                                    let qarr = [];
                                    if (Array.isArray(res)) {
                                      qarr = res;
                                    } else {
                                      qarr = res?.data || res?.questions || res?.result || res?.data?.data || [];
                                    }
                                    setSelectedSetQuestions(Array.isArray(qarr) ? qarr : []);
                                  } catch (err) {
                                    console.error("Failed to load questions for set:", err);
                                    setSelectedSetQuestions([]);
                                    toast({ title: "Unable to Load Questions", description: getFriendlyErrorMessage(err), variant: "destructive" });
                                  } finally {
                                    setQuestionsLoading(false);
                                  }
                                }}
                              >
                                {set.name}
                              </button>
                            </TableCell>
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

        {/* CREATE QUESTION SET MODAL */}
        <Dialog
          open={showCreateModal}
          onOpenChange={(open) => {
            setShowCreateModal(open);
          }}
        >
          <DialogContent className="flex max-h-[92vh] max-w-2xl flex-col overflow-hidden p-0 sm:rounded-xl">
            <DialogHeader className="border-b px-6 py-5">
              <DialogTitle>
                Create Question Set for {selectedPartner?.partner_name}
              </DialogTitle>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {/* Set Generation Method  Random */}
              <div className="space-y-2">
                <Label className="block">Set Generation Method</Label>
                <RadioGroup
                  value={setFormData.nameType}
                  onValueChange={(val) => {
                    setSetFormData({ ...setFormData, nameType: val, isRandom: val === "random" });
                  }}
                  className="flex items-center gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="random" id="r-random" />
                    <Label htmlFor="r-random">Random</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Set Name */}
              <div className="space-y-2">
                <Label htmlFor="partner-set-name">
                  Set Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="partner-set-name"
                  value={setFormData.name}
                  onChange={(e) =>
                    setSetFormData({ ...setFormData, name: e.target.value })
                  }
                  placeholder="Enter Set name"
                />
              </div>

              {/* Schools */}
              <div className="space-y-2">
                <Label htmlFor="partner-set-schools">
                  Schools <span className="text-red-500">*</span>
                </Label>
                <MultiSelectCombobox
                  options={schools.map((school) => ({
                    value: String(school.id),
                    label: school.school_name,
                  }))}
                  value={setFormData.school_ids}
                  onValueChange={(value) =>
                    setSetFormData({ ...setFormData, school_ids: value })
                  }
                  placeholder="Select schools"
                  searchPlaceholder="Search schools..."
                />
              </div>

              {/* Random Question Configuration */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Random Question Configuration</Label>
                  <div className="flex gap-2">
                    {questionSets.some((s: any) => s.random_config && s.random_config.length > 0) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={useLastRandomConfig}
                        className="h-8 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                      >
                        ↩ Use Last Configuration
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={addRandomConfigRow}>
                      <Plus className="mr-1 h-3 w-3" /> Add Topic
                    </Button>
                  </div>
                </div>

                {(!setFormData.randomConfig || setFormData.randomConfig.length === 0) && (
                  <p className="text-xs text-muted-foreground">Click "Add Topic" to configure questions.</p>
                )}

                {setFormData.randomConfig?.map((config, index) => (
                  <div key={index} className="flex items-end gap-2 p-3 border rounded-md bg-slate-50">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Topic</Label>
                      <Select
                        value={String(config.topicId)}
                        onValueChange={(val) => updateRandomConfigRow(index, 'topicId', Number(val))}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white">
                          <SelectValue placeholder="Select Topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {topics.map((t: any) => (
                            <SelectItem key={t.id} value={String(t.id)}>{t.topic}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">Easy</Label>
                      <Input 
                        type="number" min="0" className="h-8 text-xs bg-white" 
                        value={config.easy} 
                        onChange={(e) => updateRandomConfigRow(index, 'easy', parseInt(e.target.value) || 0)} 
                      />
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">Medium</Label>
                      <Input 
                        type="number" min="0" className="h-8 text-xs bg-white" 
                        value={config.medium} 
                        onChange={(e) => updateRandomConfigRow(index, 'medium', parseInt(e.target.value) || 0)} 
                      />
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">Hard</Label>
                      <Input 
                        type="number" min="0" className="h-8 text-xs bg-white" 
                        value={config.hard} 
                        onChange={(e) => updateRandomConfigRow(index, 'hard', parseInt(e.target.value) || 0)} 
                      />
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeRandomConfigRow(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {setFormData.randomConfig?.length > 0 && (
                  <div className="flex justify-end text-sm font-semibold">
                    Total Questions: {setFormData.randomConfig.reduce((acc, curr) => acc + (Number(curr.easy) || 0) + (Number(curr.medium) || 0) + (Number(curr.hard) || 0), 0)}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="border-t bg-background px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSetSubmit} disabled={isCreatingSet}>
                {isCreatingSet ? (
                  <>
                    <FileText className="mr-2 h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  "Create Set"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this partner? This action cannot be undo.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setDeleteDialogOpen(false);
                setPartnerToDelete(null);
              }}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={confirmDeletePartner}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main >
    </div >
  );
};

export default PartnerPage;
