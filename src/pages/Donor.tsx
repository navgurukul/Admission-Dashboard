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
  Search,
  Filter,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Eye
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { createDonor, getDonors, updateDonor, deleteDonor, Donor } from "@/utils/api";

const DonorPage = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalDonors, setTotalDonors] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Dialog States
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentDonor, setCurrentDonor] = useState<Donor | null>(null);
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
  }, [page, rowsPerPage]);

  const loadDonors = async () => {
    setLoading(true);
    try {
      const response = await getDonors(page, rowsPerPage);
    
      
      // Extract data from nested structure
      // API returns: { success, data: { data: [...], total, page, pageSize, totalPages } }
      const donorList = response?.data?.data || [];
      const total = response?.data?.total || 0;
      const pages = response?.data?.totalPages || 0;

      setDonors(donorList);
      setTotalDonors(total);
      setTotalPages(pages);
    } catch (error) {
      console.error("Error loading donors:", error);
      toast({ title: "Error", description: "Failed to fetch donors", variant: "destructive" });
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
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    if (formData.donor_phone.length !== 10) {
      toast({ title: "Error", description: "Phone number must be exactly 10 digits", variant: "destructive" });
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
      toast({ title: "Success", description: "Donor created successfully" });
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
      toast({ title: "Error", description: "Failed to create donor", variant: "destructive" });
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
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      return;
    }

    if (formData.donor_phone.length !== 10) {
      toast({ title: "Error", description: "Phone number must be exactly 10 digits", variant: "destructive" });
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
      toast({ title: "Success", description: "Donor updated successfully" });
      setEditDialogOpen(false);
      setCurrentDonor(null);
      loadDonors();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update donor", variant: "destructive" });
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (!confirm("Are you sure you want to delete this donor?")) return;
    try {
      await deleteDonor(id);
      toast({ title: "Deleted", description: "Donor deleted successfully" });
      loadDonors();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete donor", variant: "destructive" });
    }
  }

  // Client-side search filter (optional - you can also implement server-side search later)
  const filteredDonors = donors.filter(d =>
    searchQuery === "" || (d.donor_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    // Reset to page 1 when search query or rows per page changes
    if (page !== 1) {
      setPage(1);
    }
  }, [searchQuery, rowsPerPage]);

  return (
    <div className="min-h-screen bg-muted/40 flex">
      <AdmissionsSidebar />
      <main className="md:ml-64 flex-1 p-6 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Header & Stats */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Donors</h1>
                <p className="text-muted-foreground">Manage donor partnerships and related students.</p>
              </div>
              <div className="flex items-center gap-2">
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
              </div>
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
              <div className="flex items-center justify-between">
                <CardTitle>All Donors</CardTitle>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search donors..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">Loading...</TableCell>
                    </TableRow>
                  ) : filteredDonors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No donors found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredDonors.map((donor) => (
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>


              {/* Pagination Controls */}
              {!loading && totalDonors > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 pt-4 pb-2">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing <span className="font-medium">{(page - 1) * rowsPerPage + 1}</span> - <span className="font-medium">{Math.min(page * rowsPerPage, totalDonors)}</span> of <span className="font-medium">{totalDonors}</span> donors
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</Label>
                      <select
                        value={rowsPerPage}
                        onChange={(e) => setRowsPerPage(Number(e.target.value))}
                        className="border rounded px-2 py-1 text-sm"
                      >
                       
                        <option value={10}>10</option>

                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                    >
                      First
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>

                    {/* Page indicator */}
                    <span className="text-sm text-muted-foreground px-2">
                      Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                    >
                      Last
                    </Button>
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
          <form onSubmit={handleAddSubmit} className="space-y-4">
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
          <form onSubmit={handleEditSubmit} className="space-y-4">
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

    </div >
  );
};

export default DonorPage;
