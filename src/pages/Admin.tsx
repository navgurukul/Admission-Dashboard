import React, { useEffect, useState } from "react";
import { Trash2, Plus, X, Download } from "lucide-react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";

const ROWS_PER_PAGE = 10;

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [privileges, setPrivileges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  // Add Role Dialog state
  const [addRoleDialog, setAddRoleDialog] = useState({ open: false, userIdx: null, selectedRole: "" });
  // Add Privilege Dialog state
  const [addPrivilegeDialog, setAddPrivilegeDialog] = useState({ open: false, userIdx: null, selectedPrivilege: "" });
  // Add User Dialog state
  const [addUserDialog, setAddUserDialog] = useState({ open: false, email: "" });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        console.log("Fetching admin data...");
        // --- API call for user role is commented out until backend is ready ---
        // const [userResponse, roleResponse, privilegeResponse] = await Promise.all([
        //   fetch("https://dev-join.navgurukul.org/api/rolebaseaccess/email"),
        //   fetch("https://dev-join.navgurukul.org/api/role/getRole"),
        //   fetch("https://dev-join.navgurukul.org/api/role/getPrivilege")
        // ]);
        // if (!userResponse.ok) {
        //   throw new Error(`User API failed: ${userResponse.status}`);
        // }
        // const [userData, roleData, privilegeData] = await Promise.all([
        //   userResponse.json(),
        //   roleResponse.json(),
        //   privilegeResponse.json()
        // ]);
        // setUsers(userData || []);
        // setRoles(roleData || []);
        // setPrivileges(privilegeData || []);
        // --- END API call block ---

        // TEMP: Use empty/mock data for now
        setUsers([]);
        setRoles([]);
        setPrivileges([]);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching admin data:", err);
        setError(`Failed to fetch admin data: ${err.message}`);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Pagination logic
  const reversedUsers = [...users].reverse();
  const totalPages = Math.ceil(reversedUsers.length / ROWS_PER_PAGE);
  const paginatedUsers = reversedUsers.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // Snackbar helpers
  const showSnackbar = (message) => {
    setSnackbar({ open: true, message });
    setTimeout(() => setSnackbar({ open: false, message: "" }), 3000);
  };

  // Remove role from user (client-side)
  const handleRemoveRole = (userIdx, roleIdx) => {
    setUsers((prev) => {
      const newUsers = [...prev];
      const user = { ...newUsers[userIdx] };
      const userrole = user.userrole ? [...user.userrole] : [];
      for (let ur of userrole) {
        if (ur.role && ur.role.length > 0) {
          ur.role = ur.role.filter((_, idx) => idx !== roleIdx);
          break;
        }
      }
      user.userrole = userrole;
      newUsers[userIdx] = user;
      return newUsers;
    });
    showSnackbar("Role removed successfully");
  };

  // Remove privilege from user (client-side)
  const handleRemovePrivilege = (userIdx, privilegeIdx) => {
    setUsers((prev) => {
      const newUsers = [...prev];
      const user = { ...newUsers[userIdx] };
      const userrole = user.userrole ? [...user.userrole] : [];
      for (let ur of userrole) {
        if (ur.privileges && ur.privileges.length > 0) {
          ur.privileges = ur.privileges.filter((_, idx) => idx !== privilegeIdx);
          break;
        }
      }
      user.userrole = userrole;
      newUsers[userIdx] = user;
      return newUsers;
    });
    showSnackbar("Privilege removed successfully");
  };

  // Delete user (client-side)
  const handleDeleteUser = (userIdx) => {
    setUsers((prev) => {
      const newUsers = [...prev];
      newUsers.splice(userIdx, 1);
      return newUsers;
    });
    showSnackbar("User deleted successfully");
  };

  // Add Role Dialog
  const openAddRoleDialog = (userIdx) => {
    setAddRoleDialog({ open: true, userIdx, selectedRole: "" });
  };
  const closeAddRoleDialog = () => {
    setAddRoleDialog({ open: false, userIdx: null, selectedRole: "" });
  };
  const handleAddRoleSubmit = (e) => {
    e.preventDefault();
    if (!addRoleDialog.selectedRole) return;
    setUsers((prev) => {
      const newUsers = [...prev];
      const user = { ...newUsers[addRoleDialog.userIdx] };
      let userrole = user.userrole ? [...user.userrole] : [];
      if (userrole.length === 0) userrole = [{ role: [], privileges: [] }];
      if (!userrole[0].role) userrole[0].role = [];
      userrole[0].role.push({ roles: addRoleDialog.selectedRole });
      user.userrole = userrole;
      newUsers[addRoleDialog.userIdx] = user;
      return newUsers;
    });
    showSnackbar("Role added successfully");
    closeAddRoleDialog();
  };

  // Add Privilege Dialog
  const openAddPrivilegeDialog = (userIdx) => {
    setAddPrivilegeDialog({ open: true, userIdx, selectedPrivilege: "" });
  };
  const closeAddPrivilegeDialog = () => {
    setAddPrivilegeDialog({ open: false, userIdx: null, selectedPrivilege: "" });
  };
  const handleAddPrivilegeSubmit = (e) => {
    e.preventDefault();
    if (!addPrivilegeDialog.selectedPrivilege) return;
    setUsers((prev) => {
      const newUsers = [...prev];
      const user = { ...newUsers[addPrivilegeDialog.userIdx] };
      let userrole = user.userrole ? [...user.userrole] : [];
      if (userrole.length === 0) userrole = [{ role: [], privileges: [] }];
      if (!userrole[0].privileges) userrole[0].privileges = [];
      userrole[0].privileges.push({ privilege: addPrivilegeDialog.selectedPrivilege });
      user.userrole = userrole;
      newUsers[addPrivilegeDialog.userIdx] = user;
      return newUsers;
    });
    showSnackbar("Privilege added successfully");
    closeAddPrivilegeDialog();
  };

  // Open/close Add User Dialog
  const openAddUserDialog = () => setAddUserDialog({ open: true, email: "" });
  const closeAddUserDialog = () => setAddUserDialog({ open: false, email: "" });

  // Handle Add User form changes
  const handleAddUserChange = (value) => {
    setAddUserDialog((d) => ({ ...d, email: value }));
  };

  // Add User submit (email only)
  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!addUserDialog.email) return;
    setUsers((prev) => [
      ...prev,
      {
        id: Date.now(),
        email: addUserDialog.email,
        userrole: [{ role: [], privileges: [] }],
      },
    ]);
    showSnackbar("User email created successfully");
    closeAddUserDialog();
  };

  const getUserRoles = (user) => {
    if (!user.userrole || user.userrole.length === 0) return [];
    return user.userrole
      .flatMap((ur) => (ur.role && ur.role.length > 0 ? ur.role.map((r) => r.roles) : []));
  };

  const getUserPrivileges = (user) => {
    if (!user.userrole || user.userrole.length === 0) return [];
    return user.userrole
      .flatMap((ur) => (ur.privileges && ur.privileges.length > 0 ? ur.privileges.map((p) => p.privilege) : []));
  };

  // CSV Download for current page
  const handleDownloadCSV = () => {
    const headers = ["Email", "Roles", "Privileges"];
    const rows = paginatedUsers.map((user) => [
      user.email,
      getUserRoles(user).join("; "),
      getUserPrivileges(user).join("; ")
    ]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "admin-role-access.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      <main className="md:ml-64 overflow-auto h-screen">
        <div className="p-4 md:p-8 pt-16 md:pt-8">
          {/* Header Card */}
          <div className="bg-card rounded-xl p-6 shadow-soft border border-border mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Role Based Access</h1>
                <p className="text-muted-foreground">
                  Manage user roles and privileges for the admissions portal
                </p>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <Button
                  onClick={handleDownloadCSV}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <button
                  className="flex items-center bg-primary text-primary-foreground rounded font-semibold px-4 py-2 text-sm hover:bg-primary/90 transition-colors"
                  onClick={openAddUserDialog}
                >
                  <Plus size={18} className="mr-1" />Add User
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="text-lg">Loading admin data...</div>
            </div>
          ) : error ? (
            <div className="text-center py-10">
              <div className="text-red-500 text-lg mb-2">{error}</div>
              <button 
                className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No users found. The API might be empty or there was an issue fetching data.
            </div>
          ) : (
            <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10 border-b">
                  <TableRow>
                    <TableHead className="font-bold text-foreground">Email</TableHead>
                    <TableHead className="font-bold text-foreground">Roles</TableHead>
                    <TableHead className="font-bold text-foreground">Privileges</TableHead>
                    <TableHead className="font-bold text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user, userIdx) => (
                    <TableRow key={user.id} className="border-b transition-colors hover:bg-muted/50">
                      {/* Email */}
                      <TableCell className="font-medium">{user.email}</TableCell>
                      {/* Roles */}
                      <TableCell>
                        <div className="flex flex-wrap gap-2 items-center">
                          {getUserRoles(user).map((role, roleIdx) => (
                            <span key={roleIdx} className="inline-flex items-center bg-muted text-foreground rounded-full px-3 py-1 text-sm font-medium">
                              {role}
                              <button
                                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => handleRemoveRole((page - 1) * ROWS_PER_PAGE + userIdx, roleIdx)}
                              >
                                <X size={16} />
                              </button>
                            </span>
                          ))}
                          <button
                            className="inline-flex items-center bg-background text-foreground border border-input rounded px-3 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => openAddRoleDialog((page - 1) * ROWS_PER_PAGE + userIdx)}
                          >
                            <Plus size={16} className="mr-1" />Add
                          </button>
                        </div>
                      </TableCell>
                      {/* Privileges */}
                      <TableCell>
                        <div className="flex flex-wrap gap-2 items-center">
                          {getUserPrivileges(user).map((priv, privIdx) => (
                            <span key={privIdx} className="inline-flex items-center bg-muted text-foreground rounded-full px-3 py-1 text-sm font-medium">
                              {priv}
                              <button
                                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                                onClick={() => handleRemovePrivilege((page - 1) * ROWS_PER_PAGE + userIdx, privIdx)}
                              >
                                <X size={16} />
                              </button>
                            </span>
                          ))}
                          <button
                            className="inline-flex items-center bg-background text-foreground border border-input rounded px-3 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => openAddPrivilegeDialog((page - 1) * ROWS_PER_PAGE + userIdx)}
                          >
                            <Plus size={16} className="mr-1" />Add
                          </button>
                        </div>
                      </TableCell>
                      {/* Actions */}
                      <TableCell>
                        <button
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => handleDeleteUser((page - 1) * ROWS_PER_PAGE + userIdx)}
                        >
                          <Trash2 size={22} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination Controls */}
              <div className="flex items-center justify-end gap-4 p-4 bg-background border-t border-border">
                <span className="text-sm text-muted-foreground">Rows per page: {ROWS_PER_PAGE}</span>
                <span className="text-sm text-muted-foreground">
                  {ROWS_PER_PAGE * (page - 1) + 1}-{Math.min(page * ROWS_PER_PAGE, users.length)} of {users.length}
                </span>
                <button
                  className="px-2 py-1 rounded font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  &lt;
                </button>
                <button
                  className="px-2 py-1 rounded font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
          
          {/* Snackbar */}
          {snackbar.open && (
            <div className="fixed bottom-6 left-6 z-50 bg-gray-900 text-white px-6 py-3 rounded shadow-lg animate-fade-in">
              {snackbar.message}
            </div>
          )}
          
          {/* Add Role Dialog */}
          {addRoleDialog.open && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <form
                className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg"
                onSubmit={handleAddRoleSubmit}
              >
                <h2 className="text-xl font-bold mb-4">Select Role</h2>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={addRoleDialog.selectedRole}
                  onChange={(e) => setAddRoleDialog((d) => ({ ...d, selectedRole: e.target.value }))}
                  required
                >
                  <option value="" disabled>Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.roles}>
                      {role.roles} - {role.description}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    onClick={closeAddRoleDialog}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Add Privilege Dialog */}
          {addPrivilegeDialog.open && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <form
                className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg"
                onSubmit={handleAddPrivilegeSubmit}
              >
                <h2 className="text-xl font-bold mb-4">Select Privilege</h2>
                <select
                  className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  value={addPrivilegeDialog.selectedPrivilege}
                  onChange={(e) => setAddPrivilegeDialog((d) => ({ ...d, selectedPrivilege: e.target.value }))}
                  required
                >
                  <option value="" disabled>Select Privilege</option>
                  {privileges.map((priv) => (
                    <option key={priv.id} value={priv.privilege}>
                      {priv.privilege} - {priv.description}
                    </option>
                  ))}
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    onClick={closeAddPrivilegeDialog}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Add User Dialog */}
          {addUserDialog.open && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <form
                className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg"
                onSubmit={handleAddUserSubmit}
              >
                <h2 className="text-xl font-bold mb-4">Enter New Email</h2>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1 text-orange-600">Enter Email</label>
                  <input
                    type="email"
                    className="border-2 border-orange-400 px-3 py-3 rounded w-full text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter Email"
                    value={addUserDialog.email}
                    onChange={e => handleAddUserChange(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-orange-500 text-white rounded shadow font-semibold text-base hover:bg-orange-600"
                  >
                    CREATE USER EMAIL
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 border border-orange-400 text-orange-600 rounded font-semibold text-base bg-white hover:bg-orange-50"
                    onClick={closeAddUserDialog}
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage; 