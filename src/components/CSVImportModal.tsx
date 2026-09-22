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
      "Some columns only accept specific words like Gender, State, Qualification, and Status fields.",
      "Always enter the exact text as instructed in the 'Exact Values' tab.",
      "Do not change spelling, add extra spaces, or use shortcuts.",
    ],
  },
  {
    title: "2. Do Not Leave Important Fields Empty",
    body: [
      "Fields marked with an asterisk (*) like *First Name, *Phone Number, and *Prefered School are mandatory and must be filled.",
      "Make sure you complete all required columns.",
    ],
  },
  {
    title: "3. Follow the Correct Format",
    body: [
      "Date of Birth: use YYYY-MM-DD. Example: 2005-10-16",
      "*Phone Number: enter a valid 10-digit number.",
      "Email: use a proper email format like example@gmail.com.",
      "Pincode: numbers only, no letters.",
    ],
  },
  {
    title: "4. Avoid Special Characters",
    body: [
      "Do not use symbols like @, #, %, *, or / unless the field requires it, such as Email.",
      "Keep the text clean and simple.",
    ],
  },
  {
    title: "5. Obtained Marks",
    body: [
      "If not required, keep the cell blank.",
      "Enter only numbers. Do not add the % sign or text.",
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
      "Keep the column headers exactly as they are in the downloaded template.",
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
      "If you are unsure about any value, check the 'Exact Values' tab before filling the file.",
    ],
  },
];

