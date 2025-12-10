import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { UploadCloud, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle } from "lucide-react";
import { bulkUploadStudents } from "@/utils/api";
import { Loader2 } from "lucide-react";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ApplicantData {
  // Personal Information
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  phone_number: string;
  whatsapp_number: string | null;
  email: string | null;
  gender: string | null;
  
  // Location Information
  state: string | null;
  district: string | null;
  block: string | null;
  pin_code: string | null;
  
  // Education & Background
  cast_id: string | null;
  qualification_id: string | null;
  current_status_id: string | null;
  
  // Screening Round
  screening_status: string | null;
  question_set_id: string | null;
  obtained_marks: number | null;
  school_id: string | null;
  exam_centre: string | null;
  date_of_test: string | null;
  
  // Learning Round
  learning_round_status: string | null;
  lr_comments: string | null;
  
  // Cultural Fit Round
  cultural_fit_status: string | null;
  cfr_comments: string | null;
  
  // Final Decision
  campus_id: string | null;
  offer_letter_status: string | null;
  onboarded_status: string | null;
  joining_date: string | null;
  final_notes: string | null;
}

const CSVImportModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CSVImportModalProps) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset modal state each time it opens
      setCsvFile(null);
      setData([]);
      setError(null);
      setShowSuccess(false);
      setSuccessCount(0);
      setUploadProgress(0);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setShowSuccess(false);
    setSuccessCount(0);
    setUploadProgress(0);

    const file = event.target.files && event.target.files[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
    } else {
      setCsvFile(null);
      setError("Please select a valid CSV file.");
    }
  };

  const handleParse = async () => {
    if (!csvFile) {
      setError("Please select a CSV file.");
      return;
    }

    setError(null);
    setShowSuccess(false);
    setSuccessCount(0);
    setIsProcessing(true); // set loading **before API call**

    try {
      // Call API
      await bulkUploadStudents(csvFile);

      // Parse CSV
      Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          setData(results.data);
          processCSVData(results.data); // this will update successCount
        },
        error: (err) => {
          setError(
            "Something went wrong while uploading your CSV file. Please check it and try again.",
          );
          setIsProcessing(false);
        },
      });
    } catch (error: any) {
      console.error("Upload failed:", error);
      // Display API error message or fallback
      const customMsg =
        error &&
        "Something went wrong while uploading your CSV file. Please check it and try again.";
      setError(customMsg);
      setIsProcessing(false);

      // toast({
      //   title: "Upload Failed",
      //   description: customMsg,
      //   variant: "destructive",
      // });
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        "First Name": "John",
        "Middle Name": "Kumar",
        "Last Name": "Sharma",
        "Phone Number": "9876543210",
        "WhatsApp Number": "9876543210",
        "Email": "john.sharma@example.com",
        "Gender": "male",
        "State": "S-06",
        "District": "D-06-01",
        "Block": "1",
        "Pincode": "110001",
        "Cast ID": "1",
        "Qualification ID": "1",
        "Current Work ID": "1",
        "Screening Status": "Screening Test Pass",
        "Question Set ID": "1",
        "Obtained Marks": "18",
        "School ID": "1",
        "Exam Centre": "Delhi Centre",
        "Date of Test": "2025-01-15",
        "Learning Round Status": "Learner Round Pass",
        "LR Comments": "Good communication skills",
        "Cultural Fit Status": "Cultural Fit Interview Pass",
        "CFR Comments": "Positive attitude",
        "Campus ID": "1",
        "Offer Letter Status": "Offer Sent",
        "Onboarded Status": "Onboarded",
        "Joining Date": "2025-02-01",
        "Final Notes": "Excellent candidate"
      }
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "applicant_import_template.csv");
    link.style.visibility = "hidden";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template Downloaded",
      description: "Sample CSV template has been downloaded successfully.",
    });
  };

  const parseNumericValue = (value: string | undefined): number | null => {
    if (!value || value.trim() === "") return null;

    const trimmedValue = value.trim();
    // Handle fractional format like "18/25"
    if (trimmedValue.includes("/")) {
      const parts = trimmedValue.split("/");
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          const result = numerator / denominator;
          console.log(`Converted ${trimmedValue} to ${result}`);
          return result;
        }
      }
    }

    // Handle regular numeric values
    const numericValue = parseFloat(trimmedValue);
    if (!isNaN(numericValue)) {
      // console.log(`Parsed ${trimmedValue} as ${numericValue}`);
      return numericValue;
    }

    // console.log(`Could not parse ${trimmedValue} as number, returning null`);
    return null;
  };

  const processCSVData = async (data: any[]) => {
    try {
      setIsProcessing(true);

      const processedData = data.map((row, index) => {
        // console.log(`Processing row ${index + 1}:`, row);

        const processedRow: any = {
          // Personal Information (Required)
          first_name: row["First Name"] || row["first_name"] || "",
          middle_name: row["Middle Name"] || row["middle_name"] || null,
          last_name: row["Last Name"] || row["last_name"] || null,
          phone_number: row["Phone Number"] || row["phone_number"] || row["Mobile No."]?.toString() || "",
          whatsapp_number: row["WhatsApp Number"] || row["whatsapp_number"] || row["WA NO."]?.toString() || null,
          email: row["Email"] || row["email"] || null,
          gender: row["Gender"] || row["gender"] || null,
          
          // Location Information
          state: row["State"] || row["state"] || null,
          district: row["District"] || row["district"] || null,
          block: row["Block"] || row["block"] || null,
          pin_code: row["Pincode"] || row["pin_code"] || row["Pin Code"] || null,
          
          // Education & Background (IDs or Names)
          cast_id: row["Cast ID"] || row["cast_id"] || row["Caste"] || null,
          qualification_id: row["Qualification ID"] || row["qualification_id"] || row["Qualification"] || null,
          current_status_id: row["Current Work ID"] || row["current_status_id"] || row["Current Work"] || null,
          
          // Screening Round
          screening_status: row["Screening Status"] || row["screening_status"] || row["Status"] || null,
          question_set_id: row["Question Set ID"] || row["question_set_id"] || row["Set Name"] || row["Set"] || null,
          obtained_marks: parseNumericValue(row["Obtained Marks"]?.toString() || row["obtained_marks"]?.toString() || row["Final Marks"]?.toString()),
          school_id: row["School ID"] || row["school_id"] || row["Qualifying School"] || row["Qualifying SOP/SOB"] || null,
          exam_centre: row["Exam Centre"] || row["exam_centre"] || row["Offline Exam Centre"] || null,
          date_of_test: row["Date of Test"] || row["date_of_test"] || row["Date of Testing"] || null,
          
          // Learning Round
          learning_round_status: row["Learning Round Status"] || row["learning_round_status"] || row["LR Status"] || null,
          lr_comments: row["LR Comments"] || row["lr_comments"] || null,
          
          // Cultural Fit Round
          cultural_fit_status: row["Cultural Fit Status"] || row["cultural_fit_status"] || row["CFR Status"] || null,
          cfr_comments: row["CFR Comments"] || row["cfr_comments"] || null,
          
          // Final Decision
          campus_id: row["Campus ID"] || row["campus_id"] || row["Campus"] || null,
          offer_letter_status: row["Offer Letter Status"] || row["offer_letter_status"] || null,
          onboarded_status: row["Onboarded Status"] || row["onboarded_status"] || row["Joining Status"] || null,
          joining_date: row["Joining Date"] || row["joining_date"] || null,
          final_notes: row["Final Notes"] || row["final_notes"] || null,
        };

        // console.log(
        //   `Processed row ${index + 1}:`,
        //   processedRow
        // );
        return processedRow;
      });

      // Note: Data is already uploaded via bulkUploadStudents API
      // No need to save to localStorage separately

      setSuccessCount(processedData.length);
      setShowSuccess(true);

      // Show toast
      toast({
        title: "Success",
        description: `Successfully imported ${processedData.length} applicants!`,
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Import error:", error);

      setError(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
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
            Upload a CSV file to add multiple applicants at once. 
            <br /><br />
            <strong>Required columns:</strong> First Name, Phone Number
            <br />
            <strong>Optional columns:</strong> Middle Name, Last Name, WhatsApp Number, Email, Gender, State, District, Block, Pincode, Cast ID, Qualification ID, Current Work ID, Screening Status, Question Set ID, Obtained Marks, School ID, Exam Centre, Date of Test, Learning Round Status, LR Comments, Cultural Fit Status, CFR Comments, Campus ID, Offer Letter Status, Onboarded Status, Joining Date, Final Notes
            <br /><br />
            <em>Note: Column names are case-insensitive and support multiple formats.</em>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadSampleCSV}
              className="text-xs flex items-center gap-2"
            >
              <Download className="h-3 w-3" />
              Download Sample CSV
            </Button>
          </div>
          
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

        <Button
          onClick={handleParse}
          disabled={!csvFile || isProcessing}
          className="flex items-center gap-2"
        >
          {isProcessing && <Loader2 className="animate-spin h-4 w-4" />}
          {isProcessing ? "Importing..." : "Import"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportModal;
