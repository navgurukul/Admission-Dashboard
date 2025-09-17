// import React, { useEffect, useState } from "react";
// import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Search, Plus, Pencil, Trash2 } from "lucide-react";
// import { toast } from "@/components/ui/use-toast";

// interface School {
//   id: number;
//   school_name: string;
//   status: boolean;
//   created_at: string;
// }

// const School = () => {
//   const [schools, setSchools] = useState<School[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;
//   const navigate = useNavigate();

//   // Dialog states
//   const [addDialog, setAddDialog] = useState(false);
//   const [editDialog, setEditDialog] = useState(false);
//   const [deleteDialog, setDeleteDialog] = useState(false);

//   // Form states
//   const [newSchool, setNewSchool] = useState("");
//   const [updatedSchoolName, setUpdatedSchoolName] = useState("");
//   const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
//   const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

//   useEffect(() => {
//     fetchSchools();
//   }, []);

//   const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// const fetchSchools = async () => {
//   setLoading(true);
//   try {
//     const response = await fetch(`${BASE_URL}/schools/getSchools`);
    
//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`Failed to fetch schools: ${response.status} ${response.statusText}`);
//     }
    
//     const data = await response.json();

//     let schoolsData = [];
//     if (Array.isArray(data)) {
//       schoolsData = data;
//     } else if (data.data && Array.isArray(data.data)) {
//       schoolsData = data.data;
//     } else if (data.data && typeof data.data === 'object' && data.data.data && Array.isArray(data.data.data)) {
//       // Handle nested structure: {success: true, data: {data: [...]}}
//       schoolsData = data.data.data;
//     } else if (data.data && typeof data.data === 'object' && data.data.schools && Array.isArray(data.data.schools)) {
//       // Handle nested structure: {success: true, data: {schools: [...]}}
//       schoolsData = data.data.schools;
//     } else if (data.data && typeof data.data === 'object' && data.data.result && Array.isArray(data.data.result)) {
//       // Handle nested structure: {success: true, data: {result: [...]}}
//       schoolsData = data.data.result;
//     } else if (data.schools && Array.isArray(data.schools)) {
//       schoolsData = data.schools;
//     } else if (data.result && Array.isArray(data.result)) {
//       schoolsData = data.result;
//     } else {
//       console.log("Available keys in data:", Object.keys(data));
//       if (data.data && typeof data.data === 'object') {
//         console.log("Available keys in data.data:", Object.keys(data.data));
//       }
//       schoolsData = [];
//     }


//     const mappedSchools = schoolsData.map((school: any) => ({
//       id: school.id || school.school_id,
//       school_name: school.school_name || school.name || school.schoolName || "",
//       status: school.status !== undefined ? school.status : true,
//       created_at: school.created_at || school.createdAt || school.created_date || new Date().toISOString(),
//     }));

//     setSchools(mappedSchools);
//     setHasFetchedOnce(true);
//   } catch (error) {
//     toast({
//       title: "Error",
//       description: `Failed to fetch schools: ${error instanceof Error ? error.message : 'Unknown error'}`,
//       variant: "destructive",
//     });
//   } finally {
//     setLoading(false);
//   }
// };

// // Filter schools based on search query
  // const filteredSchools = schools.filter((school) =>
  //   school.school_name?.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  // // Pagination logic
  // const totalPages = Math.ceil(filteredSchools.length / itemsPerPage);
  // const indexOfLastItem = currentPage * itemsPerPage;
  // const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // const currentItems = filteredSchools.slice(indexOfFirstItem, indexOfLastItem);

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

//   const handleAddSchool = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//     const response = await fetch(`${BASE_URL}/schools/createSchool`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ school_name: newSchool }),
//     });

//       if (!response.ok) throw new Error("Failed to create school");

//       const result = await response.json();

//       // Add the new school to the state immediately
//       const newSchoolData = {
//         id: result.id || result.data?.id || Date.now(),
//         school_name: newSchool,
//         status: true,
//         created_at: new Date().toISOString(),
//       };

//       setSchools((prev) => [...prev, newSchoolData]);
//       setNewSchool("");
//       setAddDialog(false);

//       // Fallback: refresh data after a short delay to ensure consistency
//       setTimeout(() => {
//         fetchSchools();
//       }, 1000);

//       toast({
//         title: "School Added",
//         description: "School has been successfully added.",
//       });
//     } catch (error) {
//       console.error("Error creating school:", error);
//       toast({
//         title: "Error",
//         description: "Failed to create school.",
//         variant: "destructive",
//       });
//     }
//   };

//   const handleUpdateSchool = async (id: number, updatedName: string) => {
//    try {
//     const response = await fetch(`${BASE_URL}/schools/updateSchool/${id}`, {
//       method: "PUT",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ school_name: updatedName }),
//     });


//       if (!response.ok) throw new Error("Failed to update school");

//       setSchools((prev) =>
//         prev.map((s) => (s.id === id ? { ...s, name: updatedName } : s))
//       );

