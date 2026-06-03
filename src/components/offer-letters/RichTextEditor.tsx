import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Upload,
  Link,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
// import {
//   getOfferLetterTemplateImages,
//   uploadOfferLetterTemplateImage,
//   type OfferLetterTemplateImage,
// } from "@/services/templateService";
import {
  getOfferLetterTemplateImagesNew as getOfferLetterTemplateImages,
  uploadOfferLetterTemplateImageNew as uploadOfferLetterTemplateImage,
  type OfferLetterTemplateImage,
} from "@/utils/api";
import { EditorImageToolbar } from "@/components/offer-letters/EditorImageToolbar";
import { findS3ImageForLegacyUrl } from "@/utils/templateImageUrls";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  campusName?: string;
  initialCampusImages?: OfferLetterTemplateImage[];
}


const extractBodyContent = (html: string): { bodyContent: string; headContent: string; hasFullDocument: boolean } => {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) {
    // Not a full HTML document, return as-is but strip any stray <style> tags
    const stripped = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    return { bodyContent: stripped, headContent: '', hasFullDocument: false };
  }

  // Extract head content (including <style> tags)
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headContent = headMatch ? headMatch[0] : '';
  return { bodyContent: bodyMatch[1], headContent, hasFullDocument: true };
};

/**
 * Reconstruct a full HTML document from body content + stored head.
 */
const reconstructFullHtml = (bodyContent: string, headContent: string, wasFullDocument: boolean): string => {
  if (!wasFullDocument) return bodyContent;
  return `<!DOCTYPE html>\n<html lang="en">\n  ${headContent}\n  <body>\n    ${bodyContent}\n  </body>\n</html>`;
};

