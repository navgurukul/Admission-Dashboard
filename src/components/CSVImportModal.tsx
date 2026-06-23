import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Download, FileSpreadsheet, Eye } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle } from "lucide-react";
import { bulkUploadStudents } from "@/utils/api";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type GuideItem = {
  title: string;
  body: string[];
};

const instructionGuide: GuideItem[] = [
  {
    title: "1. Use Exact Values Only",
    body: [
      "Some columns only accept specific words like Gender, State, Qualification, and similar fields.",
      "Always enter the exact text as instructed.",
      "Do not change spelling, add extra spaces, or use shortcuts.",
    ],
  },
  {
    title: "2. Do Not Leave Important Fields Empty",
    body: [
      "Fields like Name, Phone Number, State, and similar required columns must be filled.",
      "Make sure you complete all mandatory fields.",
    ],
  },
  {
    title: "3. Follow the Correct Format",
    body: [
      "Date of Birth: use YYYY-MM-DD. Example: 2005-10-16",
      "Phone Number: enter a valid 10-digit number.",
      "Email: use a proper email format like example@gmail.com.",
      "Pin Code: numbers only, no letters.",
    ],
  },
  {
    title: "4. Avoid Special Characters",
    body: [
      "Do not use symbols like @, #, %, *, or / unless the field requires it, such as email.",
      "Keep the text clean and simple.",
    ],
  },
  {
    title: "5. Marks and Percentage",
    body: [
      "If not required, keep the cells blank.",
      "Enter only numbers. Do not add the % sign.",
      "Correct: 85",
      "Wrong: 85%",
    ],
  },
  {
    title: "6. Spelling Matters",
    body: [
      "Even small spelling mistakes can cause errors.",
      "Correct: Male",
      "Wrong: male, MALE, Mle",
    ],
  },
  {
    title: "7. One Row = One Person",
    body: [
      "Each row should contain details for only one student.",
      "Do not mix data from multiple people in the same row.",
    ],
  },
  {
    title: "8. Do Not Change Column Names",
    body: [
      "Keep the column headers exactly as they are.",
      "Do not rename, delete, or rearrange them.",
    ],
  },
  {
    title: "9. Save File Correctly",
    body: [
      "Save the file in .csv format only.",
      "Do not convert it to Excel (.xlsx) or any other format.",
    ],
  },
  {
    title: "10. When in Doubt",
    body: [
      "If you are unsure about any value, check the reference guide or ask before filling the file.",
    ],
  },
];

const referenceGuide: GuideItem[] = [
  {
    title: "Qualification",
    body: ["10th Pass, 12th Pass, Graduate, Undergraduate"],
  },
  {
    title: "CurrentStatus",
    body: ["Student, Working, Job Searching"],
  },
  {
    title: "Cast",
    body: ["General, OBC, SC, ST, Other"],
  },
  // {
  //   title: "Religion",
  //   body: ["Hinduism, Islam, Christianity, Sikhism, Buddhism, Jainism, Other"],
  // },
  {
    title: "School",
    body: ["SOP, SOB, SOF, BCA"],
  },
  {
    title: "Campus",
    body: ["Dantewad, Sarjapur, Pune"],
  },
  {
    title: "QuestionSetName",
    body: [
      "Must match the set names available in the dashboard.",
      "Legacy Migrated Exam",
      "Random Set 310075",
      "pota-cabin-dnt-SOP",
      "jashpur-SOP",
    ],
  },
  {
    title: "Statuses",
    body: [
      "ExamStatus: Screening Test Pass, Screening Test Fail",
      "LearningRoundStatus: Learning Round Pass, Learning Round Fail",
      "CulturalFitStatus: Culture Fit Round Pass, Culture Fit Round Fail",
      "OfferLetterStatus: Admission Letter Sent,Admission Letter Pending , Admission Letter Accepted, Admission Letter Declined, Selected but not joined",
      "OnboardedStatus: Onboarded",
    ],
  },
  {
    title: "Gender",
    body: ["Male, Female, Other", "Use a consistent value across rows."],
  },
  {
    title: "Email Fields",
    body: ["Use a valid email format."],
  },
  {
    title: "Date Fields",
    body: ["Use YYYY-MM-DD for DOB, DateOfTest, and JoiningDate."],
  },
  {
    title: "Percentage / Marks Fields",
    body: ["Use numeric values only. Examples: 85.5, 78, 90"],
  },
];