//       toast({
//         title: "School Updated",
//         description: `School "${updatedName}" updated successfully.`,
//       });
//     } catch (error) {
//       toast({
//         title: "Error updating school",
//         description: (error as Error).message,
//         variant: "destructive",
//       });
//     }
//   };

//  const handleDeleteSchool = async (id: number) => {
//   try {
//     const response = await fetch(`${BASE_URL}/schools/deleteSchool/${id}`, {
//       method: "DELETE",
//       headers: {
//         "Content-Type": "application/json",
//       },
//     });

//     if (!response.ok) throw new Error("Failed to delete school");

//     setSchools((prev) => prev.filter((s) => s.id !== id));

//     toast({
//       title: "School deleted",
//       description: `School has been deleted successfully.`,
//     });
//   } catch (error) {
//     toast({
//       title: "Error deleting school",
//       description: (error as Error).message,
//       variant: "destructive",
//     });
//   }
// };
//   return (
//     <div className="min-h-screen bg-background">
//       <AdmissionsSidebar />
//       <main className="md:ml-64 overflow-auto h-screen flex flex-col items-center">
//         <div className="p-4 md:p-4 w-full pt-16 md:pt-4">
//           <div className="bg-card rounded-xl shadow-soft border border-border">
//             {/* Header */}
//             <div className="p-6 border-b border-border">
//               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
//                 <div>
//                   <h2 className="text-xl font-semibold text-foreground">
//                     Schools
//                   </h2>
//                   <p className="text-muted-foreground text-sm mt-1">
//                     Manage and view all schools
//                   </p>
//                 </div>
//                 <Button onClick={() => setAddDialog(true)}>
//                   <Plus className="mr-2 h-4 w-4" /> Add School
//                 </Button>
//               </div>
//               {/* Search */}
//               <div className="flex items-center space-x-4">
//                 <div className="relative flex-1 max-w-md">
//                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
//                   <input
//                     placeholder="Search by school name..."
//                     value={searchQuery}
//                     onChange={(e) => {
//                       setSearchQuery(e.target.value);
//                       setCurrentPage(1); // reset pagination on search
//                     }}
//                     className="pl-10 h-9 border rounded w-full"
//                   />
//                 </div>
//               </div>
//             </div>
//             {/* Table */}
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b border-border/50">
//                     <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
//                       S.No
//                     </th>
//                     <th className="text-left py-4 px-6 font-medium text-muted-foreground text-sm">
//                       School Name
//                     </th>
//                     <th className="text-right py-4 px-6 font-medium text-muted-foreground text-sm">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {loading && !hasFetchedOnce ? (
//                     <tr>
//                       <td
//                         colSpan={3}
//                         className="py-12 text-center text-muted-foreground"
//                       >
//                         <div className="flex flex-col items-center space-y-2">
//                           <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
//                           <span>Loading schools...</span>
//                         </div>
//                       </td>
//                     </tr>
//                   ) : currentItems.length === 0 ? (
//                     <tr>
//                       <td
//                         colSpan={3}
//                         className="py-12 text-center text-muted-foreground"
//                       >
//                         <div className="flex flex-col items-center space-y-2">
//                           <Search className="w-8 h-8 opacity-50" />
//                           <span>No schools found</span>
//                         </div>
//                       </td>
//                     </tr>
//                   ) : (
//                     currentItems.map((school, idx) => (
//                       <tr
//                         key={school.id}
//                         className="border-b border-border/30 hover:bg-muted/30 transition-colors"
//                       >
//                         <td className="py-4 px-6">
//                           {indexOfFirstItem + idx + 1}
//                         </td>
//                         <td
//                           className="py-4 px-6 text-orange-600 font-medium cursor-pointer hover:underline"
//                           onClick={() => navigate(`/school/${school.id}`)}
//                         >
//                           {school.school_name}
//                         </td>
//                         <td className="py-4 px-6 text-right space-x-2">
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             className="text-blue-600"
//                             onClick={() => {
//                               setSelectedSchool(school);
//                               setUpdatedSchoolName(school.school_name);
//                               setEditDialog(true);
//                             }}
//                           >
//                             <Pencil className="w-4 h-4" />
//                           </Button>
//                           <Button
//                             variant="ghost"
//                             size="icon"
//                             className="text-red-600"
//                             onClick={() => {
//                               setSelectedSchool(school);
//                               setDeleteDialog(true);
//                             }}
//                           >
//                             <Trash2 className="w-4 h-4" />
//                           </Button>
//                         </td>
//                       </tr>
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination Controls */}
//             <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-t border-border/50 bg-muted/20 gap-2">
//               <Button
//                 variant="outline"
//                 onClick={handlePrevPage}
//                 disabled={currentPage === 1}
//               >
//                 Previous
//               </Button>
//               <p className="text-sm text-muted-foreground">
//                 Page {currentPage} of {totalPages}
//               </p>
//               <Button
//                 variant="outline"
//                 onClick={handleNextPage}
//                 disabled={currentPage === totalPages}
//               >
//                 Next
//               </Button>
//             </div>

