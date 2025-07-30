
import { useState } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { OfferTemplateEditor } from "@/components/offer-letters/OfferTemplateEditor";
import { OfferTemplateList } from "@/components/offer-letters/OfferTemplateList";
import { OfferHistoryPanel } from "@/components/offer-letters/OfferHistoryPanel";
import { PlaceholderManagement } from "@/components/offer-letters/PlaceholderManagement";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, History, Settings } from "lucide-react";

const OfferLetters = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      
      <main className="md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Offer Letter Module
          </h1>
          <p className="text-muted-foreground">
            Create, manage, and send personalized admission offer emails with attachments
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Offer History
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            {!editingTemplate && !showNewTemplate ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Email Templates</h2>
                  <Button onClick={() => setShowNewTemplate(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </div>
                <OfferTemplateList 
                  onEditTemplate={setEditingTemplate}
                />
              </div>
            ) : (
              <OfferTemplateEditor
                templateId={editingTemplate}
                isNew={showNewTemplate}
                onClose={() => {
                  setEditingTemplate(null);
                  setShowNewTemplate(false);
                }}
              />
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Offer History</h2>
              <OfferHistoryPanel />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Template Settings</h2>
              <p className="text-muted-foreground mb-6">
                Manage placeholder fields and template configurations
              </p>
              <PlaceholderManagement />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OfferLetters;