const CSVImportModal = ({
  isOpen,
  onClose,
  onSuccess,
}: CSVImportModalProps) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [insertedCount, setInsertedCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [rowErrors, setRowErrors] = useState<Array<{ row?: number | string; identifier: string; error: string }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const [csvPreviewData, setCsvPreviewData] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ROWS_PER_PAGE = 20;

  useEffect(() => {
    if (isOpen) {
      setCsvFile(null);
      setError(null);
      setShowResults(false);
      setSuccessCount(0);
      setInsertedCount(0);
      setUpdatedCount(0);
      setSkippedCount(0);
      setFailedCount(0);
      setRowErrors([]);
      setUploadProgress(0);
      setIsProcessing(false);
      setCsvPreviewData(null);
      setIsPreviewOpen(false);
      setPreviewPage(0);
      setShowErrorModal(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const getColLetter = (index: number): string => {
    let temp = index;
    let letter = "";
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setShowResults(false);
    setSuccessCount(0);
    setSkippedCount(0);
    setFailedCount(0);
    setRowErrors([]);
    setUploadProgress(0);
    setCsvPreviewData(null);
    setIsPreviewOpen(false);

    const file = event.target.files && event.target.files[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      setCsvFile(file);
      
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as string[][];
          if (data && data.length > 0) {
            // Filter out empty rows
            const filteredData = data.filter(row => row.some(cell => cell && cell.trim() !== ""));
            if (filteredData.length > 0) {
              const headers = filteredData[0];
              const rows = filteredData.slice(1);
              setCsvPreviewData({ headers, rows });
              setPreviewPage(0);
              setIsPreviewOpen(true);
            } else {
              setError("The CSV file is empty.");
            }
          } else {
            setError("No data found in the CSV file.");
          }
        },
        error: (err) => {
          console.error("Error parsing CSV for preview:", err);
          setError("Failed to parse the CSV file for preview.");
        }
      });
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
    setShowResults(false);
    setSuccessCount(0);
    setSkippedCount(0);
    setFailedCount(0);
    setRowErrors([]);
    setIsProcessing(true);

    try {
      // Call API
      const result = await bulkUploadStudents(csvFile);
      
      console.log("Upload result:", result);

      setSuccessCount((result.inserted_count || 0) + (result.updated_count || 0));
      setInsertedCount(result.inserted_count || 0);
      setUpdatedCount(result.updated_count || 0);
      setSkippedCount(result.skipped_count || 0);
      setFailedCount(result.failed_count || 0);

      const apiErrors = result.errors || [];
      const skippedEmails = result.skipped_emails || [];
      const skippedToErrors = skippedEmails.map((email: string) => ({
        row: "-",
        identifier: email,
        error: "Skipped (Duplicate or no changes detected)"
      }));
      setRowErrors([...apiErrors, ...skippedToErrors]);

      setShowResults(true);
      setIsProcessing(false);

      const totalSuccess = (result.inserted_count || 0) + (result.updated_count || 0);
      
      if (result.failed_count > 0 || result.skipped_count > 0) {
        toast({
          title: "⚠️ Partial Import / Skipped",
          description: `Processed ${result.total_processed} rows: ${totalSuccess} success, ${result.skipped_count} skipped, ${result.failed_count} failed.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Import Successful",
          description: `Successfully processed ${result.total_processed} rows!`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
        onSuccess();
      }
      
      // Always show the results modal to display counts
      setShowErrorModal(true);
    } catch (error: any) {
      console.error("Upload failed:", error);
      setError(error.message || "Something went wrong while uploading your CSV file. Please check it and try again.");
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

  // Removed client-side processCSVData as backend now handles everything and returns results


  const downloadTemplate = (templateType: 'full' | 'update' = 'full') => {
    if (templateType === 'update') {
      // Second format: For updating existing students with multiple session data (Email-based)
      const headers = [
        "Email",
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

      const sampleRow = [
        "student@example.com",
        "A",
        "Jaipur Center",
        "2025-11-15",
        "28",
        "Screening Test Pass",
        "interviewer1@example.com",
        "Learning Round Pass",
        "Excellent problem-solving and logical thinking",
        "interviewer1@example.com",
        "Culture Fit Round Pass",
        "Strong values alignment and team player",
        "interviewer2@example.com",
        "Admission letter Sent",
        "Onboarded",
        "Selected for January 2025 batch",
        "2025-01-15",
        "abc@navgurukul.org",
        "abc@navgurukul.org",
      ];

      const csvContent = [headers, sampleRow]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", "student_sessions_update_template.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "✅ Template Downloaded",
        description: "Student Sessions Update template has been downloaded successfully!",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      return;
    }

    // First format: Full student data import (default)
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
      "PercentageIn10th",
      "MathMarksIn10th",
      "PercentageIn12th",
      "MathMarksIn12th",
      "Cast",
      // "Religion",
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
      "85.5",
      "90",
      "78.5",
      "85",
      "General",
      // "Hindu",
      "SOB",
      "Kishanganj",
      "Called on 01-Dec-2025",
      "screening-test-set",
      "Jaipur Center",
      "2025-11-15",
      "28",
      "Screening Test Pass",
      "interviewer1@example.com",
      "Learning Round Pass",
      "Excellent problem-solving and logical thinking",
      "interviewer1@example.com",
      "Culture Fit Round Pass",
      "Strong values alignment and team player",
      "interviewer2@example.com",
      "Admission letter Sent",
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
      title: "✅ Template Downloaded",
      description: "CSV template has been downloaded successfully!",
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900",
    });
  };

  const renderGuideItems = (items: GuideItem[]) => (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.title} className="rounded-md border p-3">
          <p className="text-sm font-semibold">{item.title}</p>
          <div className="mt-2 space-y-1 text-sm text-muted-foreground">
            {item.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[700px] max-h-[90vh] overflow-hidden p-0 sm:rounded-lg">
        <div className="flex max-h-[90vh] flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Import Applicants from CSV</DialogTitle>
          <DialogDescription>
            Choose a template and upload your CSV file. Use "Full Student Data" to create new students with complete information.
            {/* or "Sessions Update" to update screening exam/interview rounds for existing students. */}
          </DialogDescription>
        </DialogHeader>

        <div className="grid flex-1 gap-4 overflow-y-auto py-4 pr-1">
          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div>
              <p className="text-sm font-medium">CSV Help Guide</p>
              <p className="text-xs text-muted-foreground">
                Review these instructions before filling or uploading the CSV.
              </p>
            </div>

            <Tabs defaultValue="instructions" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="instructions">Instructions</TabsTrigger>
                <TabsTrigger value="reference">Exact Values</TabsTrigger>
              </TabsList>

              <TabsContent value="instructions">
                <ScrollArea className="h-64 rounded-md border bg-background p-4">
                  <div className="mb-4">
                    <p className="text-sm font-semibold">
                      CSV Data Filling Guide
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This guide will help you fill the file correctly so your
                      data gets accepted without errors.
                    </p>
                  </div>
                  {renderGuideItems(instructionGuide)}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="reference">
                <ScrollArea className="h-64 rounded-md border bg-background p-4">
                  <div className="mb-4">
                    <p className="text-sm font-semibold">
                      Exact Data Reference Guide
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Type these values exactly as shown, including spaces and
                      capitalization.
                    </p>
                  </div>
                  {renderGuideItems(referenceGuide)}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Download Template Buttons */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Download Template:</Label>
            <div className="flex justify-center py-2">
              <Button
                onClick={() => downloadTemplate('full')}
                variant="outline"
                className="flex items-center gap-2 text-xs sm:text-sm px-8"
                type="button"
              >
                <Download className="h-4 w-4" />
                Download "Full Student Data" Template
              </Button>
              {/* <Button
                onClick={() => downloadTemplate('update')}
                variant="outline"
                className="flex items-center gap-2 text-xs sm:text-sm"
                type="button"
              >
                <Download className="h-4 w-4" />
                Sessions Update
              </Button> */}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              • <strong>Full Student Data:</strong> Create new students with complete information
              {/* <br/>
              • <strong>Sessions Update:</strong> Update existing students' stages and Admission letter updates based on their email addresses. */}
            </p>
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
            <div className="col-span-3 flex items-center gap-2">
              <Input
                type="file"
                id="file"
                ref={fileInputRef}
                className="flex-1"
                accept=".csv"
                onChange={handleFileChange}
              />
              {csvFile && csvPreviewData && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0 border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => setIsPreviewOpen(true)}
                  title="Show Preview"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
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
          {showResults && (
            <div className="space-y-3 rounded-lg border bg-blue-50/50 p-6 shadow-sm flex flex-col items-center justify-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-base font-semibold text-foreground">Import Process Completed</p>
                <p className="text-sm text-muted-foreground">Your CSV file has been processed.</p>
              </div>

              <div className="flex gap-3 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowErrorModal(true)}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Errors & Skipped 
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    if (successCount > 0) onSuccess();
                    onClose();
                  }}
                  className="border-gray-200"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleParse}
          disabled={!csvFile || isProcessing}
          className="mt-2 w-full flex items-center gap-2 sm:w-auto"
        >
          {isProcessing && <Loader2 className="animate-spin h-4 w-4" />}
          {isProcessing ? "Importing..." : "Import"}
        </Button>
        </div>

        <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <SheetContent side="bottom" className="h-[85vh] max-h-[85vh] flex flex-col p-0 z-[100] overflow-hidden gap-0">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b p-4 sm:p-6 bg-muted/10 shrink-0 gap-4">
              <div className="space-y-1">
                <SheetHeader className="text-left">
                  <SheetTitle className="flex items-center gap-2 text-xl font-bold">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    CSV File Preview
                  </SheetTitle>
                  <SheetDescription className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-foreground max-w-[200px] truncate" title={csvFile?.name}>
                      {csvFile?.name}
                    </span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>{(csvFile ? csvFile.size / 1024 : 0).toFixed(1)} KB</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {csvPreviewData?.rows.length} Rows
                    </span>
                    <span className="text-muted-foreground/50">|</span>
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                      {csvPreviewData?.headers.length} Columns
                    </span>
                  </SheetDescription>
                </SheetHeader>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                    fileInputRef.current?.click();
                  }}
                  className="text-xs flex items-center gap-1.5"
                >
                  Change File
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreviewOpen(false)}
                  className="text-xs"
                >
                  Close Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    handleParse();
                  }}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 shadow-sm"
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5" />
                  )}
                  Import This File
                </Button>
              </div>
            </div>

            {/* Grid Preview Area */}
            <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-slate-50/50 flex flex-col min-h-0 gap-3">

              {/* Pagination Controls */}
              {csvPreviewData && (
                <div className="flex items-center justify-between shrink-0 px-1">
                  <p className="text-xs text-muted-foreground">
                    Showing rows{" "}
                    <span className="font-semibold text-foreground">
                      {previewPage * ROWS_PER_PAGE + 1}
                    </span>{" "}–{" "}
                    <span className="font-semibold text-foreground">
                      {Math.min((previewPage + 1) * ROWS_PER_PAGE, csvPreviewData.rows.length)}
                    </span>{" "}of{" "}
                    <span className="font-semibold text-foreground">
                      {csvPreviewData.rows.length}
                    </span>{" "}total rows
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-3"
                      disabled={previewPage === 0}
                      onClick={() => setPreviewPage(p => Math.max(0, p - 1))}
                    >
                      ← Previous
                    </Button>
                    <span className="text-xs text-muted-foreground font-medium">
                      Page {previewPage + 1} / {Math.ceil(csvPreviewData.rows.length / ROWS_PER_PAGE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-3"
                      disabled={(previewPage + 1) * ROWS_PER_PAGE >= csvPreviewData.rows.length}
                      onClick={() => setPreviewPage(p => p + 1)}
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-auto border rounded-xl shadow-md bg-background relative min-h-0">
                {csvPreviewData && (
                  <Table className="border-collapse min-w-full">
                    <TableHeader className="sticky top-0 bg-muted/90 backdrop-blur-md z-20">
                      <TableRow className="hover:bg-transparent">
                        {/* Top-Left Corner Index Cell */}
                        <TableHead className="border border-border p-2 bg-muted font-mono text-[10px] text-muted-foreground text-center sticky left-0 top-0 z-30 w-12 min-w-[48px] shadow-[right_1px_0_0_0_rgba(0,0,0,0.1),bottom_1px_0_0_0_rgba(0,0,0,0.1)]">
                          #
                        </TableHead>
                        {csvPreviewData.headers.map((header, idx) => (
                          <TableHead key={idx} className="border border-border p-2 bg-muted text-xs font-semibold text-left whitespace-nowrap min-w-[150px] shadow-[bottom_1px_0_0_0_rgba(0,0,0,0.1)]">
                            <div className="text-[9px] text-muted-foreground/75 font-mono uppercase tracking-wider mb-0.5">
                              {getColLetter(idx)}
                            </div>
                            <div className="font-semibold text-foreground truncate" title={header}>
                              {header}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvPreviewData.rows
                        .slice(previewPage * ROWS_PER_PAGE, (previewPage + 1) * ROWS_PER_PAGE)
                        .map((row, rowIdx) => {
                          const absoluteRowIdx = previewPage * ROWS_PER_PAGE + rowIdx;
                          return (
                            <TableRow key={absoluteRowIdx} className="hover:bg-muted/30 even:bg-muted/10 transition-colors">
                              {/* Sticky Row Index Cell */}
                              <TableCell className="border border-border p-2 bg-muted/80 backdrop-blur-sm font-mono text-xs text-muted-foreground text-center sticky left-0 z-10 w-12 min-w-[48px] shadow-[right_1px_0_0_0_rgba(0,0,0,0.1)] font-medium">
                                {absoluteRowIdx + 1}
                              </TableCell>
                              {csvPreviewData.headers.map((_, colIdx) => {
                                const cellValue = row[colIdx] !== undefined ? row[colIdx] : "";
                                return (
                                  <TableCell key={colIdx} className="border border-border p-2 text-xs truncate max-w-[200px]" title={cellValue}>
                                    {cellValue}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })
                      }
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </DialogContent>
    </Dialog>

    {/* Error Details Modal */}
    <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
      <DialogContent className="sm:max-w-[750px] max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-slate-50/50">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {failedCount > 0 ? (
              <AlertCircle className="h-6 w-6 text-destructive" />
            ) : skippedCount > 0 ? (
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            ) : (
              <CheckCircle className="h-6 w-6 text-green-600" />
            )}
            Import Results Summary
          </DialogTitle>
          
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-md bg-green-50 text-green-700 border border-green-200">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              Inserted: {insertedCount}
            </div>
            <div className="flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Updated: {updatedCount}
            </div>
            <div className="flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200">
              <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
              Skipped: {skippedCount}
            </div>
            <div className="flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-md bg-red-50 text-red-700 border border-red-200">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              Failed: {failedCount}
            </div>
          </div>
          
          <DialogDescription className="mt-4 text-sm text-muted-foreground">
            {rowErrors.length > 0 
              ? `Review the ${rowErrors.length} records below that encountered issues or were skipped.`
              : `All rows processed successfully.`}
          </DialogDescription>
        </DialogHeader>
        
        {rowErrors.length > 0 && (
          <ScrollArea className="flex-1 p-0">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-[80px]">Row</TableHead>
                  <TableHead className="w-[250px]">Identifier</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowErrors.map((err, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {err.row && err.row !== "-" ? err.row : "N/A"}
                    </TableCell>
                    <TableCell className="font-medium text-xs break-all">
                      {err.identifier}
                    </TableCell>
                    <TableCell className={`text-xs ${err.error.includes("Skipped") ? "text-yellow-600 font-medium" : "text-destructive"}`}>
                      {err.error}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
        
        <div className="flex justify-end p-4 border-t bg-background shrink-0">
          <Button onClick={() => {
            setShowErrorModal(false);
            if (successCount > 0) onSuccess();
            if (failedCount === 0 && skippedCount === 0) onClose();
          }}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default CSVImportModal;
