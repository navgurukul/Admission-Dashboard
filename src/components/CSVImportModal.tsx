import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string[][]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      
      // Read file for preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const rows = text.split('\n').slice(0, 5); // Show first 5 rows
        const parsedRows = rows.map(row => row.split(',').map(cell => cell.trim()));
        setPreview(parsedRows);
      };
      reader.readAsText(selectedFile);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const parseDate = (dateString: string): string | null => {
    if (!dateString || dateString.trim() === '') return null;
    
    // Try different date formats
    const formats = [
      // ISO format
      /^\d{4}-\d{2}-\d{2}$/,
      // MM/DD/YYYY or DD/MM/YYYY  
      /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      // MM-DD-YYYY or DD-MM-YYYY
      /^\d{1,2}-\d{1,2}-\d{4}$/,
      // YYYY/MM/DD
      /^\d{4}\/\d{1,2}\/\d{1,2}$/
    ];

    const cleanValue = dateString.trim();
    
    try {
      const date = new Date(cleanValue);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date format: ${cleanValue}`);
        return null;
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.warn(`Date parsing error for "${cleanValue}":`, error);
      return null;
    }
  };

  const parseNumericValue = (value: string): number | null => {
    if (!value || value.trim() === '') return null;
    
    const cleanValue = value.trim();
    console.log(`Parsing numeric value: "${cleanValue}"`);
    
    try {
      // Check if it's a fraction (like "18/25")
      if (cleanValue.includes('/')) {
        console.log(`Found fraction: ${cleanValue}`);
        const parts = cleanValue.split('/');
        if (parts.length === 2) {
          const numerator = parseFloat(parts[0]);
          const denominator = parseFloat(parts[1]);
          if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
            // Convert fraction to percentage (18/25 = 72%)
            const result = (numerator / denominator) * 100;
            console.log(`Converted fraction ${cleanValue} to ${result}`);
            return result;
          }
        }
      }
      
      // Check if it's already a percentage (like "72%")
      if (cleanValue.includes('%')) {
        const numValue = parseFloat(cleanValue.replace('%', ''));
        if (!isNaN(numValue)) {
          console.log(`Found percentage: ${cleanValue} -> ${numValue}`);
          return numValue;
        }
      }
      
      // Regular number parsing
      const numValue = parseFloat(cleanValue);
      if (!isNaN(numValue)) {
        console.log(`Parsed regular number: ${cleanValue} -> ${numValue}`);
        return numValue;
      }
      
      console.warn(`Invalid numeric format: ${cleanValue}`);
      return null;
    } catch (error) {
      console.warn(`Numeric parsing error for "${cleanValue}":`, error);
      return null;
    }
  };

  const parseCSV = (text: string) => {
    const rows = text.split('\n').filter(row => row.trim() !== '');
    const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return rows.slice(1).map(row => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      const obj: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        // Map CSV headers to database columns
        switch (header.toLowerCase()) {
          case 'unique number':
          case 'unique_number':
            obj.unique_number = value;
            break;
          case 'set':
          case 'set_name':
            obj.set_name = value;
            break;
          case 'exam centre':
          case 'exam_centre':
            obj.exam_centre = value;
            break;
          case 'date of testing':
          case 'date_of_testing':
            obj.date_of_testing = value ? parseDate(value) : null;
            break;
          case 'name':
            obj.name = value;
            break;
          case 'mobile no':
          case 'mobile_no':
            obj.mobile_no = value;
            break;
          case 'whatsapp number':
          case 'whatsapp_number':
            obj.whatsapp_number = value;
            break;
          case 'block':
            obj.block = value;
            break;
          case 'city':
            obj.city = value;
            break;
          case 'caste':
            obj.caste = value;
            break;
          case 'gender':
            obj.gender = value;
            break;
          case 'qualification':
            obj.qualification = value;
            break;
          case 'current work':
          case 'current_work':
            obj.current_work = value;
            break;
          case 'final marks':
          case 'final_marks':
            obj.final_marks = value ? parseNumericValue(value) : null;
            break;
          case 'qualifying school':
          case 'qualifying_school':
            obj.qualifying_school = value;
            break;
          case 'lr status':
          case 'lr_status':
            obj.lr_status = value;
            break;
          case 'lr comments':
          case 'lr_comments':
            obj.lr_comments = value;
            break;
          case 'cfr status':
          case 'cfr_status':
            obj.cfr_status = value;
            break;
          case 'cfr comments':
          case 'cfr_comments':
            obj.cfr_comments = value;
            break;
          case 'offer letter status':
          case 'offer_letter_status':
            obj.offer_letter_status = value;
            break;
          case 'allotted school':
          case 'allotted_school':
            obj.allotted_school = value;
            break;
          case 'joining status':
          case 'joining_status':
            obj.joining_status = value;
            break;
          case 'final notes':
          case 'final_notes':
            obj.final_notes = value;
            break;
          case "tripti's notes":
          case 'triptis_notes':
            obj.triptis_notes = value;
            break;
          default:
            break;
        }
      });
      
      return obj;
    });
  };

  const handleImport = async () => {
    console.log('Import button clicked!');
    console.log('File exists:', !!file);
    console.log('Loading state:', loading);
    
    if (!file) {
      console.log('No file selected, returning early');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting CSV import process...');
      const reader = new FileReader();
      reader.onload = async (event) => {
        console.log('File read successfully');
        const text = event.target?.result as string;
        const data = parseCSV(text);
        console.log('Parsed CSV data:', data);
        
        // Filter out rows without mobile number (required field) and ensure numeric fields are properly parsed
        const validData = data.filter(row => row.mobile_no && row.mobile_no.trim() !== '').map(row => ({
          ...row,
          // Ensure final_marks is a number or null, not a string
          final_marks: typeof row.final_marks === 'string' ? parseNumericValue(row.final_marks) : row.final_marks
        }));
        console.log('Valid data after filtering and numeric parsing:', validData);
        
        if (validData.length === 0) {
          console.log('No valid data found');
          toast({
            title: "No valid data",
            description: "No rows with valid mobile numbers found",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        console.log('Attempting to insert data into Supabase...');
        const { error } = await supabase
          .from('admission_dashboard')
          .insert(validData);

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        console.log('Data imported successfully!');
        toast({
          title: "Success",
          description: `${validData.length} applicants imported successfully`,
        });
        
        console.log('Import completed, refreshing applicant list...');
        
        // Close modal and reset state
        onClose();
        setFile(null);
        setPreview([]);
        
        // Navigate to All Applicants page to show the imported data
        navigate('/applicants');
        
        // Call onSuccess after navigation
        onSuccess();
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: "Error",
        description: "Failed to import CSV file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'unique_number',
      'set_name',
      'exam_centre',
      'date_of_testing',
      'name',
      'mobile_no',
      'whatsapp_number',
      'block',
      'city',
      'caste',
      'gender',
      'qualification',
      'current_work',
      'final_marks',
      'qualifying_school',
      'lr_status',
      'lr_comments',
      'cfr_status',
      'cfr_comments',
      'offer_letter_status',
      'allotted_school',
      'joining_status',
      'final_notes',
      'triptis_notes'
    ];
    
    const csvContent = headers.join(',') + '\n' + 
      'SAMPLE123,Set A,Centre 1,2024-01-15,John Doe,9876543210,9876543210,Block A,City A,General,Male,Graduate,Software Engineer,85,School A,Pass,Good performance,Pass,Good fit,Sent,School B,Joined,Final decision made,Initial contact notes';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'admission_dashboard_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import CSV Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Upload a CSV file with applicant data. The mobile number field is required.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <Label>Preview (First 5 rows)</Label>
              <div className="border rounded-md p-3 bg-muted/30 max-h-40 overflow-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {preview.map((row, index) => (
                      <tr key={index} className={index === 0 ? 'font-semibold' : ''}>
                        {row.slice(0, 5).map((cell, cellIndex) => (
                          <td key={cellIndex} className="pr-4 truncate max-w-[100px]">
                            {cell}
                          </td>
                        ))}
                        {row.length > 5 && <td className="text-muted-foreground">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                console.log('Import Data button clicked - immediate check!');
                console.log('File exists:', !!file);
                console.log('File name:', file?.name);
                console.log('Loading state:', loading);
                handleImport();
              }} 
              disabled={!file || loading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {loading ? "Importing..." : "Import Data"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}