const referenceGuide: GuideItem[] = [
  {
    title: "Qualification",
    body: ["10th Pass, 12th Pass, Graduate, Undergraduate"],
  },
  {
    title: "Qualifying School",
    body: ["Name of the school the student is currently attending or has graduated from."],
  },
  {
    title: "Partner Name",
    body: ["Name of the partner organization, e.g., Partner XYZ"],
  },
  {
    title: "*Prefered School",
    body: ["SOP, SOB, SOF, BCA"],
  },
  {
    title: "Campus",
    body: ["Dantewada, Sarjapur, Pune"],
  },
  {
    title: "Question Set Name",
    body: [
      "Must match the set names available in the dashboard.",
      "Legacy Migrated Exam",
      "Random Set 310075",
      "pota-cabin-dnt-SOP",
      "jashpur-SOP",
    ],
  },
  {
    title: "Status Fields",
    body: [
      "Screening Round Status: Screening Test Pass, Screening Test Fail",
      "Learning Round Status: Learning Round Pass, Learning Round Fail",
      "Culture Fit Status: Culture Fit Round Pass, Culture Fit Round Fail",
      "Admission Letter Status: Admission Letter Sent, Admission Letter Pending, Admission Letter Accepted, Admission Letter Declined, Selected but not joined",
      "Onboarded Status: Onboarded",
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
    body: ["Use YYYY-MM-DD for Date of Birth, Date of Test, and Joining Date."],
  },
  {
    title: "Marks Fields",
    body: ["Use numeric values only for Obtained Marks. Examples: 85.5, 78, 90"],
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


  const downloadTemplate = () => {
    // Full student data import (Download static Excel file from public folder)
    const link = document.createElement("a");
    link.href = "/Applicant_Bulk_Upload_Template.xlsx";
    link.download = "Applicant_Bulk_Upload_Template.xlsx";
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "✅ Template Downloaded",
      description: "Excel template has been downloaded successfully!",
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900",
    });
  };

  const renderGuideItems = (items: GuideItem[], itemType: string) => (
    <div className="space-y-0 relative">
      {items.map((item, index) => {
        const titleText = item.title.replace(/^\d+\.\s*/, '');
        return (
          <div key={item.title} className="flex gap-3 p-3 border-b border-slate-100 last:border-b-0">
            {itemType === "instructions" && (
              <div className="text-xs font-bold text-pink-600 mt-1 shrink-0 w-4 text-center">{index + 1}</div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-800">{titleText}</p>
              <div className="mt-0.5 text-xs text-slate-500 space-y-0.5">
                {item.body.map((line, i) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      <div className="text-center py-2 text-xs font-semibold text-pink-600 hover:text-pink-700 cursor-pointer border-t border-pink-100/50 bg-pink-50/30 sticky bottom-0">
        ↓ Scroll for all {itemType === "instructions" ? `${items.length} instructions` : "fields"}
      </div>
    </div>
  );

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[850px] max-h-[90vh] overflow-hidden p-0 sm:rounded-2xl">
        <div className="flex max-h-[90vh] flex-col overflow-hidden">
          <div className="p-6 pb-4 border-b border-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Import Applicants from CSV</DialogTitle>
              <DialogDescription className="text-sm mt-1.5 text-slate-500">
                Choose a template and upload your CSV file. Use "Full Student Data" to create new students with complete information.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            
            {/* CSV Help Guide */}
            <div className="rounded-xl border border-pink-200 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <FileSpreadsheet className="h-4 w-4 text-slate-400" />
                <p className="text-sm font-bold text-slate-800">CSV Help Guide</p>
              </div>
              <p className="text-xs text-slate-500 mb-4 pl-6">
                Review these instructions before filling or uploading the CSV.
              </p>

              <Tabs defaultValue="instructions" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white border border-pink-200 rounded-lg p-1 h-auto">
                  <TabsTrigger value="instructions" className="text-xs font-semibold py-1.5 data-[state=active]:bg-pink-600 data-[state=active]:text-white rounded-md transition-all">Instructions</TabsTrigger>
                  <TabsTrigger value="reference" className="text-xs font-semibold py-1.5 data-[state=active]:bg-pink-600 data-[state=active]:text-white rounded-md transition-all">Exact Values</TabsTrigger>
                </TabsList>

                <TabsContent value="instructions" className="mt-3">
                  <ScrollArea className="h-48 rounded-lg border border-pink-200 bg-white shadow-sm">
                    {renderGuideItems(instructionGuide, "instructions")}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="reference" className="mt-3">
                  <ScrollArea className="h-48 rounded-lg border border-pink-200 bg-white shadow-sm">
                    {renderGuideItems(referenceGuide, "fields")}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            {/* Simple Download & Upload Section */}
            <div className="space-y-2 pt-1">
              <div>
                <Label className="text-sm font-medium text-slate-800">Download Template:</Label>
                <div className="flex justify-center py-2">
                  <Button
                    onClick={() => downloadTemplate()}
                    variant="outline"
                    className="flex items-center gap-2 text-sm px-6 h-10 rounded-lg shadow-sm border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800 transition-colors"
                    type="button"
                  >
                    <Download className="h-4 w-4" />
                    Download Import Template
                  </Button>
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  • <strong className="text-slate-600 font-semibold">Student Import Template:</strong> Use this template to import student records with all required information.
                </p>
              </div>

              <div className="relative py-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm uppercase tracking-wide">
                  <span className="bg-white px-4 text-slate-500 font-medium">
                    OR UPLOAD YOUR FILE
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Label htmlFor="file" className="w-[80px] text-right text-base text-slate-700 shrink-0 font-medium">
                  CSV File
                </Label>
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    type="file"
                    id="file"
                    ref={fileInputRef}
                    className="flex-1 cursor-pointer h-11 py-2 text-slate-600 bg-white file:bg-pink-50 file:text-pink-700 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:font-medium file:cursor-pointer hover:file:bg-pink-100"
                    accept=".csv"
                    onChange={handleFileChange}
                  />
                  {csvFile && csvPreviewData && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0 border-blue-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-11 w-11"
                      onClick={() => setIsPreviewOpen(true)}
                      title="Show Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center p-3 text-sm text-destructive bg-destructive/10 rounded-xl">
                <AlertCircle className="mr-2 h-4 w-4" />
                {error}
              </div>
            )}

            {isProcessing && (
              <div className="p-4 rounded-xl border bg-slate-50">
                <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  Processing CSV data...
                </p>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}

            {showResults && (
              <div className="space-y-3 rounded-xl border bg-blue-50/50 p-6 shadow-sm flex flex-col items-center justify-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 mb-2">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-base font-bold text-slate-800">Import Process Completed</p>
                  <p className="text-sm text-slate-500">Your CSV file has been processed.</p>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowErrorModal(true)}
                    className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 bg-white"
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
                    className="border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}

            {/* Warning Banner */}
            {!showResults && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-xs font-medium">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                Rows with missing required fields will be skipped — you'll see a summary after import.
              </div>
            )}

          </div>

          {!showResults && (
            <div className="flex justify-end p-6 pt-2">
              <Button
                onClick={handleParse}
                disabled={!csvFile || isProcessing}
                className="h-10 px-8 text-sm font-semibold flex items-center gap-2"
              >
                {isProcessing && <Loader2 className="animate-spin h-4 w-4" />}
                {isProcessing ? "Importing..." : "Import"}
              </Button>
            </div>
          )}
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
            <Table className="min-w-full table-fixed">
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
                    <TableCell className={`text-xs whitespace-normal break-words ${err.error.includes("Skipped") ? "text-yellow-600 font-medium" : "text-destructive"}`}>
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
