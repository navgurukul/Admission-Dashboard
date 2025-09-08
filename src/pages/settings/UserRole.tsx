
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";

interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export default function UserRole() {
  const [roles, setRoles] = useState<UserRole[]>([
    { id: "1", name: "Admin", description: "Full system access", permissions: ["all"] },
    { id: "2", name: "Manager", description: "Department management", permissions: ["read", "write", "delete"] },
    { id: "3", name: "Staff", description: "Basic operations", permissions: ["read", "write"] },
  ]);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [newRole, setNewRole] = useState({ name: "", description: "" });

  const handleAddRole = () => {
    if (newRole.name.trim()) {
      const role: UserRole = {
        id: Date.now().toString(),
        name: newRole.name,
        description: newRole.description,
        permissions: ["read"],
      };
      setRoles([...roles, role]);
      setNewRole({ name: "", description: "" });
    }
  };

  const handleDeleteRole = (id: string) => {
    setRoles(roles.filter(role => role.id !== id))};
    
  // Save edited role
  const handleEditRole = (updatedRole: UserRole) => {
    setRoles((prevRoles) =>
      prevRoles.map((role) => (role.id === updatedRole.id ? updatedRole : role))
    );
    setEditingRole(null);
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
                        onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                        placeholder="Role Name"
                      />
                      <Input
                        value={editingRole.description}
                        onChange={(e) =>
                          setEditingRole({ ...editingRole, description: e.target.value })
                        }
                        placeholder="Role Description"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleEditRole(editingRole)}>
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
                        <h3 className="font-semibold text-gray-900">{role.name}</h3>
                        <p className="text-sm text-gray-600">{role.description}</p>
                        <div className="flex gap-2 mt-2">
                          {role.permissions.map((permission) => (
                            <span key={permission} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              {permission}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditingRole({ ...role })}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteRole(role.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                  </div>)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}