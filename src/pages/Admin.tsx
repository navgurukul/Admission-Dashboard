import React, { useEffect, useState } from "react";
import { Trash2, Plus, X, Download } from "lucide-react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { apiRequest, getAuthHeaders } from "@/utils/api";

const ROWS_PER_PAGE = 10;

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [privileges, setPrivileges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "", type: "success" });
  // Add Role Dialog state
  const [addRoleDialog, setAddRoleDialog] = useState({ open: false, userIdx: null, selectedRole: "" });
  // Add Privilege Dialog state
  const [addPrivilegeDialog, setAddPrivilegeDialog] = useState({ open: false, userIdx: null, selectedPrivilege: "" });
  // Add User Dialog state
  const [addUserDialog, setAddUserDialog] = useState<{
    open: boolean;
    email: string;
    // password: string;
    name: string;
    phone: string;
    selectedRole: string;
  }>({ 
    open: false, 
    email: "", 
    // password: "",
    name: "",
    phone: "",
    selectedRole: "" 
  });
  // Add Role to System Dialog state
  const [addSystemRoleDialog, setAddSystemRoleDialog] = useState({ open: false, roleName: "", description: "" });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {      
      // Fetch roles from the API with authentication
      const roleResponse = await apiRequest('/roles/getRoles');
      if (!roleResponse.ok) {
        const errorData = await roleResponse.json().catch(() => ({}));
        const errorMsg = errorData.message || `Roles API failed: ${roleResponse.status}`;
        throw new Error(errorMsg);
      }
      const roleData = await roleResponse.json();
      console.log('Available roles from API:', roleData.data);
      setRoles(roleData.data || []);

      // Fetch users from the API
      const usersResponse = await apiRequest('/users/getUsers');
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json().catch(() => ({}));
        
        // Fallback: Use mock data if users API doesn't exist
        const fallbackUsers = [
          {
            id: 1,
            email: "urmilaparte@navgurukul.org",
            name: "Urmila Parte",
            phone: "+91-1234567890",
            userrole: [{ role: [{ roles: "admin" }], privileges: [{ privilege: "READ" }, { privilege: "WRITE" }] }]
          },
          {
            id: 2,
            email: "user@example.com", 
            name: "Example User",
            phone: "+91-9876543210",
            userrole: [{ role: [{ roles: "student" }], privileges: [{ privilege: "READ" }] }]
          }
        ];
        setUsers(fallbackUsers);
        // console.log("Using fallback users data:", fallbackUsers);
      } else {
        const usersData = await usersResponse.json();
        
        let usersArray = [];
        if (Array.isArray(usersData)) {
          usersArray = usersData;
        } else if (usersData.data && Array.isArray(usersData.data)) {
          usersArray = usersData.data;
        } else if (usersData.users && Array.isArray(usersData.users)) {
          usersArray = usersData.users;
        } else {
          // console.warn('Unexpected users API response structure:', usersData);
          usersArray = [];
        }

        // Map the users data to the expected format
        const mappedUsers = usersArray.map((user: any) => ({
          id: user.id || user.user_id,
          email: user.email || user.user_email,
          name: user.name || user.user_name,
          phone: user.phone || user.user_phone,
          userrole: user.userrole || user.roles || [{
            role: user.role ? [{ roles: user.role }] : [],
            privileges: user.privileges || []
          }]
        }));

        // console.log('Mapped users:', mappedUsers);
        setUsers(mappedUsers);
      }

      // Set default privileges since privileges API doesn't exist
      setPrivileges([
        { id: 1, privilege: "READ", description: "Read access" },
        { id: 2, privilege: "WRITE", description: "Write access" },
        { id: 3, privilege: "DELETE", description: "Delete access" }
      ]);
      
      setLoading(false);
    } catch (err) {
      // console.error("Error fetching admin data:", err);
      setError(`Failed to fetch admin data: ${err.message}`);
      setLoading(false);
    }
  };

  // Pagination logic - fixed to use actual users array
  const totalPages = Math.ceil(users.length / ROWS_PER_PAGE);
  const paginatedUsers = users.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // Snackbar helpers
  const showSnackbar = (message, type = "success") => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar({ open: false, message: "", type: "success" }), 3000);
  };

  // Create new role in system
  const handleCreateRole = async (roleName, description) => {
    try {
      const response = await apiRequest('/roles/createRoles', {
        method: 'POST',
        body: JSON.stringify({
          name: roleName,
          description: description,
          status: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to create role: ${response.status}`);
      }

      const result = await response.json();
      showSnackbar("Role created successfully");
      
      // Refresh roles data
      await fetchData();
      
      return result;
    } catch (error) {
      showSnackbar(`Failed to create role: ${error.message}`, "error");
      throw error;
    }
  };

  // Delete role from system
  const handleDeleteRole = async (roleId) => {
    try {
      const response = await apiRequest(`/roles/deleteRole/${roleId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete role: ${response.status}`);
      }

      showSnackbar("Role deleted successfully");
      
      // Refresh roles data
      await fetchData();
      
    } catch (error) {
      console.error("Error deleting role:", error);
      showSnackbar(`Failed to delete role: ${error.message}`, "error");
    }
  };

  // Register new user
  const handleRegisterUser = async (email,  name, phone, role) => {
    try {
      const requestBody = {
        email, 
        // password, 
        name, 
        phone, 
        role 
      };
      console.log("Register request body:", requestBody);

      // const token = localStorage.getItem('authToken')
      // console.log('Sending token:-',token)
      const response = await apiRequest('/users/onboard', {
        method: 'POST',
         headers: {
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${token}` 
      },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Register API error:", errorData);
        
        if (errorData.message && errorData.message.includes('role must be equal to one of the allowed values')) {
          throw new Error(`Invalid role. Please select a valid role from the dropdown. Available roles: ${roles.map(r => r.name).join(', ')}`);
        }
        
        throw new Error(errorData.message || `Failed to register user: ${response.status}`);
      }

      const result = await response.json();
      showSnackbar("User registered successfully");
      
      // Add the new user to the local state so it shows up in the table
      const newUser = {
        id: Date.now(), // Generate a temporary ID
        email: email,
        userrole: [{ 
          role: [{ roles: role }], 
          privileges: [] 
        }]
      };
      
      setUsers(prevUsers => [...prevUsers, newUser]);
      
      return result;
    } catch (error) {
      console.error("Error registering user:", error);
      showSnackbar(`Failed to register user: ${error.message}`, "error");
      throw error;
    }
  };

  // Delete user from system
  const handleDeleteUser = async (userId) => {
    try {
      const response = await apiRequest(`/users/deleteUser/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete user: ${response.status}`);
      }

      showSnackbar("User deleted successfully");
      
      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
    } catch (error) {
      console.error("Error deleting user:", error);
      showSnackbar(`Failed to delete user: ${error.message}`, "error");
    }
  };

  // Remove role from user
  const handleRemoveRole = async (userId, roleName) => {
    try {
      const response = await apiRequest('/users/removeRole', {
        method: 'DELETE',
        body: JSON.stringify({
          userId,
          roleName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to remove role: ${response.status}`);
      }

      showSnackbar("Role removed successfully");
      
      // Update user in local state
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            userrole: user.userrole.map(ur => ({
              ...ur,
              role: ur.role.filter(r => r.roles !== roleName)
            }))
          };
        }
        return user;
      }));
      
    } catch (error) {
      console.error("Error removing role:", error);
      showSnackbar(`Failed to remove role: ${error.message}`, "error");
    }
  };

  // Remove privilege from user
  const handleRemovePrivilege = async (userId, privilegeName) => {
    try {
      const response = await apiRequest('/users/removePrivilege', {
        method: 'DELETE',
        body: JSON.stringify({
          userId,
          privilegeName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to remove privilege: ${response.status}`);
      }

      showSnackbar("Privilege removed successfully");
      
      // Update user in local state
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            userrole: user.userrole.map(ur => ({
              ...ur,
              privileges: ur.privileges.filter(p => p.privilege !== privilegeName)
            }))
          };
        }
        return user;
      }));
      
    } catch (error) {
      console.error("Error removing privilege:", error);
      showSnackbar(`Failed to remove privilege: ${error.message}`, "error");
    }
  };

  // Add role to user
  const handleAddRoleToUser = async (userId, roleName) => {
    try {
      const response = await apiRequest('/users/addRole', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          roleName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to add role: ${response.status}`);
      }

      showSnackbar("Role added successfully");
      
      // Update user in local state
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            userrole: user.userrole.map(ur => ({
              ...ur,
              role: [...ur.role, { roles: roleName }]
            }))
          };
        }
        return user;
      }));
      
    } catch (error) {
      console.error("Error adding role:", error);
      showSnackbar(`Failed to add role: ${error.message}`, "error");
    }
  };

  // Add privilege to user
  const handleAddPrivilegeToUser = async (userId, privilegeName) => {
    try {
      const response = await apiRequest('/users/addPrivilege', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          privilegeName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to add privilege: ${response.status}`);
      }

      showSnackbar("Privilege added successfully");
      
      // Update user in local state
      setUsers(prevUsers => prevUsers.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            userrole: user.userrole.map(ur => ({
              ...ur,
              privileges: [...ur.privileges, { privilege: privilegeName }]
            }))
          };
        }
        return user;
      }));
      
    } catch (error) {
      console.error("Error adding privilege:", error);
      showSnackbar(`Failed to add privilege: ${error.message}`, "error");
    }
  };

  // Add Role Dialog
  const openAddRoleDialog = (userIdx) => {
    setAddRoleDialog({ open: true, userIdx, selectedRole: "" });
  };
  const closeAddRoleDialog = () => {
    setAddRoleDialog({ open: false, userIdx: null, selectedRole: "" });
  };
  const handleAddRoleSubmit = async (e) => {
    e.preventDefault();
    if (!addRoleDialog.selectedRole) {
      showSnackbar("Please select a role", "error");
      return;
    }
    
    const user = paginatedUsers[addRoleDialog.userIdx];
    if (!user) {
      showSnackbar("User not found", "error");
      return;
    }
    
    try {
      await handleAddRoleToUser(user.id, addRoleDialog.selectedRole);
      closeAddRoleDialog();
    } catch (error) {
      // Error is already handled in handleAddRoleToUser
    }
  };

  // Add Privilege Dialog
  const openAddPrivilegeDialog = (userIdx) => {
    setAddPrivilegeDialog({ open: true, userIdx, selectedPrivilege: "" });
  };
  const closeAddPrivilegeDialog = () => {
    setAddPrivilegeDialog({ open: false, userIdx: null, selectedPrivilege: "" });
  };
  const handleAddPrivilegeSubmit = async (e) => {
    e.preventDefault();
    if (!addPrivilegeDialog.selectedPrivilege) return;
    
    const user = paginatedUsers[addPrivilegeDialog.userIdx];
    if (!user) return;
    
    try {
      await handleAddPrivilegeToUser(user.id, addPrivilegeDialog.selectedPrivilege);
      closeAddPrivilegeDialog();
    } catch (error) {
      // Error is already handled in handleAddPrivilegeToUser
    }
  };

  // Open/close Add User Dialog
  const openAddUserDialog = () => setAddUserDialog({ 
    open: true, 
    email: "", 
    name: "",
    phone: "",
    selectedRole: "" 
  });
  const closeAddUserDialog = () => setAddUserDialog({ 
    open: false, 
    email: "", 

    name: "",
    phone: "",
    selectedRole: "" 
  });

  // Add User submit with API integration
  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!addUserDialog.email  || !addUserDialog.name || !addUserDialog.phone) {
      showSnackbar("Please fill in all required fields", "error");
      return;
    }
    
    try {
      // Convert role to lowercase to match API expectations
      const role = addUserDialog.selectedRole ? addUserDialog.selectedRole.toLowerCase() : "student";
      
      await handleRegisterUser(
        addUserDialog.email,
        addUserDialog.name,
        addUserDialog.phone,
        role
      );
      
      closeAddUserDialog();
    } catch (error) {
      // Error is already handled in handleRegisterUser
    }
  };

  // Open/close Add System Role Dialog
  const openAddSystemRoleDialog = () => setAddSystemRoleDialog({ open: true, roleName: "", description: "" });
  const closeAddSystemRoleDialog = () => setAddSystemRoleDialog({ open: false, roleName: "", description: "" });

  // Add System Role submit
  const handleAddSystemRoleSubmit = async (e) => {
    e.preventDefault();
    if (!addSystemRoleDialog.roleName) return;
    
    try {
      await handleCreateRole(addSystemRoleDialog.roleName, addSystemRoleDialog.description);
      closeAddSystemRoleDialog();
    } catch (error) {
      // Error is already handled in handleCreateRole
    }
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
                   onClick={openAddSystemRoleDialog}
                   variant="outline"
                   size="sm"
                 >
                   <Plus className="h-4 w-4 mr-2" />
                   Add Role
                 </Button>
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
                onClick={() => fetchData()}
              >
                Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-gray-500 text-lg mb-4">
                No users found in the system.
              </div>
              <div className="text-gray-400 text-sm mb-4">
                This could mean:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>The API endpoint is not available or returning empty data</li>
                  <li>There are no users registered in the system yet</li>
                  <li>There was an issue with the data mapping</li>
                </ul>
              </div>
              <div className="flex justify-center gap-4">
                <button 
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  onClick={() => fetchData()}
                >
                  Refresh Data
                </button>
                <button 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={openAddUserDialog}
                >
                  Add First User
                </button>
              </div>
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
                                onClick={() => handleRemoveRole(user.id, role)}
                              >
                                <X size={16} />
                              </button>
                            </span>
                          ))}
                          <button
                            className="inline-flex items-center bg-background text-foreground border border-input rounded px-3 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => openAddRoleDialog(userIdx)}
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
                                onClick={() => handleRemovePrivilege(user.id, priv)}
                              >
                                <X size={16} />
                              </button>
                            </span>
                          ))}
                          <button
                            className="inline-flex items-center bg-background text-foreground border border-input rounded px-3 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                            onClick={() => openAddPrivilegeDialog(userIdx)}
                          >
                            <Plus size={16} className="mr-1" />Add
                          </button>
                        </div>
                      </TableCell>
                      {/* Actions */}
                      <TableCell>
                        <button
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => handleDeleteUser(user.id)}
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
            <div className={`fixed bottom-6 left-6 z-50 px-6 py-3 rounded shadow-lg ${
              snackbar.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"
            }`} style={{
              animation: 'fadeIn 0.3s ease-in-out'
            }}>
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
                    <option key={role.id} value={role.name}>
                      {role.name}
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
      <h2 className="text-xl font-bold mb-4">Add New User</h2>

      {/* Name */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-orange-600">Name *</label>
        <input
          type="text"
          className="border-2 border-orange-400 px-3 py-3 rounded w-full text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter Name"
          value={addUserDialog.name}
          onChange={(e) => setAddUserDialog((d) => ({ ...d, name: e.target.value }))}
          required
        />
      </div>

      {/* Phone */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-orange-600">Phone *</label>
        <input
          type="tel"
          className="border-2 border-orange-400 px-3 py-3 rounded w-full text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter Phone Number"
          value={addUserDialog.phone}
          onChange={(e) => setAddUserDialog((d) => ({ ...d, phone: e.target.value }))}
          required
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-orange-600">Email *</label>
        <input
          type="email"
          className="border-2 border-orange-400 px-3 py-3 rounded w-full text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter Email"
          value={addUserDialog.email}
          onChange={(e) => setAddUserDialog((d) => ({ ...d, email: e.target.value }))}
          required
        />
      </div>

      {/* Password */}
      {/* <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-orange-600">Password *</label>
        <input
          type="password"
          className="border-2 border-orange-400 px-3 py-3 rounded w-full text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Enter Password"
          value={addUserDialog.password}
          onChange={(e) => setAddUserDialog((d) => ({ ...d, password: e.target.value }))}
          required
        />
      </div> */}

      {/* Role */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1 text-orange-600">Role</label>
        <select
                    className="border-2 border-orange-400 px-3 py-3 rounded w-full text-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={addUserDialog.selectedRole}
                    onChange={(e) => setAddUserDialog((d) => ({ ...d, selectedRole: e.target.value }))}
                  >
                    <option value="">Select Role (Optional)</option>
                
                    <option value="admin">ADMIN</option>
                    <option value="user">USER</option>
                    
                    {Array.isArray(roles) && roles.map((role) => (
  <option key={role.id} value={role.name.toLowerCase()}>
    {role.name}
  </option>
))}
                  </select>
      </div>

      <div className="flex justify-center gap-4 mt-4">
        <button
          type="submit"
          className="px-6 py-2 bg-orange-500 text-white rounded shadow font-semibold text-base hover:bg-orange-600"
        >
          CREATE USER
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


          {/* Add System Role Dialog */}
          {addSystemRoleDialog.open && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
              <form
                className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg"
                onSubmit={handleAddSystemRoleSubmit}
              >
                <h2 className="text-xl font-bold mb-4">Create New Role</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-orange-600">Role Name</label>
                  <input
                    type="text"
                    className="border-2 border-orange-400 px-3 py-3 rounded w-full text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter Role Name"
                    value={addSystemRoleDialog.roleName}
                    onChange={e => setAddSystemRoleDialog(d => ({ ...d, roleName: e.target.value }))}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1 text-orange-600">Description</label>
                  <textarea
                    className="border-2 border-orange-400 px-3 py-3 rounded w-full text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter Role Description"
                    value={addSystemRoleDialog.description}
                    onChange={e => setAddSystemRoleDialog(d => ({ ...d, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-orange-500 text-white rounded shadow font-semibold text-base hover:bg-orange-600"
                  >
                    CREATE ROLE
                  </button>
                  <button
                    type="button"
                    className="px-6 py-2 border border-orange-400 text-orange-600 rounded font-semibold text-base bg-white hover:bg-orange-50"
                    onClick={closeAddSystemRoleDialog}
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