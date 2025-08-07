import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Qualification {
  id: string;
  name: string;
  level: string;
  description: string;
  duration: string;
}

export default function Qualification() {
  const [qualifications, setQualifications] = useState<Qualification[]>([
    { id: "1", name: "High School", level: "Secondary", description: "10th standard completion", duration: "2 years" },
    { id: "2", name: "Higher Secondary", level: "Higher Secondary", description: "12th standard completion", duration: "2 years" },
    { id: "3", name: "Bachelor's Degree", level: "Undergraduate", description: "Bachelor's degree program", duration: "3-4 years" },
    { id: "4", name: "Master's Degree", level: "Postgraduate", description: "Master's degree program", duration: "2 years" },
    { id: "5", name: "PhD", level: "Doctorate", description: "Doctoral program", duration: "3-5 years" },
  ]);
  const [newQualification, setNewQualification] = useState({ name: "", level: "", description: "", duration: "" });

  const handleAddQualification = () => {
    if (newQualification.name.trim()) {
      const qualification: Qualification = {
        id: Date.now().toString(),
        name: newQualification.name,
        level: newQualification.level,
        description: newQualification.description,
        duration: newQualification.duration,
      };
      setQualifications([...qualifications, qualification]);
      setNewQualification({ name: "", level: "", description: "", duration: "" });
    }
  };

  const handleDeleteQualification = (id: string) => {
    setQualifications(qualifications.filter(qualification => qualification.id !== id));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Secondary":
        return "bg-green-100 text-green-800";
      case "Higher Secondary":
        return "bg-blue-100 text-blue-800";
      case "Undergraduate":
        return "bg-purple-100 text-purple-800";
      case "Postgraduate":
        return "bg-orange-100 text-orange-800";
      case "Doctorate":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Qualification Management</h2>
        <p className="text-gray-600">Manage educational qualifications and levels</p>
      </div>

      {/* Add New Qualification */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Qualification</CardTitle>
          <CardDescription>Create a new educational qualification</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Qualification Name</label>
              <Input
                value={newQualification.name}
                onChange={(e) => setNewQualification({ ...newQualification, name: e.target.value })}
                placeholder="Enter qualification name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <Input
                value={newQualification.level}
                onChange={(e) => setNewQualification({ ...newQualification, level: e.target.value })}
                placeholder="Secondary/Higher Secondary/etc"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <Input
                value={newQualification.duration}
                onChange={(e) => setNewQualification({ ...newQualification, duration: e.target.value })}
                placeholder="e.g., 2 years"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <Input
                value={newQualification.description}
                onChange={(e) => setNewQualification({ ...newQualification, description: e.target.value })}
                placeholder="Enter description"
              />
            </div>
          </div>
          <Button onClick={handleAddQualification} className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Add Qualification
          </Button>
        </CardContent>
      </Card>

      {/* Existing Qualifications */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Qualifications</CardTitle>
          <CardDescription>Manage current educational qualifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {qualifications.map((qualification) => (
              <div key={qualification.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">{qualification.name}</h3>
                  <p className="text-sm text-gray-600">{qualification.description}</p>
                  <div className="flex gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs rounded ${getLevelColor(qualification.level)}`}>
                      {qualification.level}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                      {qualification.duration}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteQualification(qualification.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 