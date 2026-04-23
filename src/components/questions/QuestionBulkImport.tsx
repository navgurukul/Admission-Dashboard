import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import Papa from "papaparse";
import { bulkUploadQuestions, getQuestions } from "@/utils/api";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";


interface QuestionBulkImportProps {
  onImportComplete: () => void;
}

interface CSVRow {
  difficulty_level?: string;
  question_type?: string;
  english_text?: string;
  hindi_text?: string;
  marathi_text?: string;
  english_options?: string;
  hindi_options?: string;
  marathi_options?: string;
  answer_key?: string;
  topic?: string;
}

interface Question {
  id?: string;
  question_text?: string;
  english_text?: string;
  hindi_text?: string;
  marathi_text?: string;
  question_type: string;
  options?: any;
  english_options?: string[];
  hindi_options?: string[];
  marathi_options?: string[];
  correct_answer?: any;
  answer_key?: number[];
  explanation?: string;
  difficulty_level: string | number;
  language?: string;
  points?: number;
  tags?: string[];
  time_limit_seconds?: number;
  topic?: string;
  status?: boolean;
  added_by?: string;
}

export function QuestionBulkImport({
  onImportComplete,
}: QuestionBulkImportProps) {
  const [csvData, setCsvData] = useState("");
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [importStatus, setImportStatus] = useState("idle"); // idle, parsing, importing, complete, error
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({
    success: 0,
    errors: 0,
    duplicates: 0,
  });
  const [errors, setErrors] = useState<string[]>([]);

  const { toast } = useToast();
  const { user: googleUser } = useGoogleAuth();

  const downloadTemplate = () => {
    const template = [
      "difficulty_level,question_type,english_text,hindi_text,marathi_text,english_options,hindi_options,marathi_options,answer_key,topic",
      '1,MCQ,"What is the weight of one apple if 3 apples and 2 oranges weigh 260g and the orange is 40g?","यदि 3 सेब और 2 संतरे का वजन 260 ग्राम है और संतरे का वजन 40 ग्राम है, तो एक सेब का वजन क्या है?","जर ३ सफरचंदे आणि २ संत्र्यांचे वजन २६० ग्रॅम असेल आणि संत्र्याचे वजन ४० ग्रॅम असेल, तर एका सफरचंदाचे वजन किती?","60g; 50g; 70g; 40g","60 ग्राम; 50 ग्राम; 70 ग्राम; 40 ग्राम","६० ग्रॅम; ५० ग्रॅम; ७० ग्रॅम; ४० ग्रॅम","1",2',
      '2,MCQ,"Weight of one banana is 100 grams. Weight of one mango is 200 grams. Total weight of fruits is 4000 grams. How many bananas and mangoes are there?","एक केले का वजन 100 ग्राम है और एक आम का वजन 200 ग्राम है। फलों का कुल वजन 4000 ग्राम है। कितने केले और आम हैं?","एका केळ्याचं वजन १०० ग्राम आहे. एका आंब्याचं वजन २०० ग्राम आहे. एकूण फळांचं वजन ४००० ग्राम आहे. किती केळी आणि आंबे असतील?","20 bananas, 15 mangoes; 30 bananas, 10 mangoes; 4 bananas, 18 mangoes; 20 bananas, 20 mangoes","20 केले, 15 आम; 30 केले, 10 आम; 4 केले, 18 आम; 20 केले, 20 आम","२० केळी, १५ आंबे; ३० केळी, १० आंबे; ४ केळी, १८ आंबे; २० केळी, २० आंबे","3",2',
      '2,MCQ,"The number of apples is double the number of oranges. Total weight is 5600g. Apple=80g, Orange=60g. How many apples?","सेबों की संख्या संतरे से दोगुनी है। कुल वजन 5600 ग्राम है। सेब=80 ग्राम, संतरा=60 ग्राम। कितने सेब हैं?","सफरचंदांची संख्या संत्र्यांपेक्षा दुप्पट आहे. एकूण वजन ५६०० ग्रॅम आहे. सफरचंद=८० ग्रॅम, संत्रा=६० ग्रॅम. किती सफरचंद आहेत?","50; 60; 80; 100","50; 60; 80; 100","५०; ६०; ८०; १००","1",2',
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "multi_language_question_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCsvData = () => {
    if (!csvData.trim()) {
      toast({
        title: "⚠️ No Data",
        description: "Please paste CSV data or upload a file",
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    setImportStatus("parsing");

    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrors(results.errors.map((err) => err.message));
          setImportStatus("error");
          return;
        }

        const validQuestions = [];
        const parseErrors = [];

        (results.data as CSVRow[]).forEach((row, index) => {
          try {
            // Validate required fields for multi-language format
            if (!row.english_text || !row.question_type || !row.answer_key) {
              parseErrors.push(
                `Row ${index + 1}: Missing required fields (english_text, question_type, answer_key)`,
              );
              return;
            }

            // Validate question type
            const validTypes = [
              "MCQ",
              "TF",
              "SA",
              "multiple_choice",
              "true_false",
              "short_answer",
            ];
            if (!validTypes.includes(row.question_type)) {
              parseErrors.push(
                `Row ${index + 1}: Invalid question_type. Must be one of: ${validTypes.join(", ")}`,
              );
              return;
            }

            // Helper: Smart Parse Options (JSON or Semicolon Separated)
            const smartParseOptions = (val: string) => {
              if (!val || !val.trim()) return [];
              const trimmed = val.trim();
              if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
                try {
                  return JSON.parse(trimmed);
                } catch (e) {}
              }
              // Fallback to semicolon separation
              return trimmed.split(";").map((opt, idx) => ({
                id: idx + 1,
                text: opt.trim(),
              }));
            };

            // Helper: Smart Parse Answer Key
            const smartParseAnswerKey = (val: string) => {
              if (!val || !val.trim()) return null;
              const trimmed = val.trim();
              if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
                try {
                  return JSON.parse(trimmed);
                } catch (e) {}
              }
              if (!isNaN(Number(trimmed))) {
                return [Number(trimmed)];
              }
              return null;
            };

            // Parse options and answers
            const englishOptions = smartParseOptions(row.english_options || "");
            const hindiOptions = smartParseOptions(row.hindi_options || "");
            const marathiOptions = smartParseOptions(row.marathi_options || "");
            const correctAnswer = smartParseAnswerKey(row.answer_key || "");

            if (!correctAnswer) {
              parseErrors.push(
                `Row ${index + 1}: Invalid answer_key format. Use [1] or simply 1.`,
              );
              return;
            }

            // Map question type to standard format
            const typeMapping = {
              MCQ: "multiple_choice",
              TF: "true_false",
              SA: "short_answer",
            };

            const finalQuestionType =
              typeMapping[row.question_type] || row.question_type;

            // Map difficulty level
            const difficultyMap = {
              "1": "easy",
              "2": "medium",
              "3": "hard",
              easy: "easy",
              medium: "medium",
              hard: "hard",
            };

            const question = {
              // Multi-language texts
              english_text: row.english_text,
              hindi_text: row.hindi_text || "",
              marathi_text: row.marathi_text || "",

              // For backward compatibility - main text
              question_text: row.english_text,

              question_type: finalQuestionType,

              // Multi-language options
              english_options: englishOptions,
              hindi_options: hindiOptions,
              marathi_options: marathiOptions,

              // For backward compatibility - main options
              options: englishOptions.map((opt, idx) => ({
                id: (idx + 1).toString(),
                text: typeof opt === "string" ? opt : opt?.text || JSON.stringify(opt),
              })),

              // Answer formats
              correct_answer: correctAnswer,
              answer_key: correctAnswer,

              explanation: "",
              difficulty_level: difficultyMap[row.difficulty_level] || "medium",
              language: "multi", // Indicate multi-language
              points: 1,
              tags: [],
              time_limit_seconds: 30,
              topic: row.topic || "1",
              status: true,
            };

            validQuestions.push(question);
          } catch (error) {
            parseErrors.push(`Row ${index + 1}: ${error.message}`);
          }
        });

        if (parseErrors.length > 0) {
          setErrors(parseErrors);
          setImportStatus("error");
        } else {
          setParsedData(validQuestions);
          setImportStatus("parsed");
          toast({
            title: "✅ CSV Parsed Successfully",
            description: `Found ${validQuestions.length} valid questions`,
            variant: "default",
            className: "border-green-500 bg-green-50 text-green-900",
          });
        }
      },
      error: (error) => {
        setErrors([error.message]);
        setImportStatus("error");
      },
    });
  };

  // In your component - UPDATED import function
  const importQuestions = async () => {
    if (!csvData.trim()) {
      toast({
        title: "⚠️ No Data",
        description: "Please parse CSV data first",
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    setImportStatus("importing");
    setImportProgress(0);

    if (!googleUser?.id) {
      toast({
        title: "⚠️ Authentication Error",
        description: "You must be logged in to import questions",
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      setImportStatus("error");
      return;
    }

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // ✅ FIX: Send the ORIGINAL CSV data, not parsed data
      const res = await bulkUploadQuestions(csvData);

      clearInterval(progressInterval);
      setImportProgress(100);

      // Handle results
      setImportResults({
        success: res.data?.success || res.success || parsedData.length,
        errors: res.data?.errors?.length || res.errors?.length || 0,
        duplicates: res.data?.duplicates || res.duplicates || 0,
      });

      if (res.data?.errors?.length || res.errors?.length) {
        setErrors(res.data?.errors || res.errors || []);
      }

      setImportStatus("complete");

      toast({
        title: "✅ Import Complete",
        description: `Successfully imported ${res.data?.success || res.success || parsedData.length} questions.`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });

      onImportComplete();
    } catch (error: any) {
      console.error("Import error:", error);
      const friendlyError = getFriendlyErrorMessage(error);
      setErrors([friendlyError]);
      setImportStatus("error");
      toast({
        title: "❌ Import Failed",
        description: friendlyError,
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        title: "⚠️ Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });

      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") setCsvData(e.target.result);
    };
    reader.readAsText(file);
  };

  const resetImport = () => {
    setCsvData("");
    setParsedData([]);
    setImportStatus("idle");
    setImportProgress(0);
    setImportResults({ success: 0, errors: 0, duplicates: 0 });
    setErrors([]);
  };

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <p className="font-semibold mb-1">How to format your CSV:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Options:</strong> Separate choices with a semicolon (e.g. Option A; Option B; Option C)</li>
            <li><strong>Answer Key:</strong> Just use the number of the correct option (e.g. 1 for the first option)</li>
            <li><strong>Languages:</strong> You can provide text and options for English, Hindi, and Marathi.</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" /> Download Template
        </Button>

        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("csv-upload")?.click()}
          >
            <Upload className="w-4 h-4 mr-2" /> Upload CSV File
          </Button>
        </div>

        {importStatus !== "idle" && (
          <Button variant="outline" onClick={resetImport}>
            Reset
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="Paste CSV data or upload a file..."
            rows={10}
            className="font-mono text-sm"
          />

          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={parseCsvData}
              disabled={!csvData.trim() || importStatus === "parsing"}
            >
              {importStatus === "parsing" ? "Parsing..." : "Parse CSV Data"}
            </Button>

            {importStatus === "parsed" && (
              <Button onClick={importQuestions}>
                Import {parsedData.length} Questions
              </Button>
            )}
          </div>

          {importStatus === "parsed" && (
            <div className="mt-4">
              <Badge variant="secondary">
                {parsedData.length} questions ready for import
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {importStatus === "importing" && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Importing questions...
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(importProgress)}%
                </span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {importStatus === "complete" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-medium">Import Complete</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResults.success}
                </div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResults.duplicates}
                </div>
                <div className="text-sm text-muted-foreground">Duplicates</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResults.errors}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Import Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className="text-sm text-red-600 bg-red-50 p-2 rounded"
                >
                  {error}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
