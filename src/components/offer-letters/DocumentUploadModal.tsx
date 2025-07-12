
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentUploaded: (content: string) => void;
}

export const DocumentUploadModal = ({ 
  isOpen, 
  onClose, 
  onDocumentUploaded 
}: DocumentUploadModalProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadMammoth = async () => {
    if ((window as any).mammoth) {
      return (window as any).mammoth;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      script.onload = () => {
        if ((window as any).mammoth) {
          resolve((window as any).mammoth);
        } else {
          reject(new Error('Mammoth library not loaded properly'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load mammoth library'));
      document.head.appendChild(script);
    });
  };

  const convertDocxToHtml = async (file: File): Promise<string> => {
    try {
      const mammoth = await loadMammoth();
      const arrayBuffer = await file.arrayBuffer();
      
      const options = {
        convertImage: async (image: any) => {
          try {
            const imageBuffer = await image.read();
            const blob = new Blob([imageBuffer], { type: image.contentType || 'image/png' });
            
            const fileExtension = image.contentType ? image.contentType.split('/')[1] : 'png';
            const fileName = `template-image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;
            const filePath = `template-images/${fileName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('offer-pdfs')
              .upload(filePath, blob);
            
            if (uploadError) {
              console.error('Image upload error:', uploadError);
              return { src: '' };
            }
            
            const { data } = supabase.storage
              .from('offer-pdfs')
              .getPublicUrl(filePath);
            
            return { src: data.publicUrl };
          } catch (error) {
            console.error('Error processing image:', error);
            return { src: '' };
          }
        },
        styleMap: [
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh", 
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Title'] => h1.title:fresh",
          "p[style-name='Subtitle'] => h2.subtitle:fresh",
          "r[style-name='Strong'] => strong",
          "r[style-name='Emphasis'] => em",
        ],
        transformDocument: (document: any) => {
          // Clean up empty elements that cause conversion issues
          const cleanElement = (element: any): any => {
            if (!element || !element.children) return element;
            
            element.children = element.children
              .map(cleanElement)
              .filter((child: any) => child !== null);
              
            return element;
          };
          
          return cleanElement(document);
        }
      };
      
      const result = await mammoth.convertToHtml({ arrayBuffer }, options);
      
      if (result.messages && result.messages.length > 0) {
        console.log('Conversion messages:', result.messages);
      }
      
      const styledHtml = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;">
          ${result.value}
        </div>
      `;
      
      return styledHtml;
    } catch (error) {
      console.error('Document conversion error:', error);
      throw new Error(`Document conversion failed. Please try with a simpler document or contact support.`);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a .docx file.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      console.log('Starting file upload for:', file.name);
      
      // Upload original file to Supabase storage for backup
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `template-docs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('offer-pdfs')
        .upload(filePath, file);

      if (uploadError) {
        console.error('File backup upload error:', uploadError);
      }

      console.log('Converting document to HTML...');
      const htmlContent = await convertDocxToHtml(file);
      
      console.log('Document converted successfully');
      onDocumentUploaded(htmlContent);
      
      toast({
        title: "Document Converted Successfully",
        description: "Your document has been converted and loaded into the editor."
      });
      
      onClose();
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion Error",
        description: error instanceof Error ? error.message : "Failed to convert document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document Template</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Upload a .docx file to convert it to an editable HTML template.
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="document-upload">Select Document</Label>
            <div className="flex items-center gap-2">
              <Input
                id="document-upload"
                type="file"
                accept=".docx"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Browse
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm">
            <FileText className="h-4 w-4 text-blue-600" />
            <div className="text-blue-800">
              <div className="font-medium">Supported format:</div>
              <div>• .docx files only</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
