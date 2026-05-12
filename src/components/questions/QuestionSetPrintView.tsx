import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, Type, Grid, Settings2, Languages, Eye, Layout, FileText, Minus, Plus } from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface QuestionSetPrintViewProps {
  set: any;
  difficultyLevels: any[];
  onClose: () => void;
}

type FontStyle = 'sans' | 'serif' | 'mono';
type Template = 'standard' | 'compact' | 'modern';
type Language = 'english' | 'hindi' | 'marathi';

export function QuestionSetPrintView({ set, difficultyLevels, onClose }: QuestionSetPrintViewProps) {
  const [fontSize, setFontSize] = useState(14);
  const [fontStyle, setFontStyle] = useState<FontStyle>('serif');
  const [template, setTemplate] = useState<Template>('standard');
  const [language, setLanguage] = useState<Language>('english');
  const [showAnswers, setShowAnswers] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [lineSpacing, setLineSpacing] = useState(1.5);
  const [columns, setColumns] = useState(1);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const getFontFamily = () => {
    switch (fontStyle) {
      case 'sans': return 'font-sans';
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      default: return 'font-serif';
    }
  };

  const getQuestionText = (question: any) => {
    if (language === 'hindi') return question.hindi_text || question.english_text || question.question_text || question.question || "N/A";
    if (language === 'marathi') return question.marathi_text || question.english_text || question.question_text || question.question || "N/A";
    return question.english_text || question.question_text || question.question || "N/A";
  };

  const getOptionText = (question: any, optIndex: number) => {
    const englishOption = question.english_options?.[optIndex];
    const hindiOption = question.hindi_options?.[optIndex];
    const marathiOption = question.marathi_options?.[optIndex];

    const getVal = (val: any) => {
      if (!val) return "";
      if (typeof val === 'string') return val;
      return val.text || val.value || "";
    };

    if (language === 'hindi') return getVal(hindiOption) || getVal(englishOption) || "";
    if (language === 'marathi') return getVal(marathiOption) || getVal(englishOption) || "";
    return getVal(englishOption) || "";
  };

  const isCorrect = (question: any, optIndex: number) => {
    const optionId = optIndex + 1; // Assuming 1-based index for answer key
    return question.answer_key && question.answer_key.includes(optionId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-50 overflow-hidden print:bg-white print:static print:inset-auto print:z-0 print:h-auto print:overflow-visible">
      {/* Header - Hidden on Print */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose} className="text-slate-600">
            Cancel
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <h1 className="text-lg font-semibold text-slate-900">Print Preview: {set.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
          <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Download
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
        {/* Style Editor Sidebar - Hidden on Print */}
        <aside className="w-80 border-r bg-white flex flex-col print:hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              {/* Language Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                  <Languages className="h-4 w-4" />
                  <span>Language</span>
                </div>
                <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="marathi">Marathi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Typography */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                  <Type className="h-4 w-4" />
                  <span>Typography</span>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">Font Family</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['serif', 'sans', 'mono'] as FontStyle[]).map((f) => (
                      <Button
                        key={f}
                        variant={fontStyle === f ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFontStyle(f)}
                        className="capitalize"
                      >
                        {f}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">Font Size</Label>
                    <span className="text-sm font-medium">{fontSize}px</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFontSize(Math.max(10, fontSize - 1))}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Slider 
                      value={[fontSize]} 
                      min={10} 
                      max={24} 
                      step={1} 
                      onValueChange={([val]) => setFontSize(val)} 
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFontSize(Math.min(30, fontSize + 1))}>
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-slate-500 uppercase tracking-wider">Line Spacing</Label>
                    <span className="text-sm font-medium">{lineSpacing}</span>
                  </div>
                  <Slider 
                    value={[lineSpacing]} 
                    min={1} 
                    max={2.5} 
                    step={0.1} 
                    onValueChange={([val]) => setLineSpacing(val)} 
                  />
                </div>
              </div>

              <Separator />

              {/* Template & Layout */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                  <Layout className="h-4 w-4" />
                  <span>Layout</span>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">Template Style</Label>
                  <Select value={template} onValueChange={(val) => setTemplate(val as Template)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Assessment</SelectItem>
                      <SelectItem value="compact">Compact List</SelectItem>
                      <SelectItem value="modern">Modern Clean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">Columns</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2].map((c) => (
                      <Button
                        key={c}
                        variant={columns === c ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setColumns(c)}
                      >
                        {c} {c === 1 ? 'Column' : 'Columns'}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs text-slate-500 uppercase tracking-wider">Density</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['comfortable', 'compact'] as const).map((d) => (
                      <Button
                        key={d}
                        variant={density === d ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDensity(d)}
                        className="capitalize"
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Visibility Controls */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                  <Settings2 className="h-4 w-4" />
                  <span>Options</span>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-answers" className="text-sm cursor-pointer">Show Correct Answers</Label>
                  <Switch id="show-answers" checked={showAnswers} onCheckedChange={setShowAnswers} />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-metadata" className="text-sm cursor-pointer">Show Question Info</Label>
                  <Switch id="show-metadata" checked={showMetadata} onCheckedChange={setShowMetadata} />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-instructions" className="text-sm cursor-pointer">Show Instructions</Label>
                  <Switch id="show-instructions" checked={showInstructions} onCheckedChange={setShowInstructions} />
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Preview Area */}
        <main className="flex-1 overflow-auto bg-slate-200 p-8 print:p-0 print:bg-white print:overflow-visible">
          <div 
            ref={printRef}
            className={`mx-auto bg-white shadow-2xl print:shadow-none min-h-[29.7cm] w-[21cm] p-[2cm] ${getFontFamily()}`}
            style={{ 
              fontSize: `${fontSize}px`,
              lineHeight: lineSpacing,
              color: '#1a1a1a'
            }}
          >
            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: A4;
                  margin: 0;
                }
                .no-print {
                  display: none !important;
                  height: 0 !important;
                  width: 0 !important;
                  overflow: hidden !important;
                }
                body {
                  margin: 0;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
                .print-container {
                  width: 210mm;
                  min-height: 297mm;
                  padding: 20mm;
                  margin: 0;
                }
              }
              .modern-header {
                background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
                color: white;
                padding: 3rem 2rem;
                margin: -2cm -2cm 3rem -2cm;
                text-align: left;
              }
              .modern-question-card {
                border-left: 4px solid #3b82f6;
                padding-left: 1.5rem;
                margin-bottom: 2rem;
              }
            `}} />

            {/* Assessment Header */}
            {template === 'modern' ? (
              <div className="modern-header">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-4xl font-black mb-2 tracking-tighter uppercase">{set.name}</h1>
                    <p className="text-slate-300 font-medium">{set.description || 'ADMISSION SCREENING ASSESSMENT'}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Assessment ID</div>
                    <div className="text-xl font-mono">SET-{set.id?.toString().padStart(4, '0')}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-slate-700/50">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Student Name</div>
                    <div className="h-8 border-b border-slate-600 w-full"></div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registration ID</div>
                    <div className="h-8 border-b border-slate-600 w-full"></div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Date</div>
                    <div className="h-8 border-b border-slate-600 w-full"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-12 text-center border-b-2 border-slate-900 pb-8">
                <h1 className="text-3xl font-bold mb-2 uppercase tracking-tight">{set.name}</h1>
                {set.description && <p className="text-slate-600 italic mb-4">{set.description}</p>}
                
                <div className="grid grid-cols-2 gap-4 text-left mt-6 text-sm border p-4 rounded bg-slate-50 print:bg-transparent">
                  <div>
                    <div className="flex justify-between border-b pb-1 mb-1">
                      <span className="font-bold">Student Name:</span>
                      <span className="border-b border-dotted flex-1 ml-2"></span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="font-bold">Roll Number:</span>
                      <span className="border-b border-dotted flex-1 ml-2"></span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between border-b pb-1 mb-1">
                      <span className="font-bold">Date:</span>
                      <span className="border-b border-dotted flex-1 ml-2"></span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="font-bold">Score:</span>
                      <span className="border-b border-dotted flex-1 ml-2"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showInstructions && (
              <div className="mb-8 p-4 bg-slate-50 border rounded text-sm print:bg-transparent">
                <h3 className="font-bold mb-2 uppercase text-xs tracking-wider">General Instructions:</h3>
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  <li>Read all questions carefully before answering.</li>
                  <li>Each question has 4 options. Select only one correct option.</li>
                  <li>Total questions: {set.questions?.length || 0}</li>
                  <li>All questions carry equal marks.</li>
                </ul>
              </div>
            )}

            {/* Questions List */}
            <div className={`grid ${columns > 1 ? 'grid-cols-2 gap-x-12 gap-y-8' : 'space-y-10'}`}>
              {set.questions?.map((question: any, idx: number) => (
                <div key={question.id || idx} className={`break-inside-avoid ${template === 'modern' ? 'modern-question-card' : ''}`}>
                  <div className="flex items-start gap-4 mb-4">
                    <span className={`font-bold text-lg leading-tight min-w-[1.5em] ${template === 'modern' ? 'text-blue-600' : ''}`}>
                      {idx + 1}.
                    </span>
                    <div className="flex-1">
                      <div className={`font-medium whitespace-pre-line leading-relaxed ${density === 'compact' ? 'mb-2' : 'mb-4'}`}>
                        {getQuestionText(question)}
                      </div>
                      
                      {showMetadata && null}

                      {/* Options */}
                      <div className={`grid ${template === 'compact' ? 'grid-cols-2' : 'grid-cols-1'} ${density === 'compact' ? 'gap-1' : 'gap-3'}`}>
                        {[0, 1, 2, 3].map((optIdx) => {
                          const optionText = getOptionText(question, optIdx);
                          if (!optionText) return null;
                          const correct = isCorrect(question, optIdx);
                          
                          return (
                            <div 
                              key={optIdx} 
                              className={`flex items-start gap-3 p-2 rounded transition-colors ${
                                showAnswers && correct ? 'bg-green-50 border-green-200 border' : 'bg-transparent'
                              }`}
                            >
                              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                                template === 'modern' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-300'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <div className={`flex-1 ${showAnswers && correct ? 'font-semibold text-green-800' : 'text-slate-800'}`}>
                                {optionText}
                                {showAnswers && correct && <span className="ml-2 text-[10px] uppercase font-bold">(Correct)</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {columns === 1 && idx < (set.questions?.length - 1) && (
                    <Separator className="mt-8 opacity-30" />
                  )}
                </div>
              ))}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
