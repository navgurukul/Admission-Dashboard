import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(
    null,
  );
  const { toast } = useToast();

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
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
      title: "Image Selected",
      description: "Use the controls below to adjust the image.",
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
      onChange(editorRef.current.innerHTML);
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
      // console.log("Starting image upload:", file.name || "clipboard-image");

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Show uploading toast
      toast({
        title: "Uploading Image",
        description: "Please wait while your image is being uploaded...",
      });

      const fileExt =
        file.name?.split(".").pop() || file.type.split("/")[1] || "png";
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `template-images/${fileName}`;

      // console.log("Uploading to path:", filePath);

      const { error: uploadError } = await supabase.storage
        .from("offer-pdfs")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Image upload error:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("offer-pdfs")
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        // console.log("Image uploaded successfully:", data.publicUrl);

        // Focus the editor first
        if (editorRef.current) {
          editorRef.current.focus();
        }

        // Create image HTML with proper styling and wrapper
        const imageWrapper = `
          <div style="text-align: center; margin: 15px 0; clear: both;">
            <img src="${data.publicUrl}" 
                 style="max-width: 100%; height: auto; display: block; margin: 0 auto; border: 2px solid transparent; cursor: pointer; transition: all 0.2s ease;" 
                 alt="Uploaded image" />
          </div>
        `;

        // Insert image at cursor position or end of content
        if (document.getSelection()?.rangeCount) {
          const range = document.getSelection()?.getRangeAt(0);
          if (
            range &&
            editorRef.current?.contains(range.commonAncestorContainer)
          ) {
            range.deleteContents();
            const div = document.createElement("div");
            div.innerHTML = imageWrapper;
            range.insertNode(div);
          } else {
            // Fallback to append
            if (editorRef.current) {
              editorRef.current.innerHTML += imageWrapper;
            }
          }
        } else {
          // Append to end if no cursor position
          if (editorRef.current) {
            editorRef.current.innerHTML += imageWrapper;
          }
        }

        // Trigger content update and attach handlers
        handleInput();

        toast({
          title: "Image Uploaded Successfully",
          description:
            "Click on the image to select and modify its alignment or size.",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Error",
        description: "Failed to upload image. Please try again.",
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
    <div className="border rounded-lg overflow-hidden">
      <div className="border-b bg-muted/50 p-2 flex gap-1 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand("bold")}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand("italic")}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand("underline")}
          type="button"
        >
          <Underline className="h-4 w-4" />
        </Button>

        <div className="w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand("justifyLeft")}
          type="button"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand("justifyCenter")}
          type="button"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand("justifyRight")}
          type="button"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <div className="w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand("insertUnorderedList")}
          type="button"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand("insertOrderedList")}
          type="button"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px bg-border mx-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          <Upload className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const url = prompt("Enter link URL:");
            if (url) execCommand("createLink", url);
          }}
          type="button"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      {selectedImage && (
        <div className="border-b bg-blue-50 p-3">
          <div className="text-sm font-medium text-blue-900 mb-3">
            Image Controls - Click to Apply
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => alignImage("left")}
                type="button"
                className="text-xs px-3 bg-white hover:bg-blue-100"
              >
                ← Left
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => alignImage("center")}
                type="button"
                className="text-xs px-3 bg-white hover:bg-blue-100"
              >
                ⬄ Center
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => alignImage("right")}
                type="button"
                className="text-xs px-3 bg-white hover:bg-blue-100"
              >
                Right →
              </Button>
            </div>
            <div className="w-px bg-border mx-1" />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => resizeImage("small")}
                type="button"
                className="text-xs px-3 bg-white hover:bg-blue-100"
              >
                Small
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => resizeImage("medium")}
                type="button"
                className="text-xs px-3 bg-white hover:bg-blue-100"
              >
                Medium
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => resizeImage("large")}
                type="button"
                className="text-xs px-3 bg-white hover:bg-blue-100"
              >
                Large
              </Button>
            </div>
          </div>
          <div className="text-xs text-blue-600 mt-2">
            Selected image: {selectedImage.alt || "Unnamed image"}
          </div>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-4 focus:outline-none prose max-w-none"
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
    </div>
  );
};
