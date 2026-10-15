import React, { useEffect, useState } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAllCategories, createCategory, updateCategory, deleteCategory } from "@/utils/api";

type Category = {
  id: string;
  category_name: string;
  status?: boolean;
  created_at?: string;
};

export default function Category() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({ category_name: "" });
  const [editCategory, setEditCategory] = useState({ category_name: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    console.log("Categories state updated:", categories);
    console.log("Categories length:", categories.length);
  }, [categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const fetchedCategories = await getAllCategories();
      if (Array.isArray(fetchedCategories)) {
        setCategories(fetchedCategories);
      } else if (fetchedCategories && Array.isArray(fetchedCategories.data)) {
        setCategories(fetchedCategories.data);
      } else if (fetchedCategories && Array.isArray(fetchedCategories.categories)) {
        setCategories(fetchedCategories.categories);
      } else {
        setCategories([]);
        toast({
          title: "Error",
          description: "Invalid data format received from server",
          variant: "destructive",
        });
      }
    } catch (error) {
      setCategories([]);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.category_name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }
    if (
      Array.isArray(categories) &&
      categories.some(
        (category) =>
          category.category_name.toLowerCase() === newCategory.category_name.toLowerCase(),
      )
    ) {
      toast({
        title: "Error",
        description: "A category with this name already exists",
        variant: "destructive",
      });
      return;
    }
    try {
      setCreating(true);
      const createdCategory = await createCategory({ category_name: newCategory.category_name });
      setCategories(
        Array.isArray(categories) ? [...categories, createdCategory] : [createdCategory],
      );
      setNewCategory({ category_name: "" });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditCategory({ category_name: category.category_name });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategory.category_name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }
    if (
      Array.isArray(categories) &&
      categories.some(
        (category) =>
          category.id !== editingCategory.id &&
          category.category_name.toLowerCase() === editCategory.category_name.toLowerCase(),
      )
    ) {
      toast({
        title: "Error",
        description: "A category with this name already exists",
        variant: "destructive",
      });
      return;
    }
    try {
      const updatedCategory = await updateCategory(editingCategory.id, {
        category_name: editCategory.category_name,
      });
      setCategories(
        Array.isArray(categories)
          ? categories.map((category) =>
              category.id === editingCategory.id ? updatedCategory : category,
            )
          : [updatedCategory],
      );
      setEditingCategory(null);
      setEditCategory({ category_name: "" });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }
    try {
      await deleteCategory(id);
      setCategories(
        Array.isArray(categories) ? categories.filter((category) => category.id !== id) : [],
      );
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  return (
    <div style={{ display: "flex", gap: "2rem" }}>
      <AdmissionsSidebar />
      <div className="space-y-6" style={{ flex: 1 }}>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
          <p className="text-gray-600">
            Manage category categories and classifications
          </p>
        </div>

        {/* Add New Category */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Category</CardTitle>
            <CardDescription>Create a new category category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <Input
                  value={newCategory.category_name}
                  onChange={(e) => setNewCategory({ category_name: e.target.value })}
                  placeholder="Enter category name"
                  disabled={creating}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      newCategory.category_name.trim() &&
                      !creating
                    ) {
                      handleAddCategory();
                    }
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddCategory}
                  disabled={creating || !newCategory.category_name.trim()}
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {creating ? "Creating..." : "Add Category"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Existing Categories</CardTitle>
                <CardDescription>
                  Manage current category categories
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCategories}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading categories...</span>
              </div>
            ) : !Array.isArray(categories) || categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No categories found. Create your first category above.
              </div>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    {editingCategory?.id === category.id ? (
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <Input
                            value={editCategory.category_name}
                            onChange={(e) =>
                              setEditCategory({ category_name: e.target.value })
                            }
                            placeholder="Category name"
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                editCategory.category_name.trim()
                              ) {
                                handleUpdateCategory();
                              } else if (e.key === "Escape") {
                                setEditingCategory(null);
                                setEditCategory({ category_name: "" });
                              }
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdateCategory}>
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(null);
                              setEditCategory({ category_name: "" });
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {category.category_name}
                          </h3>
                          <div className="flex gap-2 mt-2">
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                category.status
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {category.status ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {category.created_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              Created:{" "}
                              {new Date(category.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
