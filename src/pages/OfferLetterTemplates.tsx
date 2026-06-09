import { useState } from "react";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { TemplateEditor } from "@/components/offer-letters/TemplateEditor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Palette, Sparkles } from "lucide-react";

const OfferLetterTemplates = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/40 flex">
      <AdmissionsSidebar />

      <main className="md:ml-64 flex-1 p-3 sm:p-6 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 mt-12 md:mt-0">
          {!isEditorOpen ? (
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-5 text-white">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                      <Sparkles className="h-3.5 w-3.5" />
                      Offer Letter Studio
                    </div>
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                        Offer Letter Templates
                      </h1>
                      <p className="mt-2 max-w-2xl text-sm md:text-base text-white/80">
                        Create polished campus-wise HTML templates and placeholders with a cleaner, faster editor.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-white/15 text-white hover:bg-white/20 border-0 px-3 py-1.5">
                      <FileText className="mr-1 h-3.5 w-3.5" />
                      HTML Templates
                    </Badge>
                    <Badge className="bg-white/15 text-white hover:bg-white/20 border-0 px-3 py-1.5">
                      <Palette className="mr-1 h-3.5 w-3.5" />
                      Responsive Editor
                    </Badge>
                  </div>
                </div>
              </div>
              <CardContent className="grid gap-4 p-6 md:grid-cols-3">
                {[
                  { title: "Pick a campus", desc: "Choose the campus before editing templates." },
                  { title: "Edit content", desc: "Work directly on the rendered template content." },
                  { title: "Save safely", desc: "Changes are saved back to the backend HTML." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <p className="font-semibold text-foreground">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <TemplateEditor onEditorModeChange={setIsEditorOpen} />
        </div>
      </main>
    </div>
  );
};

export default OfferLetterTemplates;
