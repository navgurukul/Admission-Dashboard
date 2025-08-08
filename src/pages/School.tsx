import React, { useEffect, useState } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Plus, Pencil, Trash2, Upload, Download } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Papa from "papaparse";

interface Applicant {
  id: string;
  name: string;
  mobileNo: string;
  campus: string;
  stage: string;
  status: string;
  createdAt: string;
}

const School = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Dialog states
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Form states
  const [newApplicant, setNewApplicant] = useState({
    name: "",
    mobileNo: "",
    campus: "",
    stage: "",
    status: ""
  });
  const [updatedApplicant, setUpdatedApplicant] = useState({
    name: "",
    mobileNo: "",
    campus: "",
    stage: "",
    status: ""
  });
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  // Load data from localStorage on component mount
  useEffect(() => {
    loadApplicantsFromStorage();
  }, []);

  const loadApplicantsFromStorage = () => {
    setLoading(true);
    try {
      const storedData = localStorage.getItem("applicants");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setApplicants(parsedData);
      } else {
        setApplicants([]);
      }
      setHasFetchedOnce(true);
    } catch (error) {
      console.error("Error loading applicants from storage:", error);
      toast({
        title: "Error",
        description: "Failed to load applicants from storage",
        variant: "destructive",
      });
      setApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const saveApplicantsToStorage = (data: Applicant[]) => {
    try {
      localStorage.setItem("applicants", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving applicants to storage:", error);
      toast({
        title: "Error",
        description: "Failed to save applicants to storage",
        variant: "destructive",
      });
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as any[];
        const formattedData: Applicant[] = parsedData.map((row, index) => ({
          id: `applicant_${Date.now()}_${index}`,
          name: row.Name || row.name || "",
          mobileNo: row["Mobile No"] || row["Mobile No."] || row.mobileNo || row.mobile || "",
          campus: row.Campus || row.campus || "",
          stage: row.Stage || row.stage || "",
          status: row.Status || row.status || "",
          createdAt: new Date().toISOString(),
        }));

        // Merge with existing data or replace
        const existingData = localStorage.getItem("applicants");
        let finalData: Applicant[];
        
        if (existingData) {
          const existing = JSON.parse(existingData);
          finalData = [...existing, ...formattedData];
        } else {
          finalData = formattedData;
        }

        setApplicants(finalData);
        saveApplicantsToStorage(finalData);

        toast({
          title: "CSV Uploaded",
          description: `${formattedData.length} applicants imported successfully`,
        });
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        toast({
          title: "Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
      }
    });

    // Reset file input
    event.target.value = "";
  };

  const handleExportCSV = () => {
    if (applicants.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no applicants to export",
        variant: "destructive",
      });
      return;
    }

    const csvData = applicants.map(applicant => ({
      Name: applicant.name,
      "Mobile No": applicant.mobileNo,
      Campus: applicant.campus,
      Stage: applicant.stage,
      Status: applicant.status,
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `applicants_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV Exported",
      description: "Applicants data exported successfully",
    });
  };

  // Filter applicants based on search query
  const filteredApplicants = applicants.filter((applicant) =>
    applicant.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    applicant.mobileNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    applicant.campus?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredApplicants.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredApplicants.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleAddApplicant = (e: React.FormEvent) => {
    e.preventDefault();
    const newApplicantData: Applicant = {
      id: `applicant_${Date.now()}`,
      ...newApplicant,
      createdAt: new Date().toISOString(),
    };

    const updatedApplicants = [...applicants, newApplicantData];
    setApplicants(updatedApplicants);
    saveApplicantsToStorage(updatedApplicants);
    
    setNewApplicant({
      name: "",
      mobileNo: "",
      campus: "",
      stage: "",
      status: ""
    });
    setAddDialog(false);

    toast({
      title: "Applicant Added",
      description: "Applicant has been successfully added.",
    });
  };

  const handleUpdateApplicant = (id: string) => {
    const updatedApplicants = applicants.map((applicant) =>
      applicant.id === id ? { ...applicant, ...updatedApplicant } : applicant
    );
    
    setApplicants(updatedApplicants);
    saveApplicantsToStorage(updatedApplicants);

    toast({
      title: "Applicant Updated",
      description: `Applicant "${updatedApplicant.name}" updated successfully.`,
    });
  };

  const handleDeleteApplicant = (id: string) => {
    const updatedApplicants = applicants.filter((applicant) => applicant.id !== id);
    setApplicants(updatedApplicants);
    saveApplicantsToStorage(updatedApplicants);

    toast({
      title: "Applicant deleted",
      description: `Applicant has been deleted successfully.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      <main className="md:ml-64 overflow-auto h-screen flex flex-col items-center">
        <div className="p-4 md:p-4 w-full pt-16 md:pt-4">
          <div className="bg-card rounded-xl shadow-soft border border-border">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Applicants
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Manage and view all applicants
                  </p>
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload">
                    <Button variant="outline" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" /> Import CSV
                    </Button>
                  </label>
                  <Button variant="outline" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" /> Export CSV
                  </Button>
                  <Button onClick={() => setAddDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Applicant
                  </Button>
                </div>
              </div>
              {/* Search */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    placeholder="Search applicants..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // reset pagination on search
                    }}
                    className="pl-10 h-9 border rounded w-full"
                  />
                </div>
              </div>
            </div>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                      S.No
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                      Name
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                      Mobile No
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                      Campus
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                      Stage
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
                      Status
                    </th>
                    <th className="text-right py-4 px-6 font-medium text-muted-foreground text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && !hasFetchedOnce ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading applicants...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-12 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <Search className="w-8 h-8 opacity-50" />
                          <span>No applicants found</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((applicant, idx) => (
                      <tr
                        key={applicant.id}
                        className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          {indexOfFirstItem + idx + 1}
                        </td>
                        <td className="py-4 px-6 text-orange-600 font-medium">
                          {applicant.name}
                        </td>
                        <td className="py-4 px-6">
                          {applicant.mobileNo}
                        </td>
                        <td className="py-4 px-6">
                          {applicant.campus}
                        </td>
                        <td className="py-4 px-6">
                          {applicant.stage}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            applicant.status === 'Active' ? 'bg-green-100 text-green-800' :
                            applicant.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {applicant.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-blue-600"
                            onClick={() => {
                              setSelectedApplicant(applicant);
                              setUpdatedApplicant({
                                name: applicant.name,
                                mobileNo: applicant.mobileNo,
                                campus: applicant.campus,
                                stage: applicant.stage,
                                status: applicant.status
                              });
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
                              setSelectedApplicant(applicant);
                              setDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-t border-border/50 bg-muted/20 gap-2">
              <Button
                variant="outline"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>

            {/* Show total count */}
            <div className="px-6 py-4 border-t border-border/50 bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Showing {currentItems.length} of {filteredApplicants.length}{" "}
                filtered applicants
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Add Dialog */}
      {addDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <form
            onSubmit={handleAddApplicant}
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-blue-200"
          >
            <h2 className="text-lg font-semibold mb-4 text-blue-700">
              Add Applicant
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter name"
                className="border border-blue-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newApplicant.name}
                onChange={(e) => setNewApplicant({...newApplicant, name: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Enter mobile number"
                className="border border-blue-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newApplicant.mobileNo}
                onChange={(e) => setNewApplicant({...newApplicant, mobileNo: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Enter campus"
                className="border border-blue-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newApplicant.campus}
                onChange={(e) => setNewApplicant({...newApplicant, campus: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Enter stage"
                className="border border-blue-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newApplicant.stage}
                onChange={(e) => setNewApplicant({...newApplicant, stage: e.target.value})}
                required
              />
              <select
                className="border border-blue-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={newApplicant.status}
                onChange={(e) => setNewApplicant({...newApplicant, status: e.target.value})}
                required
              >
                <option value="">Select status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
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
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Dialog */}
      {editDialog && selectedApplicant && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-blue-200">
            <h2 className="text-lg font-semibold mb-4 text-blue-700">
              Update Applicant
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter name"
                className="border border-blue-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={updatedApplicant.name}
                onChange={(e) => setUpdatedApplicant({...updatedApplicant, name: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Enter mobile number"
                className="border border-blue-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={updatedApplicant.mobileNo}
                onChange={(e) => setUpdatedApplicant({...updatedApplicant, mobileNo: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Enter campus"
                className="border border-blue-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={updatedApplicant.campus}
                onChange={(e) => setUpdatedApplicant({...updatedApplicant, campus: e.target.value})}
                required
              />
              <input
                type="text"
                placeholder="Enter stage"
                className="border border-blue-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={updatedApplicant.stage}
                onChange={(e) => setUpdatedApplicant({...updatedApplicant, stage: e.target.value})}
                required
              />
              <select
                className="border border-blue-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={updatedApplicant.status}
                onChange={(e) => setUpdatedApplicant({...updatedApplicant, status: e.target.value})}
                required
              >
                <option value="">Select status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                onClick={() => {
                  setEditDialog(false);
                  setSelectedApplicant(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                onClick={() => {
                  if (selectedApplicant) {
                    handleUpdateApplicant(selectedApplicant.id);
                    setEditDialog(false);
                    setSelectedApplicant(null);
                  }
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialog && selectedApplicant && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-red-200">
            <h2 className="text-lg font-semibold text-red-600 mb-4">
              Confirm Deletion
            </h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{selectedApplicant.name}</strong>?
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                onClick={() => {
                  setDeleteDialog(false);
                  setSelectedApplicant(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                onClick={() => {
                  handleDeleteApplicant(selectedApplicant.id);
                  setDeleteDialog(false);
                  setSelectedApplicant(null);
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

export default School;
