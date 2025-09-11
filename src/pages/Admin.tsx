
import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Search, X, User as UserIcon, Mail, Phone, Shield } from "lucide-react";
import {
  getAllUsers,
  getAllRolesNew,
  onboardUser,
  updateUser,
  deleteUser,
  User,
  Role,
} from "@/utils/api";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";

const ROWS_PER_PAGE = 10;

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const [addUserDialog, setAddUserDialog] = useState<{
    open: boolean;
    email: string;
    name: string;
    phone: string;
    username: string;
    selectedRoleId: string;
    editId: number | null;
  }>({
    open: false,
    email: "",
    name: "",
    phone: "",
    username: "",
    selectedRoleId: "",
    editId: null,
  });

  useEffect(() => {
    fetchUsers(page);
    fetchRoles();
  }, [page]);

  const fetchUsers = async (pageNo: number = page): Promise<void> => {
    setLoading(true);
    try {
      const res = await getAllUsers(pageNo, ROWS_PER_PAGE);
      const users = res?.data?.data || [];
      const total = res?.data?.totalPages || 1;

      setUsers(users);
      setTotalPages(total);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async (): Promise<void> => {
    try {
      const roles = await getAllRolesNew();
      setRoles(roles);
    } catch (err) {
      console.error("Error fetching roles:", err);
      setRoles([]);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (
      !addUserDialog.name.trim() ||
      !addUserDialog.email.trim() ||
      !addUserDialog.phone.trim() ||
      !addUserDialog.selectedRoleId
    ) {
      console.error("Please fill all required fields");
      return;
    }

    const payload = {
      name: addUserDialog.name.trim(),
      mobile: addUserDialog.phone.trim(),
      email: addUserDialog.email.trim(),
      mail_id: addUserDialog.email.trim(),
      user_name: addUserDialog.username.trim() || addUserDialog.email.split("@")[0],
      user_role_id: parseInt(addUserDialog.selectedRoleId),
    };

    try {
      if (addUserDialog.editId) {
        // Update
        await updateUser(addUserDialog.editId.toString(), payload);
        await fetchUsers(); // refresh same page
      } else {
        // Create
        await onboardUser(payload);

        // Add hone ke baad last page le jao
        const res = await getAllUsers(1, ROWS_PER_PAGE);
        const total = res?.data?.totalPages || 1;
        setPage(total);
        await fetchUsers(total);
      }

      closeAddUserDialog();
    } catch (err) {
      console.error("Error saving user:", err);
      // You can add user-friendly error handling here
      // For example: show a toast notification or set an error state
    }
  };

  const openAddUserDialog = (): void =>
    setAddUserDialog({
      open: true,
      email: "",
      name: "",
      phone: "",
      username: "",
      selectedRoleId: "",
      editId: null,
    });

  const closeAddUserDialog = (): void =>
    setAddUserDialog({
      open: false,
      email: "",
      name: "",
      phone: "",
      username: "",
      selectedRoleId: "",
      editId: null,
    });

  const handleDeleteUser = async (id: number): Promise<void> => {
      try {
        await deleteUser(id.toString()); 
        await fetchUsers();
      } catch (err) {
        console.error("Error deleting user:", err);
      }
    
  };

  const getRoleName = (roleId: number): string => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : `Role ${roleId}`;
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.user_name && user.user_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <AdmissionsSidebar />
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Mobile Header */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md bg-white shadow-sm border border-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <UserIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    User Management
                  </h1>
                  <p className="text-gray-600 mt-1">Manage system users and their roles</p>
                </div>
                
                <button
                  onClick={openAddUserDialog}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add User</span>
                  <span className="sm:hidden">Add</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="mt-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users by name, email, or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Roles</p>
                    <p className="text-2xl font-semibold text-gray-900">{roles.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Search className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Search Results</p>
                    <p className="text-2xl font-semibold text-gray-900">{filteredUsers.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                  <div className="text-lg text-gray-600 mt-4">Loading users...</div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Username
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 font-semibold text-sm">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {user.mobile || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{user.user_name || "-"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              <Shield className="h-3 w-3 mr-1" />
                              {getRoleName(user.user_role_id)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() =>
                                  setAddUserDialog({
                                    open: true,
                                    name: user.name,
                                    email: user.email,
                                    username: user.user_name || "",
                                    phone: user.mobile || "",
                                    selectedRoleId: user.user_role_id?.toString() || "",
                                    editId: user.id,
                                  })
                                }
                                className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                                title="Edit User"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                            <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </p>
                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-500">
                              {user.mobile && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {user.mobile}
                                </span>
                              )}
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                <Shield className="h-3 w-3 mr-1" />
                                {getRoleName(user.user_role_id)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() =>
                              setAddUserDialog({
                                open: true,
                                name: user.name,
                                email: user.email,
                                username: user.user_name || "",
                                phone: user.mobile || "",
                                selectedRoleId: user.user_role_id?.toString() || "",
                                editId: user.id,
                              })
                            }
                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredUsers.length === 0 && (
                  <div className="p-12 text-center">
                    <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery ? "Try adjusting your search criteria." : "Get started by adding a new user."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        page === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      }`}
                    >
                      Previous
                    </button>
                    
                    <div className="flex gap-1 mx-2">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPage(i + 1)}
                          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            page === i + 1
                              ? "bg-orange-600 text-white shadow-sm"
                              : "bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        page === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </nav>
              </div>
            )}

            {/* Add/Edit Dialog */}
            {addUserDialog.open && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      {addUserDialog.editId ? "Edit User" : "Add New User"}
                    </h2>
                    <button
                      onClick={closeAddUserDialog}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                      <X className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>

                  <form onSubmit={handleAddUserSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        required
                        value={addUserDialog.name}
                        onChange={(e) =>
                          setAddUserDialog((d) => ({ ...d, name: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={addUserDialog.email}
                        onChange={(e) =>
                          setAddUserDialog((d) => ({ ...d, email: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                        placeholder="Enter email address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={addUserDialog.phone}
                        onChange={(e) =>
                          setAddUserDialog((d) => ({ ...d, phone: e.target.value }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                      <input
                        type="text"
                        value={addUserDialog.username}
                        onChange={(e) =>
                          setAddUserDialog((d) => ({
                            ...d,
                            username: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                        placeholder="Enter username (optional)"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Only letters, numbers, underscores allowed. Defaults to email prefix if empty.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                      <select
                        required
                        value={addUserDialog.selectedRoleId}
                        onChange={(e) =>
                          setAddUserDialog((d) => ({
                            ...d,
                            selectedRoleId: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200"
                      >
                        <option value="" disabled>
                          Select a role
                        </option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={closeAddUserDialog}
                        className="px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                      >
                        {addUserDialog.editId ? "Update User" : "Create User"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;