//             {/* Show total count */}
//             <div className="px-6 py-4 border-t border-border/50 bg-muted/20">
//               <p className="text-sm text-muted-foreground">
//                 Showing {currentItems.length} of {filteredSchools.length}{" "}
//                 filtered schools
//               </p>
//             </div>
//           </div>
//         </div>
//       </main>

//       {/* Add Dialog */}
//       {addDialog && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
//           <form
//             onSubmit={handleAddSchool}
//             className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-blue-200"
//           >
//             <h2 className="text-lg font-semibold mb-4 text-blue-700">
//               Add School
//             </h2>
//             <input
//               type="text"
//               placeholder="Enter school name"
//               className="border border-blue-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               value={newSchool}
//               onChange={(e) => setNewSchool(e.target.value)}
//               required
//             />
//             <div className="flex justify-end gap-2 mt-6">
//               <button
//                 type="button"
//                 className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
//                 onClick={() => setAddDialog(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
//               >
//                 Add
//               </button>
//             </div>
//           </form>
//         </div>
//       )}

//       {/* Edit Dialog */}
//       {editDialog && selectedSchool && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-blue-200">
//             <h2 className="text-lg font-semibold mb-4 text-blue-700">
//               Update School
//             </h2>
//             <input
//               type="text"
//               placeholder="Enter school name"
//               className="border border-blue-300 px-3 py-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               value={updatedSchoolName}
//               onChange={(e) => setUpdatedSchoolName(e.target.value)}
//               required
//             />
//             <div className="flex justify-end gap-2 mt-6">
//               <button
//                 className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
//                 onClick={() => {
//                   setEditDialog(false);
//                   setSelectedSchool(null);
//                 }}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
//                 onClick={() => {
//                   if (selectedSchool) {
//                     handleUpdateSchool(selectedSchool.id, updatedSchoolName);
//                     setEditDialog(false);
//                     setSelectedSchool(null);
//                   }
//                 }}
//               >
//                 Update
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete Dialog */}
//       {deleteDialog && selectedSchool && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-red-200">
//             <h2 className="text-lg font-semibold text-red-600 mb-4">
//               Confirm Deletion
//             </h2>
//             <p>
//               Are you sure you want to delete{" "}
//               <strong>{selectedSchool.school_name}</strong>?
//             </p>
//             <div className="flex justify-end gap-2 mt-6">
//               <button
//                 className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
//                 onClick={() => {
//                   setDeleteDialog(false);
//                   setSelectedSchool(null);
//                 }}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
//                 onClick={() => {
//                   handleDeleteSchool(selectedSchool.id);
//                   setDeleteDialog(false);
//                   setSelectedSchool(null);
//                 }}
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default School;

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

// 🔹 API methods from api.ts
import { getAllSchools, createSchool, updateSchool, deleteSchool } from "@/utils/api";

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

  // 🔹 Fetch schools
  useEffect(() => {
  const fetchSchools = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSchools();
      setSchools(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  fetchSchools();
}, []);


  // 🔹 Filter & pagination
 const filteredSchools = schools.filter(
  (school) => (school.school_name || "").toLowerCase().includes(search.toLowerCase())
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

  // 🔹 Add School
  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
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
        title: "School Added",
        description: "School has been successfully added.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: `Failed to create school: ${err instanceof Error ? err.message : "Unknown error"}`,
        variant: "destructive",
      });
    }
  };

  // 🔹 Update School
  const handleUpdateSchool = async (id: number, updatedName: string) => {
    try {
      await updateSchool(id, updatedName);

      setSchools((prev) =>
        prev.map((s) => (s.id === id ? { ...s, school_name: updatedName } : s))
      );

      toast({
        title: "School Updated",
        description: `School "${updatedName}" updated successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error updating school",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // 🔹 Delete School
  const handleDeleteSchool = async (id: number) => {
    try {
      await deleteSchool(id);

      setSchools((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: "School Deleted",
        description: `School ID ${id} has been deleted.`,
      });
    } catch (error) {
      toast({
        title: "Error deleting school",
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
                <Button variant="outline" size="icon">
                  <FileDown className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Printer className="h-4 w-4" />
                </Button>
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
                            <TableCell>{indexOfFirstItem + index + 1}</TableCell>
                            <TableCell className="font-medium text-orange-600">
                              {school.school_name|| "N/A"}
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

      {/* 🔹 Add Dialog */}
      {addDialog && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-4">
          <form
            onSubmit={handleAddSchool}
            className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg border border-orange-200"
          >
            <h2 className="text-lg font-semibold mb-4 text-orange-700">Add School</h2>
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
            <h2 className="text-lg font-semibold mb-4 text-orange-700">Update School</h2>
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
            <h2 className="text-lg font-semibold text-red-600 mb-4">Confirm Deletion</h2>
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
                  handleDeleteSchool(selectedSchool.id);
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
