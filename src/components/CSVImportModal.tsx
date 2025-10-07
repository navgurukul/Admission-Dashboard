import React, { useState } from "react";
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
import { UploadCloud } from "lucide-react";
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
          setError(err.message);
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error("Import error:", error);
      setError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setIsProcessing(false);
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
          console.log(`Converted ${trimmedValue} to ${result}`);
          return result;
        }
      }
    }

    // Handle regular numeric values
    const numericValue = parseFloat(trimmedValue);
    if (!isNaN(numericValue)) {
      console.log(`Parsed ${trimmedValue} as ${numericValue}`);
      return numericValue;
    }

    console.log(`Could not parse ${trimmedValue} as number, returning null`);
    return null;
  };

  const processCSVData = async (data: any[]) => {
    try {
      setIsProcessing(true);

      const processedData = data.map((row, index) => {
        console.log(`Processing row ${index + 1}:`, row);

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

        console.log(
          `Processed row ${index + 1} final_marks:`,
          processedRow.final_marks
        );
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
        error instanceof Error ? error.message : "Unknown error occurred"
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
            Upload a CSV file to add multiple applicants at once. Duplicate
            mobile numbers are now allowed.
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
