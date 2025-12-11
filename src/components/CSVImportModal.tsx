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
import { addApplicants } from "@/utils/localStorage";
import { bulkUploadStudents } from "@/utils/api";
import { Loader2 } from "lucide-react";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ApplicantData {
  mobile_no: string;
  unique_number: string | null;
  name: string | null;
  city: string | null;
  block: string | null;
  caste: string | null;
  gender: string | null;
  qualification: string | null;
  current_work: string | null;
  qualifying_school: string | null;
  whatsapp_number: string | null;
  set_name: string | null;
  exam_centre: string | null;
  date_of_testing: string | null;
  lr_status: string | null;
  lr_comments: string | null;
  cfr_status: string | null;
  cfr_comments: string | null;
  final_marks: number | null;
  offer_letter_status: string | null;
  allotted_school: string | null;
  joining_status: string | null;
  final_notes: string | null;
  triptis_notes: string | null;
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
          // console.log(`Converted ${trimmedValue} to ${result}`);
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

        const processedRow = {
          mobile_no: row["Mobile No."]?.toString() || "",
          unique_number: row["Unique Number"]?.toString() || null, // if exists
          name: row["Name"] || null,
          city: row["City"] || null,
          block: row["Block"] || null,
          caste: row["Caste"] || null,
          gender: row["Gender"] || null,
          qualification: row["Qualification"] || null,
          current_work: row["Current Work"] || null,
          qualifying_school: row["Qualifying SOP/SOB"] || null,
          whatsapp_number: row["WA NO."]?.toString() || null,
          set_name: row["Set"] || null,
          exam_centre: row["Offline Exam Centre"] || null,
          date_of_testing: row["Date of Testing"] || null,
          final_marks: parseNumericValue(row["Final Marks"]?.toString()),
          // Optional fields (comment if not needed)
          // lr_status: row["LR Status"] || null,
          // lr_comments: row["LR Comments"] || null,
          // cfr_status: row["CFR Status"] || null,
          // cfr_comments: row["CFR Comments"] || null,
          final_notes: row["Final Notes"] || null,
          triptis_notes: row["Triptis Notes"] || null,
        };

        // console.log(
        //   `Processed row ${index + 1} final_marks:`,
        //   processedRow.final_marks
        // );
        return processedRow;
      });

      // Save to localStorage first
      addApplicants(processedData);

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

  const downloadTemplate = () => {
    // Define the CSV headers based on the expected columns
    const headers = [
      "FirstName",
      "MiddleName",
      "LastName",
      "Gender",
      "DOB",
      "Email",
      "PhoneNumber",
      "WhatsappNumber",
      "State",
      "City",
      "District",
      "Block",
      "PinCode",
      "Qualification",
      "CurrentStatus",
      // "PercentageIn10th",
      // "MathMarksIn10th",
      // "PercentageIn12th",
      // "MathMarksIn12th",
      "Cast",
      "Religion",
      "School",
      "Campus",
      "CommunicationNotes",
      "QuestionSetName",
      "ExamCentre",
      "DateOfTest",
      "ObtainedMarks",
      "ExamStatus",
      "ExamLastUpdatedByEmail",
      "LearningRoundStatus",
      "LearningRoundComments",
      "LearningRoundLastUpdatedByEmail",
      "CulturalFitStatus",
      "CulturalFitComments",
      "CulturalFitLastUpdatedByEmail",
      "OfferLetterStatus",
      "OnboardedStatus",
      "FinalNotes",
      "JoiningDate",
      "OfferLetterSentByEmail",
      "FinalStatusUpdatedByEmail",
    ];

    // Create sample row with example data
    const sampleRow = [
      "xyz",
      "Kumar",
      "Singh",
      "Male",
      "2005-01-15",
      "A@example.com",
      "1234567890",
      "1234567890",
      "Rajasthan",
      "Jaipur",
      "Jaipur",
      "Mansarovar",
      "302020",
      "12th Pass",
      "Student",
      // "85.5",
      // "90",
      // "78.5",
      // "85",
      "General",
      "Hindu",
      "SOB",
      "Kishanganj",
      "Called on 01-Dec-2025",
      "A",
      "Jaipur Center",
      "2025-11-15",
      "28",
      "Screening Test Pass",
      "interviewer1@example.com",
      "Learner Round Pass",
      "Excellent problem-solving and logical thinking",
      "interviewer1@example.com",
      "Cultural Fit Interview Pass",
      "Strong values alignment and team player",
      "interviewer2@example.com",
      "Offer Sent",
      "Onboarded",
      "Selected for January 2025 batch",
      "2025-01-15",
      "abc@navgurukul.org",
      "abc@navgurukul.org",
    ];

    // Combine headers and sample row
    const csvContent = [headers, sampleRow]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "applicants_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Template Downloaded",
      description: "CSV template has been downloaded successfully!",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Applicants from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to add multiple applicants at once. Duplicate
            mobile numbers are now allowed.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Download Template Button */}
          <div className="flex justify-center">
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="flex items-center gap-2"
              type="button"
            >
              <Download className="h-4 w-4" />
              Download CSV Template
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or upload your file
              </span>
            </div>
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
