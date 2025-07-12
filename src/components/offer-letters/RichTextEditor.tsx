
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
      // Make images selectable and styled
      img.style.cursor = 'pointer';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.border = '2px solid transparent';
      img.style.transition = 'border-color 0.2s ease';
      
      // Remove any existing event listeners to prevent duplicates
      img.removeEventListener('click', handleImageClick);
      img.removeEventListener('mouseenter', handleImageMouseEnter);
      img.removeEventListener('mouseleave', handleImageMouseLeave);
      
      // Add event listeners
      img.addEventListener('click', handleImageClick);
      img.addEventListener('mouseenter', handleImageMouseEnter);
      img.addEventListener('mouseleave', handleImageMouseLeave);
    });
  };

  const handleImageClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    const img = e.target as HTMLImageElement;
    selectImage(img);
  };

  const handleImageMouseEnter = (e: Event) => {
    const img = e.target as HTMLImageElement;
    if (selectedImage !== img) {
      img.style.border = '2px solid #3b82f6';
    }
  };

  const handleImageMouseLeave = (e: Event) => {
    const img = e.target as HTMLImageElement;
    if (selectedImage !== img) {
      img.style.border = '2px solid transparent';
    }
  };

  const selectImage = (img: HTMLImageElement) => {
    // Remove selection from previous image
    if (selectedImage && selectedImage !== img) {
      selectedImage.style.border = '2px solid transparent';
      selectedImage.style.boxShadow = 'none';
    }
    
    // Select new image
    setSelectedImage(img);
    img.style.border = '2px solid #3b82f6';
    img.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.3)';
    
    console.log('Image selected:', img.src);
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

    console.log('Aligning image to:', alignment);

    // Clear any existing alignment styles
    selectedImage.style.float = '';
    selectedImage.style.display = '';
    selectedImage.style.marginLeft = '';
    selectedImage.style.marginRight = '';
    selectedImage.style.textAlign = '';

    // Apply new alignment
    switch (alignment) {
      case 'left':
        selectedImage.style.float = 'left';
        selectedImage.style.marginRight = '15px';
        selectedImage.style.marginBottom = '10px';
        break;
      case 'center':
        selectedImage.style.display = 'block';
        selectedImage.style.marginLeft = 'auto';
        selectedImage.style.marginRight = 'auto';
        selectedImage.style.marginBottom = '10px';
        break;
      case 'right':
        selectedImage.style.float = 'right';
        selectedImage.style.marginLeft = '15px';
        selectedImage.style.marginBottom = '10px';
        break;
    }
    
    // Trigger content update
    handleInput();
    
    toast({
      title: "Image Aligned",
      description: `Image aligned to ${alignment}`,
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

    console.log('Resizing image to:', size);

    let width = '';
    switch (size) {
      case 'small':
        width = '200px';
        break;
      case 'medium':
        width = '400px';
        break;
      case 'large':
        width = '600px';
        break;
    }
    
    selectedImage.style.width = width;
    selectedImage.style.height = 'auto';
    
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
      console.error('Error executing command:', command, error);
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
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          console.log('Pasting image file:', file.name || 'clipboard-image');
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
      console.log('Starting image upload:', file.name || 'unnamed-file');
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }

      const fileExt = file.name?.split('.').pop() || file.type.split('/')[1] || 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `template-images/${fileName}`;

      console.log('Uploading to path:', filePath);

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
        console.log('Image uploaded successfully:', data.publicUrl);
        
        // Focus the editor first
        if (editorRef.current) {
          editorRef.current.focus();
        }
        
        // Insert image at cursor position or end of content
        const imageHtml = `<img src="${data.publicUrl}" style="max-width: 100%; height: auto; display: block; margin: 10px 0; border: 2px solid transparent;" alt="Uploaded image" />`;
        
        if (document.getSelection()?.rangeCount) {
          // Insert at cursor position
          execCommand('insertHTML', imageHtml);
        } else {
          // Append to end if no cursor position
          if (editorRef.current) {
            editorRef.current.innerHTML += imageHtml;
          }
        }
        
        // Attach handlers to the new image
        setTimeout(() => {
          attachImageHandlers();
        }, 200);
        
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
      console.log('File selected via input:', file.name);
      handleImageUpload(file);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'IMG' && selectedImage) {
      // Clicked outside of image, deselect
      selectedImage.style.border = '2px solid transparent';
      selectedImage.style.boxShadow = 'none';
      setSelectedImage(null);
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
        <div className="border-b bg-blue-50 p-3">
          <div className="text-sm font-medium text-blue-900 mb-3">Image Controls</div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => alignImage('left')} 
                type="button"
                className="text-xs px-3"
              >
                Left
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => alignImage('center')} 
                type="button"
                className="text-xs px-3"
              >
                Center
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => alignImage('right')} 
                type="button"
                className="text-xs px-3"
              >
                Right
              </Button>
            </div>
            <div className="w-px bg-border mx-1" />
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => resizeImage('small')} 
                type="button"
                className="text-xs px-3"
              >
                Small
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => resizeImage('medium')} 
                type="button"
                className="text-xs px-3"
              >
                Medium
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => resizeImage('large')} 
                type="button"
                className="text-xs px-3"
              >
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
