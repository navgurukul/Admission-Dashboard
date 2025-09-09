
import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  onboardUser,
  getAllRolesNew,
  getAllUsers,
  deleteUser,
  updateUser, //  new function in utils/api.ts
} from "@/utils/api";

const ROWS_PER_PAGE = 10;

const AdminPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [addUserDialog, setAddUserDialog] = useState<{
    open: boolean;
    email: string;
    name: string;
    phone: string;
    selectedRole: string;
    editId?: number | null;
  }>({
    open: false,
    email: "",
    name: "",
    phone: "",
    selectedRole: "",
    editId: null,
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers(1, 100);
      console.log("Users API Response:", res);

      const normalizedUsers = (res.data?.data || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.mail_id,
        phone: u.mobile,
        role: u.role_name || "USER",
      }));

      setUsers(normalizedUsers);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await getAllRolesNew();
      setRoles(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setRoles([]);
    }
  };

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUserDialog.name || !addUserDialog.email || !addUserDialog.phone)
      return;

    try {
      const selectedRole = roles.find(
        (r) => r.name === addUserDialog.selectedRole
      );

      if (addUserDialog.editId) {
        //  Update user
        await updateUser(addUserDialog.editId, {
          name: addUserDialog.name,
          email: addUserDialog.email,
          mobile: addUserDialog.phone,
          user_role_id: selectedRole?.id || 2,
        });
        await fetchUsers();
      } else {
        //  Add new user
        await onboardUser({
          name: addUserDialog.name,
          email: addUserDialog.email,
          mobile: addUserDialog.phone,
          user_name: addUserDialog.email.split("@")[0],
          role_id: selectedRole?.id || 2,
        });
        await fetchUsers();
      }

      closeAddUserDialog();
    } catch (err) {
      console.error(err);
    }
  };

  const openAddUserDialog = () =>
    setAddUserDialog({
      open: true,
      email: "",
      name: "",
      phone: "",
      selectedRole: "",
      editId: null,
    });

  const closeAddUserDialog = () =>
    setAddUserDialog({
      open: false,
      email: "",
      name: "",
      phone: "",
      selectedRole: "",
      editId: null,
    });

  const paginatedUsers = users.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );
  const totalPages = Math.ceil(users.length / ROWS_PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      <main className="md:ml-64 overflow-auto h-screen p-4 md:p-8 pt-16">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-foreground">
            User Management
          </h1>
          <Button onClick={openAddUserDialog}>
            <Plus className="h-4 w-4 mr-1" />
            Add User
          </Button>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 border-b">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone || "-"}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell className="flex gap-2">
                      <button
                        onClick={() =>
                          setAddUserDialog({
                            open: true,
                            name: u.name,
                            email: u.email,
                            phone: u.phone,
                            selectedRole: u.role,
                            editId: u.id, // edit mode
                          })
                        }
                      >
                        <Pencil size={20} className="text-blue-600" />
                      </button>
                      <button
                        onClick={() => deleteUser(u.id).then(fetchUsers)}
                      >
                        <Trash2 size={20} className="text-red-600" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {addUserDialog.open && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 p-2">
    <form
      className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg"
      onSubmit={handleAddUserSubmit}
    >
      <h2 className="text-xl font-bold mb-4">
        {addUserDialog.editId ? "Edit User" : "Add New User"}
      </h2>

      {/* Name */}
      <label className="block mb-1 text-orange-600">Name</label>
      <input
        type="text"
        placeholder="Name"
        value={addUserDialog.name}
        onChange={(e) =>
          setAddUserDialog((d) => ({ ...d, name: e.target.value }))
        }
        style={{
          border: "1px solid #ccc",
          padding: "8px 12px",
          width: "100%",
          marginBottom: "12px",
        }}
        required
      />

      {/* Phone */}
      <label className="block mb-1 text-orange-600">Phone</label>
      <input
        type="tel"
        placeholder="Phone"
        value={addUserDialog.phone}
        onChange={(e) =>
          setAddUserDialog((d) => ({ ...d, phone: e.target.value }))
        }
        style={{
          border: "1px solid #ccc",
          padding: "8px 12px",
          width: "100%",
          marginBottom: "12px",
        }}
        required
      />

      {/* Email */}
      <label className="block mb-1 text-orange-600">Email</label>
      <input
        type="email"
        placeholder="Email"
        value={addUserDialog.email}
        onChange={(e) =>
          setAddUserDialog((d) => ({ ...d, email: e.target.value }))
        }
        style={{
          border: "1px solid #ccc",
          padding: "8px 12px",
          width: "100%",
          marginBottom: "12px",
        }}
        required
      />

      {/* Role Select */}
      <label className="block mb-1 text-orange-600">Role</label>
      <select
        value={addUserDialog.selectedRole}
        onChange={(e) =>
          setAddUserDialog((d) => ({
            ...d,
            selectedRole: e.target.value,
          }))
        }
        style={{
          border: "1px solid #ccc",
          padding: "8px 12px",
          width: "100%",
          color: "orange",
          backgroundColor: "white",
          marginBottom: "16px",
        }}
      >
        <option
          style={{ fontSize: "12px", width: "100vh", color: "orange" }}
          value=""
        >
          Select Role
        </option>
        {roles.map((r) => (
          <option
            key={r.id}
            value={r.name}
            style={{ fontSize: "12px", width: "100vh", color: "orange" }}
          >
            {r.name}
          </option>
        ))}
      </select>

      {/* Buttons */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={closeAddUserDialog}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-orange-500 text-white rounded"
        >
          {addUserDialog.editId ? "Update" : "Create"}
        </button>
      </div>
    </form>
  </div>
)}
      </main>
    </div>
  );
};

export default AdminPage;
