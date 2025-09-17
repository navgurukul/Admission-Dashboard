// import React, { useEffect, useState } from "react";
// import { AdmissionsSidebar } from "../components/AdmissionsSidebar";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Search, Plus, FileDown, Printer, Pencil, Trash2 } from "lucide-react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Link } from "react-router-dom";
// import { toast } from "@/components/ui/use-toast";

// interface Campus {
//   id: number;
//   campus: string;
// }

// const CampusPage = () => {
//   const [campuses, setCampuses] = useState<Campus[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   const [addDialog, setAddDialog] = useState(false);
//   const [editDialog, setEditDialog] = useState(false);
//   const [deleteDialog, setDeleteDialog] = useState(false);

//   const [newCampus, setNewCampus] = useState("");
//   const [updatedCampusName, setUpdatedCampusName] = useState("");
//   const [selectedCampus, setSelectedCampus] = useState<Campus | null>(null);
//   const BASE_URL = import.meta.env.VITE_API_BASE_URL;

//   useEffect(() => {
//     const fetchCampuses = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const response = await fetch(`${BASE_URL}/campuses/getCampuses`);
        
//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(`Failed to fetch campuses: ${response.status} ${response.statusText}`);
//         }
        
//         const data = await response.json();

//         let campusesData = [];
//         if (Array.isArray(data)) {
//           campusesData = data;
//         } else if (data.data && Array.isArray(data.data)) {
//           campusesData = data.data;
//         } else if (data.data && typeof data.data === 'object' && data.data.data && Array.isArray(data.data.data)) {
//           // Handle nested structure: {success: true, data: {data: [...]}}
//           campusesData = data.data.data;
//         } else if (data.data && typeof data.data === 'object' && data.data.campuses && Array.isArray(data.data.campuses)) {
//           campusesData = data.data.campuses;
//         } else if (data.data && typeof data.data === 'object' && data.data.result && Array.isArray(data.data.result)) {
//           // Handle nested structure: {success: true, data: {result: [...]}}
//           campusesData = data.data.result;
//         } else if (data.campuses && Array.isArray(data.campuses)) {
//           campusesData = data.campuses;
//         } else if (data.result && Array.isArray(data.result)) {
//           campusesData = data.result;
//         } else {
//           console.warn("Unexpected campuses API response structure:", data);
//           console.log("Available keys in data:", Object.keys(data));
//           if (data.data && typeof data.data === 'object') {
//             console.log("Available keys in data.data:", Object.keys(data.data));
//           }
//           campusesData = [];
//         }


//         const mappedCampuses = campusesData.map((item: any) => ({
//           id: item.id || item.campus_id,
//           campus: item.campus_name || item.name || item.campusName || item.campus || "",
//         }));

//         setCampuses(mappedCampuses);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : "An unknown error occurred");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCampuses();
//   }, []);

//   const filteredCampuses = campuses.filter((campus) =>
//     campus.campus.toLowerCase().includes(search.toLowerCase())
//   );

