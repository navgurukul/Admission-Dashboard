import React, { useEffect, useState } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";

interface Owner {
  id: number;
  user_id: number;
  available: boolean;
  max_limit: number;
  type: string[];
  pending_interview_count: number;
  gender: number;
  user: {
    id: number;
    user_name: string;
    mail_id: string;
    email: string;
    profile_pic?: string;
  };
}

const genderOptions = [
  { value: 1, label: "Female" },
  { value: 2, label: "Male" },
];
const availabilityOptions = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];
const stageOptions = [
  { value: "CultureFitInterview", label: "CultureFitInterview" },
  { value: "EnglishInterview", label: "EnglishInterview" },
  { value: "AlgebraInterview", label: "AlgebraInterview" },
];

export default function OwnerPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    owner: "",
    gender: "",
    available: "",
    stage: "",
    limit: "",
  });
  const [ownerOptions, setOwnerOptions] = useState<
    { id: number; name: string }[]
  >([]);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(owners.length / itemsPerPage);

  const paginatedOwners = owners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const openAddModal = () => {
    setModalMode("add");
    setEditingOwner(null);
    setForm({ owner: "", gender: "", available: "", stage: "", limit: "" });
    setShowModal(true);
  };

  const openEditModal = (owner: Owner) => {
    setModalMode("edit");
    setEditingOwner(owner);
    setForm({
      owner: String(owner.user.id),
      gender: String(owner.gender),
      available: String(owner.available),
      stage: owner.type[0] || "",
      limit: String(owner.max_limit),
    });
    setShowModal(true);
  };

  useEffect(() => {
    fetch("https://dev-join.navgurukul.org/api/owner")
      .then((res) => res.json())
      .then((data) => {
        setOwners(data.data || []);
        setLoading(false);
        setOwnerOptions(
          (data.data || []).map((o: any) => ({
            id: o.user.id,
            name: o.user.user_name + " (" + o.user.mail_id + ")",
          })),
        );
      });
  }, []);

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdmissionsSidebar />
      <main className="md:ml-64 flex-1 p-4 md:p-8 pt-16 md:pt-8">
        <div className="bg-card rounded-xl shadow-soft border border-border">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Owners
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Manage and track owner details
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Button className="bg-gradient-primary hover:bg-primary/90 text-white h-9">
                  Interview Schedule
                </Button>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-md px-6 py-2 font-semibold shadow h-9"
                  onClick={openAddModal}
                >
                  Add Owner
                </Button>
              </div>
            </div>
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                    Edit
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                    Name
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                    Gender
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                    Available
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                    Pending Interviews
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                    Interview Types
                  </th>
                  <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                    Assigned Interviews Limit
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading owners...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedOwners.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-12 text-center text-muted-foreground"
                    >
                      <span>No owners found</span>
                    </td>
                  </tr>
                ) : (
                  paginatedOwners.map((owner) => (
                    <tr
                      key={owner.id}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => openEditModal(owner)}
                        >
                          <svg
                            width="18"
                            height="18"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
                          </svg>
                        </button>
                      </td>
                      <td className="py-4 px-6 font-medium">
                        {owner.user.user_name}
                      </td>
                      <td className="py-4 px-6">
                        {genderOptions.find((g) => g.value === owner.gender)
                          ?.label || "Other"}
                      </td>
                      <td className="py-4 px-6">
                        {owner.available ? "Yes" : "No"}
                      </td>
                      <td className="py-4 px-6">
                        {owner.pending_interview_count}
                      </td>
                      <td className="py-4 px-6">
                        {owner.type.map((t) => (
                          <span
                            key={t}
                            className="inline-block bg-orange-100 text-orange-700 rounded px-2 py-1 text-xs font-semibold mr-1 mb-1"
                          >
                            {t}
                          </span>
                        ))}
                      </td>
                      <td className="py-4 px-6">{owner.max_limit}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex justify-between items-center px-6 py-4">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg">
                <h2 className="text-xl font-bold mb-4">
                  {modalMode === "edit" ? "Edit Owner" : "Add New Owner"}
                </h2>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="owner">Select Owner</Label>
                    <Select
                      value={form.owner}
                      onValueChange={(v) => handleFormChange("owner", v)}
                    >
                      <SelectTrigger id="owner" className="mt-1">
                        <SelectValue placeholder="Please Select Owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {ownerOptions.map((opt) => (
                          <SelectItem key={opt.id} value={String(opt.id)}>
                            {opt.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gender">Select Gender</Label>
                    <Select
                      value={form.gender}
                      onValueChange={(v) => handleFormChange("gender", v)}
                    >
                      <SelectTrigger id="gender" className="mt-1">
                        <SelectValue placeholder="Please select your gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {genderOptions.map((opt) => (
                          <SelectItem key={opt.value} value={String(opt.value)}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="available">Select Availability</Label>
                    <Select
                      value={form.available}
                      onValueChange={(v) => handleFormChange("available", v)}
                    >
                      <SelectTrigger id="available" className="mt-1">
                        <SelectValue placeholder="Select Yes/No" />
                      </SelectTrigger>
                      <SelectContent>
                        {availabilityOptions.map((opt) => (
                          <SelectItem
                            key={String(opt.value)}
                            value={String(opt.value)}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="stage">Select Stage</Label>
                    <Select
                      value={form.stage}
                      onValueChange={(v) => handleFormChange("stage", v)}
                    >
                      <SelectTrigger id="stage" className="mt-1">
                        <SelectValue placeholder="Select Stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {stageOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="limit">Interview Limit</Label>
                    <Input
                      id="limit"
                      type="number"
                      min="0"
                      value={form.limit}
                      onChange={(e) =>
                        handleFormChange("limit", e.target.value)
                      }
                      placeholder="Ek student kitne interviews le sakta hai."
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button className="bg-orange-500 text-white" type="submit">
                      {modalMode === "edit" ? "Update Owner" : "Add Owner"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </Dialog>
        )}
      </main>
    </div>
  );
}
