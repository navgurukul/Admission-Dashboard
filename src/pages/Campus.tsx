import React, { useEffect, useState } from "react";
import { AdmissionsSidebar } from "../components/AdmissionsSidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";
import { useDebounce } from "@/hooks/useDebounce";

import {
  getCampuses,
  getCampusesApi,
  createCampusApi,
  updateCampusApi,
  deleteCampusApi,
} from "@/utils/api";

interface Campus {
  id: number;
  campus_name: string;
}

const CampusPage: React.FC = () => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true); // initial page load
  const [actionLoading, setActionLoading] = useState(false); // for add/update/delete
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { debouncedValue: debouncedSearch } = useDebounce(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCampusesCount, setTotalCampusesCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const [newCampus, setNewCampus] = useState("");
  const [updatedCampusName, setUpdatedCampusName] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);

  // Reusable fetch function
  const fetchCampuses = async (showLoader = false, page = currentPage) => {
    if (showLoader) setLoading(true);
    try {
      const response = await getCampuses(page, itemsPerPage);
      // console.log("campus Data", response);

      let campusArray = [];
      let total = 0;
      let pages = 0;

      // Robust extraction similar to Partner.tsx
      if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
        campusArray = response.data.data;
        total = response.data.totalCount || response.data.total || campusArray.length;
        pages = response.data.totalPages || Math.ceil(total / itemsPerPage);
      } else if (response && response.data && Array.isArray(response.data)) {
        campusArray = response.data;
        total = response.totalCount || response.total || response.data.totalCount || campusArray.length;
        pages = response.totalPages || response.data.totalPages || Math.ceil(total / itemsPerPage);
      } else if (Array.isArray(response)) {
        campusArray = response;
        total = response.length;
        pages = Math.ceil(total / itemsPerPage);
      }

      setCampuses(campusArray);
      setTotalPages(pages);
      setTotalCampusesCount(total);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Fetch on mount and when page changes
  useEffect(() => {
    fetchCampuses(true, 1);
  }, []);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Filter and Slice (Slice added to ensure only itemsPerPage are shown)
  const filteredCampuses = campuses
    .filter((c) =>
      debouncedSearch.trim()
        ? c.campus_name.toLowerCase().includes(debouncedSearch.toLowerCase())
        : true
    );

  const displayCampuses = filteredCampuses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const totalFilteredPages = Math.ceil(filteredCampuses.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalFilteredPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  // Add campus
  const handleAddCampus = async (e: React.FormEvent) => {
    e.preventDefault();

    const isDuplicate = campuses.some(
      (campus) =>
        campus.campus_name.toLowerCase() === newCampus.toLowerCase().trim(),
    );

    if (isDuplicate) {
      toast({
        title: "⚠️ Duplicate Campus",
        description: "This campus name already exists. Please use a different name.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }
    setActionLoading(true);
    try {
      await createCampusApi(newCampus);
      setAddDialog(false);
      setNewCampus("");
      toast({
        title: "✅ Campus Added Successfully",
        description: `"${newCampus}" has been added.`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      await fetchCampuses(false);
      setCurrentPage(1);
    } catch (err) {
      toast({
        title: "❌ Unable to Add Campus",
        description: getFriendlyErrorMessage(err),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Update campus
  const handleUpdateCampus = async (id: number, campus_name: string) => {
    // Get the old campus name before updating
    const oldCampus = campuses.find(c => c.id === id);
    const oldName = oldCampus?.campus_name || "";

    setActionLoading(true);
    try {
      await updateCampusApi(id, campus_name);
      setEditDialog(false);
      setSelectedCampus(null);
      toast({
        title: "✅ Campus Updated",
        description: `Campus name updated from "${oldName}" to "${campus_name}".`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      await fetchCampuses(false);
    } catch (err) {
      toast({
        title: "❌ Unable to Update Campus",
        description: getFriendlyErrorMessage(err),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete campus
  const handleDeleteCampus = async (id: number, campus_name: string) => {
    setActionLoading(true);
    try {
      await deleteCampusApi(id);
      setDeleteDialog(false);
      setSelectedCampus(null);
      toast({
        title: "✅ Campus Deleted",
        description: `"${campus_name}" has been deleted.`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      await fetchCampuses(false);
      setCurrentPage(1);
    } catch (error: any) {
      // Try multiple paths to get the error message
      const fullErrorMessage =
        error?.data?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "An unexpected error occurred.";

      // Check if it's a student records association error
      const isStudentRecordsError = fullErrorMessage && (
        fullErrorMessage.toLowerCase().includes("associated with") ||
        fullErrorMessage.toLowerCase().includes("student records")
      );

      // Use orange for student records error (warning), red for others (error)
      const isWarning = isStudentRecordsError;

      toast({
        title: isWarning ? "⚠️ Unable to Delete Campus" : "❌ Unable to Delete Campus",
        description: fullErrorMessage || "An unexpected error occurred.",
        variant: isWarning ? "default" : "destructive",
        className: isWarning ? "border-orange-500 bg-orange-50 text-orange-900" : "border-red-500 bg-red-50 text-red-900",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <AdmissionsSidebar />
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 md:ml-64">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-2xl">Campuses Name</CardTitle>
                <CardDescription>A list of all the campuses.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search campus..."
                    className="pl-8 w-full"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                    }}
                  />
                </div>
                <Button onClick={() => setAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Campus
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Campus Name</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayCampuses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            No campuses found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayCampuses.map((campus, index) => (
                          <TableRow key={campus.id}>
                            <TableCell>
                              {indexOfFirstItem + index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              <Link
                                to={`/campus/${campus.id}`}
                                className="text-primary hover:underline"
                              >
                                {campus.campus_name}
                              </Link>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-secondary-purple hover:text-secondary-purple/80 hover:bg-secondary-purple/10"
                                onClick={() => {
                                  setSelectedCampus(campus);
                                  setUpdatedCampusName(campus.campus_name);
                                  setEditDialog(true);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                                onClick={() => {
                                  setSelectedCampus(campus);
                                  setDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between px-4 py-4 border-t bg-muted/20">
                  <div className="text-sm text-muted-foreground">
                    Showing <strong>{displayCampuses.length === 0 ? 0 : indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfFirstItem + displayCampuses.length, filteredCampuses.length)}</strong> of <strong>{filteredCampuses.length}</strong>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">Rows:</Label>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(1); // Reset to first page when changing rows per page
                        }}
                        className="border rounded px-2 py-1 text-sm h-8"
                      >
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <span className="text-sm text-muted-foreground px-2">
                      Page <strong>{currentPage}</strong> of <strong>{totalFilteredPages}</strong>
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="h-8"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalFilteredPages || totalFilteredPages === 0}
                      className="h-8"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Dialog */}
      {addDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-fade-in">
          <form
            onSubmit={handleAddCampus}
            noValidate
            className="bg-card rounded-xl p-6 w-full max-w-md shadow-2xl border-2 border-primary/30 animate-scale-in"
          >
            <h2 className="text-xl font-semibold mb-4 text-primary">
              Add Campus
            </h2>
            <input
              type="text"
              placeholder="Enter campus name"
              className="border-2 border-input px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground transition-all"
              value={newCampus}
              onChange={(e) => setNewCampus(e.target.value)}
              required
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg border-2 border-border transition-all"
                onClick={() => setAddDialog(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-primary"
                disabled={actionLoading}
              >
                {actionLoading ? "Adding..." : "Add"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Dialog */}
      {editDialog && selectedCampus && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-fade-in">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedCampus) {
                handleUpdateCampus(selectedCampus.id, updatedCampusName);
              }
            }}
            noValidate
            className="bg-card rounded-xl p-6 w-full max-w-md shadow-2xl border-2 border-secondary-purple/30 animate-scale-in"
          >
            <h2 className="text-xl font-semibold mb-4 text-secondary-purple">
              Update Campus
            </h2>
            <input
              type="text"
              placeholder="Enter campus name"
              className="border-2 border-input px-3 py-2 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-secondary-purple focus:border-secondary-purple bg-background text-foreground transition-all"
              value={updatedCampusName}
              onChange={(e) => setUpdatedCampusName(e.target.value)}
              required
            />
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg border-2 border-border transition-all"
                onClick={() => {
                  setEditDialog(false);
                  setSelectedCampus(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-secondary-purple hover:bg-secondary-purple/90 text-secondary-purple-foreground rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-secondary-purple"
                disabled={actionLoading}
              >
                {actionLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialog && selectedCampus && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-fade-in">
          <div className="bg-card rounded-xl p-6 w-full max-w-md shadow-2xl border-2 border-destructive/30 animate-scale-in">
            <div className="flex items-center mb-4">
              <div className="bg-destructive/10 rounded-full p-2 mr-3">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-destructive">
                Confirm Deletion
              </h2>
            </div>
            <p className="text-muted-foreground mb-2">
              Are you sure you want to delete{" "}
              <strong className="text-foreground">{selectedCampus.campus_name}</strong>?
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg border-2 border-border transition-all"
                onClick={() => {
                  setDeleteDialog(false);
                  setSelectedCampus(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg shadow-md hover:shadow-lg transition-all border-2 border-destructive"
                onClick={() => {
                  handleDeleteCampus(
                    selectedCampus.id,
                    selectedCampus.campus_name,
                  );
                  setDeleteDialog(false);
                  setSelectedCampus(null);
                }}
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusPage;
