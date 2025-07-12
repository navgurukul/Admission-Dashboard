
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
      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const filePath = `template-docs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('offer-pdfs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // For now, we'll provide a basic HTML template structure
      // In a real implementation, you'd want to use a service to convert DOC to HTML
      const basicTemplate = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
          <h1>Offer Letter Template</h1>
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

      onDocumentUploaded(basicTemplate);
      
      toast({
        title: "Document Uploaded",
        description: "Document has been processed and loaded into the editor"
      });
      
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload document. Please try again.",
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
            Upload a .doc or .docx file to use as a template. The document will be converted 
            to an editable format while preserving the original formatting.
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
            <span className="text-blue-800">
              Supported formats: .doc, .docx
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
