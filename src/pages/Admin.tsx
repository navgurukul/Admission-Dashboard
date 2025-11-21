import React, { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Search,
  X,
  User as UserIcon,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import {searchUsers} from "@/utils/api";

const ROWS_PER_PAGE = 10;

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string>("");
  const [nameError, setNameError] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [usernameError, setUsernameError] = useState<string>("");

  const { toast } = useToast();

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    userId: number | null;
    userName: string;
  }>({ open: false, userId: null, userName: "" });

  const [updateConfirm, setUpdateConfirm] = useState<{
    open: boolean;
    data: any;
  }>({ open: false, data: null });

  const [addUserDialog, setAddUserDialog] = useState<{
    open: boolean;
    email: string;
    name: string;
    phone: string;
    username: string;
    selectedRoleId: string;
    editId: number | null;
    user_role_id?: number;
  }>({
    open: false,
    email: "",
    name: "",
    phone: "",
    username: "",
    selectedRoleId: "",
    editId: null,
    user_role_id: undefined,
  });

  const fetchUsers = async (pageNo: number = page): Promise<void> => {
    setLoading(true);
    try {
      const res = await getAllUsers(pageNo, ROWS_PER_PAGE);
      const users = res?.users || [];
      const total = res?.total || 0;

      setUsers(users);
      setTotalUsers(total);
      setTotalPages(Math.ceil(total / ROWS_PER_PAGE));
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

  // Fetch users when page changes or search is cleared
  useEffect(() => {
    // Only fetch users from server when not searching
    if (!searchQuery.trim()) {
      fetchUsers(page);
    }
  }, [page, searchQuery]);

  // Fetch roles once on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Search with debouncing
  useEffect(() => {
    // Don't do anything if search is empty
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchUsers(searchQuery.trim());
        setSearchResults(results || []);
      } catch (err) {
        console.error("Error searching users:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const handleAddUserSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    // Name validation: only letters, spaces, apostrophe and hyphen allowed
    const nameTrim = addUserDialog.name.trim();
    if (!/^[A-Za-z\s'-]+$/.test(nameTrim)) {
      setNameError("Name can only contain letters, spaces.");
      toast({
        title: "Invalid Name",
        description: "Name can only contain letters, spaces, apostrophes, and hyphens.",
        variant: "destructive",
      });
      return;
    }
    setNameError("");

    // Phone validation: exactly 10 digits
    if (!/^\d{10}$/.test(addUserDialog.phone.trim())) {
      setPhoneError("Phone number must be exactly 10 digits");
      toast({
        title: "Invalid Phone",
        description: "Phone number must be exactly 10 digits.",
        variant: "destructive",
      });
      return;
    }
    setPhoneError("");

    // Email presence & format
    const emailTrim = addUserDialog.email.trim();
    if (!emailTrim) {
      setEmailError("Email is required");
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      setEmailError("Please enter a valid email address");
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    setEmailError("");

    // Username validation (optional, but if provided must be valid)
    const usernameTrim = addUserDialog.username.trim();
    if (usernameTrim && !/^[A-Za-z0-9_]+$/.test(usernameTrim)) {
      setUsernameError("Username can only contain letters, numbers, and underscores");
      toast({
        title: "Invalid Username",
        description: "Username can only contain letters, numbers, and underscores.",
        variant: "destructive",
      });
      return;
    }
    setUsernameError("");

    if (!addUserDialog.selectedRoleId) {
      // role required
      toast({
        title: "Role Required",
        description: "Please select a role for the user.",
        variant: "destructive",
      });
      return;
    }

    // Use trimmed username or fallback to email prefix
    const firstName = nameTrim.split(" ")[0].toLowerCase();
    const finalUsername = usernameTrim || firstName;

    console.log("Creating user - Username field:", usernameTrim, "Final username:", finalUsername);
    
    const payload = {
      name: nameTrim,
      mobile: addUserDialog.phone.trim(),
      email: emailTrim,
      mail_id: emailTrim,
      user_name: finalUsername,
      user_role_id: parseInt(addUserDialog.selectedRoleId),
    };

    // If editing, show confirmation dialog
    if (addUserDialog.editId) {
      setUpdateConfirm({ open: true, data: payload });
      return;
    }

    // For new user, proceed directly
    try {
      // Create new user
      await onboardUser(payload);

      // Clear search if active
      if (searchQuery.trim()) {
        setSearchQuery("");
        setSearchResults([]);
      }

      // Move to last page after adding
      const res = await getAllUsers(1, ROWS_PER_PAGE);
      const totalPagesCalculated = Math.ceil((res?.total || 0) / ROWS_PER_PAGE);
      setPage(totalPagesCalculated);
      await fetchUsers(totalPagesCalculated);

      toast({
        title: "User Created",
        description: `Successfully created user ${payload.name}`,
      });

      closeAddUserDialog();
    } catch (err) {
      console.error("Error saving user:", err);
      toast({
        title: "Error",
        description: addUserDialog.editId 
          ? "Failed to update user. Please try again."
          : "Failed to create user. Please try again.",
        variant: "destructive",
      });
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

  const handleDeleteUser = (id: number, userName: string): void => {
    setDeleteConfirm({ open: true, userId: id, userName });
  };

  const confirmDeleteUser = async (): Promise<void> => {
    if (!deleteConfirm.userId) return;

    try {
      await deleteUser(deleteConfirm.userId.toString());
      
      // Refresh current state without changing page or search
      if (searchQuery.trim()) {
        // Re-run the search to get updated results
        const results = await searchUsers(searchQuery.trim());
        setSearchResults(results || []);
      } else {
        // Just refresh current page
        await fetchUsers(page);
      }

      toast({
        title: "User Deleted",
        description: "User has been successfully deleted.",
      });

      setDeleteConfirm({ open: false, userId: null, userName: "" });
    } catch (err) {
      console.error("Error deleting user:", err);
      toast({
        title: "Delete Failed",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
      setDeleteConfirm({ open: false, userId: null, userName: "" });
    }
  };

  const confirmUpdateUser = async (): Promise<void> => {
    if (!updateConfirm.data || !addUserDialog.editId) return;

    try {
      await updateUser(addUserDialog.editId.toString(), updateConfirm.data);

      // Refresh current state without changing page or search
      if (searchQuery.trim()) {
        const results = await searchUsers(searchQuery.trim());
        setSearchResults(results || []);
      } else {
        await fetchUsers(page);
      }

      toast({
        title: "User Updated",
        description: `Successfully updated ${updateConfirm.data.name}`,
      });

      setUpdateConfirm({ open: false, data: null });
      closeAddUserDialog();
    } catch (err) {
      console.error("Error updating user:", err);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
      setUpdateConfirm({ open: false, data: null });
    }
  };

  const getRoleName = (roleId: number): string => {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : `Role ${roleId}`;
  };

  // Use search results if searching, otherwise show all users
  const filteredUsers = searchQuery.trim() ? searchResults : users;

  // Client-side pagination for search results only
  // For regular users, server already sends paginated data
  const paginatedUsers = searchQuery.trim()
    ? filteredUsers.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)
    : users;

  // Calculate total pages based on whether we're searching or not
  const totalPagesCount = searchQuery.trim()
    ? Math.ceil(filteredUsers.length / ROWS_PER_PAGE)
    : totalPages;

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <AdmissionsSidebar />
      
      {/* Main Content */}
      <div className="md:pl-64">
        
        <main className="p-4 sm:p-6 lg:p-8">
          
          <div className="max-w-7xl mx-auto">
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
                  <p className="text-gray-600 mt-1">
                    {searchQuery
                      ? `${filteredUsers.length} users found (search)`
                      : "Manage system users and their roles"}
                  </p>
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
                    <p className="text-sm font-medium text-gray-600">
                      Total Users
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {searchQuery.trim() ? filteredUsers.length : totalUsers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Shield className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Active Roles
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {roles.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Search className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Search Results
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {filteredUsers.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            {loading || isSearching ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                  <div className="text-lg text-gray-600 mt-4">
                    {isSearching ? "Searching users..." : "Loading users..."}
                  </div>
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
                      {paginatedUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 font-semibold text-sm">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </div>
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
                            <div className="text-sm text-gray-900">
                              {user.user_name || "-"}
                            </div>
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
                                    selectedRoleId:
                                      user.user_role_id?.toString() || "",
                                    editId: user.id,
                                  })
                                }
                                className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                                title="Edit User"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.name)}
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
                  {paginatedUsers.map((user) => (
                    <div key={user.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-600 font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.name}
                            </p>
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
                                selectedRoleId:
                                  user.user_role_id?.toString() || "",
                                editId: user.id,
                              })
                            }
                            className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors duration-200"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.name)}
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
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      No users found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery
                        ? "Try adjusting your search criteria."
                        : "Get started by adding a new user."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPagesCount > 1 && (
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
                      {[...Array(totalPagesCount)].map((_, i) => (
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
                      onClick={() =>
                        setPage((p) => Math.min(totalPagesCount, p + 1))
                      }
                      disabled={page === totalPagesCount}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        page === totalPagesCount
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={addUserDialog.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAddUserDialog((d) => ({ ...d, name: val }));
                          // live validation: only letters, spaces, apostrophe, hyphen
                          if (val && !/^[A-Za-z\s'-]+$/.test(val)) {
                            setNameError("Name can only contain letters, spaces.");
                          } else {
                            setNameError("");
                          }
                        }}
                        onBlur={() => {
                          const val = addUserDialog.name.trim();
                          if (val && !/^[A-Za-z\s'-]+$/.test(val)) {
                            setNameError("Name can only contain letters, spaces.");
                          } else {
                            setNameError("");
                          }
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 transition-colors duration-200 ${
                          nameError
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                        }`}
                        placeholder="Enter full name"
                      />
                      {nameError && (
                        <p className="text-red-500 text-sm mt-1">
                          {nameError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={addUserDialog.email}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAddUserDialog((d) => ({ ...d, email: val }));
                          // live validation
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!val) setEmailError("Email is required");
                          else if (!emailRegex.test(val)) setEmailError("Please enter a valid email address");
                          else setEmailError("");
                        }}
                        onBlur={() => {
                          const val = addUserDialog.email.trim();
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!val) setEmailError("Email is required");
                          else if (!emailRegex.test(val)) setEmailError("Please enter a valid email address");
                          else setEmailError("");
                        }}
                        disabled={!!addUserDialog.editId}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        placeholder="Enter email address"
                      />
                      {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={addUserDialog.phone}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAddUserDialog((d) => ({ ...d, phone: value }));

                          // validation: sirf number aur max 10 digit
                          if (!/^\d{0,10}$/.test(value)) {
                            setPhoneError(
                              "Only numbers allowed, 10 digits"
                            );
                          } else {
                            setPhoneError("");
                          }
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 transition-colors duration-200 ${
                          phoneError
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                        }`}
                        placeholder="Enter 10-digit phone number"
                      />
                      {phoneError && (
                        <p className="text-red-500 text-sm mt-1">
                          {phoneError}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={addUserDialog.username}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAddUserDialog((d) => ({ ...d, username: val }));
                          // live validation: only letters, numbers, underscores
                          if (val && !/^[A-Za-z0-9_]+$/.test(val)) {
                            setUsernameError("Username can only contain letters, numbers, and underscores");
                          } else {
                            setUsernameError("");
                          }
                        }}
                        onBlur={() => {
                          const val = addUserDialog.username.trim();
                          if (val && !/^[A-Za-z0-9_]+$/.test(val)) {
                            setUsernameError("Username can only contain letters, numbers, and underscores");
                          } else {
                            setUsernameError("");
                          }
                        }}
                        className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 transition-colors duration-200 ${
                          usernameError
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-orange-500 focus:border-orange-500"
                        }`}
                        placeholder="Enter username (optional)"
                      />
                      {usernameError && (
                        <p className="text-red-500 text-sm mt-1">{usernameError}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Role *
                      </label>
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

            {/* Delete Confirmation Dialog */}
            {deleteConfirm.open && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Confirm Delete
                    </h2>
                    <p className="text-gray-600">
                      Are you sure you want to delete <strong>{deleteConfirm.userName}</strong>? 
                      This action cannot be retrieved.
                    </p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setDeleteConfirm({ open: false, userId: null, userName: "" })}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteUser}
                      className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Update Confirmation Dialog */}
            {updateConfirm.open && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      Confirm Update
                    </h2>
                    <p className="text-gray-600">
                      Are you sure you want to update <strong>{updateConfirm.data?.name}</strong>?
                    </p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setUpdateConfirm({ open: false, data: null })}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmUpdateUser}
                      className="px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors duration-200"
                    >
                      Update
                    </button>
                  </div>
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
