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
      '1,MCQ,"Try to understand the given data and convert unknowns into variables. Use equations like 3x + 2y = 100. Even if you\'re not confident in maths, try with focus – you’ll be able to solve it.\n\nWeight of one apple is 60 grams. And weight of one orange is 40 grams. You have 3600 grams of fruits. Which of the following combinations has 3600 grams of weight?","इन प्रश्नों को करने के लिए आप सोचिए - आपके पास जो जानकारी नहीं है, उसे एक्स और वाई जैसे वेरिएबल्स दे कर मनानी पड़ेगी। फिर उन चरों का समीकरण बन सकता है जैसे 3x+2y=100. अगर आप गणित से डरते हैं तो भी मत घबराइए, आप थोड़ा सा ध्यान लगा कर सोचेंगे तो कुछ प्रश्न भी हल करेंगे।\n\nएक सेब का वजन 60 ग्राम है और एक संतरे का वजन 40 ग्राम है। आपके पास 3600 ग्राम फल हैं। निम्नलिखित में से कौन सा संयोजन 3600 ग्राम के बराबर है?","प्रश्न को हल करने के लिए दिए गए आंकड़ों को ध्यानपूर्वक समझें और जिन जानकारियों का उल्लेख नहीं किया गया है, उन्हें x और y जैसे चर (variables) मान लें।\nइसके आधार पर आप एक समीकरण बना सकते हैं, जैसे: 3x + 2y = 100।\nयदि आपको गणित से डर लगता है या आप इसमें बहुत आत्मविश्वासी नहीं हैं, तब भी चिंता न करें —\nथोड़ा ध्यान लगाकर और मन लगाकर प्रयास करेंगे, तो आप निश्चित रूप से इन प्रश्नों को हल कर पाएंगे।\n\nएका सफरचंदाचं वजन ६० ग्राम आहे आणि एका संत्र्याचं वजन ४० ग्राम आहे। तुमच्याकडे एकूण ३६०० ग्राम फळं आहेत। खालीलपैकी कोणतं संयोजन बरोबर आहे?","[{""id"":1,""text"":""40 apples, 30 oranges""},{""id"":2,""text"":""42 apples, 28 oranges""},{""id"":3,""text"":""45 apples, 20 oranges""},{""id"":4,""text"":""35 apples, 35 oranges""}]","[]","[]","[1]",2',
      '2,MCQ,"Weight of one banana is 100 grams. Weight of one mango is 200 grams. Total weight of fruits is 4000 grams. How many bananas and mangoes are there?","एक केले का वजन 100 ग्राम है और एक आम का वजन 200 ग्राम है। फलों का कुल वजन 4000 ग्राम है। कितने केले और आम हैं?","एका केळ्याचं वजन १०० ग्राम आहे. एका आंब्याचं वजन २०० ग्राम आहे. एकूण फळांचं वजन ४००० ग्राम आहे. किती केळी आणि आंबे असतील?","[{""id"":1,""text"":""20 bananas, 15 mangoes""},{""id"":2,""text"":""30 bananas, 10 mangoes""},{""id"":3,""text"":""4 bananas, 18 mangoes""},{""id"":4,""text"":""20 bananas, 20 mangoes""}]","[]","[]","[3]",2',
      '2,MCQ,"Weight of one apple is 80 grams and one orange weighs 60 grams. You have a total of 5500 grams of fruits. The number of apples is double the number of oranges. How many apples do you have?","एक सेब का वजन 80 ग्राम है और एक संतरे का वजन 60 ग्राम है। आपके पास कुल 5600 ग्राम फल हैं। सेबों की संख्या संतरे से दोगुनी है। आपके पास कितने सेब हैं?","एका सफरचंदाचं वजन ८० ग्राम आहे आणि एका संत्र्याचं वजन ६० ग्राम आहे. तुमच्याकडे एकूण 5500 ग्राम फळं आहेत. सफरचंदांची संख्या संत्र्यांपेक्षा दुप्पट आहे. किती सफरचंदं आहेत?","[{""id"":1,""text"":""50""},{""id"":2,""text"":""60""},{""id"":3,""text"":""80""},{""id"":4,""text"":""100""}]","[]","[]","[1]",2',
      '3,MCQ,"Weight of one apple is 75 grams. One apple is 3 times heavier than an orange. The number of oranges is 5 times that of apples. You have 3600 grams of fruit. How many apples do you have?","एक सेब का वजन 90 ग्राम है। सेब संतरे से 3 गुना भारी है। संतरे की संख्या सेब से 4 गुना है। कुल वजन 6300 ग्राम है। बताएं कितने सेब हैं?","एका सफरचंदाचं वजन ९० ग्राम आहे. एक सफरचंद संत्र्याच्या वजनाच्या ३ पट आहे. संत्र्यांची संख्या सफरचंदांपेक्षा ४ पट आहे. तुमच्याकडे एकूण ६३०० ग्राम फळं आहेत. किती सफरचंदं आहेत?","[{""id"":1,""text"":""30""},{""id"":2,""text"":""32""},{""id"":3,""text"":""28""},{""id"":4,""text"":""25""}]","[]","[]","[1]",2',
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

            // Parse options and answers
            let englishOptions = [];
            let hindiOptions = [];
            let marathiOptions = [];
            let correctAnswer = null;

            try {
              // Parse English options
              if (row.english_options && row.english_options.trim()) {
                englishOptions = JSON.parse(row.english_options);
              }

              // Parse Hindi options
              if (row.hindi_options && row.hindi_options.trim()) {
                hindiOptions = JSON.parse(row.hindi_options);
              }

              // Parse Marathi options
              if (row.marathi_options && row.marathi_options.trim()) {
                marathiOptions = JSON.parse(row.marathi_options);
              }

              // Parse correct answer
              correctAnswer = JSON.parse(row.answer_key);
            } catch (e) {
              parseErrors.push(
                `Row ${index + 1}: Invalid JSON format in options or answer_key`,
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
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Import questions in bulk using CSV. Supports English/Hindi/Marathi
          text and options. Follow the template format.
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
