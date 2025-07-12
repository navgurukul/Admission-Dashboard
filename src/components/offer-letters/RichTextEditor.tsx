
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
  const { toast } = useToast();

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const execCommand = (command: string, value?: string) => {
    try {
      document.execCommand(command, false, value);
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    } catch (error) {
      console.error('Error executing command:', command, error);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Allow default paste behavior for better compatibility
    setTimeout(() => {
      handleInput();
    }, 0);
  };

  const handleImageUpload = async (file: File) => {
    try {
      console.log('Starting image upload:', file.name);
      
      const fileExt = file.name.split('.').pop();
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
        // Insert image at cursor position
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const img = document.createElement('img');
          img.src = data.publicUrl;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          range.insertNode(img);
          
          // Move cursor after the image
          range.setStartAfter(img);
          range.setEndAfter(img);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          // Fallback: append to end of content
          execCommand('insertHTML', `<img src="${data.publicUrl}" style="max-width: 100%; height: auto;" />`);
        }
        
        handleInput();
        
        toast({
          title: "Image Uploaded",
          description: "Image has been successfully uploaded and inserted"
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
      
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-4 focus:outline-none prose max-w-none"
        onInput={handleInput}
        onFocus={() => setIsEditorFocused(true)}
        onBlur={() => setIsEditorFocused(false)}
        onPaste={handlePaste}
        suppressContentEditableWarning={true}
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
