import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Religion, createReligion, getAllReligions, updateReligion, deleteReligion } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

export default function Religion() {
  const [religions, setReligions] = useState<Religion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingReligion, setEditingReligion] = useState<Religion | null>(null);
  const [newReligion, setNewReligion] = useState({ religion_name: "" });
  const [editReligion, setEditReligion] = useState({ religion_name: "" });
  const { toast } = useToast();

  // Fetch religions on component mount
  useEffect(() => {
    fetchReligions();
  }, []);

  // Debug: Log religions state changes
  useEffect(() => {
    console.log('Religions state updated:', religions);
    console.log('Religions length:', religions.length);
  }, [religions]);

  const fetchReligions = async () => {
    try {
      setLoading(true);
      const fetchedReligions = await getAllReligions();
      
      console.log('Fetched religions in component:', fetchedReligions);
      console.log('Fetched religions type:', typeof fetchedReligions);
      console.log('Is array?', Array.isArray(fetchedReligions));
      
      // Ensure fetchedReligions is an array
      if (Array.isArray(fetchedReligions)) {
        console.log('Setting religions to array:', fetchedReligions);
        setReligions(fetchedReligions);
      } else if (fetchedReligions && Array.isArray(fetchedReligions.data)) {
        // If API returns { data: [...] }
        console.log('Setting religions to fetchedReligions.data:', fetchedReligions.data);
        setReligions(fetchedReligions.data);
      } else if (fetchedReligions && Array.isArray(fetchedReligions.religions)) {
        // If API returns { religions: [...] }
        console.log('Setting religions to fetchedReligions.religions:', fetchedReligions.religions);
        setReligions(fetchedReligions.religions);
      } else {
        console.error('Unexpected API response format:', fetchedReligions);
        setReligions([]);
        toast({
          title: "Error",
          description: "Invalid data format received from server",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching religions:', error);
      setReligions([]);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch religions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddReligion = async () => {
    if (!newReligion.religion_name.trim()) {
      toast({
        title: "Error",
        description: "Religion name is required",
        variant: "destructive",
      });
      return;
    }

    // Check if religion already exists
    if (Array.isArray(religions) && religions.some(religion => religion.religion_name.toLowerCase() === newReligion.religion_name.toLowerCase())) {
      toast({
        title: "Error",
        description: "A religion with this name already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const createdReligion = await createReligion({ religion_name: newReligion.religion_name });
      setReligions(Array.isArray(religions) ? [...religions, createdReligion] : [createdReligion]);
      setNewReligion({ religion_name: "" });
      toast({
        title: "Success",
        description: "Religion created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create religion",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditReligion = (religion: Religion) => {
    setEditingReligion(religion);
    setEditReligion({ religion_name: religion.religion_name });
  };

  const handleUpdateReligion = async () => {
    if (!editingReligion || !editReligion.religion_name.trim()) {
      toast({
        title: "Error",
        description: "Religion name is required",
        variant: "destructive",
      });
      return;
    }

    // Check if religion name already exists (excluding current religion)
    if (Array.isArray(religions) && religions.some(religion => 
      religion.id !== editingReligion.id && 
      religion.religion_name.toLowerCase() === editReligion.religion_name.toLowerCase()
    )) {
      toast({
        title: "Error",
        description: "A religion with this name already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedReligion = await updateReligion(editingReligion.id.toString(), { religion_name: editReligion.religion_name });
      setReligions(Array.isArray(religions) ? religions.map(religion => religion.id === editingReligion.id ? updatedReligion : religion) : [updatedReligion]);
      setEditingReligion(null);
      setEditReligion({ religion_name: "" });
      toast({
        title: "Success",
        description: "Religion updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update religion",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReligion = async (id: number) => {
    if (!confirm("Are you sure you want to delete this religion?")) {
      return;
    }

    try {
      await deleteReligion(id.toString());
      setReligions(Array.isArray(religions) ? religions.filter(religion => religion.id !== id) : []);
      toast({
        title: "Success",
        description: "Religion deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete religion",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Religion Management</h2>
        <p className="text-gray-600">Manage religious categories and classifications</p>
      </div>

      {/* Add New Religion */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Religion</CardTitle>
          <CardDescription>Create a new religious category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Religion Name</label>
              <Input
                value={newReligion.religion_name}
                onChange={(e) => setNewReligion({ religion_name: e.target.value })}
                placeholder="Enter religion name"
                disabled={creating}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newReligion.religion_name.trim() && !creating) {
                    handleAddReligion();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddReligion} disabled={creating || !newReligion.religion_name.trim()}>
                {creating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {creating ? "Creating..." : "Add Religion"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Religions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Existing Religions</CardTitle>
              <CardDescription>Manage current religious categories</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchReligions}
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
              <span>Loading religions...</span>
            </div>
          ) : (!Array.isArray(religions) || religions.length === 0) ? (
            <div className="text-center py-8 text-gray-500">
              No religions found. Create your first religion above.
            </div>
          ) : (
            <div className="space-y-4">
              {religions.map((religion) => (
                <div key={religion.id} className="flex items-center justify-between p-4 border rounded-lg">
                  {editingReligion?.id === religion.id ? (
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <Input
                          value={editReligion.religion_name}
                          onChange={(e) => setEditReligion({ religion_name: e.target.value })}
                          placeholder="Religion name"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editReligion.religion_name.trim()) {
                              handleUpdateReligion();
                            } else if (e.key === 'Escape') {
                              setEditingReligion(null);
                              setEditReligion({ religion_name: "" });
                            }
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleUpdateReligion}>
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setEditingReligion(null);
                            setEditReligion({ religion_name: "" });
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="font-semibold text-gray-900">{religion.religion_name}</h3>
                        <div className="flex gap-2 mt-2">
                          <span className={`px-2 py-1 text-xs rounded ${
                            religion.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {religion.status ? "Active" : "Inactive"}
                          </span>
                        </div>
                        {religion.created_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Created: {new Date(religion.created_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditReligion(religion)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteReligion(religion.id)}
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
  );
} 