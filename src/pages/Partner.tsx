import React, { useEffect, useState } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Pencil, Plus, X, Download, Eye, File, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

const columns = [
  "Edit",
  "Name",
  "View Assessments",
  "Create Assessment",
  "Joined Students Progress",
  "Online Test",
  "Meraki Link",
  "Send Report",
];

const ROWS_PER_PAGE = 10;

const defaultPartnerForm = {
  name: "",
  emails: [""],
  notes: "",
  slug: "",
  districts: [""]
};

const PartnerPage = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [page, setPage] = useState(1);
  const [editDialog, setEditDialog] = useState({ open: false, idx: null, form: defaultPartnerForm });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDialog, setFilterDialog] = useState(false);
  const [filters, setFilters] = useState({ district: "", slug: "", emailDomain: "" });
  const [addDialog, setAddDialog] = useState({ open: false, form: defaultPartnerForm });
  const { toast } = useToast();

  useEffect(() => {
    fetch("https://dev-join.navgurukul.org/api/partners")
      .then((res) => res.json())
      .then((data) => {
        setPartners(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Filter partners based on search query and filters (search on all partners, not just paginated)
  const filteredPartners = partners.filter(partner => {
    // If searchQuery is empty, match all
    const matchesSearch = !searchQuery.trim() ||
      partner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.slug?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = filters.district
      ? (partner.districts || []).some(d => d.toLowerCase().includes(filters.district.toLowerCase()))
      : true;
    const matchesSlug = filters.slug
      ? partner.slug?.toLowerCase().includes(filters.slug.toLowerCase())
      : true;
    const matchesEmailDomain = filters.emailDomain
      ? partner.email?.toLowerCase().endsWith(filters.emailDomain.toLowerCase())
      : true;
    return matchesSearch && matchesDistrict && matchesSlug && matchesEmailDomain;
  });

  // Reset page to 1 when search or filters change
  React.useEffect(() => { setPage(1); }, [searchQuery, filters]);
  const paginatedPartners = filteredPartners.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);
  const totalPages = Math.ceil(filteredPartners.length / ROWS_PER_PAGE);

  // CSV Download
  const handleDownloadCSV = () => {
    const headers = columns.map((col) =>
      col === "Edit" ? "Edit Partner Details" : col
    );
    const rows = paginatedPartners.map((partner) => [
      "Edit", // Placeholder
      partner.name,
      "View Assessments", // Placeholder
      "+Create", // Placeholder
      "Get Information", // Placeholder
      "Go for test", // Placeholder
      partner.meraki_link || "-",
      "Send Report" // Placeholder
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

  // Create Meraki Link (client-side dummy)
  const handleCreateMerakiLink = (idx) => {
    setPartners((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        meraki_link: `https://dummy-meraki-link.com/partner/${updated[idx].id}`
      };
      return updated;
    });
  };

  // Edit dialog handlers
  const openEditDialog = (idx) => {
    const partner = partners[idx];
    setEditDialog({
      open: true,
      idx,
      form: {
        name: partner.name || "",
        emails: partner.email ? [partner.email] : [""],
        notes: partner.notes || "",
        slug: partner.slug || "",
        districts: partner.districts && partner.districts.length > 0 ? [...partner.districts] : [""]
      }
    });
  };
  const closeEditDialog = () => {
    setEditDialog({ open: false, idx: null, form: defaultPartnerForm });
  };
  const handleEditFormChange = (field, value) => {
    setEditDialog((d) => ({ ...d, form: { ...d.form, [field]: value } }));
  };
  const handleEditEmailChange = (i, value) => {
    setEditDialog((d) => ({ ...d, form: { ...d.form, emails: d.form.emails.map((e, idx) => idx === i ? value : e) } }));
  };
  const handleEditDistrictChange = (i, value) => {
    setEditDialog((d) => ({ ...d, form: { ...d.form, districts: d.form.districts.map((e, idx) => idx === i ? value : e) } }));
  };
  const addEditEmail = () => {
    setEditDialog((d) => ({ ...d, form: { ...d.form, emails: [...d.form.emails, ""] } }));
  };
  const removeEditEmail = (i) => {
    setEditDialog((d) => ({ ...d, form: { ...d.form, emails: d.form.emails.filter((_, idx) => idx !== i) } }));
  };
  const addEditDistrict = () => {
    setEditDialog((d) => ({ ...d, form: { ...d.form, districts: [...d.form.districts, ""] } }));
  };
  const removeEditDistrict = (i) => {
    setEditDialog((d) => ({ ...d, form: { ...d.form, districts: d.form.districts.filter((_, idx) => idx !== i) } }));
  };
  const handleEditSubmit = (e) => {
    e.preventDefault();
    setPartners((prev) => {
      const updated = [...prev];
      const idx = editDialog.idx;
      updated[idx] = {
        ...updated[idx],
        name: editDialog.form.name,
        email: editDialog.form.emails[0] || "",
        notes: editDialog.form.notes,
        slug: editDialog.form.slug,
        districts: editDialog.form.districts
      };
      return updated;
    });
    closeEditDialog();
  };

  // Add Partner dialog handlers
  const openAddDialog = () => {
    setAddDialog({ open: true, form: defaultPartnerForm });
  };
  const closeAddDialog = () => {
    setAddDialog({ open: false, form: defaultPartnerForm });
  };
  const handleAddFormChange = (field, value) => {
    setAddDialog((d) => ({ ...d, form: { ...d.form, [field]: value } }));
  };
  const handleAddEmailChange = (i, value) => {
    setAddDialog((d) => ({ ...d, form: { ...d.form, emails: d.form.emails.map((e, idx) => idx === i ? value : e) } }));
  };
  const handleAddDistrictChange = (i, value) => {
    setAddDialog((d) => ({ ...d, form: { ...d.form, districts: d.form.districts.map((e, idx) => idx === i ? value : e) } }));
  };
  const addAddEmail = () => {
    setAddDialog((d) => ({ ...d, form: { ...d.form, emails: [...d.form.emails, ""] } }));
  };
  const removeAddEmail = (i) => {
    setAddDialog((d) => ({ ...d, form: { ...d.form, emails: d.form.emails.filter((_, idx) => idx !== i) } }));
  };
  const addAddDistrict = () => {
    setAddDialog((d) => ({ ...d, form: { ...d.form, districts: [...d.form.districts, ""] } }));
  };
  const removeAddDistrict = (i) => {
    setAddDialog((d) => ({ ...d, form: { ...d.form, districts: d.form.districts.filter((_, idx) => idx !== i) } }));
  };
  const handleAddSubmit = (e) => {
    e.preventDefault();
    // Basic validation: name and at least one email and district
    if (!addDialog.form.name.trim() || !addDialog.form.emails[0].trim() || !addDialog.form.districts[0].trim()) {
      return;
    }
    setPartners((prev) => [
      ...prev,
      {
        id: Date.now(), // Temporary ID
        name: addDialog.form.name,
        email: addDialog.form.emails[0] || "",
        notes: addDialog.form.notes,
        slug: addDialog.form.slug,
        districts: addDialog.form.districts,
        meraki_link: ""
      }
    ]);
    closeAddDialog();
    toast({
      title: "Success",
      description: "Partner added successfully!",
    });
  };

  const handleViewAssessments = (partner) => {
    setSelectedPartner(partner);
    setShowAssessmentModal(true);
  };

  const handleCreateAssessment = (partner) => {
    setSelectedPartner(partner);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowAssessmentModal(false);
    setShowCreateModal(false);
    setSelectedPartner(null);
  };

  const handleFileUpload = (e, partner) => {
    alert(`File selected for ${partner.name}: ${e.target.files[0]?.name}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      <main className="ml-64 overflow-auto h-screen flex flex-col items-center">
        <div className="p-4 w-full">
          <div className="bg-card rounded-xl shadow-soft border border-border">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Partners</h2>
                  <p className="text-muted-foreground text-sm mt-1">Manage and track partner details</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" onClick={handleDownloadCSV} className="h-9">
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button 
                    className="bg-gradient-primary hover:bg-primary/90 text-white h-9"
                    onClick={openAddDialog}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Partner
                  </Button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name, email, or slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
                <Button variant="outline" size="sm" className="h-9" onClick={() => setFilterDialog(true)}>
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                {Object.values(filters).some(Boolean) && (
                  <Button variant="ghost" size="sm" className="h-9" onClick={() => setFilters({ district: "", slug: "", emailDomain: "" })}>
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Clean Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">Partner</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">Email</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">Slug</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">Districts</th>
                    <th className="text-center py-4 px-6 font-medium text-muted-foreground text-sm w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading partners...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedPartners.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center space-y-2">
                          <Search className="w-8 h-8 opacity-50" />
                          <span>No partners found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedPartners.map((partner, idx) => (
                      <tr 
                        key={partner.id} 
                        className="border-b border-border/30 hover:bg-muted/30 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-primary text-sm font-medium">
                                {partner.name ? partner.name.split(' ').map(n => n[0]).join('') : '?'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {partner.name || 'No Name'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {partner.notes || 'No notes'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-foreground">
                            {partner.email || 'No email'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-foreground">
                            {partner.slug || 'No slug'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-foreground">
                            {partner.districts && partner.districts.length > 0 
                              ? partner.districts.join(', ') 
                              : 'No districts'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-muted"
                              onClick={() => openEditDialog((page - 1) * ROWS_PER_PAGE + idx)}
                              title="Edit Partner"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-muted"
                              onClick={() => handleViewAssessments(partner)}
                              title="View Assessments"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-muted"
                              onClick={() => handleCreateAssessment(partner)}
                              title="Create Assessment"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Show total count and pagination */}
            <div className="px-6 py-4 border-t border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {paginatedPartners.length} of {partners.length} partners
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Partner Dialog */}
          {editDialog.open && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <form
                className="bg-white rounded-lg p-8 w-full max-w-lg shadow-lg overflow-y-auto max-h-[90vh]"
                onSubmit={handleEditSubmit}
              >
                <h2 className="text-xl font-bold mb-4">Edit Partner</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Partner Name</label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    value={editDialog.form.name}
                    onChange={e => handleEditFormChange("name", e.target.value)}
                    required
                  />
                  <span className="text-xs text-gray-500">Partner ka Name Enter karein.</span>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  {editDialog.form.emails.map((email, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input
                        type="email"
                        className="border px-3 py-2 rounded w-full"
                        value={email}
                        onChange={e => handleEditEmailChange(i, e.target.value)}
                        required
                      />
                      {editDialog.form.emails.length > 1 && (
                        <button type="button" className="text-red-500" onClick={() => removeEditEmail(i)}>
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="flex items-center text-orange-600 mt-1" onClick={addEditEmail}>
                    <Plus size={18} className="mr-1" />ADD ANOTHER EMAIL
                  </button>
                  <span className="text-xs text-gray-500 block">Partner ka Email Enter karein.</span>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    value={editDialog.form.notes}
                    onChange={e => handleEditFormChange("notes", e.target.value)}
                  />
                  <span className="text-xs text-gray-500">Partner ki thodi details add karein.</span>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    value={editDialog.form.slug}
                    onChange={e => handleEditFormChange("slug", e.target.value)}
                  />
                  <span className="text-xs text-gray-500">Partner ke student ko online test dene ke liye Slug add karo.</span>
                </div>
                {editDialog.form.districts.map((district, i) => (
                  <div key={i} className="mb-2 flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">District {i + 1}</label>
                      <input
                        type="text"
                        className="border px-3 py-2 rounded w-full"
                        value={district}
                        onChange={e => handleEditDistrictChange(i, e.target.value)}
                        required
                      />
                      <span className="text-xs text-gray-500">Enter District {i + 1}</span>
                    </div>
                    {editDialog.form.districts.length > 1 && (
                      <button type="button" className="text-red-500 mt-6" onClick={() => removeEditDistrict(i)}>
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="flex items-center text-orange-600 mt-1" onClick={addEditDistrict}>
                  <Plus size={18} className="mr-1" />ADD ANOTHER DISTRICT
                </button>
                <div className="flex justify-end gap-2 mt-8">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    onClick={closeEditDialog}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    UPDATE PARTNER
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* Add Partner Dialog */}
          {addDialog.open && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <form
                className="bg-white rounded-lg p-8 w-full max-w-lg shadow-lg overflow-y-auto max-h-[90vh]"
                onSubmit={handleAddSubmit}
              >
                <h2 className="text-xl font-bold mb-4">Add Partner</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Partner Name</label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    value={addDialog.form.name}
                    onChange={e => handleAddFormChange("name", e.target.value)}
                    required
                  />
                  <span className="text-xs text-gray-500">Partner ka Name Enter karein.</span>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  {addDialog.form.emails.map((email, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <input
                        type="email"
                        className="border px-3 py-2 rounded w-full"
                        value={email}
                        onChange={e => handleAddEmailChange(i, e.target.value)}
                        required
                      />
                      {addDialog.form.emails.length > 1 && (
                        <button type="button" className="text-red-500" onClick={() => removeAddEmail(i)}>
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="flex items-center text-orange-600 mt-1" onClick={addAddEmail}>
                    <Plus size={18} className="mr-1" />ADD ANOTHER EMAIL
                  </button>
                  <span className="text-xs text-gray-500 block">Partner ka Email Enter karein.</span>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    value={addDialog.form.notes}
                    onChange={e => handleAddFormChange("notes", e.target.value)}
                  />
                  <span className="text-xs text-gray-500">Partner ki thodi details add karein.</span>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    value={addDialog.form.slug}
                    onChange={e => handleAddFormChange("slug", e.target.value)}
                  />
                  <span className="text-xs text-gray-500">Partner ke student ko online test dene ke liye Slug add karo.</span>
                </div>
                {addDialog.form.districts.map((district, i) => (
                  <div key={i} className="mb-2 flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">District {i + 1}</label>
                      <input
                        type="text"
                        className="border px-3 py-2 rounded w-full"
                        value={district}
                        onChange={e => handleAddDistrictChange(i, e.target.value)}
                        required
                      />
                      <span className="text-xs text-gray-500">Enter District {i + 1}</span>
                    </div>
                    {addDialog.form.districts.length > 1 && (
                      <button type="button" className="text-red-500 mt-6" onClick={() => removeAddDistrict(i)}>
                        <X size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="flex items-center text-orange-600 mt-1" onClick={addAddDistrict}>
                  <Plus size={18} className="mr-1" />ADD ANOTHER DISTRICT
                </button>
                <div className="flex justify-end gap-2 mt-8">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    onClick={closeAddDialog}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    ADD PARTNER
                  </button>
                </div>
              </form>
            </div>
          )}
          {/* Assessment Modal */}
          {showAssessmentModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Assessments for {selectedPartner?.name}</h2>
                <p className="mb-4">(Assessment details modal placeholder)</p>
                <button
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </div>
            </div>
          )}
          {/* Create Assessment Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
                <h2 className="text-xl font-bold mb-4">Create New Assessment</h2>
                <input
                  type="text"
                  placeholder="Paper set name"
                  className="border px-3 py-2 rounded w-full mb-4"
                />
                <button
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  onClick={handleCloseModal}
                >
                  Create
                </button>
                <button
                  className="ml-2 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {/* Filter Modal */}
          {filterDialog && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <form
                className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg overflow-y-auto max-h-[90vh]"
                onSubmit={e => { e.preventDefault(); setFilterDialog(false); }}
              >
                <h2 className="text-xl font-bold mb-4">Filter Partners</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">District</label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    placeholder="Enter district name"
                    value={filters.district}
                    onChange={e => setFilters(f => ({ ...f, district: e.target.value }))}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    placeholder="Enter slug"
                    value={filters.slug}
                    onChange={e => setFilters(f => ({ ...f, slug: e.target.value }))}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Email Domain</label>
                  <input
                    type="text"
                    className="border px-3 py-2 rounded w-full"
                    placeholder="e.g. gmail.com"
                    value={filters.emailDomain}
                    onChange={e => setFilters(f => ({ ...f, emailDomain: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-8">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    onClick={() => setFilterDialog(false)}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    APPLY FILTERS
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PartnerPage;  