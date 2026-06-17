import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Users,
  Handshake,
  Filter,
  X,
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { useNavigate } from "react-router-dom";
import { createDonor, getDonors, updateDonor, deleteDonor, Donor } from "@/utils/api";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";

const DonorPage = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { debouncedValue: debouncedSearchQuery, isPending: isSearching } = useDebounce(searchQuery, 800);
  const [filterDialog, setFilterDialog] = useState(false);
  const [filters, setFilters] = useState({ name: "", email: "" });
  const [tempFilters, setTempFilters] = useState({ name: "", email: "" });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalDonors, setTotalDonors] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const isTeamUser = useMemo(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return false;
      const parsedUser = JSON.parse(storedUser);
      const roleIdNum = Number(parsedUser?.user_role_id);
      const roleName = String(parsedUser?.role_name || "").toUpperCase();
      return roleIdNum === 3 || roleName === "TEAM";
    } catch (error) {
      console.error("Error parsing user for role checks:", error);
      return false;
    }
  }, []);

  // Dialog States
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentDonor, setCurrentDonor] = useState<Donor | null>(null);
  const [donorToDelete, setDonorToDelete] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    donor_name: "",
    donor_email: "",
    donor_phone: "",
    donor_address: "",
    donor_city: "",
    donor_state: "",
    donor_country: ""
  });

  useEffect(() => {
    loadDonors();
  }, [page, rowsPerPage, filters, debouncedSearchQuery]);

  const loadDonors = async () => {
    setLoading(true);
    try {
      const response = await getDonors(page, rowsPerPage, debouncedSearchQuery.trim() || filters.name.trim(), filters.email.trim());

      const donorsContainer = response?.data?.donors ?? response?.data;
      const donorList = donorsContainer?.data || [];
      const total = donorsContainer?.total || 0;
      const pages = donorsContainer?.totalPages || 0;

      setDonors(donorList);
      setTotalDonors(total);
      setTotalPages(pages);
    } catch (error) {
      console.error("Error loading donors:", error);
      toast({ title: "❌ Unable to Load Donors", description: getFriendlyErrorMessage(error), variant: "destructive", className: "border-red-500 bg-red-50 text-red-900" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.donor_name.trim() ||
      !formData.donor_email.trim() ||
      !formData.donor_phone.toString().trim() ||
      !formData.donor_address.trim() ||
      !formData.donor_city.trim() ||
      !formData.donor_state.trim() ||
      !formData.donor_country.trim()
    ) {
      toast({ title: "⚠️ Required Fields Missing", description: "All fields are required", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
      return;
    }

    if (formData.donor_phone.length !== 10) {
      toast({ title: "⚠️ Invalid Phone Number", description: "Phone number must be exactly 10 digits", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
      return;
    }

    try {
      await createDonor({
        donor_name: formData.donor_name,
        donor_email: formData.donor_email,
        donor_phone: formData.donor_phone,
        donor_address: formData.donor_address,
        donor_city: formData.donor_city,
        donor_state: formData.donor_state,
        donor_country: formData.donor_country
      });
      toast({ title: "✅ Donor Created", description: "Donor created successfully", variant: "default", className: "border-green-500 bg-green-50 text-green-900" });
      setAddDialogOpen(false);
      setFormData({
        donor_name: "",
        donor_email: "",
        donor_phone: "",
        donor_address: "",
        donor_city: "",
        donor_state: "",
        donor_country: ""
      });
      loadDonors();
    } catch (error) {
      toast({ title: "❌ Unable to Create Donor", description: getFriendlyErrorMessage(error), variant: "destructive", className: "border-red-500 bg-red-50 text-red-900" });
    }
  };

  const handleEditClick = (donor: Donor) => {
    setCurrentDonor(donor);
    setFormData({
      donor_name: donor.donor_name,
      donor_email: donor.donor_email || "",
      donor_phone: donor.donor_phone ? String(donor.donor_phone) : "",
      donor_address: donor.donor_address || "",
      donor_city: donor.donor_city || "",
      donor_state: donor.donor_state || "",
      donor_country: donor.donor_country || ""
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !currentDonor ||
      !formData.donor_name.trim() ||
      !formData.donor_email.trim() ||
      !formData.donor_phone.toString().trim() ||
      !formData.donor_address.trim() ||
      !formData.donor_city.trim() ||
      !formData.donor_state.trim() ||
      !formData.donor_country.trim()
    ) {
      toast({ title: "⚠️ Required Fields Missing", description: "All fields are required", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
      return;
    }

    if (formData.donor_phone.length !== 10) {
      toast({ title: "⚠️ Invalid Phone Number", description: "Phone number must be exactly 10 digits", variant: "default", className: "border-orange-500 bg-orange-50 text-orange-900" });
      return;
    }

    try {
      await updateDonor(currentDonor.id, {
        donor_name: formData.donor_name,
        donor_email: formData.donor_email,
        donor_phone: formData.donor_phone,
        donor_address: formData.donor_address,
        donor_city: formData.donor_city,
        donor_state: formData.donor_state,
        donor_country: formData.donor_country
      });
      toast({ title: "✅ Donor Updated", description: "Donor updated successfully", variant: "default", className: "border-green-500 bg-green-50 text-green-900" });
      setEditDialogOpen(false);
      setCurrentDonor(null);
      loadDonors();
    } catch (error) {
      toast({ title: "❌ Unable to Update Donor", description: getFriendlyErrorMessage(error), variant: "destructive", className: "border-red-500 bg-red-50 text-red-900" });
    }
  };

  const handleDeleteClick = (id: number) => {
    setDonorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!donorToDelete) return;
    try {
      await deleteDonor(donorToDelete);
      toast({ title: "✅ Donor Deleted", description: "Donor deleted successfully", variant: "default", className: "border-green-500 bg-green-50 text-green-900" });
      setDeleteDialogOpen(false);
      setDonorToDelete(null);
      loadDonors();
    } catch (error) {
      toast({ title: "❌ Unable to Delete Donor", description:"This donor cannot be deleted because it is linked to other records.", variant: "destructive", className: "border-red-500 bg-red-50 text-red-900" });
    }
  };

  // Sync tempFilters when dialog opens
  useEffect(() => {
    if (filterDialog) setTempFilters(filters);
  }, [filterDialog]);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [filters]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    // Reset to page 1 when rows per page changes
    if (page !== 1) setPage(1);
  }, [rowsPerPage]);

  return (
    <div className="min-h-screen bg-muted/40 flex">
      <AdmissionsSidebar />
      <main className="md:ml-64 flex-1 p-6 overflow-y-auto h-screen pt-20 md:pt-6">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header & Stats */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Donors</h1>
                <p className="text-sm sm:text-base text-muted-foreground">Manage donor partnerships and related students.</p>
              </div>
              {/* <div className="flex items-center gap-2">
                <Button onClick={() => {
                  setFormData({
                    donor_name: "",
                    donor_email: "",
                    donor_phone: "",
                    donor_address: "",
                    donor_city: "",
                    donor_state: "",
                    donor_country: ""
                  });
                  setAddDialogOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" /> Add Donor
                </Button>
              </div> */}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Donors</CardTitle>
                  <Handshake className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalDonors}</div>
                </CardContent>
              </Card>
              {/* Add more stats if available from API later */}
            </div>
          </div>

          {/* Main Content */}
          <Card className="shadow-md border-border/60">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
                <div className="flex flex-col mr-10">
                  <CardTitle>All Donors</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {donors.length} {donors.length === 1 ? 'donor' : 'donors'} 
                    {(filters.name || filters.email) ? ' (Filtered)' : ' total'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                  <Button variant="outline" onClick={() => setFilterDialog(true)} size="sm" className="text-xs sm:text-sm">
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span>Filters</span>
                  </Button>
                  {!isTeamUser && (
                    <Button onClick={() => {
                      setFormData({
                        donor_name: "",
                        donor_email: "",
                        donor_phone: "",
                        donor_address: "",
                        donor_city: "",
                        donor_state: "",
                        donor_country: ""
                      });
                      setAddDialogOpen(true);
                    }} size="sm">
                      <Plus className="mr-2 h-4 w-4" /> Add Donor
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search donors by name..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Active Filter Chips */}
              {(filters.name || filters.email) && (
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {filters.name && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full py-1.5 px-3 flex items-center gap-2 border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700 h-auto whitespace-nowrap"
                        onClick={() => setFilters(prev => ({ ...prev, name: "" }))}
                      >
                        <span className="text-xs">Name: {filters.name}</span>
                        <X className="w-3 h-3 flex-shrink-0" />
                      </Button>
                    )}
                    {filters.email && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full py-1.5 px-3 flex items-center gap-2 border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-100 hover:text-gray-700 h-auto whitespace-nowrap"
                        onClick={() => setFilters(prev => ({ ...prev, email: "" }))}
                      >
                        <span className="text-xs">Email: {filters.email}</span>
                        <X className="w-3 h-3 flex-shrink-0" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFilters({ name: "", email: "" })}
                      className="rounded-full py-1.5 px-3 h-auto flex items-center gap-2 text-xs border border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-50 hover:text-pink-800"
                    >
                      <X className="w-3 h-3" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Country</TableHead>
                    {!isTeamUser && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading || isSearching ? (
                    <TableRow>
                      <TableCell colSpan={isTeamUser ? 7 : 8} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          {isSearching ? "Searching..." : "Loading..."}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : donors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isTeamUser ? 7 : 8} className="h-24 text-center text-muted-foreground">
                        {(filters.name || filters.email || searchQuery)
                          ? "No donors match your search."
                          : "No donors found."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    donors.map((donor) => (
                      <TableRow key={donor.id}>
                        <TableCell>
                          <span
                            className="font-medium cursor-pointer hover:underline hover:text-primary"
                            onClick={() => navigate(`/donors/${donor.id}/students`)}
                          >
                            {donor.donor_name || (donor as any)['name'] || "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell>{donor.donor_email || "-"}</TableCell>
                        <TableCell>{donor.donor_phone || "-"}</TableCell>
                        <TableCell>{donor.donor_address || "-"}</TableCell>
                        <TableCell>{donor.donor_city || "-"}</TableCell>
                        <TableCell>{donor.donor_state || "-"}</TableCell>
                        <TableCell>{donor.donor_country || "-"}</TableCell>
                        {!isTeamUser && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditClick(donor)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/donors/${donor.id}/students`)}>
                                  <Eye className="mr-2 h-4 w-4" /> View Students
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(donor.id)}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>


              {/* Pagination Controls */}
              {!loading && donors.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 px-4 py-4 border-t bg-muted/20">
                  {/* Showing count - Hidden on mobile, visible on sm and up */}
                  <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left order-2 sm:order-1">
                    Showing <strong>{(page - 1) * rowsPerPage + 1}</strong> - <strong>{Math.min(page * rowsPerPage, totalDonors)}</strong> of <strong>{totalDonors}</strong>
                  </div>
                  
                  {/* Pagination controls */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2 order-1 sm:order-2">
                    {/* Rows per page selector */}
                    <div className="flex items-center gap-2">
                      <Label className="text-xs m:text-sm text-muted-foreground whitespace-nowrap">Rows:</Label>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        className="border rounded px-2 py-1.5 text-xs sm:text-sm h-8 sm:h-9 min-w-[70px] focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    
                    {/* Navigation buttons */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground px-2 whitespace-nowrap">
                        Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="h-8 sm:h-9 text-xs sm:text-sm px-2 sm:px-3"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </main >

      {/* Add Dialog */}
      < Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen} >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Donor</DialogTitle>
            <DialogDescription>Create a new donor partner.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Donor Name <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.donor_name}
                onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                placeholder="e.g. Accenture"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.donor_email}
                  onChange={(e) => setFormData({ ...formData, donor_email: e.target.value })}
                  placeholder="donor@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                <Input
                  id="phone"
                  type="text"
                  value={formData.donor_phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, donor_phone: value });
                  }}
                  placeholder="10 digit number"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address <span className="text-destructive">*</span></Label>
              <Input
                id="address"
                value={formData.donor_address}
                onChange={(e) => setFormData({ ...formData, donor_address: e.target.value })}
                placeholder="Street address"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                <Input
                  id="city"
                  value={formData.donor_city}
                  onChange={(e) => setFormData({ ...formData, donor_city: e.target.value })}
                  placeholder="City"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
                <Input
                  id="state"
                  value={formData.donor_state}
                  onChange={(e) => setFormData({ ...formData, donor_state: e.target.value })}
                  placeholder="State"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                <Input
                  id="country"
                  value={formData.donor_country}
                  onChange={(e) => setFormData({ ...formData, donor_country: e.target.value })}
                  placeholder="Country"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Create Donor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog >

      {/* Edit Dialog */}
      < Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen} >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Donor</DialogTitle>
            <DialogDescription>Update donor details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Donor Name <span className="text-destructive">*</span></Label>
              <Input
                id="edit-name"
                value={formData.donor_name}
                onChange={(e) => setFormData({ ...formData, donor_name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.donor_email}
                  onChange={(e) => setFormData({ ...formData, donor_email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-phone"
                  type="text"
                  value={formData.donor_phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({ ...formData, donor_phone: value });
                  }}
                  placeholder="10 digit number"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address <span className="text-destructive">*</span></Label>
              <Input
                id="edit-address"
                value={formData.donor_address}
                onChange={(e) => setFormData({ ...formData, donor_address: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-city">City <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-city"
                  value={formData.donor_city}
                  onChange={(e) => setFormData({ ...formData, donor_city: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-state">State <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-state"
                  value={formData.donor_state}
                  onChange={(e) => setFormData({ ...formData, donor_state: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country <span className="text-destructive">*</span></Label>
                <Input
                  id="edit-country"
                  value={formData.donor_country}
                  onChange={(e) => setFormData({ ...formData, donor_country: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Update Donor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog >

      {/* Filter Dialog */}
      <Dialog open={filterDialog} onOpenChange={setFilterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filter Donors</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input
                value={tempFilters.name}
                onChange={(e) => setTempFilters(f => ({ ...f, name: e.target.value }))}
                placeholder="Filter by donor name"
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                value={tempFilters.email}
                onChange={(e) => setTempFilters(f => ({ ...f, email: e.target.value }))}
                placeholder="Filter by email"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFilterDialog(false)}>Cancel</Button>
            <Button onClick={() => { setFilters(tempFilters); setFilterDialog(false); }}>Apply Filters</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this donor? This action cannot be undo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setDeleteDialogOpen(false);
              setDonorToDelete(null);
            }}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div >
  );
};

export default DonorPage;
