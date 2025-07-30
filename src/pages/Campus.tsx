
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
import { Search, Plus, FileDown, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Campus {
  id: number;
  campus: string;
}

const CampusPage = () => {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [addDialog, setAddDialog] = useState(false);
  const [newCampus, setNewCampus] = useState("");

  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const response = await fetch(import.meta.env.VITE_API_CAMPUS_BASE_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        setCampuses(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCampuses();
  }, []);

  const filteredCampuses = campuses.filter((campus) =>
    campus.campus.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCampuses.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCampuses.slice(indexOfFirstItem, indexOfLastItem);

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

  const handleAddCampus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampus.trim()) return;
    setCampuses(prev => [
      ...prev,
      { id: Date.now(), campus: newCampus }
    ]);
    setNewCampus("");
    setAddDialog(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdmissionsSidebar />
      <main className="flex-1 p-8 ml-64">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">Campuses Name</CardTitle>
                <CardDescription>A list of all the campuses.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search campus..."
                    className="pl-8"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1); // Reset to page 1 when searching
                    }}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <FileDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Printer className="h-4 w-4" />
                </Button>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">S.No</TableHead>
                      <TableHead>Campus Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center">
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
                              {campus.campus}
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <p>
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
              </>
            )}
          </CardContent>
        </Card>
      </main>
      {/* Add Campus Dialog */}
      {addDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form
            className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg overflow-y-auto max-h-[90vh]"
            onSubmit={handleAddCampus}
          >
            <h2 className="text-xl font-bold mb-4">Add Campus</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Campus Name</label>
              <input
                type="text"
                className="border px-3 py-2 rounded w-full"
                value={newCampus}
                onChange={e => setNewCampus(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 mt-8">
              <button
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                onClick={() => setAddDialog(false)}
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
              >
                ADD CAMPUS
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CampusPage;
