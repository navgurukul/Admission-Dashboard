import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Database, Trash2, Download, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getApplicants,
  clearAllData,
  saveApplicants,
} from "@/utils/localStorage";

interface LocalStorageViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocalStorageViewer({
  isOpen,
  onClose,
}: LocalStorageViewerProps) {
  const [localData, setLocalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadLocalData();
    }
  }, [isOpen]);

  const loadLocalData = () => {
    const data = getApplicants();
    setLocalData(data);
  };

  const handleClearAll = () => {
    if (
      confirm(
        "Are you sure you want to clear all localStorage data? This action cannot be undone.",
      )
    ) {
      clearAllData();
      setLocalData([]);
      toast({
        title: "Data Cleared",
        description: "All localStorage data has been cleared",
      });
    }
  };

  const handleExportData = () => {
    if (localData.length === 0) {
      toast({
        title: "No Data",
        description: "No data to export",
        variant: "destructive",
      });
      return;
    }

    const dataStr = JSON.stringify(localData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `localStorage_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: `Exported ${localData.length} records to JSON file`,
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedData)) {
          saveApplicants(importedData);
          setLocalData(importedData);
          toast({
            title: "Data Imported",
            description: `Successfully imported ${importedData.length} records`,
          });
        } else {
          throw new Error("Invalid data format");
        }
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            LocalStorage Data Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {localData.length} records in localStorage
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                disabled={localData.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearAll}
                disabled={localData.length === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>

          <Separator />

          {/* Data Display */}
          {localData.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No data found in localStorage. Add some applicants to see them
                  here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {localData.slice(0, 10).map((applicant, index) => (
                <Card key={applicant.id || index}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {applicant.name || "No Name"} ({applicant.mobile_no})
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {applicant.stage || "No Stage"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {applicant.status || "No Status"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>City: {applicant.city || "N/A"}</div>
                      <div>Campus: {applicant.campus || "N/A"}</div>
                      <div>
                        Created:{" "}
                        {new Date(applicant.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        Updated:{" "}
                        {new Date(applicant.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {localData.length > 10 && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                      Showing first 10 records. Total: {localData.length}{" "}
                      records
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