//   const totalPages = Math.ceil(filteredCampuses.length / itemsPerPage);
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = filteredCampuses.slice(
//     indexOfFirstItem,
//     indexOfLastItem
//   );

//   const handleNextPage = () => {
//     if (currentPage < totalPages) {
//       setCurrentPage((prev) => prev + 1);
//     }
//   };

//   const handlePrevPage = () => {
//     if (currentPage > 1) {
//       setCurrentPage((prev) => prev - 1);
//     }
//   };

//   const handleAddCampus = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       console.log("Creating campus:", newCampus);
//       const response = await fetch(`${BASE_URL}/campuses/createCampus`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ campus_name: newCampus }),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`Failed to create campus: ${response.status} ${response.statusText}`);
//       }

//       const result = await response.json();

//       // Add the new campus to the state immediately
//       const newCampusData = {
//         id: result.id || result.data?.id || Date.now(),
//         campus: newCampus,
//       };

//       setCampuses((prev) => [...prev, newCampusData]);
//       setNewCampus("");
//       setAddDialog(false);

//       toast({
//         title: "Campus Added",
//         description: "Campus has been successfully added.",
//       });
//     } catch (err) {
//       console.error("Error creating campus:", err);
//       toast({
//         title: "Error",
//         description: `Failed to create campus: ${err instanceof Error ? err.message : 'Unknown error'}`,
//         variant: "destructive",
//       });
//     }
//   };

//   const handleUpdateCampus = async (id: number, updatedName: string) => {
    
//   try {
//     const response = await fetch(
//       `${BASE_URL}/campuses/updateCampus/${id}`,
//       {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ campus_name: updatedName }),
//       }
//     );

//     if (!response.ok) throw new Error("Failed to update campus");

//     setCampuses((prev) =>
//       prev.map((c) => (c.id === id ? { ...c, campus: updatedName } : c))
//     );

//     toast({
//       title: "Campus Updated",
//       description: `Campus "${updatedName}" updated successfully.`,
//     });
//   } catch (error) {
//     toast({
//       title: "Error updating campus",
//       description: (error as Error).message,
//       variant: "destructive",
//     });
//   }
// };

// const handleDeleteCampus = async (id: number) => {
//   try {
//     const response = await fetch(
//       `${BASE_URL}/campuses/deleteCampus/${id}`,
//       {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (!response.ok) throw new Error("Failed to delete");

//     setCampuses((prev) => prev.filter((c) => c.id !== id));
//     toast({
//       title: "Campus deleted",
//       description: `Campus ID ${id} has been deleted.`,
//     });
//   } catch (error) {
//     toast({
//       title: "Error deleting campus",
//       description: (error as Error).message,
//       variant: "destructive",
//     });
//   }
// };

  // return (
  //   <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
  //     <AdmissionsSidebar />
  //     <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 md:ml-64">
  //       <Card>
  //         <CardHeader>
  //           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
  //             <div>
  //               <CardTitle className="text-2xl">Campuses Name</CardTitle>
  //               <CardDescription>A list of all the campuses.</CardDescription>
  //             </div>
  //             <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
  //               <div className="relative flex-1">
  //                 <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
  //                 <Input
  //                   type="search"
  //                   placeholder="Search campus..."
  //                   className="pl-8 w-full"
  //                   value={search}
  //                   onChange={(e) => {
  //                     setSearch(e.target.value);
  //                     setCurrentPage(1);
  //                   }}
  //                 />
  //               </div>
  //               <Button variant="outline" size="icon">
  //                 <FileDown className="h-4 w-4" />
  //               </Button>
  //               <Button variant="outline" size="icon">
  //                 <Printer className="h-4 w-4" />
  //               </Button>
  //               <Button onClick={() => setAddDialog(true)}>
  //                 <Plus className="mr-2 h-4 w-4" /> Add Campus
  //               </Button>
  //             </div>
  //           </div>
  //         </CardHeader>
  //         <CardContent>
  //           {loading ? (
  //             <p>Loading...</p>
  //           ) : error ? (
  //             <p className="text-red-500">{error}</p>
  //           ) : (
  //             <>
  //               <div className="overflow-x-auto">
  //                 <Table>
  //                   <TableHeader>
  //                     <TableRow>
  //                       <TableHead>S.No</TableHead>
  //                       <TableHead>Campus Name</TableHead>
  //                       <TableHead className="text-right">Actions</TableHead>
  //                     </TableRow>
  //                   </TableHeader>
  //                   <TableBody>
  //                     {currentItems.length === 0 ? (
  //                       <TableRow>
  //                         <TableCell colSpan={3} className="text-center">
  //                           No campuses found.
  //                         </TableCell>
  //                       </TableRow>
  //                     ) : (
  //                       currentItems.map((campus, index) => (
  //                         <TableRow key={campus.id}>
  //                           <TableCell>
  //                             {indexOfFirstItem + index + 1}
  //                           </TableCell>
  //                           <TableCell className="font-medium">
  //                             <Link
  //                               to={`/campus/${campus.id}`}
  //                               className="text-primary hover:underline"
  //                             >
  //                               {campus.campus}
  //                             </Link>
  //                           </TableCell>
  //                           <TableCell className="text-right space-x-2">
  //                             <Button
  //                               variant="ghost"
  //                               size="icon"
  //                               className="text-blue-600"
  //                               onClick={() => {
  //                                 setSelectedCampus(campus);
  //                                 setUpdatedCampusName(campus.campus);
  //                                 setEditDialog(true);
  //                               }}
  //                             >
  //                               <Pencil className="w-4 h-4" />
  //                             </Button>
  //                             <Button
  //                               variant="ghost"
  //                               size="icon"
  //                               className="text-red-600"
  //                               onClick={() => {
  //                                 setSelectedCampus(campus);
  //                                 setDeleteDialog(true);
  //                               }}
  //                             >
  //                               <Trash2 className="w-4 h-4" />
  //                             </Button>
  //                           </TableCell>
  //                         </TableRow>
  //                       ))
  //                     )}
  //                   </TableBody>
  //                 </Table>
  //               </div>

  //               <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-2">
  //                 <Button
  //                   variant="outline"
  //                   onClick={handlePrevPage}
  //                   disabled={currentPage === 1}
  //                 >
  //                   Previous
  //                 </Button>
  //                 <p>
  //                   Page {currentPage} of {totalPages}
  //                 </p>
  //                 <Button
  //                   variant="outline"
  //                   onClick={handleNextPage}
  //                   disabled={currentPage === totalPages}
  //                 >
  //                   Next
  //                 </Button>
  //               </div>
  //             </>
  //           )}
  //         </CardContent>
  //       </Card>
  //     </main>

  //     {/* Add Dialog */}
  //     {addDialog && (
  //       <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
  //         <form
  //           onSubmit={handleAddCampus}
  //           className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-orange-200"
  //         >
  //           <h2 className="text-lg font-semibold mb-4 text-orange-700">
  //             Add Campus
  //           </h2>
  //           <input
  //             type="text"
  //             placeholder="Enter campus name"
  //             className="border border-orange-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  //             value={newCampus}
  //             onChange={(e) => setNewCampus(e.target.value)}
  //             required
  //           />
  //           <div className="flex justify-end gap-2 mt-6">
  //             <button
  //               type="button"
  //               className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
  //               onClick={() => setAddDialog(false)}
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               type="submit"
  //               className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
  //             >
  //               Add
  //             </button>
  //           </div>
  //         </form>
  //       </div>
  //     )}

  //     {/* Edit Dialog */}
  //     {editDialog && selectedCampus && (
  //       <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
  //         <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-orange-200">
  //           <h2 className="text-lg font-semibold mb-4 text-orange-700">
  //             Update Campus
  //           </h2>
  //           <input
  //             type="text"
  //             placeholder="Enter campus name"
  //             className="border border-orange-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
  //             value={updatedCampusName}
  //             onChange={(e) => setUpdatedCampusName(e.target.value)}
  //             required
  //           />
  //           <div className="flex justify-end gap-2 mt-6">
  //             <button
  //               className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
  //               onClick={() => {
  //                 setEditDialog(false);
  //                 setSelectedCampus(null);
  //               }}
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
  //               onClick={() => {
  //                 if (selectedCampus) {
  //                   handleUpdateCampus(selectedCampus.id, updatedCampusName);
  //                   setEditDialog(false);
  //                   setSelectedCampus(null);
  //                 }
  //               }}
  //             >
  //               Update
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     )}

  //     {/* Delete Dialog */}
  //     {deleteDialog && selectedCampus && (
  //       <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
  //         <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-red-200">
  //           <h2 className="text-lg font-semibold text-red-600 mb-4">
  //             Confirm Deletion
  //           </h2>
  //           <p>
  //             Are you sure you want to delete{" "}
  //             <strong>{selectedCampus.campus}</strong>?
  //           </p>
  //           <div className="flex justify-end gap-2 mt-6">
  //             <button
  //               className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
  //               onClick={() => {
  //                 setDeleteDialog(false);
  //                 setSelectedCampus(null);
  //               }}
  //             >
  //               Cancel
  //             </button>
  //             <button
  //               className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
  //               onClick={() => {
  //                 handleDeleteCampus(selectedCampus.id);
  //                 setDeleteDialog(false);
  //                 setSelectedCampus(null);
  //               }}
  //             >
  //               Delete
  //             </button>
  //           </div>
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
// };

