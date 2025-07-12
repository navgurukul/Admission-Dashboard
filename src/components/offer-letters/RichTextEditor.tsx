
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
  Link
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
      attachImageHandlers();
    }
  }, [content]);

  const attachImageHandlers = () => {
    if (!editorRef.current) return;
    
    const images = editorRef.current.querySelectorAll('img');
    images.forEach(img => {
      // Make images resizable and draggable
      img.style.cursor = 'pointer';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.resize = 'both';
      img.style.overflow = 'auto';
      img.style.display = 'block';
      img.style.border = '2px solid transparent';
      
      // Add click handler for selection
      img.onclick = (e) => {
        e.preventDefault();
        selectImage(img);
      };
      
      // Add hover effects
      img.onmouseenter = () => {
        img.style.border = '2px solid #3b82f6';
      };
      
      img.onmouseleave = () => {
        if (selectedImage !== img) {
          img.style.border = '2px solid transparent';
        }
      };
    });
  };

  const selectImage = (img: HTMLImageElement) => {
    // Remove selection from previous image
    if (selectedImage) {
      selectedImage.style.border = '2px solid transparent';
    }
    
    // Select new image
    setSelectedImage(img);
    img.style.border = '2px solid #3b82f6';
    img.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.3)';
  };

  const alignImage = (alignment: 'left' | 'center' | 'right') => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please click on an image first to align it.",
        variant: "destructive"
      });
      return;
    }

    const wrapper = selectedImage.parentElement;
    if (wrapper && wrapper.style.position === 'relative') {
      // Update wrapper alignment
      switch (alignment) {
        case 'left':
          wrapper.style.textAlign = 'left';
          wrapper.style.marginLeft = '0';
          wrapper.style.marginRight = 'auto';
          break;
        case 'center':
          wrapper.style.textAlign = 'center';
          wrapper.style.marginLeft = 'auto';
          wrapper.style.marginRight = 'auto';
          break;
        case 'right':
          wrapper.style.textAlign = 'right';
          wrapper.style.marginLeft = 'auto';
          wrapper.style.marginRight = '0';
          break;
      }
    } else {
      // Apply alignment directly to image
      switch (alignment) {
        case 'left':
          selectedImage.style.float = 'left';
          selectedImage.style.marginRight = '10px';
          selectedImage.style.marginLeft = '0';
          break;
        case 'center':
          selectedImage.style.float = 'none';
          selectedImage.style.display = 'block';
          selectedImage.style.marginLeft = 'auto';
          selectedImage.style.marginRight = 'auto';
          break;
        case 'right':
          selectedImage.style.float = 'right';
          selectedImage.style.marginLeft = '10px';
          selectedImage.style.marginRight = '0';
          break;
      }
    }
    
    handleInput();
    toast({
      title: "Image Aligned",
      description: `Image aligned to ${alignment}`
    });
  };

  const resizeImage = (size: 'small' | 'medium' | 'large') => {
    if (!selectedImage) {
      toast({
        title: "No Image Selected",
        description: "Please click on an image first to resize it.",
        variant: "destructive"
      });
      return;
    }

    switch (size) {
      case 'small':
        selectedImage.style.width = '200px';
        break;
      case 'medium':
        selectedImage.style.width = '400px';
        break;
      case 'large':
        selectedImage.style.width = '600px';
        break;
    }
    
    selectedImage.style.height = 'auto';
    handleInput();
    
    toast({
      title: "Image Resized",
      description: `Image resized to ${size}`
    });
  };

  const execCommand = (command: string, value?: string) => {
    try {
      document.execCommand(command, false, value);
      handleInput();
    } catch (error) {
      console.error('Error executing command:', command, error);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      attachImageHandlers();
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Check for images in clipboard
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
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
      console.log('Starting image upload:', file.name);
      
      const fileExt = file.name?.split('.').pop() || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `template-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('offer-pdfs')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Image upload error:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('offer-pdfs')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        // Create image with resizable wrapper
        const imageHtml = `
          <div style="position: relative; display: inline-block; margin: 10px; max-width: 100%; text-align: center;">
            <img src="${data.publicUrl}" 
                 style="max-width: 100%; height: auto; cursor: pointer; border: 2px solid transparent; display: block;" 
                 alt="Uploaded image" />
          </div>
        `;
        
        execCommand('insertHTML', imageHtml);
        
        // Attach handlers to the new image
        setTimeout(() => {
          attachImageHandlers();
        }, 100);
        
        toast({
          title: "Image Uploaded",
          description: "Image has been successfully uploaded and inserted. Click on it to select and modify alignment/size."
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        handleImageUpload(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive"
        });
      }
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'IMG') {
      // Clicked outside of image, deselect
      if (selectedImage) {
        selectedImage.style.border = '2px solid transparent';
        selectedImage.style.boxShadow = 'none';
        setSelectedImage(null);
      }
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="border-b bg-muted/50 p-2 flex gap-1 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          type="button"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          type="button"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          type="button"
        >
          <Underline className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyLeft')}
          type="button"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyCenter')}
          type="button"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyRight')}
          type="button"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        
        <div className="w-px bg-border mx-1" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          type="button"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertOrderedList')}
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
            const url = prompt('Enter link URL:');
            if (url) execCommand('createLink', url);
          }}
          type="button"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>

      {selectedImage && (
        <div className="border-b bg-blue-50 p-2">
          <div className="text-sm font-medium text-blue-900 mb-2">Image Controls</div>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => alignImage('left')} type="button">
                Left
              </Button>
              <Button size="sm" variant="outline" onClick={() => alignImage('center')} type="button">
                Center
              </Button>
              <Button size="sm" variant="outline" onClick={() => alignImage('right')} type="button">
                Right
              </Button>
            </div>
            <div className="w-px bg-border mx-1" />
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => resizeImage('small')} type="button">
                Small
              </Button>
              <Button size="sm" variant="outline" onClick={() => resizeImage('medium')} type="button">
                Medium
              </Button>
              <Button size="sm" variant="outline" onClick={() => resizeImage('large')} type="button">
                Large
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-4 focus:outline-none prose max-w-none"
        onInput={handleInput}
        onFocus={() => setIsEditorFocused(true)}
        onBlur={() => setIsEditorFocused(false)}
        onPaste={handlePaste}
        onClick={handleClick}
        suppressContentEditableWarning={true}
        style={{
          lineHeight: '1.6',
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
