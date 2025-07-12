
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Import mammoth for .docx conversion
const mammoth = (window as any).mammoth;

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

  // Load mammoth library dynamically
  const loadMammoth = async () => {
    if (!(window as any).mammoth) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';
      document.head.appendChild(script);
      
      return new Promise((resolve) => {
        script.onload = resolve;
      });
    }
  };

  const convertDocxToHtml = async (file: File): Promise<string> => {
    await loadMammoth();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          
          const options = {
            convertImage: async (image: any) => {
              // Convert images to base64 and upload to Supabase
              const imageBuffer = await image.read();
              const blob = new Blob([imageBuffer], { type: image.contentType });
              
              // Create a unique filename
              const fileName = `template-image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${image.contentType.split('/')[1]}`;
              const filePath = `template-images/${fileName}`;
              
              try {
                // Upload to Supabase storage
                const { error: uploadError } = await supabase.storage
                  .from('offer-pdfs')
                  .upload(filePath, blob);
                
                if (uploadError) {
                  console.error('Image upload error:', uploadError);
                  return { src: '' }; // Return empty src if upload fails
                }
                
                // Get public URL
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
              // Map Word styles to HTML/CSS
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Title'] => h1.title:fresh",
              "p[style-name='Subtitle'] => h2.subtitle:fresh",
              "r[style-name='Strong'] => strong",
              "r[style-name='Emphasis'] => em",
              "p[style-name='Quote'] => blockquote:fresh",
              "p[style-name='List Paragraph'] => p.list-paragraph:fresh"
            ]
          };
          
          const result = await (window as any).mammoth.convertToHtml(arrayBuffer, options);
          
          if (result.messages && result.messages.length > 0) {
            console.log('Conversion messages:', result.messages);
          }
          
          // Enhance the HTML with better styling
          const styledHtml = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto;">
              ${result.value}
            </div>
          `;
          
          resolve(styledHtml);
        } catch (error) {
          console.error('Document conversion error:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.doc') && !file.name.endsWith('.docx')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a .doc or .docx file",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload original file to Supabase storage for backup
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `template-docs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('offer-pdfs')
        .upload(filePath, file);

      if (uploadError) {
        console.error('File upload error:', uploadError);
        // Continue with conversion even if backup upload fails
      }

      // Convert document to HTML
      let htmlContent: string;
      
      if (file.name.endsWith('.docx')) {
        htmlContent = await convertDocxToHtml(file);
      } else {
        // For .doc files, show a message that .docx is preferred
        toast({
          title: "File Format Notice",
          description: "For better conversion results, please use .docx format. Proceeding with basic conversion.",
          variant: "default"
        });
        
        // Fallback to basic template for .doc files
        htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
            <h1>Document Template</h1>
            <p>Your .doc file has been uploaded. For better formatting preservation, please convert to .docx format and re-upload.</p>
            <p>You can now edit this content and add placeholders as needed.</p>
            <br>
            <p>Dear {{STUDENT_NAME}},</p>
            <p>We are pleased to inform you that you have been selected for admission to {{PROGRAM_NAME}} at {{CAMPUS_NAME}}.</p>
            <p>Your enrollment details:</p>
            <ul>
              <li>Student ID: {{STUDENT_ID}}</li>
              <li>Program: {{PROGRAM_NAME}}</li>
              <li>Campus: {{CAMPUS_NAME}}</li>
              <li>Start Date: {{START_DATE}}</li>
            </ul>
            <p>Please find attached the consent form and checklist for your enrollment.</p>
            <p>Congratulations on your admission!</p>
            <p>Best regards,<br>Admissions Team</p>
          </div>
        `;
      }

      onDocumentUploaded(htmlContent);
      
      toast({
        title: "Document Converted Successfully",
        description: "Your document has been converted to HTML and loaded into the editor. Images have been uploaded and embedded."
      });
      
      onClose();
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        title: "Conversion Error",
        description: "Failed to convert document. Please try again or check if the file is corrupted.",
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
            Upload a .docx file (recommended) or .doc file to convert it to an editable HTML template. 
            The system will preserve formatting, convert images, and maintain document structure.
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="document-upload">Select Document</Label>
            <div className="flex items-center gap-2">
              <Input
                id="document-upload"
                type="file"
                accept=".doc,.docx"
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
              <div className="font-medium">Supported formats:</div>
              <div>• .docx (recommended for best results)</div>
              <div>• .doc (basic conversion)</div>
            </div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg text-sm text-green-800">
            <div className="font-medium mb-1">What gets converted:</div>
            <ul className="space-y-1 text-xs">
              <li>• Text content and formatting</li>
              <li>• Images (uploaded to storage)</li>
              <li>• Headers, paragraphs, and lists</li>
              <li>• Bold, italic, and other text styles</li>
              <li>• Document structure and layout</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
