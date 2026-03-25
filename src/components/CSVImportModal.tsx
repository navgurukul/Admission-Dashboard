import React, { useState, useEffect } from "react";
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
import { Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle } from "lucide-react";
import { bulkUploadStudents } from "@/utils/api";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  {
    title: "Religion",
    body: ["Hinduism, Islam, Christianity, Sikhism, Buddhism, Jainism, Other"],
  },
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
      "OfferLetterStatus: Offer Sent, Offer Accepted, Offer Declined, Selected but not joined",
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
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Reset modal state each time it opens
      setCsvFile(null);
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
      // addApplicants(processedData);

      setSuccessCount(processedData.length);
      setShowSuccess(true);

      // Show toast
      toast({
        title: "✅ Import Successful",
        description: `Successfully imported ${processedData.length} applicant${processedData.length > 1 ? 's' : ''}!`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
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
        "Offer Sent",
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
      "85.5",
      "90",
      "78.5",
      "85",
      "General",
      "Hindu",
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-[700px] max-h-[90vh] overflow-hidden p-0 sm:rounded-lg">
        <div className="flex max-h-[90vh] flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Import Applicants from CSV</DialogTitle>
          <DialogDescription>
            Choose a template and upload your CSV file. Use "Full Student Data" to create new students or "Sessions Update" to update screening exam/interview rounds for existing students.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={() => downloadTemplate('full')}
                variant="outline"
                className="flex items-center gap-2 text-xs sm:text-sm"
                type="button"
              >
                <Download className="h-4 w-4" />
                Full Student Data
              </Button>
              <Button
                onClick={() => downloadTemplate('update')}
                variant="outline"
                className="flex items-center gap-2 text-xs sm:text-sm"
                type="button"
              >
                <Download className="h-4 w-4" />
                Sessions Update
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              • <strong>Full Student Data:</strong> Create new students with complete information<br/>
              • <strong>Sessions Update:</strong> Update existing students' stages and offer letter updates based on their email addresses.
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
          className="mt-2 w-full flex items-center gap-2 sm:w-auto"
        >
          {isProcessing && <Loader2 className="animate-spin h-4 w-4" />}
          {isProcessing ? "Importing..." : "Import"}
        </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CSVImportModal;
