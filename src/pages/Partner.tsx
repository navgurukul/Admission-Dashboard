import React, { useEffect, useState } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Pencil, Plus, X, Download, Eye, File } from "lucide-react";

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

  useEffect(() => {
    fetch("https://dev-join.navgurukul.org/api/partners")
      .then((res) => res.json())
      .then((data) => {
        setPartners(data.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(partners.length / ROWS_PER_PAGE);
  const paginatedPartners = partners.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

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
          {/* Table Header Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Partners</h1>
              <p className="text-muted-foreground text-sm">Manage and track partner details</p>
            </div>
            <div className="flex flex-wrap gap-2 items-center justify-end">
              <button
                className="flex items-center bg-orange-500 text-white rounded px-4 py-2 text-sm font-semibold hover:bg-orange-600"
                onClick={handleDownloadCSV}
              >
                <Download size={18} className="mr-1" />Download CSV
              </button>
              <button className="flex items-center bg-orange-500 text-white rounded px-4 py-2 text-sm font-semibold hover:bg-orange-600">
                <Plus size={18} className="mr-1" />Add Partner
              </button>
            </div>
          </div>
          {/* Table Section */}
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white border border-gray-200 w-full">
              <table className="min-w-full w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm font-medium">
                    {columns.map((col, idx) => (
                      <th key={col} className="px-3 py-2 text-left whitespace-nowrap">
                        {col === "Edit" ? "Edit Partner Details" : col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedPartners.map((partner, idx) => (
                    <tr key={partner.id} className="border-b hover:bg-gray-50 text-[15px]">
                      {/* Edit */}
                      <td className="px-3 py-2">
                        <button
                          className="text-orange-600 hover:text-orange-800 flex items-center"
                          onClick={() => openEditDialog((page - 1) * ROWS_PER_PAGE + idx)}
                        >
                          <Pencil size={16} className="mr-1" />Edit
                        </button>
                      </td>
                      {/* Name */}
                      <td className="px-3 py-2 font-medium text-red-600">{partner.name}</td>
                      {/* View Assessments */}
                      <td className="px-3 py-2">
                        <button
                          className="text-gray-700 hover:text-blue-600 flex items-center justify-center"
                          onClick={() => handleViewAssessments(partner)}
                          title="View Assessments"
                        >
                          <Eye size={18} className="mr-1" />
                          <span className="ml-1">View Assessment</span>
                        </button>
                      </td>
                      {/* Create Assessment */}
                      <td className="px-3 py-2">
                        <button
                          className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 flex items-center"
                          onClick={() => handleCreateAssessment(partner)}
                        >
                          <Plus size={16} className="mr-1" />Create
                        </button>
                      </td>
                      {/* Joined Students Progress */}
                      <td className="px-3 py-2">
                        <button className="text-blue-600 hover:underline">Get Information</button>
                      </td>
                      {/* Online Test */}
                      <td className="px-3 py-2">
                        <button className="text-orange-600 hover:underline">Go for test</button>
                      </td>
                      {/* Meraki Link */}
                      <td className="px-3 py-2">
                        {partner.meraki_link ? (
                          <a
                            href={partner.meraki_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-orange-100 text-orange-700 px-2 py-1 rounded flex items-center hover:bg-orange-200"
                          >
                            <File size={16} className="mr-1" />Get Link
                          </a>
                        ) : (
                          <button
                            className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 flex items-center"
                            onClick={() => handleCreateMerakiLink((page - 1) * ROWS_PER_PAGE + idx)}
                          >
                            <Plus size={16} className="mr-1" />Create
                          </button>
                        )}
                      </td>
                      {/* Send Report */}
                      <td className="px-3 py-2">
                        <button className="text-gray-700 hover:text-blue-600 flex items-center">
                          <span className="material-icons mr-1">mail</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="flex items-center justify-end gap-4 p-4 bg-white border-t border-gray-200">
                <span className="text-sm text-gray-500">Rows per page: {ROWS_PER_PAGE}</span>
                <span className="text-sm text-gray-500">
                  {ROWS_PER_PAGE * (page - 1) + 1}-{Math.min(page * ROWS_PER_PAGE, partners.length)} of {partners.length}
                </span>
                <button
                  className="px-2 py-1 rounded disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  &lt;
                </button>
                <button
                  className="px-2 py-1 rounded disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
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
        </div>
      </main>
    </div>
  );
};

export default PartnerPage; 