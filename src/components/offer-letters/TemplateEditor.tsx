import { useCallback, useEffect, useMemo, useState } from "react";
import { useTemplates } from "@/hooks/useTemplates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Copy,
  Eye,
  ArrowLeft,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RichTextEditor } from "@/components/offer-letters/RichTextEditor";
import { CampusS3LogoSection } from "@/components/offer-letters/CampusS3LogoSection";
import {
  extractPlaceholders,
  // getOfferLetterTemplateImages,
  // type OfferLetterTemplateImage,
  type CampusSummary,
  type TemplateListItem,
} from "@/services/templateService";
import {
  getOfferLetterTemplateImagesNew as getOfferLetterTemplateImages,
  type OfferLetterTemplateImage,
} from "@/utils/api";
import { prepareTemplateHtmlForPdf, rewriteTemplateHtmlImageUrls } from "@/utils/templateImageUrls";

type EditorMode = "existing" | "new";
type FileTypeFilter = "all" | "admission" | "email" | "other";

interface TemplateEditorProps {
  onEditorModeChange?: (isEditing: boolean) => void;
}

const EMPTY_HTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Template</title>
  </head>
  <body>
    
  </body>
</html>`;

const TEMPLATE_NAME_REGEX = /^.+\.(?:html?|htm)$/i;
const PLACEHOLDER_KEY_REGEX = /^[a-zA-Z0-9_]+$/;

export const TemplateEditor = ({ onEditorModeChange }: TemplateEditorProps) => {
  const { toast } = useToast();
  const {
    campusesQuery,
    getTemplatesQuery,
    getTemplateContentQuery,
    createTemplateMutation,
    updateTemplateMutation,
    deleteTemplateMutation,
    createPlaceholderMutation,
    renamePlaceholderMutation,
    deletePlaceholderMutation,
  } = useTemplates();

  const [activeTab, setActiveTab] = useState("campuses");
  const [selectedCampus, setSelectedCampus] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<FileTypeFilter>("all");
  const [hasPlaceholdersOnly, setHasPlaceholdersOnly] = useState(false);
  const [selectedFile, setSelectedFile] = useState("");
  const [mode, setMode] = useState<EditorMode>("existing");
  const [fileNameInput, setFileNameInput] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFileForDelete, setSelectedFileForDelete] = useState<TemplateListItem | null>(null);
  const [newPlaceholderKey, setNewPlaceholderKey] = useState("");
  const [placeholderFrom, setPlaceholderFrom] = useState("");
  const [placeholderTo, setPlaceholderTo] = useState("");
  const [placeholderToRemove, setPlaceholderToRemove] = useState("");
  const [placeholderReplacement, setPlaceholderReplacement] = useState("");
  const [campusImages, setCampusImages] = useState<OfferLetterTemplateImage[]>([]);
  const [campusImagesLoading, setCampusImagesLoading] = useState(false);
  const [campusImagesError, setCampusImagesError] = useState("");

  const templatesQuery = getTemplatesQuery(
    {
      campus: selectedCampus || undefined,
      has_placeholders: hasPlaceholdersOnly ? true : undefined,
      type: fileTypeFilter,
    },
    !!selectedCampus,
  );

  const contentQuery = getTemplateContentQuery(
    selectedCampus,
    selectedFile,
    !!selectedCampus && !!selectedFile && mode === "existing",
  );

  useEffect(() => {
    if (!contentQuery.data || contentQuery.data.file_name !== selectedFile || isDirty) return;

    const loadContent = async () => {
      let content = contentQuery.data.content || "";

      const { html, s3Replaced, absoluteReplaced } = prepareTemplateHtmlForPdf(content, campusImages);
      if (s3Replaced > 0 || absoluteReplaced > 0) {
        content = html;
        setIsDirty(true);
        toast({
          title: "Logo URLs adjusted for PDF",
          description: "Save the template so PDF generation can load the logo.",
        });
      }

      setHtmlContent(content);
      setFileNameInput(contentQuery.data.file_name || selectedFile);
    };

    void loadContent();
  }, [contentQuery.data, isDirty, selectedFile, campusImages, toast, editorKey]);

  useEffect(() => {
    if (!selectedCampus) {
      setSelectedFile("");
      setMode("existing");
      setFileNameInput("");
      setHtmlContent("");
      setActiveTab("campuses");
    }
  }, [selectedCampus]);

  const loadCampusImages = useCallback(async (campusName: string) => {
    if (!campusName) {
      setCampusImages([]);
      setCampusImagesError("");
      return;
    }

    setCampusImagesLoading(true);
    setCampusImagesError("");

    try {
      const images = await getOfferLetterTemplateImages(campusName);
      setCampusImages(images);
    } catch (error) {
      setCampusImages([]);
      setCampusImagesError(error instanceof Error ? error.message : "Unable to load template images");
    } finally {
      setCampusImagesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCampusImages(selectedCampus);
  }, [selectedCampus, loadCampusImages]);

  useEffect(() => {
    onEditorModeChange?.(activeTab === "editor");
  }, [activeTab, onEditorModeChange]);

  const templates = templatesQuery.data || [];
  const currentTemplate = templates.find((template) => template.file_name === selectedFile);
  const currentPlaceholders = useMemo(() => {
    if (contentQuery.data?.placeholders?.length) {
      return contentQuery.data.placeholders;
    }
    return extractPlaceholders(htmlContent);
  }, [contentQuery.data?.placeholders, htmlContent]);

  /** Optional: rewrite img src from /images/... to S3 URLs already uploaded for this campus. */
  const replaceLocalImageUrlsWithS3 = () => {
    const { html, replacedCount } = rewriteTemplateHtmlImageUrls(htmlContent, campusImages);
    if (replacedCount === 0) {
      toast({
        title: "Nothing to replace",
        description: campusImages.length
          ? "No local image paths matched, or HTML already uses S3 URLs."
          : "Upload ng.png first: POST /api/offer-letter-template-images/upload (image_type: logo).",
        variant: "destructive",
      });
      return;
    }
    setHtmlContent(html);
    setIsDirty(true);
    toast({
      title: "HTML updated",
      description: `${replacedCount} img src set to S3 URL(s). Save template to persist.`,
    });
  };

  const insertCampusImage = (image: OfferLetterTemplateImage) => {
    if (!image.s3_url) {
      toast({ title: "Missing image URL", variant: "destructive" });
      return;
    }

    const { html, replacedCount } = rewriteTemplateHtmlImageUrls(htmlContent, [image]);
    if (replacedCount > 0) {
      setHtmlContent(html);
    } else {
      const maxWidth = image.image_type === "logo" ? "240px" : "100%";
      const imageMarkup = `
      <div style="text-align: center; margin: 16px 0; clear: both;">
        <img src="${image.s3_url}"
             alt="${image.image_name || image.image_type}"
             style="max-width: ${maxWidth}; width: 100%; height: auto; display: block; margin: 0 auto;" />
      </div>
    `;
      setHtmlContent((current) => `${current.trimEnd()}\n${imageMarkup.trim()}`);
    }
    setIsDirty(true);
    setActiveTab("editor");
  };

  const copyImageUrl = async (imageUrl: string) => {
    await navigator.clipboard.writeText(imageUrl);
    toast({ title: "Copied", description: "Image URL copied to clipboard" });
  };

  const resetEditor = () => {
    setSelectedFile("");
    setMode("new");
    setFileNameInput("");
    setHtmlContent(EMPTY_HTML);
    setIsDirty(false);
    setEditorKey((k) => k + 1);
    setActiveTab("editor");
  };

  const openFile = (template: TemplateListItem) => {
    setSelectedFile(template.file_name);
    setMode("existing");
    setFileNameInput(template.file_name);
    setHtmlContent("");
    setIsDirty(false);
    setEditorKey((k) => k + 1);
    setActiveTab("editor");
  };

  const selectCampus = (campusName: string) => {
    setSelectedCampus(campusName);
    setSelectedFile("");
    setMode("existing");
    setFileNameInput("");
    setHtmlContent("");
    setIsDirty(false);
  };

  const openCampusTemplates = () => {
    if (!selectedCampus) return;
    setActiveTab("files");
  };

  const saveTemplate = async () => {
    if (!selectedCampus) {
      toast({ title: "Select a campus first", variant: "destructive" });
      return;
    }

    if (!fileNameInput.trim()) {
      toast({ title: "File name is required", variant: "destructive" });
      return;
    }

    if (!TEMPLATE_NAME_REGEX.test(fileNameInput.trim())) {
      toast({
        title: "Invalid file name",
        description: "Only .html or .htm files are allowed",
        variant: "destructive",
      });
      return;
    }

    if (!htmlContent.trim()) {
      toast({ title: "HTML content is required", variant: "destructive" });
      return;
    }

    try {
      let contentToSave = htmlContent;
      const { html: pdfReady, s3Replaced, absoluteReplaced } = prepareTemplateHtmlForPdf(
        htmlContent,
        campusImages,
      );
      if (s3Replaced > 0 || absoluteReplaced > 0) {
        contentToSave = pdfReady;
        setHtmlContent(pdfReady);
      }

      if (mode === "new") {
        await createTemplateMutation.mutateAsync({
          campus_name: selectedCampus,
          file_name: fileNameInput.trim(),
          content: contentToSave,
        });
        setSelectedFile(fileNameInput.trim());
        setMode("existing");
      } else {
        await updateTemplateMutation.mutateAsync({
          campus_name: selectedCampus,
          file_name: selectedFile || fileNameInput.trim(),
          content: contentToSave,
        });
      }

      setIsDirty(false);
      const logoNote =
        s3Replaced + absoluteReplaced > 0
          ? ` Logo URLs updated for PDF (${s3Replaced ? "S3" : ""}${s3Replaced && absoluteReplaced ? ", " : ""}${absoluteReplaced ? "backend" : ""}).`
          : "";
      toast({ title: "Template saved", description: `HTML template updated successfully.${logoNote}` });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error?.message || error?.response?.data?.message || error?.response?.data?.error || "Unable to save template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedCampus || !selectedFileForDelete) return;
    try {
      await deleteTemplateMutation.mutateAsync({ campusName: selectedCampus, fileName: selectedFileForDelete.file_name });
      toast({ title: "Template deleted", description: `${selectedFileForDelete.file_name} was removed` });
      if (selectedFile === selectedFileForDelete.file_name) {
        setSelectedFile("");
        setHtmlContent("");
        setFileNameInput("");
      }
      setDeleteDialogOpen(false);
      setSelectedFileForDelete(null);
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.message || error?.response?.data?.message || error?.response?.data?.error || "Unable to delete template",
        variant: "destructive",
      });
    }
  };

  const handleCopyPlaceholder = async (placeholder: string) => {
    await navigator.clipboard.writeText(`{{${placeholder}}}`);
    toast({ title: "Copied", description: `{{${placeholder}}} copied to clipboard` });
  };

  const handleAddPlaceholder = async () => {
    if (!selectedCampus || !selectedFile) {
      toast({ title: "Open a template first", variant: "destructive" });
      return;
    }

    if (!PLACEHOLDER_KEY_REGEX.test(newPlaceholderKey.trim())) {
      toast({
        title: "Invalid placeholder key",
        description: "Only letters, numbers, and underscores are allowed",
        variant: "destructive",
      });
      return;
    }

    try {
      await createPlaceholderMutation.mutateAsync({
        campusName: selectedCampus,
        payload: { file_name: selectedFile, key: newPlaceholderKey.trim() },
      });
      toast({ title: "Placeholder added", description: `{{${newPlaceholderKey.trim()}}} inserted into the file` });
      setNewPlaceholderKey("");
    } catch (error: any) {
      toast({
        title: "Add placeholder failed",
        description: error?.message || error?.response?.data?.message || error?.response?.data?.error || "Unable to insert placeholder",
        variant: "destructive",
      });
    }
  };

  const handleRenamePlaceholder = async () => {
    if (!selectedCampus || !placeholderFrom.trim() || !placeholderTo.trim()) {
      toast({ title: "Both placeholder names are required", variant: "destructive" });
      return;
    }

    try {
      const result = await renamePlaceholderMutation.mutateAsync({
        campusName: selectedCampus,
        payload: { from: placeholderFrom.trim(), to: placeholderTo.trim() },
      }) as any;

      toast({
        title: "Placeholder renamed",
        description: summarizePlaceholderResult(result),
      });
      setPlaceholderFrom("");
      setPlaceholderTo("");
    } catch (error: any) {
      toast({
        title: "Rename failed",
        description: error?.message || error?.response?.data?.message || error?.response?.data?.error || "Unable to rename placeholder",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlaceholder = async () => {
    if (!selectedCampus || !placeholderToRemove.trim()) {
      toast({ title: "Placeholder name is required", variant: "destructive" });
      return;
    }

    try {
      const result = await deletePlaceholderMutation.mutateAsync({
        campusName: selectedCampus,
        name: placeholderToRemove.trim(),
        replacement: placeholderReplacement.trim() || undefined,
      }) as any;

      toast({
        title: "Placeholder removed",
        description: summarizePlaceholderResult(result),
      });
      setPlaceholderToRemove("");
      setPlaceholderReplacement("");
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error?.message || error?.response?.data?.message || error?.response?.data?.error || "Unable to delete placeholder",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (template: TemplateListItem) => {
    setSelectedFileForDelete(template);
    setDeleteDialogOpen(true);
  };

  const previewHtml = useMemo(
    () => prepareTemplateHtmlForPdf(htmlContent, campusImages).html,
    [htmlContent, campusImages],
  );

  const error = campusesQuery.error || templatesQuery.error || contentQuery.error;
  const isEditorView = activeTab === "editor";

  return (
    <div className="space-y-6">
      {isEditorView ? (
        <Card className="min-h-[calc(100vh-12rem)] flex flex-col overflow-hidden border-border/60 shadow-sm">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                {mode === "new" ? "Create Template" : "Edit Template"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {selectedCampus ? `${selectedCampus}${selectedFile ? ` / ${selectedFile}` : ""}` : "Select a campus to start"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setActiveTab("files")} disabled={!selectedCampus}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Files
              </Button>
              <Button variant="outline" onClick={() => setShowPreview(true)} disabled={!htmlContent.trim()}>
                <Eye className="mr-2 h-4 w-4" /> Preview
              </Button>
              <Button variant="outline" onClick={() => templatesQuery.refetch()} disabled={!selectedCampus}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button onClick={saveTemplate} disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}>
                {createTemplateMutation.isPending || updateTemplateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 flex flex-col bg-muted/10">
            {mode === "new" ? (
              <div className="space-y-2">
                <Label htmlFor="template-file-name">File name</Label>
                <Input
                  id="template-file-name"
                  value={fileNameInput}
                  onChange={(event) => {
                    setFileNameInput(event.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="example.html"
                />
              </div>
            ) : null}

            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between rounded-xl border border-dashed bg-background/80 px-4 py-3">
                <Label htmlFor="html-content">Content</Label>
                <p className="text-xs text-muted-foreground">बस सादा टेक्स्ट लिखें - HTML का चिंता न करें</p>
              </div>
              <div className="rounded-2xl border bg-background flex-1 min-h-[70vh] shadow-sm overflow-hidden">
                <RichTextEditor
                  key={`${selectedFile || "new"}-${editorKey}`}
                  content={htmlContent}
                  onChange={(content) => {
                    setHtmlContent(content);
                    setIsDirty(true);
                  }}
                  campusName={selectedCampus}
                  initialCampusImages={campusImages}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {currentPlaceholders.map((placeholder) => (
                <Badge key={placeholder} variant="secondary" className="cursor-pointer" onClick={() => handleCopyPlaceholder(placeholder)}>
                  <Copy className="mr-1 h-3 w-3" />
                  {placeholder}
                </Badge>
              ))}
            </div>

            {selectedCampus ? (
              <div className="rounded-2xl border bg-background p-4 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">Campus Visual Assets</h3>
                    
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => void loadCampusImages(selectedCampus)} disabled={campusImagesLoading}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                    <Button variant="secondary" size="sm" onClick={replaceLocalImageUrlsWithS3} disabled={!campusImages.length}>
                      Replace local img → Campus Asset
                    </Button>
                  </div>
                </div>

                {campusImagesError ? (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{campusImagesError}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {campusImagesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading images...
                    </div>
                  ) : campusImages.length ? (
                    campusImages.map((image) => (
                      <div key={image.id} className="rounded-xl border bg-muted/20 p-3">
                        <div className="flex items-start gap-3">
                          <img
                            src={image.s3_url}
                            alt={image.image_name || image.image_type}
                            className="h-14 w-14 rounded-md border bg-background object-contain"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{image.image_name || image.image_type}</p>
                            <p className="text-xs text-muted-foreground truncate">{image.image_type}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground break-all">{image.s3_key}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => insertCampusImage(image)}>
                            <Plus className="mr-2 h-4 w-4" /> Use in template
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => void copyImageUrl(image.s3_url)}>
                            <Copy className="mr-2 h-4 w-4" /> Copy URL
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No campus images found yet. Upload ng.png to the offer-letter-template-images API and click refresh.
                    </p>
                  )}
                </div>
              </div>
            ) : null}

            {currentTemplate ? (
              <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                Current file type: <span className="font-medium text-foreground">{currentTemplate.file_type}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="campuses">Campuses</TabsTrigger>
            <TabsTrigger value="files" disabled={!selectedCampus}>Files</TabsTrigger>
            {/* <TabsTrigger value="editor" disabled={!selectedCampus}>Editor</TabsTrigger> */}
          </TabsList>

          <TabsContent value="campuses" className="space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle>Campus &amp; Visual Assets</CardTitle>
                
              </CardHeader>
              <CardContent className="space-y-4">
                <CampusS3LogoSection
                  selectedCampus={selectedCampus}
                  onCampusSelect={selectCampus}
                  onImagesChange={setCampusImages}
                />
                <Button onClick={openCampusTemplates} disabled={!selectedCampus} className="w-full sm:w-auto">
                  <FileText className="mr-2 h-4 w-4" />
                  Open HTML templates
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            <Card className="border-border/60 shadow-sm">
              <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Files for {selectedCampus || "Campus"}</CardTitle>
                  <p className="text-sm text-muted-foreground">Select a file to edit HTML content or manage placeholder inserts.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select value={fileTypeFilter} onValueChange={(value) => setFileTypeFilter(value as FileTypeFilter)}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="admission">Admission</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* <Button variant={hasPlaceholdersOnly ? "default" : "outline"} onClick={() => setHasPlaceholdersOnly((value) => !value)}>
                    {hasPlaceholdersOnly ? "Showing with placeholders" : "Has placeholders"}
                  </Button> */}
                  <Button onClick={resetEditor} disabled={!selectedCampus}>
                    <Plus className="mr-2 h-4 w-4" /> New Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {templatesQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading files...
                  </div>
                ) : templatesQuery.error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{getErrorMessage(templatesQuery.error)}</AlertDescription>
                  </Alert>
                ) : templates.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {templates.map((template) => (
                      <div key={template.file_name} className="rounded-xl border bg-background p-4 shadow-sm transition hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium break-all">{template.file_name}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="secondary">{template.file_type}</Badge>
                              <Badge variant="outline">{template.placeholders.length} placeholders</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => openFile(template)}>
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(template)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">
                          Updated {template.updated_at || "recently"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No files match the current filters.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>Rendered HTML for the current editor content.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-white p-4">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} className="prose max-w-none" />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template?</DialogTitle>
            <DialogDescription>
              This will permanently remove {selectedFileForDelete?.file_name || "the selected file"} from {selectedCampus}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate} disabled={!selectedFileForDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  const responseError = error as { response?: { data?: { message?: string; error?: string } } } | null;
  return responseError?.response?.data?.message || responseError?.response?.data?.error || "Something went wrong";
};

const summarizePlaceholderResult = (result: unknown) => {
  const payload = result as { message?: string; files_updated?: number; replacements_per_file?: Record<string, number> } | null;
  if (!payload) return "Operation completed";
  if (payload.message) return payload.message;

  const filesUpdated = payload.files_updated ?? Object.keys(payload.replacements_per_file || {}).length;
  return filesUpdated ? `${filesUpdated} file(s) updated` : "Operation completed";
};
