import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import {
  createRole,
  updateRole,
  deleteRole,
  getAllRolesNew,
} from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

interface UserRole {
  id: string | number;
  name: string;
  description?: string;
  permissions?: string[];
}

export default function UserRole() {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const { toast } = useToast();

  // Fetch roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const data = await getAllRolesNew();
        const mapped: UserRole[] = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description ?? "",
          permissions: r.permissions ?? [],
        }));
        setRoles(mapped);
        console.log("Fetched roles:", mapped);
      } catch (err) {
        console.error("Failed to fetch roles:", err);
        toast({
          title: "Error",
          description: "Failed to fetch roles",
          variant: "destructive",
        });
      }
    };
    fetchRoles();
  }, [toast]);

  // Add new role
  const handleAddRole = async () => {
    if (!newRole.name.trim()) return;

    const exists = roles.some(
      (role) => role.name.toLowerCase() === newRole.name.trim().toLowerCase()
    );
    if (exists) {
      toast({
        title: "Duplicate Role",
        description: `Role "${newRole.name}" already exists.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const created = await createRole({
        name: newRole.name.trim(),
        // description: newRole.description.trim(),
      });

      const newRoleWithDefaults: UserRole = {
        id: created.id,
        name: created.name,
        // description: created.description ?? "",
        // permissions: created.permissions ?? [],
      };

      setRoles((prev) => [...prev, newRoleWithDefaults]);
      setNewRole({ name: "", description: "" });

      toast({
        title: "Role Added",
        description: `Role "${created.name}" has been created.`,
      });
    } catch (err) {
      console.error("Failed to create role:", err);
      toast({
        title: "Error",
        description: "Failed to create role",
        variant: "destructive",
      });
    }
  };

  // Delete role
  const handleDeleteRole = async (id: string | number) => {
    try {
      await deleteRole(String(id));
      setRoles((prev) => prev.filter((role) => role.id !== id));
      toast({
        title: "Role Deleted",
        description: "Role has been deleted successfully.",
      });
    } catch (err) {
      console.error("Failed to delete role:", err);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  // Save edited role
const handleEditRole = async (updatedRole: UserRole) => {
  try {
    const updated = await updateRole(Number(updatedRole.id), {
      name: updatedRole.name,
      status: true, // if your backend requires it
    });

    setRoles((prevRoles) =>
      prevRoles.map((role) =>
        role.id === updated.id ? { ...role, ...updated } : role
      )
    );

    setEditingRole(null);

    toast({
      title: "Role Updated",
      description: `Role "${updated.name}" has been updated successfully.`,
    });
  } catch (err: any) {
    console.error("Failed to update role:", err);
    toast({
      title: "Error",
      description: err.message || "Failed to update role",
      variant: "destructive",
    });
  }
};

  return (
    <div style={{ display: "flex", gap: "2rem" }}>
      <AdmissionsSidebar />
      <div className="space-y-6" style={{ flex: 1 }}>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Roles</h2>
          <p className="text-gray-600">Manage user roles and their permissions</p>
        </div>

        {/* Add New Role */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Role</CardTitle>
            <CardDescription>Create a new user role with specific permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                <Input
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <Input
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Enter role description"
                />
              </div>
            </div>
            <Button onClick={handleAddRole} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Role
            </Button>
          </CardContent>
        </Card>

        {/* Existing Roles */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Roles</CardTitle>
            <CardDescription>Manage current user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role.id} className="p-4 border rounded-lg space-y-2">
                  {editingRole?.id === role.id ? (
                    // Edit Mode
                    <div className="space-y-2">
                      <Input
                        value={editingRole.name}
                        onChange={(e) =>
                          setEditingRole({
                            ...editingRole,
                            name: e.target.value,
                          })
                        }
                        placeholder="Role Name"
                      />
                      <Input
                        value={editingRole.description}
                        onChange={(e) =>
                          setEditingRole({
                            ...editingRole,
                            // description: e.target.value,
                          })
                        }
                        placeholder="Role Description"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditRole(editingRole)}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingRole(null)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {role.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {role.description}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {role.permissions?.map((permission) => (
                            <span
                              key={permission}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                            >
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingRole({ ...role })}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRole(role.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
