import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Copy, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCampusesApi } from "@/utils/api";
import {
  deleteOfferLetterTemplateImage,
  getOfferLetterTemplateImages,
  uploadOfferLetterTemplateImage,
  type OfferLetterTemplateImage,
} from "@/services/templateService";

interface CampusS3LogoSectionProps {
  selectedCampus: string;
  onCampusSelect: (campusName: string) => void;
  onImagesChange?: (images: OfferLetterTemplateImage[]) => void;
}

export const CampusS3LogoSection = ({
  selectedCampus,
  onCampusSelect,
  onImagesChange,
}: CampusS3LogoSectionProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [campusOptions, setCampusOptions] = useState<{ id: number; campus_name: string }[]>([]);
  const [campusesLoading, setCampusesLoading] = useState(true);
  const [campusesError, setCampusesError] = useState("");
  const [images, setImages] = useState<OfferLetterTemplateImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadCampuses = useCallback(async () => {
    setCampusesLoading(true);
    setCampusesError("");
    try {
      const list = await getCampusesApi();
      setCampusOptions(list.filter((c) => c.campus_name));
    } catch (err) {
      setCampusOptions([]);
      setCampusesError(err instanceof Error ? err.message : "Failed to load campuses");
    } finally {
      setCampusesLoading(false);
    }
  }, []);

  const loadImages = useCallback(async () => {
    if (!selectedCampus) {
      setImages([]);
      onImagesChange?.([]);
      return;
    }

    setImagesLoading(true);
    setImagesError("");
    try {
      const list = await getOfferLetterTemplateImages(selectedCampus);
      setImages(list);
      onImagesChange?.(list);
    } catch (err) {
      setImages([]);
      onImagesChange?.([]);
      setImagesError(err instanceof Error ? err.message : "Failed to load S3 images");
    } finally {
      setImagesLoading(false);
    }
  }, [selectedCampus, onImagesChange]);

  useEffect(() => {
    void loadCampuses();
  }, [loadCampuses]);

  useEffect(() => {
    void loadImages();
  }, [loadImages]);

  const campusLogo = images.find((img) => img.image_type === "logo") ?? images[0];

  const handleUpload = async (file: File) => {
    if (!selectedCampus) return;
    setUploading(true);
    try {
      await uploadOfferLetterTemplateImage(selectedCampus, file, {
        image_name: file.name.replace(/\.[^/.]+$/, ""),
        image_type: "logo",
      });
      await loadImages();
      toast({ title: "Uploaded", description: `${file.name} saved to S3 for ${selectedCampus}` });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not upload",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (image: OfferLetterTemplateImage) => {
    if (!image.id) return;
    try {
      await deleteOfferLetterTemplateImage(image.id);
      await loadImages();
      toast({ title: "Deleted", description: image.image_name || "Image removed" });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Could not delete",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Campus</Label>
        {campusesLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading campuses…
          </div>
        ) : campusesError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{campusesError}</AlertDescription>
          </Alert>
        ) : (
          <Select value={selectedCampus || undefined} onValueChange={onCampusSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select campus (exact name for S3 match)" />
            </SelectTrigger>
            <SelectContent>
              {campusOptions.map((campus) => (
                <SelectItem key={campus.id ?? campus.campus_name} value={campus.campus_name}>
                  {campus.campus_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="text-xs text-muted-foreground">
          GET /api/v1/campuses/getCampuses · Upload/GET S3 use the same <strong>campus_name</strong> (case-sensitive).
        </p>
      </div>

      {selectedCampus ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">S3 logos — {selectedCampus}</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => void loadImages()} disabled={imagesLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${imagesLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Upload logo
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
            }}
          />

          {imagesError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{imagesError}</AlertDescription>
            </Alert>
          ) : null}

          {imagesLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading S3 images…
            </div>
          ) : images.length === 0 ? (
            <Alert>
              <AlertDescription className="text-sm">
                No images for <strong>{selectedCampus}</strong>. Upload ng.png with{" "}
                <code className="text-xs">image_type=logo</code> — campus name must match exactly.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {campusLogo?.s3_url ? (
                <div className="rounded-xl border bg-muted/30 p-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Header preview (logo)</p>
                  <img
                    src={campusLogo.s3_url}
                    alt={campusLogo.image_name || "Campus logo"}
                    className="mx-auto max-h-24 object-contain"
                    crossOrigin="anonymous"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">{campusLogo.image_name}</p>
                  <p className="mt-1 text-[10px] font-mono break-all text-muted-foreground">{campusLogo.s3_url}</p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                {images.map((image) => (
                  <div key={image.id} className="rounded-lg border p-3 flex gap-3">
                    <img
                      src={image.s3_url}
                      alt={image.image_name}
                      className="h-14 w-14 rounded border object-contain bg-background shrink-0"
                      crossOrigin="anonymous"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{image.image_name}</p>
                      <p className="text-xs text-muted-foreground">{image.image_type}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            void navigator.clipboard.writeText(image.s3_url);
                            toast({ title: "Copied S3 URL" });
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          URL
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive"
                          onClick={() => void handleDelete(image)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Select a campus to load S3 logos.</p>
      )}
    </div>
  );
};