// export default CampusPage;

// CampusPage.tsx
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
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";

// API functions (from your new api.ts)
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
  const [loading, setLoading] = useState(true);
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

  // Fetch campuses on mount
  useEffect(() => {
    const fetchCampuses = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCampusesApi();
        setCampuses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCampuses();
  }, []);

  // Filter + pagination calculations (IMPORTANT: currentItems is defined here)
  const filteredCampuses = campuses.filter((campus) =>
    campus.campus_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCampuses.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCampuses.slice(indexOfFirstItem, indexOfLastItem);

  const handleNextPage = () => {
    if (currentPage < Math.max(totalPages, 1)) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Add campus
  const handleAddCampus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createCampusApi(newCampus);
      const newCampusData: Campus = {
        id: result.id || result.data?.id || Date.now(),
        campus_name: newCampus,
      };
      setCampuses((prev) => [...prev, newCampusData]);
      setNewCampus("");
      setAddDialog(false);
      toast({ title: "Campus Added", description: "Campus has been successfully added." });
    } catch (err) {
      console.error("Error creating campus:", err);
      toast({
        title: "Error",
        description: `Failed to create campus: ${err instanceof Error ? err.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  // Update campus
  const handleUpdateCampus = async (id: number, updatedName: string) => {
    try {
      await updateCampusApi(id, updatedName);
      setCampuses((prev) => prev.map((c) => (c.id === id ? { ...c, campus: updatedName } : c)));
      toast({ title: "Campus Updated", description: `Campus "${updatedName}" updated successfully.` });
    } catch (error) {
      toast({
        title: "Error updating campus",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Delete campus
  const handleDeleteCampus = async (id: number) => {
    try {
      await deleteCampusApi(id);
      setCampuses((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Campus deleted", description: `Campus ID ${id} has been deleted.` });
    } catch (error) {
      toast({
        title: "Error deleting campus",
        description: (error as Error).message,
        variant: "destructive",
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
                            <TableCell>{indexOfFirstItem + index + 1}</TableCell>
                            <TableCell className="font-medium">
                              <Link to={`/campus/${campus.id}`} className="text-primary hover:underline">
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

                <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-2">
                  <Button variant="outline" onClick={handlePrevPage} disabled={currentPage === 1}>
                    Previous
                  </Button>
                  <p>Page {currentPage} of {Math.max(totalPages, 1)}</p>
                  <Button variant="outline" onClick={handleNextPage} disabled={currentPage === Math.max(totalPages, 1)}>
                    Next
                  </Button>
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
            <h2 className="text-lg font-semibold mb-4 text-orange-700">Add Campus</h2>
            <input
              type="text"
              placeholder="Enter campus name"
              className="border border-orange-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              value={newCampus}
              onChange={(e) => setNewCampus(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className="px-4 py-2 bg-gray-300 text-gray-700 rounded" onClick={() => setAddDialog(false)}>
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded">
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Dialog */}
      {editDialog && selectedCampus && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-orange-200">
            <h2 className="text-lg font-semibold mb-4 text-orange-700">Update Campus</h2>
            <input
              type="text"
              placeholder="Enter campus name"
              className="border border-orange-300 px-3 py-2 rounded w-full"
              value={updatedCampusName}
              onChange={(e) => setUpdatedCampusName(e.target.value)}
              required
            />
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded" onClick={() => { setEditDialog(false); setSelectedCampus(null); }}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-orange-500 text-white rounded" onClick={() => {
                if (selectedCampus) {
                  handleUpdateCampus(selectedCampus.id, updatedCampusName);
                  setEditDialog(false);
                  setSelectedCampus(null);
                }
              }}>
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialog && selectedCampus && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-red-200">
            <h2 className="text-lg font-semibold text-red-600 mb-4">Confirm Deletion</h2>
            <p>Are you sure you want to delete <strong>{selectedCampus.campus_name}</strong>?</p>
            <div className="flex justify-end gap-2 mt-6">
              <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded" onClick={() => { setDeleteDialog(false); setSelectedCampus(null); }}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={() => {
                handleDeleteCampus(selectedCampus.id);
                setDeleteDialog(false);
                setSelectedCampus(null);
              }}>
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
