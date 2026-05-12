import React, { useEffect, useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  Layout, 
  FileText, 
  Table as TableIcon,
  Type,
  X
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import Papa from 'papaparse';
import { useToast } from "@/components/ui/use-toast";

interface QuestionSetDownloadPreviewProps {
  set: any;
  difficultyLevels: any[];
  onClose: () => void;
  initialLanguage?: Language;
}

type Template = 'standard' | 'compact' | 'modern';
type Language = 'english' | 'hindi' | 'marathi';
type FileFormat = 'pdf' | 'csv' | 'json';

export function QuestionSetDownloadPreview({ set, difficultyLevels, onClose, initialLanguage = 'english' }: QuestionSetDownloadPreviewProps) {
  const { toast } = useToast();
  const [template, setTemplate] = useState<Template>('standard');
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [fileFormat, setFileFormat] = useState<FileFormat>('pdf');
  const [selectionFormat, setSelectionFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    blockTag: '' as '' | 'h1' | 'h2' | 'h3',
  });
  
  const [showAnswers, setShowAnswers] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [columns, setColumns] = useState(1);
  
  // Header and Spacing states
  const [headerTitle, setHeaderTitle] = useState('Navgurukul - Screening Test');
  const [headerSubtitle, setHeaderSubtitle] = useState('pan-india-bca-SOF');
  const [headerSubSubtitle, setHeaderSubSubtitle] = useState('SOP - A');
  const [maxMarks, setMaxMarks] = useState(set.questions?.length * 2 || 0);
  const [headerGap, setHeaderGap] = useState(6);
  const [instructionGap, setInstructionGap] = useState(5);
  const [showHorizontalLine, setShowHorizontalLine] = useState(true);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage, set?.id]);

  const getValidSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const preview = printRef.current;
    if (!preview) return null;

    const anchorNode = selection.anchorNode;
    const focusNode = selection.focusNode;
    if (!anchorNode || !focusNode) return null;
    if (!preview.contains(anchorNode) || !preview.contains(focusNode)) return null;

    return { selection, range };
  };

  const withSelectionInPreview = (action: () => void, showToast = true) => {
    const selectionData = getValidSelection();
    if (!selectionData) {
      if (showToast) {
        toast({
          title: 'Select text first',
          description: 'Please select text inside the preview area to format it.',
        });
      }
      return;
    }

    action();
  };

  const updateSelectionFormatState = () => {
    const selectionData = getValidSelection();
    if (!selectionData) {
      setSelectionFormat({ bold: false, italic: false, underline: false, blockTag: '' });
      return;
    }

    const { selection } = selectionData;
    const anchorElement = getSelectionAnchorElement();
    const activeBlock = anchorElement?.closest('[data-inline-format]') as HTMLElement | null;
    const blockTag = (activeBlock?.getAttribute('data-inline-format') as '' | 'h1' | 'h2' | 'h3' | null) || '';

    setSelectionFormat({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      blockTag,
    });
  };

  const getSelectionAnchorElement = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const anchorNode = selection.anchorNode;
    if (!anchorNode) return null;

    return anchorNode.nodeType === Node.ELEMENT_NODE
      ? (anchorNode as HTMLElement)
      : anchorNode.parentElement;
  };

  const applyInlineFormat = (command: 'bold' | 'italic' | 'underline') => {
    withSelectionInPreview(() => {
      document.execCommand(command, false);
    });
  };

  const toggleBlockFormat = (tagName: 'h1' | 'h2' | 'h3') => {
    withSelectionInPreview(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (range.collapsed) {
        toast({
          title: 'Select text first',
          description: 'Please select the text you want to format.',
        });
        return;
      }

      const selectedElement = getSelectionAnchorElement()?.closest(`[data-inline-format="${tagName}"]`) as HTMLElement | null;
      if (selectedElement) {
        const parent = selectedElement.parentNode;
        if (!parent) return;

        while (selectedElement.firstChild) {
          parent.insertBefore(selectedElement.firstChild, selectedElement);
        }
        parent.removeChild(selectedElement);
        selection.removeAllRanges();
        return;
      }

      const extracted = range.extractContents();
      const wrapper = document.createElement('span');
      wrapper.setAttribute('data-inline-format', tagName);

      if (tagName === 'h1') {
        wrapper.style.fontSize = '1.5em';
        wrapper.style.fontWeight = '700';
        wrapper.style.lineHeight = '1.2';
      } else if (tagName === 'h2') {
        wrapper.style.fontSize = '1.2em';
        wrapper.style.fontWeight = '600';
        wrapper.style.lineHeight = '1.25';
      } else {
        wrapper.style.fontSize = '1.05em';
        wrapper.style.fontWeight = '500';
        wrapper.style.lineHeight = '1.3';
        wrapper.style.color = '#475569';
      }

      wrapper.appendChild(extracted);
      range.insertNode(wrapper);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(wrapper);
      selection.addRange(newRange);
    });
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      window.requestAnimationFrame(updateSelectionFormatState);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
    };
  }, []);

  const getQuestionText = (question: any) => {
    let text = "";
    if (language === 'hindi') text = question.hindi_text || question.english_text || question.question_text || question.question || "N/A";
    else if (language === 'marathi') text = question.marathi_text || question.english_text || question.question_text || question.question || "N/A";
    else text = question.english_text || question.question_text || question.question || "N/A";
    return text;
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
    const optionId = optIndex + 1;
    return question.answer_key && (Array.isArray(question.answer_key) ? question.answer_key.includes(optionId) : question.answer_key === optionId);
  };

  const uiText = {
    english: {
      instructionsTitle: 'Instructions:',
      instructionPoints: [
        'All questions are multiple-choice.',
        'Choose only one correct answer for each question.',
        'Mark the correct answer on the OMR sheet.',
      ],
      languageLabel: 'Language:',
      totalQuestionsLabel: 'Total Questions:',
      maxMarksLabel: 'Maximum Marks:',
      sectionLabel: 'MCQ',
      questionPrefix: 'Q.'
    },
    hindi: {
      instructionsTitle: 'निर्देश:',
      instructionPoints: [
        'सभी प्रश्न बहुविकल्पीय हैं।',
        'प्रत्येक प्रश्न के लिए केवल एक सही उत्तर चुनें।',
        'सही उत्तर OMR शीट पर चिन्हित करें।',
      ],
      languageLabel: 'भाषा:',
      totalQuestionsLabel: 'कुल प्रश्न:',
      maxMarksLabel: 'अधिकतम अंक:',
      sectionLabel: 'MCQ',
      questionPrefix: 'प्र.'
    },
    marathi: {
      instructionsTitle: 'सूचना:',
      instructionPoints: [
        'सर्व प्रश्न बहुपर्यायी आहेत.',
        'प्रत्येक प्रश्नासाठी फक्त एकच बरोबर उत्तर निवडा.',
        'बरोबर उत्तर OMR शीटवर चिन्हांकित करा.',
      ],
      languageLabel: 'भाषा:',
      totalQuestionsLabel: 'एकूण प्रश्न:',
      maxMarksLabel: 'कमाल गुण:',
      sectionLabel: 'MCQ',
      questionPrefix: 'प्र.'
    },
  }[language];

  const handleDownload = () => {
    if (fileFormat === 'pdf') {
      window.print();
      toast({
        title: "Generating PDF",
        description: "The print dialog has been opened.",
      });
    } else if (fileFormat === 'csv') {
      downloadCSV();
    } else if (fileFormat === 'json') {
      downloadJSON();
    }
  };

  const downloadCSV = () => {
    const data = set.questions.map((q: any, idx: number) => ({
      index: idx + 1,
      question: getQuestionText(q),
      option_a: getOptionText(q, 0),
      option_b: getOptionText(q, 1),
      option_c: getOptionText(q, 2),
      option_d: getOptionText(q, 3),
      correct_answer: q.answer_key,
      difficulty: difficultyLevels?.find((d: any) => d.id === q.difficulty_level)?.name || q.difficulty_level
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${set.name}_${language}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV Downloaded",
      description: `Question set exported as CSV in ${language}.`,
    });
  };

  const downloadJSON = () => {
    const data = {
      set_name: set.name,
      language: language,
      questions: set.questions.map((q: any) => ({
        text: getQuestionText(q),
        options: [0, 1, 2, 3].map(i => getOptionText(q, i)),
        answer_key: q.answer_key,
        difficulty: q.difficulty_level
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${set.name}_${language}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "JSON Downloaded",
      description: `Question set exported as JSON in ${language}.`,
    });
  };

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-slate-50 overflow-hidden print:bg-white print:static print:inset-auto print:z-0 print:h-auto print:overflow-visible question-set-preview-root">
      {/* Global Print Hiding Style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide everything in the body */
          body * {
            visibility: hidden !important;
          }
          /* Show only our preview root and its children */
          .question-set-preview-root, .question-set-preview-root * {
            visibility: visible !important;
          }
          /* Position the preview root at the very top */
          .question-set-preview-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
          }
          /* Specifically hide our editor sidebar and header during print */
          .no-print {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
          /* Hide the sidebar and header containers specifically */
          header.print\\:hidden, aside.print\\:hidden {
            display: none !important;
          }
        }
      `}} />
      {/* Header - Hidden on Print */}
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 print:hidden shadow-sm relative overflow-hidden no-print">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-50/50 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4 relative z-10">
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">Download Preview</h1>
            <p className="text-xs text-slate-500 mt-1">{set.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={handleDownload} className="gap-2 bg-pink-600 hover:bg-pink-700 shadow-md transition-all active:scale-95 text-white">
            <Download className="h-4 w-4" />
            Download {fileFormat.toUpperCase()}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden print:overflow-visible print:block">
        {/* Editor Sidebar - Hidden on Print */}
        <aside className="w-80 border-r bg-white flex flex-col print:hidden shadow-lg z-10 no-print">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6 pb-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider">
                  <FileText className="h-4 w-4 text-pink-500" />
                  <span>File Type</span>
                </div>

                <Select value={fileFormat} onValueChange={(value) => setFileFormat(value as FileFormat)}>
                  <SelectTrigger className="h-11 w-full bg-slate-50 border-slate-200 text-slate-900">
                    <SelectValue placeholder="Choose file type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Choose the export format before downloading.
                </p>
              </div>

              <Separator />

              {/* Formatting Controls */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider">
                  <Type className="h-4 w-4 text-pink-500" />
                  <span>Formatting</span>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`font-bold ${selectionFormat.bold ? 'bg-pink-400 text-white hover:bg-pink-400' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyInlineFormat('bold');
                      }}
                      title="Bold (Ctrl+B)"
                    >
                      B
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`font-semibold italic ${selectionFormat.italic ? 'bg-pink-400 text-white hover:bg-pink-400' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyInlineFormat('italic');
                      }}
                      title="Italic (Ctrl+I)"
                    >
                      I
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`font-semibold underline ${selectionFormat.underline ? 'bg-pink-400 text-white hover:bg-pink-400' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyInlineFormat('underline');
                      }}
                      title="Underline (Ctrl+U)"
                    >
                      U
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`font-bold ${selectionFormat.blockTag === 'h1' ? 'bg-pink-400 text-white hover:bg-pink-400' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        toggleBlockFormat('h1');
                      }}
                      title="Heading 1"
                    >
                      H1
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`font-semibold ${selectionFormat.blockTag === 'h2' ? 'bg-pink-400 text-white hover:bg-pink-400' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        toggleBlockFormat('h2');
                      }}
                      title="Heading 2"
                    >
                      H2
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`font-medium ${selectionFormat.blockTag === 'h3' ? 'bg-pink-400 text-white hover:bg-pink-400' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        toggleBlockFormat('h3');
                      }}
                      title="Heading 3"
                    >
                      H3
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Header & Spacing Controls */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wider">
                  <Layout className="h-4 w-4 text-pink-500" />
                  <span>Header & Spacing</span>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="show-line" className="text-xs font-medium cursor-pointer">Header Line</Label>
                  <Switch id="show-line" checked={showHorizontalLine} onCheckedChange={setShowHorizontalLine} />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-slate-500 font-medium">Header Bottom Gap</Label>
                    <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{headerGap}px</span>
                  </div>
                  <Slider 
                    value={[headerGap]} 
                    min={0} 
                    max={100} 
                    step={4} 
                    onValueChange={([val]) => setHeaderGap(val)} 
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs text-slate-500 font-medium">Instruction Bottom Gap</Label>
                    <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{instructionGap}px</span>
                  </div>
                  <Slider 
                    value={[instructionGap]} 
                    min={0} 
                    max={100} 
                    step={4} 
                    onValueChange={([val]) => setInstructionGap(val)} 
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </aside>

        {/* Preview Area */}
        <main className="flex-1 overflow-auto bg-slate-200 p-8 print:p-0 print:bg-white print:overflow-visible">
          <div 
            ref={printRef}
            className="mx-auto bg-white shadow-2xl print:shadow-none min-h-[29.7cm] w-[21cm] p-[1.4cm] transition-all duration-300"
            style={{ 
              color: '#1a1a1a',
              fontSize: '12px'
            }}
          >
            {/* Print Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: A4;
                  margin: 0;
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
                border-left: 4px solid #db2777;
                padding-left: 1.5rem;
                margin-bottom: 2.5rem;
                background: rgba(219, 39, 119, 0.02);
                padding-top: 1rem;
                padding-bottom: 1rem;
                border-radius: 0 8px 8px 0;
              }
              .question-text-formatted {
                /* Removed global formatting override */
              }
              [contenteditable]:hover {
                background: rgba(219, 39, 119, 0.05);
              }
              [contenteditable]:focus {
                background: white;
                box-shadow: 0 0 0 2px #fbcfe8;
                outline: none;
              }
              /* Ensure formatting is visible during print */
              @media print {
                [contenteditable] {
                  background: transparent !important;
                  box-shadow: none !important;
                }
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
              <div 
                className={`text-center transition-all ${showHorizontalLine ? 'border-b-2 border-slate-900' : ''}`}
                style={{ marginBottom: `${headerGap}px`, paddingBottom: showHorizontalLine ? '0.5rem' : '0' }}
              >
                <h1 
                  className="text-xl font-bold mb-1 uppercase tracking-tight outline-none focus:bg-slate-50 rounded"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => setHeaderTitle(e.currentTarget.textContent || '')}
                >
                  {headerTitle}
                </h1>
                <p 
                  className="text-slate-700 font-medium mb-0.5 outline-none focus:bg-slate-50 rounded"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => setHeaderSubtitle(e.currentTarget.textContent || '')}
                >
                  {headerSubtitle}
                </p>
                <p 
                  className="text-slate-700 mb-2 outline-none focus:bg-slate-50 rounded"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onBlur={(e) => setHeaderSubSubtitle(e.currentTarget.textContent || '')}
                >
                  {headerSubSubtitle}
                </p>
                
                <div className="flex items-center justify-center gap-4 text-[13px] font-medium text-slate-800">
                  <div className="flex items-center gap-1">
                    <span>{uiText.languageLabel}</span>
                    <span className="px-1">
                      {language.charAt(0).toUpperCase() + language.slice(1)}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-slate-400"></div>
                  <div className="flex items-center gap-1">
                    <span>{uiText.totalQuestionsLabel}</span>
                    <span>{set.questions?.length || 0}</span>
                  </div>
                  <div className="w-px h-4 bg-slate-400"></div>
                  <div className="flex items-center gap-1">
                    <span>{uiText.maxMarksLabel}</span>
                    <span 
                      className="outline-none focus:bg-slate-50 rounded px-1"
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={(e) => setMaxMarks(parseInt(e.currentTarget.textContent || '0'))}
                    >
                      {maxMarks}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {showInstructions && (
              <div 
                className="text-sm print:bg-transparent transition-all border-b border-slate-500 pb-2"
                style={{ marginBottom: `${instructionGap}px` }}
              >
                <h3 className="font-bold mb-1 text-sm text-slate-900">{uiText.instructionsTitle}</h3>
                <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-sm">
                  {uiText.instructionPoints.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            <h3 className="font-bold text-[1.05em] mb-0.5">{uiText.sectionLabel}</h3>

            {/* Questions List */}
            <div className={`grid ${columns > 1 ? 'grid-cols-2 gap-x-6 gap-y-3' : 'space-y-3'}`}>
              {set.questions?.map((question: any, idx: number) => (
                <div key={question.id || idx} className={`break-inside-avoid ${template === 'modern' ? 'modern-question-card' : ''}`}>
                  <div className="flex items-start gap-2.5 mb-1.5">
                    <span className={`font-bold leading-tight min-w-[2.5em] ${template === 'modern' ? 'text-pink-600' : ''}`}>
                      {uiText.questionPrefix}{idx + 1}
                    </span>
                    <div className="flex-1">
                      <div 
                        key={`question-${question.id || idx}-${language}`}
                        className="question-text-formatted whitespace-pre-line leading-snug mb-1 outline-none focus:ring-1 focus:ring-pink-200 rounded p-0.5"
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                      >
                        {getQuestionText(question)}
                      </div>
                      
                      {showMetadata && null}

                      {/* Options */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                        {[0, 1, 2, 3].map((optIdx) => {
                          const optionText = getOptionText(question, optIdx);
                          if (!optionText) return null;
                          const correct = isCorrect(question, optIdx);
                          
                          return (
                            <div 
                              key={`${question.id || idx}-${optIdx}-${language}`} 
                              className={`flex items-start gap-2 p-0 rounded transition-colors ${
                                showAnswers && correct ? 'bg-green-50 border-green-200 border' : 'bg-transparent'
                              }`}
                            >
                              <div className="shrink-0 font-bold">
                                {String.fromCharCode(65 + optIdx)}.
                              </div>
                              <div 
                                className={`flex-1 outline-none focus:ring-1 focus:ring-pink-200 rounded p-0.5 ${showAnswers && correct ? 'font-semibold text-green-800' : 'text-slate-800'}`}
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                              >
                                {optionText}
                                {showAnswers && correct && <span className="ml-2 text-[10px] uppercase font-bold text-green-600" contentEditable={false}>(Correct)</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {columns === 1 && idx < (set.questions?.length - 1) && template !== 'modern' && (
                    <Separator className="mt-2 opacity-30" />
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
