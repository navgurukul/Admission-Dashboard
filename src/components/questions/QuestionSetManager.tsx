import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListChecks, Trash2, Plus, Edit, Download, Eye, Upload } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { QuestionPicker } from "./QuestionPicker";
import { QuestionEditor } from "./QuestionEditor";
import { useToast } from "@/components/ui/use-toast";
import Papa from "papaparse";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  createTopic,
  getAllQuestionSets,
  deleteQuestionFromSet,
  createQuestionSetMappings,
  deleteTopic,
  getQuestionsBySetType,
  deleteQuestionSet,
  createQuestionSet,
  getTopics,
  type TopicOption,
  updateQuestionSet,
  updateTopic,
  setDefaultOnlineQuestionSet,
  downloadQuestionSetPDF,
  getAllSchools,
  updateQuestion,
} from "@/utils/api";

export function QuestionSetManager({ allQuestions, difficultyLevels }) {
  const DEFAULT_SET_DESCRIPTION = "N/A";
  const { toast } = useToast();
  const [sets, setSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  // const [editingId, setEditingId] = useState<number | null>(null);.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    nameType: "custom", // "random" | "custom"
    isRandom: false,
    school_ids: [] as string[],
    importJsonText: "",
    questions: [] as any[],
  });
  const [schools, setSchools] = useState<any[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadFormData, setDownloadFormData] = useState({
    selectedSet: "",
    language: "English",
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [setToDelete, setSetToDelete] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingSet, setViewingSet] = useState<any>(null);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [importPreviewQuestions, setImportPreviewQuestions] = useState<any[]>([]);
  const [importPreviewMeta, setImportPreviewMeta] = useState({
    count: 0,
    source: "",
  });
  const [isImportPreviewModalOpen, setIsImportPreviewModalOpen] = useState(false);
  const [importPreviewSet, setImportPreviewSet] = useState<any>(null);
  const [importFileStatusMessage, setImportFileStatusMessage] = useState("");
  const importFileStatusTimeoutRef = useRef<number | null>(null);
  const [importSummary, setImportSummary] = useState({
    total: 0,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[],
  });

  const clearImportFileStatusTimeout = () => {
    if (importFileStatusTimeoutRef.current) {
      window.clearTimeout(importFileStatusTimeoutRef.current);
      importFileStatusTimeoutRef.current = null;
    }
  };

  const normalizeDifficultyLevel = (value: any, fallback = 1) => {
    if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      return value;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return fallback;

      const numericValue = Number(trimmed);
      if (Number.isInteger(numericValue) && numericValue > 0) {
        return numericValue;
      }

      const matchedLevel = Array.isArray(difficultyLevels)
        ? difficultyLevels.find((level: any) => level.name?.toLowerCase() === trimmed.toLowerCase())
        : null;

      if (matchedLevel?.id) {
        return matchedLevel.id;
      }
    }

    return fallback;
  };

  const showDelayedImportFileStatusMessage = (message: string, delayMs = 2200) => {
    clearImportFileStatusTimeout();
    setImportFileStatusMessage("");
    importFileStatusTimeoutRef.current = window.setTimeout(() => {
      setImportFileStatusMessage(message);
      importFileStatusTimeoutRef.current = null;
    }, delayMs);
  };

  const resetImportPreviewState = () => {
    setImportPreviewQuestions([]);
    setImportPreviewMeta({ count: 0, source: "" });
    setImportSummary({ total: 0, success: 0, skipped: 0, failed: 0, errors: [] });
  };

  const clearImportStatusMessage = () => {
    clearImportFileStatusTimeout();
    setImportFileStatusMessage("");
  };


  const fetchSets = async (loadQuestions = true) => {
    const setsFromApi = await getAllQuestionSets();

    // fetch mapped questions for each set only if needed
    const setsWithQuestions = loadQuestions
      ? await Promise.all(
        setsFromApi.map(async (s) => {
          try {
            const mapped = await getQuestionsBySetType(s.name); // fetch mapped questions
            return {
              id: s.id,
              name: s.name,
              description: s.description,
              limit: s.maximumMarks,
              questions: mapped.data || [], // actual selected questions
              active: s.status,
              is_default_online_set: s.is_default_online_set,
              school_ids: s.school_ids,
              created_at: s.created_at,
              updated_at: s.updated_at,
            };
          } catch (error) {
            return {
              id: s.id,
              name: s.name,
              description: s.description,
              limit: s.maximumMarks,
              questions: [],
              active: s.status,
              is_default_online_set: s.is_default_online_set,
              school_ids: s.school_ids,
              created_at: s.created_at,
              updated_at: s.updated_at,
            };
          }
        }),
      )
      : setsFromApi.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        limit: s.maximumMarks,
        questions: [],
        active: s.status,
        is_default_online_set: s.is_default_online_set,
        school_ids: s.school_ids,
        created_at: s.created_at,
        updated_at: s.updated_at,
      }));

    setSets(setsWithQuestions);
  };
  const fetchSchools = async () => {
    try {
      const schoolsData = await getAllSchools();
      setSchools(schoolsData);
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  };

  const fetchTopics = async () => {
    try {
      const topicsData = await getTopics();
      setTopics((topicsData || []).filter((topic) => topic?.status !== false));
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  useEffect(() => {
    fetchSets(false); // prevent unnecessary api call for sets.
    fetchSchools();
    fetchTopics();
  }, []);

  useEffect(() => {
    return () => {
      clearImportFileStatusTimeout();
    };
  }, []);

  const loadSetQuestions = async (setId: number) => {
    try {
      const set = sets.find((s) => s.id === setId);
      if (!set) return null;

      const mapped = await getQuestionsBySetType(set.name);
      const updatedSet = { ...set, questions: mapped?.data || [] };

      setSets((prev) =>
        prev.map((s) =>
          s.id === setId ? updatedSet : s,
        ),
      );

      return updatedSet;
    } catch (error) {
      console.warn(`Error loading questions for set ${setId}:`, error);
      return null;
    }
  };

  // Function to handle saving selected questions
  const handleSaveQuestions = async (selected: any[], activeSet: any) => {
    try {
      const prevSelected = activeSet.questions || [];

      // Find newly added
      const added = selected.filter(
        (q) => !prevSelected.some((p) => p.id === q.id),
      );

      // Find removed
      const removed = prevSelected.filter(
        (p) => !selected.some((q) => q.id === p.id),
      );

      // Add new mappings
      if (added.length > 0) {
        const addPayload = added.map((q) => ({
          question_set_id: activeSet.id,
          question_id: q.id,
          difficulty_level: q.difficulty_level,
        }));
        await createQuestionSetMappings(addPayload);
      }

      if (removed.length > 0) {
        await Promise.all(removed.map((q) => deleteQuestionFromSet(q.id)));
      }

      setSets((prev) =>
        prev.map((s) =>
          s.id === activeSet.id ? { ...s, questions: selected } : s,
        ),
      );

      toast({
        title: "Questions Added Successfully",
        description: `Added: ${added.length}`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } catch (err: any) {
      toast({
        title: "Failed to Update Questions",
        description: err.message || "An error occurred while updating questions. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  //   Functions
  // const addSet = () => {
  //   setSets((prev) => [
  //     ...prev,
  //     {
  //       id: Date.now(),
  //       name: `Set ${String.fromCharCode(65 + prev.length)}`,
  //       limit: 0,
  //       questions: [],
  //       active: true,
  //     },
  //   ]);
  //   toast({
  //     title: "Set created",
  //     description: "A new question set has been added.",
  //   });
  // };

  const openAddModal = () => {
    setEditingSet(null);
    setFormData({ name: "", description: "", nameType: "custom", isRandom: false, school_ids: [], importJsonText: "", questions: [] });
    resetImportPreviewState();
    clearImportStatusMessage();
    setIsModalOpen(true);
  };

  const parseImportData = (rawText: string) => {
    const dataText = rawText.trim();

    if (!dataText) {
      throw new Error("Please paste JSON data or upload a file");
    }

    let parsedData: any = {};
    const csvParseErrors: string[] = [];
    const csvValidationErrors: string[] = [];

    if (dataText.startsWith("{") || dataText.startsWith("[")) {
      parsedData = JSON.parse(dataText);
    } else {
      const parseResult = Papa.parse(dataText, {
        header: true,
        skipEmptyLines: true,
        transform: (value) => value.trim(),
      });

      if (parseResult.errors.length > 0) {
        parseResult.errors.forEach((error) => {
          const rowNumber = typeof error.row === "number" ? error.row + 2 : "unknown";
          csvParseErrors.push(`Row ${rowNumber}: ${error.message}`);
        });
      }

      const csvData = parseResult.data;
      const csvHeaders = (parseResult.meta.fields || []).map((field) => String(field || "").trim());

      if (csvData.length === 0) {
        throw new Error("CSV file is empty or invalid");
      }

      const firstRow: any = csvData[0];
      if (firstRow.field && firstRow.value) {
        csvData.forEach((row: any) => {
          if (row.field && row.value) {
            if (row.field === "school_ids") {
              parsedData.school_ids = row.value
                .split(",")
                .map((id: string) => parseInt(id.trim(), 10))
                .filter((id: number) => !isNaN(id));
            } else if (row.field === "isRandom") {
              parsedData.isRandom = row.value.toLowerCase() === "true";
            } else {
              parsedData[row.field] = row.value;
            }
          }
        });
      } else if (
        firstRow.english_text !== undefined ||
        firstRow.question_type !== undefined ||
        firstRow.difficulty_level !== undefined
      ) {
        const requiredHeaders = ["english_text", "english_options", "answer_key"];
        const missingHeaders = requiredHeaders.filter((header) => !csvHeaders.includes(header));
        if (missingHeaders.length > 0) {
          csvValidationErrors.push(
            `Missing required column(s): ${missingHeaders.join(", ")}. Please use the Template file to keep exact header names.`,
          );
        }
        parsedData = csvData;
      } else {
        parsedData = [];
        csvValidationErrors.push(
          "CSV format not recognized. Please use the Template file and do not rename/remove headers.",
        );
      }
    }

    let questions = Array.isArray(parsedData) ? parsedData : parsedData.questions || [];
    const rowErrors = [...csvParseErrors, ...csvValidationErrors];
    const totalRows = questions.length;

    if (questions.length > 0) {
      const tryParseList = (val: any) => {
        if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
          try {
            return JSON.parse(val);
          } catch {
            return val;
          }
        }
        return val;
      };

      const tryParseOptions = (val: any) => {
        const parsed = tryParseList(val);
        if (Array.isArray(parsed)) {
          return parsed.map((item) =>
            typeof item === "object" && item.text !== undefined ? String(item.text) : String(item),
          );
        }
        if (typeof parsed === "string") {
          const trimmed = parsed.trim();
          if (!trimmed) return [];
          // New CSV template uses semicolon-delimited options.
          if (trimmed.includes(";")) {
            return trimmed
              .split(";")
              .map((item) => item.trim())
              .filter(Boolean);
          }
          return [trimmed];
        }
        return parsed;
      };

      const tryParseIntArray = (val: any) => {
        const parsed = tryParseList(val);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => parseInt(item, 10))
            .filter((num) => Number.isInteger(num));
        }
        if (typeof parsed === "string") {
          const trimmed = parsed.trim();
          if (!trimmed) return [];
          if (trimmed.includes(";")) {
            return trimmed
              .split(";")
              .map((item) => parseInt(item.trim(), 10))
              .filter((num) => Number.isInteger(num));
          }
          const parsedNumber = parseInt(trimmed, 10);
          return Number.isInteger(parsedNumber) ? [parsedNumber] : [];
        }
        if (typeof parsed === "number") {
          const parsedNumber = parseInt(String(parsed), 10);
          return Number.isInteger(parsedNumber) ? [parsedNumber] : [];
        }
        return parsed;
      };

      const validQuestions: any[] = [];

      questions.forEach((q: any, index: number) => {
        const normalizedQuestion = {
          ...q,
          id: q.id ? parseInt(q.id, 10) : (q.question_id ? parseInt(q.question_id, 10) : undefined),
          difficulty_level: normalizeDifficultyLevel(q.difficulty_level),
          english_options: tryParseOptions(q.english_options),
          hindi_options: tryParseOptions(q.hindi_options),
          marathi_options: tryParseOptions(q.marathi_options),
          answer_key: tryParseIntArray(q.answer_key),
        };

        const rowLabel = `Row ${index + 1}`;
        const hasExistingId = typeof normalizedQuestion.id === "number" && !isNaN(normalizedQuestion.id);
        const hasQuestionText = Boolean(
          normalizedQuestion.english_text || normalizedQuestion.question_text || normalizedQuestion.question,
        );
        const isEnglishOptionsArray = Array.isArray(normalizedQuestion.english_options);
        const isAnswerKeyArray = Array.isArray(normalizedQuestion.answer_key);
        const hasValidOptions = isEnglishOptionsArray && normalizedQuestion.english_options.length > 0;
        const hasValidAnswerKey =
          isAnswerKeyArray &&
          normalizedQuestion.answer_key.length > 0 &&
          normalizedQuestion.answer_key.every((value: any) => Number.isInteger(value));
        const rowIssues: string[] = [];

        if (normalizedQuestion.english_options && !isEnglishOptionsArray) {
          rowIssues.push('Invalid "english_options" format. Use semicolon-separated values, for example: Option 1;Option 2.');
        }

        if (normalizedQuestion.answer_key && !isAnswerKeyArray) {
          rowIssues.push('Invalid "answer_key" format. Use option number(s) with semicolon if multiple, for example: 1 or 1;3.');
        }

        if (!hasExistingId) {
          if (!hasQuestionText) {
            rowIssues.push('Missing "english_text" (question text).');
          }
          if (!hasValidOptions) {
            rowIssues.push(
              isEnglishOptionsArray
                ? 'Column "english_options" cannot be empty.'
                : 'Invalid "english_options" format. Use semicolon-separated values, for example: Option 1;Option 2.',
            );
          }
          if (!hasValidAnswerKey) {
            rowIssues.push(
              isAnswerKeyArray
                ? 'Column "answer_key" cannot be empty and must contain integer option number(s), for example: 1 or 1;3.'
                : 'Invalid "answer_key" format. Use option number(s), for example: 1 or 1;3.',
            );
          }
        }

        if (rowIssues.length > 0) {
          rowErrors.push(`${rowLabel}: ${rowIssues.join(" ")}`);
          return;
        }

        validQuestions.push(normalizedQuestion);
      });

      questions = validQuestions;
    }

    return {
      parsedData,
      questions,
      summary: {
        total: totalRows,
        success: questions.length,
        skipped: 0,
        failed: rowErrors.length,
        errors: rowErrors,
      },
    };
  };

  const applyImportedData = (
    rawText: string,
    sourceLabel = "uploaded file",
    options?: { keepRawText?: boolean; displayText?: string },
  ) => {
    const { parsedData, questions, summary } = parseImportData(rawText);
    const canImportQuestions = summary.failed === 0;
    const importedQuestions = canImportQuestions ? questions : [];
    const keepRawText = options?.keepRawText ?? true;
    const displayText = options?.displayText;

    setFormData((prev) => ({
      ...prev,
      importJsonText: keepRawText ? rawText : (displayText || ""),
      name: parsedData.name || prev.name,
      description: parsedData.description || prev.description,
      school_ids: parsedData.school_ids ? parsedData.school_ids.map(String) : prev.school_ids,
      nameType: "custom",
      isRandom: parsedData.isRandom !== undefined ? parsedData.isRandom : false,
      questions: importedQuestions,
    }));

    setImportPreviewQuestions(importedQuestions);
    setImportPreviewMeta({
      count: importedQuestions.length,
      source: sourceLabel,
    });
    setImportSummary(summary);

    return { parsedData, questions: importedQuestions, summary };
  };

  const openImportedQuestionsPreview = (
    questions: any[],
    sourceLabel: string,
    setName = formData.name || "Imported Questions",
  ) => {
    setImportPreviewSet({
      id: "import-preview",
      name: setName,
      questions,
      sourceLabel,
    });
    setIsImportPreviewModalOpen(true);
  };

  const handlePreviewFileUploadParsed = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isCSV = file.type === "text/csv" || file.name.endsWith(".csv");
    const isJSON = file.type === "application/json" || file.name.endsWith(".json");

    if (!isCSV && !isJSON) {
      clearImportStatusMessage();
      toast({
        title: "Invalid File",
        description: "Please upload a CSV or JSON file",
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        try {
          const { questions, summary } = applyImportedData(e.target.result, file.name, {
            keepRawText: true,
          });
          if (summary.failed > 0) {
            showDelayedImportFileStatusMessage(
              `Import blocked. ${summary.failed} row(s) failed validation. Please fix errors in Import Summary and upload again.`,
            );
          } else if (questions.length > 0) {
            const message =
              "File imported successfully. You can check in Preview section.";
            showDelayedImportFileStatusMessage(message);
          } else {
            clearImportStatusMessage();
          }
        } catch (err: any) {
          clearImportStatusMessage();
          resetImportPreviewState();
          setFormData((prev) => ({
            ...prev,
            importJsonText: e.target.result as string,
            questions: [],
          }));
          toast({
            title: "Invalid Format",
            description: err.message || "Please check your file format. Supported: JSON or CSV",
            variant: "destructive",
            className: "border-red-500 bg-red-50 text-red-900",
          });
        }
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const downloadCSVTemplate = () => {
    const template = [
      "difficulty_level,question_type,english_text,hindi_text,marathi_text,english_options,hindi_options,marathi_options,answer_key,topic",
      'Easy,MCQ,"Sample english question?","Sample hindi question?","Sample marathi question?","Option 1;Option 2;Option 3;Option 4","विकल्प 1;विकल्प 2;विकल्प 3;विकल्प 4","पर्याय 1;पर्याय 2;पर्याय 3;पर्याय 4","1","5"',
    ].join("\n");

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "multi_language_question_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Question import CSV template has been downloaded",
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900",
      duration: 1000,
    });
  };

  const handleImportWithPreviewParsed = () => {
    if (!formData.importJsonText.trim()) {
      toast({
        title: "Empty Data",
        description: "Please paste JSON data or upload a file",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    try {
      const { parsedData, questions, summary } = applyImportedData(
        formData.importJsonText,
        "pasted content",
      );
      if (questions.length > 0) {
        openImportedQuestionsPreview(questions, "pasted content");
      }

      const importedFields: string[] = [];
      if (parsedData.name) importedFields.push("name");
      if (parsedData.description) importedFields.push("description");
      if (parsedData.school_ids && parsedData.school_ids.length > 0) {
        importedFields.push(`${parsedData.school_ids.length} school(s)`);
      }
      if (questions && questions.length > 0) {
        importedFields.push(`${questions.length} question(s)`);
      }

      if (summary.failed > 0) {
        toast({
          title: "Import Blocked",
          description: `${summary.failed} row(s) failed validation, so no questions were imported. Review Import Summary and try again.`,
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900",
          duration: 1000,
        });
      } else {
        toast({
          title: "Data Imported",
          description: `Imported: ${importedFields.join(", ") || "some fields"}. Preview modal is ready.`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
          duration: 1000,
        });
      }
    } catch (err: any) {
      resetImportPreviewState();
      toast({
        title: "❌ Invalid Format",
        description: err.message || "Please check your file format. Supported: JSON or CSV",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const openEditModal = (set: any) => {
    setEditingSet(set);
    setFormData({
      name: set.name,
      description: set.description || "",
      nameType: "custom",
      isRandom: false,
      school_ids: set.school_ids ? set.school_ids.map(String) : [],
      importJsonText: "",
      questions: [],
    });
    resetImportPreviewState();
    clearImportStatusMessage();
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    const finalName = formData.name;
    const finalDescription = formData.description.trim() || DEFAULT_SET_DESCRIPTION;

    if (!formData.name.trim()) {
      toast({
        title: "⚠️ Required Field Missing",
        description: "Please enter a set name",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (!formData.school_ids || formData.school_ids.length === 0) {
      toast({
        title: "⚠️ Required Field Missing",
        description: "Please select school",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    try {
      const payload = {
        name: finalName,
        description: finalDescription,
        isRandom: formData.nameType === "random",
        school_ids: formData.school_ids.map(Number),
        success: true,
      };

      if (editingSet) {
        const response = await updateQuestionSet(editingSet.id, payload);
        toast({
          title: "Set Updated",
          description: response.message,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
        setIsModalOpen(false);
        await fetchSets(false);
      } else {
        const importedQuestions = formData.questions || [];
        const existingQuestions = importedQuestions.filter(
          (question: any) => question.id && typeof question.id === "number",
        );
        const newQuestions = importedQuestions.filter(
          (question: any) => !question.id || typeof question.id !== "number",
        );

        const createPayload = {
          ...payload,
          questions: existingQuestions.map((question: any) => ({
            question_id: question.id,
            difficulty_level: normalizeDifficultyLevel(question.difficulty_level),
          })),
          newQuestions: newQuestions.map((question: any) => {
            const { id, isNew, ...rest } = question;
            return {
              ...rest,
              difficulty_level: normalizeDifficultyLevel(rest.difficulty_level),
            };
          }),
        };

        const response = await createQuestionSet(createPayload);
        toast({
          title: "Set Created",
          description: response.message,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });

        setIsModalOpen(false);
        resetImportPreviewState();
        setImportPreviewSet(null);
        setIsImportPreviewModalOpen(false);
        await fetchSets(false);
      }
    } catch (err: any) {
      toast({
        title: "Unable to create!",
        description: err.message,
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const openDeleteConfirm = (set: any) => {
    setSetToDelete(set);
    setDeleteConfirmOpen(true);
  };

  const deleteSet = async () => {
    if (!setToDelete) return;

    try {
      await deleteQuestionSet(setToDelete.id);
      setSets((prev) => prev.filter((s) => s.id !== setToDelete.id));
      toast({
        title: "✅ Set Deleted Successfully",
        description: `"${setToDelete?.name || 'Set'}" has been removed.`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      await fetchSets(false);
      setDeleteConfirmOpen(false);
      setSetToDelete(null);
    } catch (err: any) {
      toast({
        title: "❌ Failed to Delete Set",
        description: err.message || "Unable to delete the set. It may contain questions or be in use.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  // const defaultSet = sets.find((s) => s.is_default_online_set);

  const handleDownloadSubmit = async () => {
    if (!downloadFormData.selectedSet) {
      toast({
        title: "⚠️ Required Field Missing",
        description: "Please select a question set",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    try {
      // Find the set ID from the selected set name
      const selectedSet = sets.find((s) => s.name === downloadFormData.selectedSet);
      if (!selectedSet) {
        throw new Error("Selected set not found");
      }

      toast({
        title: "⏳ Generating PDF...",
        description: `Please wait while we generate the PDF`,
        variant: "default",
        className: "border-blue-500 bg-blue-50 text-blue-900",
      });

      // Call the API to download PDF
      const pdfBlob = await downloadQuestionSetPDF(
        selectedSet.id,
        downloadFormData.language
      );

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${downloadFormData.selectedSet}_${downloadFormData.language}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "✅ PDF Downloaded",
        description: `${downloadFormData.selectedSet} in ${downloadFormData.language} has been downloaded`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
      setIsDownloadModalOpen(false);
    } catch (err: any) {
      toast({
        title: "❌ Download Failed",
        description: err.message || "Unable to download PDF. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const openDownloadModal = () => {
    setDownloadFormData({
      selectedSet: "",
      language: "English",
    });
    setIsDownloadModalOpen(true);
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
  };

  const handleSaveEditedQuestion = async (questionData: any) => {
    if (!editingQuestion) return;

    try {
      await updateQuestion(editingQuestion.id, questionData);

      toast({
        title: "✅ Question Updated",
        description: "The question has been successfully updated.",
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });

      // Refresh the questions in the current set
      if (viewingSet) {
        const updatedSet = await loadSetQuestions(viewingSet.id);
        if (updatedSet) {
          setViewingSet(updatedSet);
        }
      }

      setEditingQuestion(null);
    } catch (err: any) {
      toast({
        title: "❌ Update Failed",
        description: err.message || "Failed to update question. Please try again.",
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
  };

  const handleCreateTopic = async (topicName: string) => {
    const createdTopic = await createTopic({
      topic: topicName.trim(),
      status: true,
    });

    setTopics((prev) => [...prev, createdTopic]);
    return createdTopic;
  };

  const handleUpdateTopic = async (topicId: number, topicName: string) => {
    const updatedTopic = await updateTopic(topicId, {
      topic: topicName.trim(),
      status: true,
    });

    setTopics((prev) =>
      prev.map((topic) =>
        topic.id === topicId ? { ...topic, ...updatedTopic } : topic,
      ),
    );

    return updatedTopic;
  };

  const handleDeleteTopic = async (topicId: number) => {
    const result = await deleteTopic(topicId);
    setTopics((prev) => prev.filter((topic) => topic.id !== topicId));
    return result;
  };

  return (
    <div className="space-y-4" data-onboarding="questions-sets-panel">
      <div className="flex justify-end items-center gap-3">
        <Button
          onClick={openAddModal}
          variant="outline"
          data-onboarding="questions-add-set"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Set
        </Button>
        <Button
          onClick={openDownloadModal}
          variant="outline"
          data-onboarding="questions-download-set"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        {/* {defaultSet && (
          <div className="flex items-center gap-2 border border-green-300 rounded-md px-3 py-1.5 bg-green-50">
            <span className="text-sm font-medium text-green-700">Default Set:</span>
            <span className="text-sm font-semibold text-green-800">
              {defaultSet.name}
            </span>
          </div>
        )} */}
      </div>

      <div className="space-y-4">
        {sets.length === 0 && (
          <p className="text-gray-500 text-sm">No question sets found. Click "Add Set" to create one.</p>
        )}
        {sets.map((set) => (
          <Card key={set.id} className="relative">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base font-semibold">
                    {set.name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1">
                    {set.school_ids && set.school_ids.length > 0 ? (
                      set.school_ids.map((id: number) => {
                        const school = schools.find((s) => s.id === id);
                        return school ? (
                          <Badge key={id} variant="secondary" className="text-[10px] px-1.5 h-5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                            {school.school_name}
                          </Badge>
                        ) : null;
                      })
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">No school assigned</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      const updatedSet = await loadSetQuestions(set.id);
                      // console.log('Viewing set:', updatedSet);
                      // console.log('Selected questions:', updatedSet?.questions);
                      setViewingSet(updatedSet || set);
                      setIsViewModalOpen(true);
                    }}
                    title="View questions"
                  >
                    <Eye className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(set)}
                    title="Edit set"
                  >
                    <Edit className="h-4 w-4 text-black-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteConfirm(set)}
                    title="Delete set"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm font-medium text-gray-600">
                {set.questions.length > 0 ? (
                  <>
                    You've selected <strong>{set.questions.length}</strong> question
                    {set.questions.length !== 1 && "s"}.
                  </>
                ) : (
                  <span className="text-muted-foreground">Click "Pick Questions" to view and manage questions</span>
                )}
              </p>

              {/* <p className="text-xs text-gray-500">
              Created: {new Date(set.created_at).toLocaleDateString()} <br />
              Updated: {new Date(set.updated_at).toLocaleDateString()}
            </p> */}

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await loadSetQuestions(set.id)
                    setActiveSet(set)
                  }}
                >
                  <ListChecks className="h-4 w-4 mr-2" />
                  Pick Questions
                </Button>

                {/* <div className="flex items-center gap-2">
                  <Checkbox
                    id={`default-${set.id}`}
                    checked={set.is_default_online_set || false}
                    className="rounded-none data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        try {
                          await setDefaultOnlineQuestionSet(set.id);
                          setSets((prev) =>
                            prev.map((s) => ({
                              ...s,
                              is_default_online_set: s.id === set.id,
                            }))
                          );
                          toast({
                            title: "✅ Default Set Updated",
                            description: `"${set.name}" is now the default online test set.`,
                            variant: "default",
                            className: "border-green-500 bg-green-50 text-green-900",
                          });
                        } catch (err: any) {
                          toast({
                            title: "❌ Failed to Set Default",
                            description: err.message || "Unable to set default online test set. Please try again.",
                            variant: "destructive",
                            className: "border-red-500 bg-red-50 text-red-900",
                          });
                        }
                      }
                    }}
                  />
                  <Label
                    htmlFor={`default-${set.id}`}
                    className="text-xs cursor-pointer whitespace-nowrap"
                  >
                    Mark Default
                  </Label>
                </div> */}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* <Button onClick={addSet} variant="outline">
        <Plus className="h-4 w-4 mr-2" />
        Add Set
      </Button> */}

      {activeSet && (
        <QuestionPicker
          activeSet={sets.find((s) => s.id === activeSet.id) || activeSet}
          onClose={() => setActiveSet(null)}
          difficultyLevel={difficultyLevels}
          onSave={(selected) => handleSaveQuestions(selected, activeSet)}
        />
      )}

      {isImportPreviewModalOpen && importPreviewSet && (
        <QuestionPicker
          activeSet={importPreviewSet}
          onClose={() => {
            setIsImportPreviewModalOpen(false);
            setImportPreviewSet(null);
          }}
          onSave={(selected) => {
            setFormData((prev) => ({ ...prev, questions: selected }));
            setImportPreviewQuestions(selected);
            setImportPreviewMeta((prev) => ({ ...prev, count: selected.length }));
          }}
          difficultyLevel={difficultyLevels}
          fetchQuestionsFromApi={false}
          previewMode
          showLanguageLabels
          showCorrectAnswer
          saveLabel="Use These Questions"
          title= "Preview Imported Questions"
          footerNote={`${importPreviewMeta.count || importPreviewSet.questions?.length || 0} imported question(s) selected for this set`}
        />
      )}
      {/* Add/Edit Set Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            clearImportFileStatusTimeout();
            setImportFileStatusMessage("");
          }
          setIsModalOpen(open);
        }}
      >
        <DialogContent className="flex max-h-[92vh] max-w-2xl flex-col overflow-hidden p-0 sm:rounded-xl">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>
              {editingSet ? "Edit Question Set" : "Create Question Set"}
            </DialogTitle>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <Label className="block">Set Generation Method</Label>
              <RadioGroup
                value={formData.nameType}
                onValueChange={(val) => {
                  const isRandom = val === "random";
                  const newName = isRandom ? `Set ${sets.length + 1}` : "";
                  setFormData({ ...formData, nameType: val, name: newName, isRandom });
                }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="r-custom" />
                  <Label htmlFor="r-custom">Custom Name</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="random" id="r-random" />
                  <Label htmlFor="r-random">Random</Label>
                </div>
                
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Set Name <span className="text-red-500">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter Set name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school">Schools <span className="text-red-500">*</span></Label>
              <MultiSelectCombobox
                options={schools.map((school) => ({
                  value: String(school.id),
                  label: school.school_name,
                }))}
                value={formData.school_ids}
                onValueChange={(value) =>
                  setFormData({ ...formData, school_ids: value })
                }
                placeholder="Select schools"
                searchPlaceholder="Search schools..."
              />
            </div>

            {/* Import Section */}
            {!editingSet && formData.nameType === "custom" && (
              <div className="space-y-2 border-t pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <Label htmlFor="import-json" className="text-sm font-semibold">Import from File/JSON</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={downloadCSVTemplate}
                      className="h-7 text-xs"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Template
                    </Button>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handlePreviewFileUploadParsed}
                      className="hidden"
                      id="set-file-upload"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => document.getElementById("set-file-upload")?.click()}
                      className="h-7 text-xs"
                    >
                      <Upload className="mr-1 h-3 w-3" />
                      Upload File
                    </Button>
                    {/* <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleImportWithPreviewParsed}
                      className="h-7 text-xs"
                    >
                      Import
                    </Button> */}
                    {importPreviewQuestions.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openImportedQuestionsPreview(
                            importPreviewQuestions,
                            importPreviewMeta.source || "imported content",
                            formData.name || "Imported Questions",
                          )
                        }
                        className="h-7 text-xs"
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Preview
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  id="import-json"
                  value={formData.importJsonText}
                  onChange={(e) => {
                    setFormData({ ...formData, importJsonText: e.target.value });
                    clearImportStatusMessage();
                    resetImportPreviewState();
                  }}
                  placeholder="Paste csv here"
                  rows={6}
                  className="font-mono text-xs"
                />
                {importFileStatusMessage && (
                  <div className="rounded-md border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                    {importFileStatusMessage}
                  </div>
                )}
                {(importSummary.total > 0 || importSummary.failed > 0) && (
                  <div className="space-y-3 rounded-md border bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">Import Summary</p>
                      <Badge variant="secondary" className="border-blue-200 bg-blue-50 text-blue-700">
                        {importSummary.total} total rows
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge className="border border-green-200 bg-green-50 text-green-700 hover:bg-green-50">
                        {importSummary.success} Success
                      </Badge>
                      <Badge className="border border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-50">
                        {importSummary.skipped} Skipped
                      </Badge>
                      <Badge className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-50">
                        {importSummary.failed} Failed
                      </Badge>
                    </div>

                    {importSummary.failed > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-red-700">Specific Error Details:</p>
                        <div className="max-h-28 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2">
                          <div className="space-y-1">
                            {importSummary.errors.map((error, index) => (
                              <p key={`${error}-${index}`} className="text-xs text-red-700">
                                {index + 1}. {error}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="border-t bg-background px-6 py-4">
            <Button
              variant="outline"
              onClick={() => {
                clearImportFileStatusTimeout();
                setImportFileStatusMessage("");
                setIsModalOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingSet ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download PDF Modal */}
      <Dialog open={isDownloadModalOpen} onOpenChange={setIsDownloadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Question Set PDF</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="set-select">Select Question Set</Label>
              <Select
                value={downloadFormData.selectedSet}
                onValueChange={(value) =>
                  setDownloadFormData({ ...downloadFormData, selectedSet: value })
                }
              >
                <SelectTrigger id="set-select">
                  <SelectValue placeholder="Choose a question set" />
                </SelectTrigger>
                <SelectContent>
                  {sets.map((set) => (
                    <SelectItem key={set.id} value={set.name}>
                      {set.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language-select">Language</Label>
              <Select
                value={downloadFormData.language}
                onValueChange={(value) =>
                  setDownloadFormData({ ...downloadFormData, language: value })
                }
              >
                <SelectTrigger id="language-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Marathi">Marathi</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDownloadModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDownloadSubmit}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSetToDelete(null);
        }}
        onConfirm={deleteSet}
        title="Delete Question Set"
        description={`Are you sure you want to delete "${setToDelete?.name || 'this set'}"?\n\nThis action cannot be revert. All questions in this set will be removed from the set.`}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* View Questions Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={(open) => {
        setIsViewModalOpen(open);
        if (!open) {
          setEditingQuestion(null);
        }
      }}>
        <DialogContent className="max-w-4xl h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{viewingSet?.name || 'Question Set'}</DialogTitle>
          </DialogHeader>

          {editingQuestion ? (
            <div className="flex-1 overflow-y-auto pr-2">
              <QuestionEditor
                question={editingQuestion}
                onSave={handleSaveEditedQuestion}
                onCancel={handleCancelEdit}
                difficultyLevels={difficultyLevels}
                schools={schools}
                topics={topics}
                onCreateTopic={handleCreateTopic}
                onUpdateTopic={handleUpdateTopic}
                onDeleteTopic={handleDeleteTopic}
                setSelectedQuestion={setEditingQuestion}
              />
            </div>
          ) : viewingSet && (
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="space-y-4">
                {viewingSet.description && (
                  <p className="text-sm text-gray-600 italic">
                    {viewingSet.description}
                  </p>
                )}
                {viewingSet.questions && viewingSet.questions.length > 0 ? (
                  <div className="space-y-3">
                    {viewingSet.questions.map((question: any, index: number) => (
                      <div key={question.id} className="p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">``
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-2 whitespace-pre-line">
                              {index + 1}. <span className="font-semibold">English:</span> {question.english_text || question.question_text || question.question || 'N/A'}
                            </div>
                            {question.hindi_text && (
                              <div className="text-sm text-gray-700 mb-1 whitespace-pre-line">
                                <span className="font-semibold">Hindi:</span> {question.hindi_text}
                              </div>
                            )}
                            {question.marathi_text && (
                              <div className="text-sm text-gray-700 whitespace-pre-line">
                                <span className="font-semibold">Marathi:</span> {question.marathi_text}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditQuestion(question)}
                            title="Edit question"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {difficultyLevels?.find((d: any) => d.id === question.difficulty_level)?.name || question.difficulty_level || 'N/A'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {question.question_type || 'N/A'}
                          </Badge>
                          {question.time_limit && (
                            <Badge variant="outline" className="text-xs">
                              {question.time_limit}s
                            </Badge>
                          )}
                        </div>

                        {question.question_type === 'MCQ' && question.english_options && question.english_options.length > 0 && (
                          <div className="mt-4">
                            <div className="space-y-2">
                              {question.english_options.map((option: any, optIndex: number) => {
                                const optionText = typeof option === 'string' ? option : option.text || option.value;
                                const optionId = typeof option === 'string' ? optIndex + 1 : option.id;
                                const isCorrect = question.answer_key && question.answer_key.includes(optionId);

                                return (
                                  <div key={optIndex} className="p-2 bg-gray-50 rounded">
                                    <div className="flex items-start gap-2">
                                      <span className="font-medium text-gray-700 min-w-[24px]">
                                        {String.fromCharCode(65 + optIndex)}.
                                      </span>
                                      <div className="flex-1">
                                        <div className="text-sm text-gray-900 whitespace-pre-line">
                                          <span className="font-semibold">English:</span> {optionText}
                                          {isCorrect && (
                                            <span className="ml-2 text-green-600 font-semibold">✓ Correct</span>
                                          )}
                                        </div>
                                        {question.hindi_options && question.hindi_options[optIndex] && (
                                          <div className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                                            <span className="font-semibold">Hindi:</span> {typeof question.hindi_options[optIndex] === 'string' ? question.hindi_options[optIndex] : question.hindi_options[optIndex]?.text || question.hindi_options[optIndex]?.value}
                                          </div>
                                        )}
                                        {question.marathi_options && question.marathi_options[optIndex] && (
                                          <div className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                                            <span className="font-semibold">Marathi:</span> {typeof question.marathi_options[optIndex] === 'string' ? question.marathi_options[optIndex] : question.marathi_options[optIndex]?.text || question.marathi_options[optIndex]?.value}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No questions in this set
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex-shrink-0 mt-4">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
