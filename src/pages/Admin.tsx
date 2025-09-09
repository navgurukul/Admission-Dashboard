
import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import {getAllUsers,getAllRolesNew,onboardUser,updateUser,deleteUser,User,Role,} from "@/utils/api"
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";

const ROWS_PER_PAGE = 10;

const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [addUserDialog, setAddUserDialog] = useState({
    open: false,
    email: "",
    name: "",
    phone: "",
    selectedRoleId: "",
    editId: null as number | null,
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page]);

 const fetchUsers = async () => {
  setLoading(true);
  try {
    const res = await getAllUsers(page, ROWS_PER_PAGE);
    const users = res?.data?.data || []; // unwrap nested array
    setUsers(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    setUsers([]);
  } finally {
    setLoading(false);
  }
};


  const fetchRoles = async () => {
  try {
    const roles = await getAllRolesNew(); // no extra unwrap
    setRoles(roles);
  } catch (err) {
    console.error("Error fetching roles:", err);
    setRoles([]);
  }
};



  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserDialog.name || !addUserDialog.email || !addUserDialog.phone || !addUserDialog.selectedRoleId) return;

    try {
      if (addUserDialog.editId) {
        // Update user
        await updateUser(addUserDialog.editId.toString(), {
          name: addUserDialog.name,
          mobile: addUserDialog.phone,
          user_name: addUserDialog.email, // if username = email
          user_role_id: parseInt(addUserDialog.selectedRoleId),
        });
      } else {
        // Onboard new user
        await onboardUser({
          name: addUserDialog.name,
          email: addUserDialog.email,
          mobile: addUserDialog.phone,
          user_name: addUserDialog.email, // backend expects user_name
          role_id: parseInt(addUserDialog.selectedRoleId),
        });
      }

      await fetchUsers();
      closeAddUserDialog();
    } catch (err) {
      console.error("Error saving user:", err);
    }
  };

  const openAddUserDialog = () =>
    setAddUserDialog({
      open: true,
      email: "",
      name: "",
      phone: "",
      selectedRoleId: "",
      editId: null,
    });

  const closeAddUserDialog = () =>
    setAddUserDialog({
      open: false,
      email: "",
      name: "",
      phone: "",
      selectedRoleId: "",
      editId: null,
    });

  const handleDeleteUser = async (id: number) => {
    try {
      await deleteUser(id.toString());
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const paginatedUsers = users.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );
  const totalPages = Math.ceil(users.length / ROWS_PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <AdmissionsSidebar/>
      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              User Management
            </h1>
            <button
              onClick={openAddUserDialog}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-lg">Loading...</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.mobile || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.role_name || "-"}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={() =>
                            setAddUserDialog({
                              open: true,
                              name: user.name,
                              email: user.email,
                              phone: user.mobile || "",
                              selectedRoleId: user.role_id?.toString() || "",
                              editId: user.id,
                            })
                          }
                          className="text-orange-600 hover:text-orange-800"
                        >
                          <Pencil size={20} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-2 rounded border ${
                  page === 1
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-orange-600 text-white hover:bg-orange-700"
                }`}
              >
                Prev
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`px-3 py-2 rounded ${
                    page === i + 1
                      ? "bg-orange-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-3 py-2 rounded border ${
                  page === totalPages
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-orange-600 text-white hover:bg-orange-700"
                }`}
              >
                Next
              </button>
            </div>
          )}

          {/* Add/Edit Dialog */}
          {addUserDialog.open && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
              <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-bold mb-4">
                  {addUserDialog.editId ? "Edit User" : "Add New User"}
                </h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={addUserDialog.name}
                    onChange={(e) =>
                      setAddUserDialog((d) => ({ ...d, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={addUserDialog.phone}
                    onChange={(e) =>
                      setAddUserDialog((d) => ({ ...d, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={addUserDialog.email}
                    onChange={(e) =>
                      setAddUserDialog((d) => ({ ...d, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select
                    value={addUserDialog.selectedRoleId}
                    onChange={(e) =>
                      setAddUserDialog((d) => ({
                        ...d,
                        selectedRoleId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="" disabled>
                      Select Role
                    </option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeAddUserDialog}
                    className="px-4 py-2 text-gray-700 border rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUserSubmit}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                  >
                    {addUserDialog.editId ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;
