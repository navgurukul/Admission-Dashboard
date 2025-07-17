import React, { useState } from "react";
import { Trash2, Plus, X, Download } from "lucide-react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";

const ROWS_PER_PAGE = 10;

// Hardcoded initial data
const initialUsers = [
  {
    id: 1,
    email: "urmilaparte23@navgurukul.org",
    password: "123456"
  }
];

const hardcodedRoles = [
  { id: 1, roles: "admin", description: "Full system administrator" },
  { id: 2, roles: "manager", description: "Department manager" },
  { id: 3, roles: "coordinator", description: "Program coordinator" },
  { id: 4, roles: "teacher", description: "Teaching staff" },
  { id: 5, roles: "student", description: "Student access" },
  { id: 6, roles: "fullDashboardAccess", description: "Full dashboard access" },
  { id: 7, roles: "limitedAccess", description: "Limited system access" }
];

const hardcodedPrivileges = [
  { id: 1, privilege: "read", description: "Read access to data" },
  { id: 2, privilege: "write", description: "Write access to data" },
  { id: 3, privilege: "delete", description: "Delete access to data" },
  { id: 4, privilege: "export", description: "Export data access" },
  { id: 5, privilege: "import", description: "Import data access" },
  { id: 6, privilege: "approve", description: "Approval permissions" },
  { id: 7, privilege: "view_reports", description: "View reports access" }
];

const AdminPage = () => {
  const [users, setUsers] = useState(() => {
    const stored = localStorage.getItem("adminUser");
    return stored ? JSON.parse(stored) : initialUsers;
  });
  const [roles] = useState(hardcodedRoles);
  const [privileges] = useState(hardcodedPrivileges);
  const [page, setPage] = useState(1);
  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });
  // Add Role Dialog state
  const [addRoleDialog, setAddRoleDialog] = useState({ open: false, userIdx: null, selectedRole: "" });
  // Add Privilege Dialog state
  const [addPrivilegeDialog, setAddPrivilegeDialog] = useState({ open: false, userIdx: null, selectedPrivilege: "" });
  // Add User Dialog state
  const [addUserDialog, setAddUserDialog] = useState({ open: false, email: "", password: "" });

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
      localStorage.setItem("adminUser", JSON.stringify(newUsers));
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
  const openAddUserDialog = () => setAddUserDialog({ open: true, email: "", password: "" });
  const closeAddUserDialog = () => setAddUserDialog({ open: false, email: "", password: "" });

  // Handle Add User form changes
  const handleAddUserChange = (field, value) => {
    setAddUserDialog((d) => ({ ...d, [field]: value }));
  };

  // Add User submit (email and password)
  const handleAddUserSubmit = (e) => {
    e.preventDefault();
    if (!addUserDialog.email || !addUserDialog.password) return;
    const existingUsers = JSON.parse(localStorage.getItem("adminUser")) || [];
    const newUser = { 
      id: Date.now(), 
      email: addUserDialog.email.trim().toLowerCase(), 
      password: addUserDialog.password,
      userrole: [{ role: [], privileges: [] }]
    };
    const updatedUsers = [...existingUsers, newUser];
    localStorage.setItem("adminUser", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    showSnackbar("User created successfully");
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
      <main className="ml-64 overflow-auto h-screen">
        <div className="p-8">
          {/* Header Section with Download and Add User */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <h1 className="text-3xl font-bold mb-4">Role Based Access</h1>
            <div className="flex flex-wrap gap-2 items-center justify-end">
              <button
                className="flex items-center bg-orange-500 text-white rounded px-4 py-2 text-sm font-semibold hover:bg-orange-600"
                onClick={handleDownloadCSV}
              >
                <Download size={18} className="mr-1" />Download CSV
              </button>
              <button
                className="flex items-center bg-orange-500 text-white rounded px-4 py-2 text-sm font-semibold hover:bg-orange-600"
                onClick={openAddUserDialog}
              >
                <Plus size={18} className="mr-1" />Add User
              </button>
            </div>
          </div>
          
          {users.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow bg-white">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="px-4 py-2 text-left whitespace-nowrap">Email</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">Roles</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">Privileges</th>
                    <th className="px-4 py-2 text-left whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, userIdx) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      {/* Email */}
                      <td className="px-4 py-2 whitespace-nowrap font-medium text-red-600">{user.email}</td>
                      {/* Roles */}
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2 items-center">
                          {getUserRoles(user).map((role, roleIdx) => (
                            <span key={roleIdx} className="inline-flex items-center bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-sm font-medium">
                              {role}
                              <button
                                className="ml-1 text-gray-500 hover:text-red-500"
                                onClick={() => handleRemoveRole((page - 1) * ROWS_PER_PAGE + userIdx, roleIdx)}
                              >
                                <X size={16} />
                              </button>
                            </span>
                          ))}
                          <button
                            className="inline-flex items-center bg-orange-500 text-white rounded px-3 py-1 text-sm font-medium hover:bg-orange-600"
                            onClick={() => openAddRoleDialog((page - 1) * ROWS_PER_PAGE + userIdx)}
                          >
                            <Plus size={16} className="mr-1" />Add
                          </button>
                        </div>
                      </td>
                      {/* Privileges */}
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex flex-wrap gap-2 items-center">
                          {getUserPrivileges(user).map((priv, privIdx) => (
                            <span key={privIdx} className="inline-flex items-center bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-sm font-medium">
                              {priv}
                              <button
                                className="ml-1 text-gray-500 hover:text-red-500"
                                onClick={() => handleRemovePrivilege((page - 1) * ROWS_PER_PAGE + userIdx, privIdx)}
                              >
                                <X size={16} />
                              </button>
                            </span>
                          ))}
                          <button
                            className="inline-flex items-center bg-orange-500 text-white rounded px-3 py-1 text-sm font-medium hover:bg-orange-600"
                            onClick={() => openAddPrivilegeDialog((page - 1) * ROWS_PER_PAGE + userIdx)}
                          >
                            <Plus size={16} className="mr-1" />Add
                          </button>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDeleteUser((page - 1) * ROWS_PER_PAGE + userIdx)}
                        >
                          <Trash2 size={22} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination Controls */}
              <div className="flex items-center justify-end gap-4 p-4 bg-white border-t border-gray-200">
                <span className="text-sm text-gray-500">Rows per page: {ROWS_PER_PAGE}</span>
                <span className="text-sm text-gray-500">
                  {ROWS_PER_PAGE * (page - 1) + 1}-{Math.min(page * ROWS_PER_PAGE, users.length)} of {users.length}
                </span>
                <button
                  className="px-2 py-1 rounded disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  &lt;
                </button>
                <button
                  className="px-2 py-1 rounded disabled:opacity-50"
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
                    onChange={e => handleAddUserChange("email", e.target.value)}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1 text-orange-600">Enter Password</label>
                  <input
                    type="password"
                    className="border-2 border-orange-400 px-3 py-3 rounded w-full text-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter Password"
                    value={addUserDialog.password}
                    onChange={e => handleAddUserChange("password", e.target.value)}
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