import React, { useEffect, useState } from "react";
import {AdmissionsSidebar} from "@/components/AdmissionsSidebar"; 
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getAllCasts, createCast, updateCast, deleteCast } from "@/utils/api"; 

type Cast = {
  id: string;
  cast_name: string;
  status?: boolean;
  created_at?: string;
};

export default function Caste() {
  const [castes, setCastes] = useState<Cast[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingCaste, setEditingCaste] = useState<Cast | null>(null);
  const [newCaste, setNewCaste] = useState({ cast_name: "" });
  const [editCaste, setEditCaste] = useState({ cast_name: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchCastes();
  }, []);

  useEffect(() => {
    console.log('Castes state updated:', castes);
    console.log('Castes length:', castes.length);
  }, [castes]);

  const fetchCastes = async () => {
    try {
      setLoading(true);
      const fetchedCastes = await getAllCasts();
      if (Array.isArray(fetchedCastes)) {
        setCastes(fetchedCastes);
      } else if (fetchedCastes && Array.isArray(fetchedCastes.data)) {
        setCastes(fetchedCastes.data);
      } else if (fetchedCastes && Array.isArray(fetchedCastes.castes)) {
        setCastes(fetchedCastes.castes);
      } else {
        setCastes([]);
        toast({
          title: "Error",
          description: "Invalid data format received from server",
          variant: "destructive",
        });
      }
    } catch (error) {
      setCastes([]);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch castes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCaste = async () => {
    if (!newCaste.cast_name.trim()) {
      toast({
        title: "Error",
        description: "Cast name is required",
        variant: "destructive",
      });
      return;
    }
    if (Array.isArray(castes) && castes.some(cast => cast.cast_name.toLowerCase() === newCaste.cast_name.toLowerCase())) {
      toast({
        title: "Error",
        description: "A cast with this name already exists",
        variant: "destructive",
      });
      return;
    }
    try {
      setCreating(true);
      const createdCast = await createCast({ cast_name: newCaste.cast_name });
      setCastes(Array.isArray(castes) ? [...castes, createdCast] : [createdCast]);
      setNewCaste({ cast_name: "" });
      toast({
        title: "Success",
        description: "Cast created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create cast",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditCaste = (caste: Cast) => {
    setEditingCaste(caste);
    setEditCaste({ cast_name: caste.cast_name });
  };

  const handleUpdateCaste = async () => {
    if (!editingCaste || !editCaste.cast_name.trim()) {
      toast({
        title: "Error",
        description: "Cast name is required",
        variant: "destructive",
      });
      return;
    }
    if (Array.isArray(castes) && castes.some(cast =>
      cast.id !== editingCaste.id &&
      cast.cast_name.toLowerCase() === editCaste.cast_name.toLowerCase()
    )) {
      toast({
        title: "Error",
        description: "A cast with this name already exists",
        variant: "destructive",
      });
      return;
    }
    try {
      const updatedCast = await updateCast(editingCaste.id, { cast_name: editCaste.cast_name });
      setCastes(Array.isArray(castes) ? castes.map(cast => cast.id === editingCaste.id ? updatedCast : cast) : [updatedCast]);
      setEditingCaste(null);
      setEditCaste({ cast_name: "" });
      toast({
        title: "Success",
        description: "Cast updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update cast",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCaste = async (id: string) => {
    if (!confirm("Are you sure you want to delete this cast?")) {
      return;
    }
    try {
      await deleteCast(id);
      setCastes(Array.isArray(castes) ? castes.filter(cast => cast.id !== id) : []);
      toast({
        title: "Success",
        description: "Cast deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete cast",
        variant: "destructive",
      });
    }
  };

  return (
    <div style={{ display: "flex", gap: "2rem" }}>
      <AdmissionsSidebar />
      <div className="space-y-6" style={{ flex: 1 }}>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Caste Management</h2>
          <p className="text-gray-600">Manage caste categories and classifications</p>
        </div>

        {/* Add New Caste */}
        <Card>
          <CardHeader>
            <CardTitle>Add New Caste</CardTitle>
            <CardDescription>Create a new caste category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Caste Name</label>
                <Input
                  value={newCaste.cast_name}
                  onChange={(e) => setNewCaste({ cast_name: e.target.value })}
                  placeholder="Enter caste name"
                  disabled={creating}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCaste.cast_name.trim() && !creating) {
                      handleAddCaste();
                    }
                  }}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddCaste} disabled={creating || !newCaste.cast_name.trim()}>
                  {creating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {creating ? "Creating..." : "Add Caste"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Castes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Existing Castes</CardTitle>
                <CardDescription>Manage current caste categories</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCastes}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading castes...</span>
              </div>
            ) : (!Array.isArray(castes) || castes.length === 0) ? (
              <div className="text-center py-8 text-gray-500">
                No castes found. Create your first caste above.
              </div>
            ) : (
              <div className="space-y-4">
                {castes.map((caste) => (
                  <div key={caste.id} className="flex items-center justify-between p-4 border rounded-lg">
                    {editingCaste?.id === caste.id ? (
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <Input
                            value={editCaste.cast_name}
                            onChange={(e) => setEditCaste({ cast_name: e.target.value })}
                            placeholder="Cast name"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editCaste.cast_name.trim()) {
                                handleUpdateCaste();
                              } else if (e.key === 'Escape') {
                                setEditingCaste(null);
                                setEditCaste({ cast_name: "" });
                              }
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleUpdateCaste}>
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCaste(null);
                              setEditCaste({ cast_name: "" });
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="font-semibold text-gray-900">{caste.cast_name}</h3>
                          <div className="flex gap-2 mt-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              caste.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {caste.status ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {caste.created_at && (
                            <p className="text-xs text-gray-500 mt-1">
                              Created: {new Date(caste.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCaste(caste)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCaste(caste.id)}
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