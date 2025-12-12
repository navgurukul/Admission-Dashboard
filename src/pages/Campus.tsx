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
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

import {
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const [newCampus, setNewCampus] = useState("");
  const [updatedCampusName, setUpdatedCampusName] = useState("");
  const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);

  // Reusable fetch function
  const fetchCampuses = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const data = await getCampusesApi();
      console.log("campus Data", data);
      setCampuses(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchCampuses(true);
  }, []);

  // Filter + pagination
  const filteredCampuses = campuses.filter((c) =>
    c.campus_name.toLowerCase().includes(search.toLowerCase()),
  );
  const totalPages = Math.ceil(filteredCampuses.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCampuses.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
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
        title: "Duplicate Campus",
        description: "This campus name already exists. Please use a different name.",
        className: "border-l-4 border-l-orange-500",
      });
      return;
    }
    setActionLoading(true);
    try {
      await createCampusApi(newCampus);
      setAddDialog(false);
      setNewCampus("");
      toast({
        title: "Campus Added Successfully",
        description: `"${newCampus}" has been added.`,
        className: "border-l-4 border-l-green-600",
      });
      await fetchCampuses(false);
      setCurrentPage(1);
    } catch (err) {
      toast({
        title: "Unable to Add Campus",
        description: err instanceof Error ? err.message : "An unexpected error occurred while adding the campus",
        variant: "destructive",
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
      title: "Campus Updated",
      description: `Campus name updated from "${oldName}" to "${campus_name}".`,
      className: "border-l-4 border-l-blue-600",
    });
    await fetchCampuses(false);
  } catch (err) {
    toast({
      title: "Unable to Update Campus",
      description: err instanceof Error ? err.message : "An unexpected error occurred.",
      variant: "destructive",
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
      title: "Campus Deleted",
      description: `"${campus_name}" has been deleted.`,
      className: "border-l-4 border-l-red-600",
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
    
    // Use orange for student records error, red for others
    const borderColor = isStudentRecordsError 
      ? "border-l-orange-500" 
      : "border-l-red-600";
    
    toast({
      title: "Unable to Delete Campus",
      description: fullErrorMessage || "An unexpected error occurred.",
      className: `border-l-4 ${borderColor}`,
    });
  } finally {
    setActionLoading(false);
  }
};

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
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
                      setCurrentPage(1);
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
                      {currentItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center">
                            No campuses found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentItems.map((campus, index) => (
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
                                className="text-blue-600"
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
                                className="text-red-600"
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
                <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-2">
                  {/* Showing items range */}
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    {filteredCampuses.length === 0 ? 0 : indexOfFirstItem + 1} –{" "}
                    {Math.min(indexOfLastItem, filteredCampuses.length)} of{" "}
                    {filteredCampuses.length}
                  </p>

                  {/* Pagination buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || totalPages === 0}
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <form
            onSubmit={handleAddCampus}
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-orange-200"
          >
            <h2 className="text-lg font-semibold mb-4 text-orange-700">
              Add Campus
            </h2>
            <input
              type="text"
              placeholder="Enter campus name"
              className="border border-orange-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={newCampus}
              onChange={(e) => setNewCampus(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                onClick={() => setAddDialog(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-white rounded"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Dialog */}
      {editDialog && selectedCampus && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (selectedCampus) {
                handleUpdateCampus(selectedCampus.id, updatedCampusName);
              }
            }}
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-orange-200"
          >
            <h2 className="text-lg font-semibold mb-4 text-orange-700">
              Update Campus
            </h2>
            <input
              type="text"
              placeholder="Enter campus name"
              className="border border-orange-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={updatedCampusName}
              onChange={(e) => setUpdatedCampusName(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                onClick={() => {
                  setEditDialog(false);
                  setSelectedCampus(null);
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-white rounded"
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-red-200">
            <h2 className="text-lg font-semibold text-red-600 mb-4">
              Confirm Deletion
            </h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedCampus.campus_name}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
                onClick={() => {
                  setDeleteDialog(false);
                  setSelectedCampus(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={() => {
                  handleDeleteCampus(
                    selectedCampus.id,
                    selectedCampus.campus_name,
                  );
                  setDeleteDialog(false);
                  setSelectedCampus(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampusPage;
