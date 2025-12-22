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
import { Search, Plus, FileDown, Printer, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";

// 🔹 API methods from api.ts
import {
  getAllSchools,
  createSchool,
  updateSchool,
  deleteSchool,
} from "@/utils/api";

interface School {
  id: number;
  school_name: string;
}

const SchoolPage = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const [newSchool, setNewSchool] = useState("");
  const [updatedSchoolName, setUpdatedSchoolName] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const formatErrorMessage = (error: any): string => {
    // Check for nested API error response (e.g., error.data.message)
    if (error?.data?.message) {
      return error.data.message;
    }

    const errorMessage = (error?.message || "").toLowerCase();

    // Duplicate value errors
    if (
      errorMessage.includes("duplicate") ||
      errorMessage.includes("already exists")
    ) {
      return "This school name already exists. Please use a different name.";
    }

    // Network errors
    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      return "Network error. Please check your connection and try again.";
    }

    return error?.data?.message || "An error occurred. Please try again.";
  };

  // Fetch schools
  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllSchools();
        setSchools(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred while adding the schools",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, []);

  //  Filter & pagination
  const filteredSchools = schools.filter((school) =>
    (school.school_name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSchools.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  //  Add School
  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();

    const isDuplicate = schools.some(
      (school) =>
        school.school_name.toLowerCase() === newSchool.toLowerCase().trim(),
    );

    if (isDuplicate) {
      toast({
        title: "⚠️ Duplicate School",
        description: "This school name already exists. Please use a different name.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900"
      });
      return;
    }
    try {
      const result = await createSchool(newSchool);
      const newSchoolData: School = {
        id: result.id || result.data?.id || Date.now(),
        school_name: newSchool,
        // status: true,
        // created_at: new Date().toISOString(),
      };

      setSchools((prev) => [...prev, newSchoolData]);
      setNewSchool("");
      setAddDialog(false);

      toast({
        title: "✅ School Added",
        description: `"${newSchool}" has been added to the list.`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900"
      });
    } catch (err) {
      const errorMessage = formatErrorMessage(err as Error);
      toast({
        title: "❌ Unable to Add School",
        description: getFriendlyErrorMessage(err),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900"
      });
    }
  };

  //  Update School
  const handleUpdateSchool = async (id: number, updatedName: string) => {
  // Get the old school name before updating
  const oldSchool = schools.find(s => s.id === id);
  const oldName = oldSchool?.school_name || "";
  
  try {
    await updateSchool(id, updatedName);
    setSchools((prev) =>
      prev.map((s) => (s.id === id ? { ...s, school_name: updatedName } : s)),
    );

    toast({
      title: "✅ School Updated",
      description: `School name updated from "${oldName}" to "${updatedName}".`,
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900"
    });
  } catch (error) {
    const errorMessage = formatErrorMessage(error as Error);
    toast({
      title: "❌ Unable to Update School",
      description: getFriendlyErrorMessage(error),
      variant: "destructive",
      className: "border-red-500 bg-red-50 text-red-900"
    });
  }
};

  // Delete School
  const handleDeleteSchool = async (id: number, school_name: string) => {
  try {
    await deleteSchool(id);

    setSchools((prev) => prev.filter((s) => s.id !== id));
    toast({
      title: "✅ School Deleted",
      description: `"${school_name}" has been removed.`,
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900"
    });
  } catch (error: any) {
    // Try multiple paths to get the error message
    const fullErrorMessage = 
      error?.data?.message || 
      error?.response?.data?.message ||
      error?.message ||
      formatErrorMessage(error);
    
    // Check if it's a student records association error
    const isStudentRecordsError = fullErrorMessage && (
      fullErrorMessage.toLowerCase().includes("existing student records") ||
      fullErrorMessage.toLowerCase().includes("students before deletion") ||
      fullErrorMessage.toLowerCase().includes("reassign or remove")
    );
    
    toast({
      title: isStudentRecordsError ? "⚠️ Cannot Delete School" : "❌ Unable to Delete School",
      description: getFriendlyErrorMessage(error),
      variant: isStudentRecordsError ? "default" : "destructive",
      className: isStudentRecordsError 
        ? "border-orange-500 bg-orange-50 text-orange-900" 
        : "border-red-500 bg-red-50 text-red-900"
    });
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
                <CardTitle className="text-2xl">Schools</CardTitle>
                <CardDescription>A list of all the schools.</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search school..."
                    className="pl-8 w-full"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
                <Button onClick={() => setAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add School
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
                        <TableHead>School Name</TableHead>
                        {/* <TableHead>Status</TableHead> */}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No schools found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentItems.map((school, index) => (
                          <TableRow key={school.id}>
                            <TableCell>
                              {indexOfFirstItem + index + 1}
                            </TableCell>
                            <TableCell className="font-medium text-orange-600">
                              {school.school_name || "N/A"}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-blue-600"
                                onClick={() => {
                                  setSelectedSchool(school);
                                  setUpdatedSchoolName(school.school_name);
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
                                  setSelectedSchool(school);
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

                <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-2">
                  {/* Showing items */}
                  <p className="text-sm text-muted-foreground">
                    Showing{" "}
                    {filteredSchools.length === 0 ? 0 : indexOfFirstItem + 1} –
                    {Math.min(indexOfLastItem, filteredSchools.length)} of{" "}
                    {filteredSchools.length}
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

      {/* 🔹 Add Dialog */}
      {addDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <form
            onSubmit={handleAddSchool}
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-orange-200"
          >
            <h2 className="text-lg font-semibold mb-4 text-orange-700">
              Add School
            </h2>
            <input
              type="text"
              placeholder="Enter school name"
              className="border border-orange-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={newSchool}
              onChange={(e) => setNewSchool(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                onClick={() => setAddDialog(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 🔹 Edit Dialog */}
      {editDialog && selectedSchool && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-orange-200">
            <h2 className="text-lg font-semibold mb-4 text-orange-700">
              Update School
            </h2>
            <input
              type="text"
              placeholder="Enter school name"
              className="border border-orange-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={updatedSchoolName}
              onChange={(e) => setUpdatedSchoolName(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                onClick={() => {
                  setEditDialog(false);
                  setSelectedSchool(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                onClick={() => {
                  if (selectedSchool) {
                    handleUpdateSchool(selectedSchool.id, updatedSchoolName);
                    setEditDialog(false);
                    setSelectedSchool(null);
                  }
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Delete Dialog */}
      {deleteDialog && selectedSchool && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-red-200">
            <h2 className="text-lg font-semibold text-red-600 mb-4">
              Confirm Deletion
            </h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedSchool.school_name}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                onClick={() => {
                  setDeleteDialog(false);
                  setSelectedSchool(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                onClick={() => {
                  handleDeleteSchool(
                    selectedSchool.id,
                    selectedSchool.school_name,
                  );
                  setDeleteDialog(false);
                  setSelectedSchool(null);
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

export default SchoolPage;
