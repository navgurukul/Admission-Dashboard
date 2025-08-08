
import React, { useState } from 'react';
import Papa from 'papaparse';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { UploadCloud } from 'lucide-react';
import { Progress } from "@/components/ui/progress"
import { CheckCircle, AlertCircle } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ApplicantData {
  id: string;
  name: string;
  mobileNo: string;
  campus: string;
  stage: string;
  status: string;
  createdAt: string;
}

const CSVImportModal = ({ isOpen, onClose, onSuccess }: CSVImportModalProps) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setShowSuccess(false);
    setSuccessCount(0);
    setUploadProgress(0);

    const file = event.target.files && event.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
    } else {
      setCsvFile(null);
      setError('Please select a valid CSV file.');
    }
  };

  const handleParse = () => {
    if (!csvFile) {
      setError('Please select a CSV file.');
      return;
    }

    setIsProcessing(true);
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: (results) => {
        setData(results.data);
        processCSVData(results.data);
      },
      error: (err) => {
        setError(err.message);
        setIsProcessing(false);
      },
    });
  };



  const processCSVData = async (data: any[]) => {
    try {
      setIsProcessing(true);
      
      const processedData = data.map((row, index) => {
        console.log(`Processing row ${index + 1}:`, row);
        
        const processedRow = {
          id: `applicant_${Date.now()}_${index}`,
          name: row.Name || row.name || '',
          mobileNo: row["Mobile No"] || row["Mobile No."] || row.mobileNo || row.mobile_no || '',
          campus: row.Campus || row.campus || row.allotted_school || '',
          stage: row.Stage || row.stage || row.lr_status || '',
          status: row.Status || row.status || row.joining_status || 'Active',
          createdAt: new Date().toISOString(),
        };

        console.log(`Processed row ${index + 1}:`, processedRow);
        return processedRow;
      });

      console.log('Saving to localStorage:', processedData.slice(0, 2)); // Log first 2 rows

      // Get existing data from localStorage
      const existingData = localStorage.getItem("applicants");
      let allData = [];
      
      if (existingData) {
        allData = JSON.parse(existingData);
      }
      
      // Add new data to existing data
      const updatedData = [...allData, ...processedData];
      
      // Save to localStorage
      localStorage.setItem("applicants", JSON.stringify(updatedData));

      setSuccessCount(processedData.length);
      setShowSuccess(true);
      onSuccess();
      
      toast({
        title: "Import Successful",
        description: `${processedData.length} applicants imported successfully to localStorage`,
      });
    } catch (error) {
      console.error('Import error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      
      toast({
        title: "Import Failed",
        description: "Failed to import applicants to localStorage",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Applicants from CSV</DialogTitle>
                  <DialogDescription>
          Upload a CSV file with columns: Name, Mobile No, Campus, Stage, Status. Data will be stored locally in your browser.
        </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              CSV File
            </Label>
            <Input
              type="file"
              id="file"
              className="col-span-3"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>

          {error && (
            <div className="flex items-center text-sm text-destructive">
              <AlertCircle className="mr-2 h-4 w-4" />
              {error}
            </div>
          )}

          {isProcessing && (
            <div>
              <p className="text-sm text-muted-foreground">
                Processing CSV data...
              </p>
              <Progress value={uploadProgress} />
            </div>
          )}

          {showSuccess && (
            <div className="flex items-center text-sm text-green-500">
              <CheckCircle className="mr-2 h-4 w-4" />
              Successfully imported {successCount} applicants!
            </div>
          )}
        </div>

        <Button onClick={handleParse} disabled={!csvFile || isProcessing}>
          {isProcessing ? 'Importing...' : 'Import'}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportModal;
