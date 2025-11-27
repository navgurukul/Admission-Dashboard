import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useDifficultyLevels } from "@/hooks/useDifficultyLevels";
import {
  type CreateDifficultyLevelData,
  type UpdateDifficultyLevelData,
} from "@/utils/difficultyLevelAPI";

interface DifficultyLevelFormData {
  name: string;
  description: string;
  color: string;
  status: boolean;
}

export function DifficultyLevelManager() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const [formData, setFormData] = useState<DifficultyLevelFormData>({
    name: "",
    description: "",
    color: "#3B82F6",
    status: true,
  });

  const {
    difficultyLevels,
    loading,
    error,
    createDifficultyLevel,
    updateDifficultyLevel,
    deleteDifficultyLevel,
    toggleDifficultyLevelStatus,
    fetchDifficultyLevels,
    difficultyLevelUtils,
  } = useDifficultyLevels();

  useEffect(() => {
    console.log("Difficulty Levels Data:", difficultyLevels);
    console.log("Is Array:", Array.isArray(difficultyLevels));
    if (difficultyLevels && typeof difficultyLevels === "object") {
      console.log("Object keys:", Object.keys(difficultyLevels));
    }
  }, [difficultyLevels]);

  // Better way to handle the API response structure
  const getLevelsArray = (): DifficultyLevel[] => {
    if (!difficultyLevels) return [];

    // Direct access to the nested array structure
    if (
      difficultyLevels.data &&
      difficultyLevels.data.data &&
      Array.isArray(difficultyLevels.data.data)
    ) {
      return difficultyLevels.data.data;
    }

    return [];
  };

  const levelsArray = getLevelsArray();
  console.log("Levels array:", levelsArray);
  console.log("Number of levels:", levelsArray.length);

  // Filter difficulty levels based on search and status
  const filteredLevels = levelsArray.filter((level) => {
    console.log("Processing level:", level);

    const matchesSearch =
      level.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (level.description &&
        level.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = !showActiveOnly || level.status;

    return matchesSearch && matchesStatus;
  });

  console.log("Filtered levels:", filteredLevels);

  // Handle form input changes
  const handleFormChange = (
    field: keyof DifficultyLevelFormData,
    value: any,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "#3B82F6",
      status: true,
    });
  };

  // Handle create difficulty level
  const handleCreate = async () => {
    try {
      const createData: CreateDifficultyLevelData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        status: formData.status,
      };

      await createDifficultyLevel(createData);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating difficulty level:", error);
    }
  };

  // Handle edit difficulty level
  const handleEdit = async () => {
    if (!editingLevel) return;

    try {
      const updateData: UpdateDifficultyLevelData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        status: formData.status,
      };

      await updateDifficultyLevel(editingLevel.id, updateData);
      setIsEditDialogOpen(false);
      setEditingLevel(null);
      resetForm();
    } catch (error) {
      console.error("Error updating difficulty level:", error);
    }
  };

  // Handle delete difficulty level
  const handleDelete = async (id: number) => {
    try {
      await deleteDifficultyLevel(id);
    } catch (error) {
      console.error("Error deleting difficulty level:", error);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await toggleDifficultyLevelStatus(id, currentStatus);
    } catch (error) {
      console.error("Error toggling difficulty level status:", error);
    }
  };

  // Open edit dialog
  const openEditDialog = (level: any) => {
    setEditingLevel(level);
    setFormData({
      name: level.name,
      description: level.description || "",
      color: level.color || "#3B82F6",
      status: level.status,
    });
    setIsEditDialogOpen(true);
  };

  // Close dialogs
  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingLevel(null);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Difficulty Levels
          </h1>
          <p className="text-muted-foreground">
            Manage difficulty levels for questions and assessments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchDifficultyLevels}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Difficulty Level
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Difficulty Level</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    placeholder="e.g., Easy, Medium, Hard"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleFormChange("description", e.target.value)
                    }
                    placeholder="Optional description..."
                    rows={3}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        handleFormChange("color", e.target.value)
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) =>
                        handleFormChange("color", e.target.value)
                      }
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) =>
                      handleFormChange("status", checked)
                    }
                  />
                  <Label htmlFor="status">Active</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeCreateDialog}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.name.trim()}>
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search difficulty levels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active-only"
                checked={showActiveOnly}
                onCheckedChange={setShowActiveOnly}
              />
              <Label htmlFor="active-only">Active only</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Difficulty Levels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Difficulty Levels ({filteredLevels.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Loading difficulty levels...
              </p>
            </div>
          ) : filteredLevels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm || showActiveOnly
                  ? "No difficulty levels found matching your criteria"
                  : "No difficulty levels found. Create your first one!"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLevels.length > 0 && (
                  <div>
                    <h3>Debug - Levels Found:</h3>
                    {filteredLevels.map((level) => (
                      <div
                        key={level.id}
                        style={{
                          border: "1px solid #ccc",
                          margin: "5px",
                          padding: "10px",
                        }}
                      >
                        <p>ID: {level.id}</p>
                        <p>Name: {level.name}</p>
                        <p>Status: {level.status ? "Active" : "Inactive"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Difficulty Level</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                placeholder="e.g., Easy, Medium, Hard"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  handleFormChange("description", e.target.value)
                }
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleFormChange("color", e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => handleFormChange("color", e.target.value)}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-status"
                checked={formData.status}
                onCheckedChange={(checked) =>
                  handleFormChange("status", checked)
                }
              />
              <Label htmlFor="edit-status">Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeEditDialog}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name.trim()}>
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