export const RichTextEditor = ({ content, onChange, campusName, initialCampusImages }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headContentRef = useRef<string>('');
  const wasFullDocumentRef = useRef<boolean>(false);
  const lastSetContentRef = useRef<string>('');
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(
    null,
  );
  const [campusImages, setCampusImages] = useState<OfferLetterTemplateImage[]>(initialCampusImages ?? []);
  const [campusImagesLoading, setCampusImagesLoading] = useState(false);
  const [campusImagesError, setCampusImagesError] = useState("");
  const [showCampusImageBrowser, setShowCampusImageBrowser] = useState(false);
  const { toast } = useToast();

  const loadCampusImages = useCallback(async () => {
    if (!campusName) return;

    setCampusImagesLoading(true);
    setCampusImagesError("");

    try {
      const images = await getOfferLetterTemplateImages(campusName);
      setCampusImages(images);
      return images;
    } catch (error) {
      setCampusImagesError(error instanceof Error ? error.message : "Failed to load images");
      return [];
    } finally {
      setCampusImagesLoading(false);
    }
  }, [campusName]);

  useEffect(() => {
    // Only fetch campus images if parent hasn't already provided them
    if (campusName && !initialCampusImages?.length) void loadCampusImages();
  }, [campusName, loadCampusImages, initialCampusImages]);

  const applySrcToSelectedImage = (s3Url: string, alt?: string) => {
    if (!selectedImage || !s3Url) return;
    selectedImage.src = s3Url;
    if (alt) selectedImage.alt = alt;
    handleInput();
  };

  const replaceSelectedImageWithS3 = async () => {
    const images = campusImages.length ? campusImages : await loadCampusImages();
    if (!selectedImage || !images?.length) {
      toast({
        title: "No S3 images",
        description: "Upload ng.png logo for this campus first.",
        variant: "destructive",
      });
      return;
    }

    const match = findS3ImageForLegacyUrl(selectedImage.src, images);
    if (!match?.s3_url) {
      toast({
        title: "No matching S3 file",
        description: "Upload a logo (e.g. ng.png) for this campus, then try again.",
        variant: "destructive",
      });
      return;
    }

    applySrcToSelectedImage(match.s3_url, match.image_name || match.image_type);
    toast({
      title: "Logo updated",
      description: "Image now uses S3. Save the template to persist.",
    });
  };

  const removeSelectedImage = () => {
    if (!selectedImage) return;
    const target = selectedImage.parentElement?.tagName === "DIV" ? selectedImage.parentElement : selectedImage;
    target?.remove();
    setSelectedImage(null);
    handleInput();
    toast({ title: "Image removed" });
  };

  const insertS3Image = (image: OfferLetterTemplateImage) => {
    if (!image.s3_url) {
      toast({ title: "Missing image URL", variant: "destructive" });
      return;
    }

    if (selectedImage) {
      applySrcToSelectedImage(image.s3_url, image.image_name || image.image_type);
      setShowCampusImageBrowser(false);
      toast({
        title: "Image replaced",
        description: `${image.image_name || image.image_type} now uses S3 URL`,
      });
      return;
    }

    const maxWidth = image.image_type === "logo" ? "240px" : "100%";
    const imageWrapper = `
      <div style="text-align: center; margin: 15px 0; clear: both;">
        <img src="${image.s3_url}"
             alt="${image.image_name || image.image_type}"
             style="max-width: ${maxWidth}; width: 100%; height: auto; display: block; margin: 0 auto; border: 2px solid transparent; cursor: pointer; transition: all 0.2s ease;" />
      </div>
    `;

    if (editorRef.current) {
      editorRef.current.focus();
      if (document.getSelection()?.rangeCount) {
        const range = document.getSelection()?.getRangeAt(0);
        if (range && editorRef.current?.contains(range.commonAncestorContainer)) {
          range.deleteContents();
          const div = document.createElement("div");
          div.innerHTML = imageWrapper;
          range.insertNode(div);
        } else {
          editorRef.current.innerHTML += imageWrapper;
        }
      } else {
        editorRef.current.innerHTML += imageWrapper;
      }
    }

    handleInput();
    setShowCampusImageBrowser(false);
    toast({
      title: "Image inserted",
      description: `${image.image_name || image.image_type} added to template`,
    });
  };

  useEffect(() => {
    if (!editorRef.current) return;
    // Extract body-only content to prevent template CSS from leaking into editor
    const { bodyContent, headContent, hasFullDocument } = extractBodyContent(content);
    headContentRef.current = headContent;
    wasFullDocumentRef.current = hasFullDocument;

    // Only update DOM if the body content actually changed (prevents blinking)
    if (lastSetContentRef.current !== bodyContent) {
      lastSetContentRef.current = bodyContent;
      editorRef.current.innerHTML = bodyContent;
      setTimeout(() => {
        attachImageHandlers();
      }, 100);
    }
  }, [content]);

  const attachImageHandlers = () => {
    if (!editorRef.current) return;

    const images = editorRef.current.querySelectorAll("img");
    images.forEach((img) => {
      // Remove existing event listeners first
      const newImg = img.cloneNode(true) as HTMLImageElement;
      img.parentNode?.replaceChild(newImg, img);

      // Style the image
      newImg.style.cursor = "pointer";
      newImg.style.maxWidth = "100%";
      newImg.style.height = "auto";
      newImg.style.display = "block";
      newImg.style.border = "2px solid transparent";
      newImg.style.transition = "all 0.2s ease";
      newImg.style.userSelect = "none";

      // Add click handler
      newImg.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectImage(newImg);
      });

      // Add hover effects
      newImg.addEventListener("mouseenter", () => {
        if (selectedImage !== newImg) {
          newImg.style.border = "2px solid #3b82f6";
          newImg.style.transform = "scale(1.02)";
        }
      });

      newImg.addEventListener("mouseleave", () => {
        if (selectedImage !== newImg) {
          newImg.style.border = "2px solid transparent";
          newImg.style.transform = "scale(1)";
        }
      });
    });
  };

  const selectImage = (img: HTMLImageElement) => {
    // Clear previous selection
    if (selectedImage && selectedImage !== img) {
      selectedImage.style.border = "2px solid transparent";
      selectedImage.style.boxShadow = "none";
      selectedImage.style.transform = "scale(1)";
    }

    // Select new image
    setSelectedImage(img);
    img.style.border = "2px solid #3b82f6";
    img.style.boxShadow = "0 0 10px rgba(59, 130, 246, 0.4)";
    img.style.transform = "scale(1.05)";

    // console.log("Image selected:", img.src);

    toast({
      title: "Image selected",
      description: "Use the toolbar below to replace with S3 or remove.",
    });
  };

  const alignImage = (alignment: "left" | "center" | "right") => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please click on an image first to align it.",
        variant: "destructive",
      });
      return;
    }

    // console.log("Aligning image to:", alignment);

    // Create a wrapper div for better control
    const wrapper = document.createElement("div");
    wrapper.style.width = "100%";
    wrapper.style.margin = "10px 0";
    wrapper.style.clear = "both";

    // Clone the image
    const clonedImg = selectedImage.cloneNode(true) as HTMLImageElement;

    // Apply alignment styles
    switch (alignment) {
      case "left":
        wrapper.style.textAlign = "left";
        clonedImg.style.float = "left";
        clonedImg.style.marginRight = "15px";
        clonedImg.style.marginBottom = "10px";
        break;
      case "center":
        wrapper.style.textAlign = "center";
        clonedImg.style.float = "none";
        clonedImg.style.margin = "0 auto 10px auto";
        clonedImg.style.display = "block";
        break;
      case "right":
        wrapper.style.textAlign = "right";
        clonedImg.style.float = "right";
        clonedImg.style.marginLeft = "15px";
        clonedImg.style.marginBottom = "10px";
        break;
    }

    // Replace the original image with the wrapped version
    wrapper.appendChild(clonedImg);
    selectedImage.parentNode?.replaceChild(wrapper, selectedImage);

    // Update selection
    setSelectedImage(clonedImg);

    // Trigger content update and reattach handlers
    handleInput();

    toast({
      title: "Image Aligned",
      description: `Image aligned to ${alignment}`,
    });
  };

  const resizeImage = (size: "small" | "medium" | "large") => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please click on an image first to resize it.",
        variant: "destructive",
      });
      return;
    }

    // console.log("Resizing image to:", size);

    let width = "";
    let maxWidth = "";

    switch (size) {
      case "small":
        width = "200px";
        maxWidth = "200px";
        break;
      case "medium":
        width = "400px";
        maxWidth = "400px";
        break;
      case "large":
        width = "600px";
        maxWidth = "600px";
        break;
    }

    selectedImage.style.width = width;
    selectedImage.style.maxWidth = maxWidth;
    selectedImage.style.height = "auto";

    // Trigger content update
    handleInput();

    toast({
      title: "Image Resized",
      description: `Image resized to ${size}`,
    });
  };

  const execCommand = (command: string, value?: string) => {
    try {
      document.execCommand(command, false, value);
      handleInput();
    } catch (error) {
      console.error("Error executing command:", command, error);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      // Reconstruct full HTML (with head/style) before calling onChange
      const fullHtml = reconstructFullHtml(
        editorRef.current.innerHTML,
        headContentRef.current,
        wasFullDocumentRef.current,
      );
      // Update last known body so useEffect doesn't re-set innerHTML on next render
      lastSetContentRef.current = editorRef.current.innerHTML;
      onChange(fullHtml);
      // Re-attach handlers after content change
      setTimeout(() => {
        attachImageHandlers();
      }, 100);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Check for images in clipboard
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          // console.log("Pasting image from clipboard");
          await handleImageUpload(file);
          return;
        }
      }
    }

    // Allow default paste for text
    setTimeout(() => {
      handleInput();
    }, 0);
  };

  const handleImageUpload = async (file: File) => {
    try {
      if (!campusName) {
        toast({
          title: "Campus not selected",
          description: "Please select a campus to upload images",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Uploading",
        description: "Uploading to S3...",
      });

      const uploaded = await uploadOfferLetterTemplateImage(campusName, file, {
        image_type: selectedImage ? "logo" : "template",
      });
      const s3Url = uploaded.s3_url;
      if (!s3Url) throw new Error("No S3 URL in response");

      await loadCampusImages();

      if (selectedImage) {
        applySrcToSelectedImage(s3Url, uploaded.image_name || file.name);
        toast({
          title: "Logo replaced",
          description: "Selected image now uses S3. Save the template.",
        });
        return;
      }

      if (editorRef.current) editorRef.current.focus();

      const imageWrapper = `
        <div style="text-align: center; margin: 15px 0; clear: both;">
          <img src="${s3Url}"
               style="max-width: 100%; height: auto; display: block; margin: 0 auto; border: 2px solid transparent; cursor: pointer; transition: all 0.2s ease;"
               crossorigin="anonymous"
               alt="${uploaded.image_name || "Uploaded image"}" />
        </div>
      `;

      if (editorRef.current) {
        editorRef.current.innerHTML += imageWrapper;
      }

      handleInput();

      toast({
        title: "Uploaded to S3",
        description: "Image added to template.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // console.log("File selected via input:", file.name);
      handleImageUpload(file);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "IMG" && selectedImage) {
      // Clicked outside of image, deselect
      selectedImage.style.border = "2px solid transparent";
      selectedImage.style.boxShadow = "none";
      selectedImage.style.transform = "scale(1)";
      setSelectedImage(null);
    }
  };

  return (
    <div className="border rounded-2xl overflow-hidden bg-background shadow-sm">
      <div className="hidden sticky top-0 z-10 border-b bg-background/95 p-3 gap-1 flex-wrap backdrop-blur md:flex">
        <Button
          variant="outline"
          size="sm"
          onClick={() => execCommand("bold")}
          type="button"
          className="rounded-full"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => execCommand("italic")}
          type="button"
          className="rounded-full"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => execCommand("underline")}
          type="button"
          className="rounded-full"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px bg-border mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => execCommand("justifyLeft")}
          type="button"
          className="rounded-full"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => execCommand("justifyCenter")}
          type="button"
          className="rounded-full"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => execCommand("justifyRight")}
          type="button"
          className="rounded-full"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px bg-border mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => execCommand("insertUnorderedList")}
          type="button"
          className="rounded-full"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => execCommand("insertOrderedList")}
          type="button"
          className="rounded-full"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px bg-border mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (campusName) {
              void loadCampusImages();
              setShowCampusImageBrowser(true);
            } else {
              toast({
                title: "Campus not selected",
                description: "Please select a campus to browse campus images",
                variant: "destructive",
              });
            }
          }}
          type="button"
          className="rounded-full"
          title="Browse campus S3 images"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          type="button"
          className="rounded-full"
          disabled={!campusName}
          title={campusName ? "Upload image to S3" : "Select a campus first"}
        >
          <Upload className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const url = prompt("Enter link URL:");
            if (url) execCommand("createLink", url);
          }}
          type="button"
          className="rounded-full"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      {selectedImage ? (
        <>
          <EditorImageToolbar
            imageSrc={selectedImage.src}
            imageAlt={selectedImage.alt}
            onReplaceWithS3={() => void replaceSelectedImageWithS3()}
            onBrowseS3={() => {
              void loadCampusImages();
              setShowCampusImageBrowser(true);
            }}
            onUpload={() => fileInputRef.current?.click()}
            onRemove={removeSelectedImage}
            onCopyUrl={() => {
              void navigator.clipboard.writeText(selectedImage.src);
              toast({ title: "Copied", description: "Image URL copied" });
            }}
          />
          <div className="border-b bg-blue-50/50 p-2 md:p-3">
            <p className="text-xs font-medium text-blue-900 mb-2">Layout</p>
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant="outline" type="button" className="text-xs h-7" onClick={() => alignImage("left")}>
                ← Left
              </Button>
              <Button size="sm" variant="outline" type="button" className="text-xs h-7" onClick={() => alignImage("center")}>
                Center
              </Button>
              <Button size="sm" variant="outline" type="button" className="text-xs h-7" onClick={() => alignImage("right")}>
                Right →
              </Button>
              <Button size="sm" variant="outline" type="button" className="text-xs h-7" onClick={() => resizeImage("small")}>
                Small
              </Button>
              <Button size="sm" variant="outline" type="button" className="text-xs h-7" onClick={() => resizeImage("medium")}>
                Medium
              </Button>
              <Button size="sm" variant="outline" type="button" className="text-xs h-7" onClick={() => resizeImage("large")}>
                Large
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <div
        ref={editorRef}
        contentEditable
        className="w-full min-h-[400px] p-4 focus:outline-none prose max-w-none overflow-auto"
        onInput={handleInput}
        onPaste={handlePaste}
        onClick={handleClick}
        suppressContentEditableWarning={true}
        style={{
          lineHeight: "1.6",
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {showCampusImageBrowser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-4 flex items-center justify-between">
              <h3 className="font-semibold">Campus S3 Images</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCampusImageBrowser(false)}
              >
                ✕
              </Button>
            </div>

            <div className="p-4 space-y-3">
              {campusImagesError && (
                <Alert variant="destructive">
                  <AlertDescription>{campusImagesError}</AlertDescription>
                </Alert>
              )}

              {campusImagesLoading ? (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Loading images...
                </div>
              ) : campusImages.length ? (
                <div className="grid gap-3">
                  {campusImages.map((image) => (
                    <div key={image.id} className="border rounded-lg p-3 hover:bg-muted/50 transition">
                      <div className="flex gap-3 items-start">
                        <img
                          src={image.s3_url}
                          alt={image.image_name || image.image_type}
                          className="h-12 w-12 rounded border bg-muted object-contain"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {image.image_name || image.image_type}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {image.image_type}
                          </p>
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => insertS3Image(image)}
                          >
                            {selectedImage ? "Replace selected" : "Insert"}
                          </Button>
                          <p className="mt-1 text-[10px] text-muted-foreground break-all font-mono line-clamp-2">
                            {image.s3_url}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No images found for this campus. Upload images using the API first.
                </div>
              )}

              <div className="border-t pt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => void loadCampusImages()}
                  disabled={campusImagesLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowCampusImageBrowser(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
