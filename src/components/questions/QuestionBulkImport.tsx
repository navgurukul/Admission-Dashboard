
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
      '"What is 2+2?",multiple_choice,"[{""id"":""1"",""text"":""3""},{""id"":""2"",""text"":""4""},{""id"":""3"",""text"":""5""}]","2","Basic arithmetic","easy","EN",1,"mathematics",30',
      '"HTML stands for HyperText Markup Language",true_false,"[{""id"":""true"",""text"":""True""},{""id"":""false"",""text"":""False""}]","true","HTML is indeed HyperText Markup Language","easy","EN",1,"html-basics",45'
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

        results.data.forEach((row, index) => {
          try {
            // Validate required fields
            if (!row.question_text || !row.question_type || !row.correct_answer_json) {
              parseErrors.push(`Row ${index + 1}: Missing required fields`);
              return;
            }

            // Parse JSON fields
            let options = null;
            let correctAnswer = null;

            if (row.options_json) {
              options = JSON.parse(row.options_json);
            }
            
            correctAnswer = JSON.parse(row.correct_answer_json);

            const question = {
              question_text: row.question_text,
              question_type: row.question_type,
              options,
              correct_answer: correctAnswer,
              explanation: row.explanation || '',
              difficulty_level: row.difficulty_level || 'medium',
              language: row.language || 'EN',
              points: parseInt(row.points) || 1,
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

    for (let i = 0; i < parsedData.length; i++) {
      try {
        const questionData = {
          ...parsedData[i],
          created_by: userId
        };

        // Check for duplicates by question text
        const { data: existing } = await supabase
          .from('questions')
          .select('id')
          .eq('question_text', questionData.question_text)
          .single();

        if (existing) {
          results.duplicates++;
        } else {
          const { error } = await supabase
            .from('questions')
            .insert([questionData]);

          if (error) {
            results.errors++;
            importErrors.push(`Question ${i + 1}: ${error.message}`);
          } else {
            results.success++;
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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
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
      setCsvData(e.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Import questions in bulk using CSV format. Make sure to follow the template structure for successful import.
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
          <Button variant="outline" onClick={() => document.getElementById('csv-upload').click()}>
            <Upload className="w-4 h-4 mr-2" />
            Upload CSV File
          </Button>
        </div>
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
              Parse CSV Data
            </Button>
            
            {importStatus === 'parsed' && (
              <Button onClick={importQuestions}>
                Import {parsedData.length} Questions
              </Button>
            )}
          </div>
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
            <div className="space-y-2">
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
