import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import Papa from 'papaparse';

interface QuestionBulkImportProps {
  onImportComplete: () => void;
}

interface CSVRow {
  question_text?: string;
  question_type?: string;
  options_json?: string;
  correct_answer_json?: string;
  explanation?: string;
  difficulty_level?: string;
  language?: string;
  points?: string;
  tags?: string;
  time_limit_seconds?: string;
}

export function QuestionBulkImport({ onImportComplete }: QuestionBulkImportProps) {
  const [csvData, setCsvData] = useState('');
  const [parsedData, setParsedData] = useState([]);
  const [importStatus, setImportStatus] = useState('idle'); // idle, parsing, importing, complete, error
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, errors: 0, duplicates: 0 });
  const [errors, setErrors] = useState([]);
  
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      'question_text,question_type,options_json,correct_answer_json,explanation,difficulty_level,language,points,tags,time_limit_seconds',
      '"What is 2+2?",multiple_choice,"[{""id"":""1"",""text"":""3""},{""id"":""2"",""text"":""4""},{""id"":""3"",""text"":""5""},{""id"":""4"",""text"":""6""}]","2","Basic arithmetic operation","easy","EN",1,"mathematics,arithmetic",30',
      '"HTML stands for HyperText Markup Language",true_false,"[{""id"":""true"",""text"":""True""},{""id"":""false"",""text"":""False""}]","true","HTML is indeed HyperText Markup Language","easy","EN",1,"html,web-development",45',
      '"What is the capital of France?",short_answer,"","Paris","The capital city of France is Paris","medium","EN",2,"geography,capitals",60',
      '"Explain the concept of Object-Oriented Programming and its main principles.",long_answer,"","Object-Oriented Programming (OOP) is a programming paradigm based on the concept of objects. The main principles are: 1) Encapsulation - bundling data and methods together, 2) Inheritance - creating new classes based on existing ones, 3) Polymorphism - ability to take multiple forms, 4) Abstraction - hiding complex implementation details.","This tests understanding of fundamental programming concepts","hard","EN",5,"programming,oop,computer-science",300',
      '"Write a function to reverse a string in Python",coding,"","def reverse_string(s):\n    return s[::-1]\n\n# Alternative solution:\n# def reverse_string(s):\n#     return \'\'.join(reversed(s))","Tests basic Python string manipulation skills","medium","EN",3,"python,coding,strings",600',
      '"The ____ of a circle is the distance from its center to any point on its circumference.",fill_in_blank,"","radius","The radius is the distance from center to circumference","easy","EN",1,"mathematics,geometry",45'
    ].join('\n');

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'question_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCsvData = () => {
    if (!csvData.trim()) {
      toast({
        title: "No Data",
        description: "Please paste CSV data or upload a file",
        variant: "destructive"
      });
      return;
    }

    setImportStatus('parsing');
    
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrors(results.errors.map(err => err.message));
          setImportStatus('error');
          return;
        }

        const validQuestions = [];
        const parseErrors = [];

        (results.data as CSVRow[]).forEach((row, index) => {
          try {
            // Validate required fields
            if (!row.question_text || !row.question_type || !row.correct_answer_json) {
              parseErrors.push(`Row ${index + 1}: Missing required fields (question_text, question_type, correct_answer_json)`);
              return;
            }

            // Validate question type
            const validTypes = ['multiple_choice', 'true_false', 'short_answer', 'long_answer', 'coding', 'fill_in_blank'];
            if (!validTypes.includes(row.question_type)) {
              parseErrors.push(`Row ${index + 1}: Invalid question_type. Must be one of: ${validTypes.join(', ')}`);
              return;
            }

            // Parse JSON fields
            let options = null;
            let correctAnswer = null;

            if (row.options_json && row.options_json.trim()) {
              try {
                options = JSON.parse(row.options_json);
              } catch (e) {
                parseErrors.push(`Row ${index + 1}: Invalid JSON in options_json`);
                return;
              }
            }
            
            try {
              correctAnswer = JSON.parse(row.correct_answer_json);
            } catch (e) {
              // If JSON parsing fails, treat as string
              correctAnswer = row.correct_answer_json;
            }

            // Validate difficulty level
            const validDifficulties = ['easy', 'medium', 'hard'];
            const difficulty = row.difficulty_level || 'medium';
            if (!validDifficulties.includes(difficulty)) {
              parseErrors.push(`Row ${index + 1}: Invalid difficulty_level. Must be one of: ${validDifficulties.join(', ')}`);
              return;
            }

            const question = {
              question_text: row.question_text,
              question_type: row.question_type,
              options,
              correct_answer: correctAnswer,
              explanation: row.explanation || '',
              difficulty_level: difficulty,
              language: row.language || 'EN',
              points: parseInt(row.points || '1') || 1,
              tags: row.tags ? row.tags.split(',').map(t => t.trim()) : [],
              time_limit_seconds: row.time_limit_seconds ? parseInt(row.time_limit_seconds) : null
            };

            validQuestions.push(question);
          } catch (error) {
            parseErrors.push(`Row ${index + 1}: ${error.message}`);
          }
        });

        if (parseErrors.length > 0) {
          setErrors(parseErrors);
          setImportStatus('error');
        } else {
          setParsedData(validQuestions);
          setImportStatus('parsed');
          toast({
            title: "CSV Parsed Successfully",
            description: `Found ${validQuestions.length} valid questions`
          });
        }
      },
      error: (error) => {
        setErrors([error.message]);
        setImportStatus('error');
      }
    });
  };

  const importQuestions = async () => {
    if (parsedData.length === 0) return;

    setImportStatus('importing');
    setImportProgress(0);
    
    const results = { success: 0, errors: 0, duplicates: 0 };
    const importErrors = [];

    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to import questions",
        variant: "destructive"
      });
      setImportStatus('error');
      return;
    }

    // Generate a batch ID for this import
    const batchId = crypto.randomUUID();

    for (let i = 0; i < parsedData.length; i++) {
      try {
        const questionData = {
          ...parsedData[i],
          created_by: userId
        };

        // Check for duplicates by question text in main questions table
        const { data: existingQuestion } = await supabase
          .from('questions')
          .select('id')
          .eq('question_text', questionData.question_text)
          .single();

        if (existingQuestion) {
          results.duplicates++;
        } else {
          // Insert into imported_questions table first
          const { error: importError } = await supabase
            .from('imported_questions')
            .insert([{
              ...questionData,
              import_batch_id: batchId,
              imported_by: userId,
              is_processed: false
            }]);

          if (importError) {
            results.errors++;
            importErrors.push(`Question ${i + 1}: Failed to record import - ${importError.message}`);
          } else {
            // Insert into main questions table
            const { error: questionError } = await supabase
              .from('questions')
              .insert([questionData]);

            if (questionError) {
              results.errors++;
              importErrors.push(`Question ${i + 1}: Failed to create question - ${questionError.message}`);
            } else {
              results.success++;
              
              // Mark as processed in imported_questions
              await supabase
                .from('imported_questions')
                .update({ is_processed: true })
                .eq('import_batch_id', batchId)
                .eq('question_text', questionData.question_text);
            }
          }
        }
      } catch (error) {
        results.errors++;
        importErrors.push(`Question ${i + 1}: ${error.message}`);
      }

      setImportProgress(((i + 1) / parsedData.length) * 100);
    }

    setImportResults(results);
    setErrors(importErrors);
    setImportStatus('complete');

    toast({
      title: "Import Complete",
      description: `Successfully imported ${results.success} questions. ${results.duplicates} duplicates skipped. ${results.errors} errors.`,
      variant: results.errors > 0 ? "destructive" : "default"
    });

    if (results.success > 0) {
      setTimeout(() => {
        onImportComplete();
      }, 2000);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setCsvData(result);
      }
    };
    reader.readAsText(file);
  };

  const resetImport = () => {
    setCsvData('');
    setParsedData([]);
    setImportStatus('idle');
    setImportProgress(0);
    setImportResults({ success: 0, errors: 0, duplicates: 0 });
    setErrors([]);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Import questions in bulk using CSV format. Questions will be added to both the main Question Library and tracked in the import history. Make sure to follow the template structure for successful import.
        </AlertDescription>
      </Alert>

      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
        
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <Button variant="outline" onClick={() => document.getElementById('csv-upload')?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV File
          </Button>
        </div>

        {importStatus !== 'idle' && (
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
            placeholder="Paste your CSV data here or upload a file..."
            rows={10}
            className="font-mono text-sm"
          />
          
          <div className="flex items-center gap-2 mt-4">
            <Button 
              onClick={parseCsvData}
              disabled={!csvData.trim() || importStatus === 'parsing'}
            >
              {importStatus === 'parsing' ? 'Parsing...' : 'Parse CSV Data'}
            </Button>
            
            {importStatus === 'parsed' && (
              <Button onClick={importQuestions} disabled={importStatus === 'importing'}>
                Import {parsedData.length} Questions
              </Button>
            )}
          </div>

          {importStatus === 'parsed' && (
            <div className="mt-4">
              <Badge variant="secondary">
                {parsedData.length} questions ready for import
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {importStatus === 'importing' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Importing questions...</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(importProgress)}%
                </span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {importStatus === 'complete' && (
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
                <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
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
