import { useState, useEffect } from "react";
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
  getAllQuestionSets,
  deleteQuestionFromSet,
  createQuestionSetMappings,
  getQuestionsBySetType,
  deleteQuestionSet,
  createQuestionSet,
  updateQuestionSet,
  setDefaultOnlineQuestionSet,
  downloadQuestionSetPDF,
  getAllSchools,
  updateQuestion,
} from "@/utils/api";

export function QuestionSetManager({ allQuestions, difficultyLevels }) {
  const { toast } = useToast();
  const [sets, setSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  // const [editingId, setEditingId] = useState<number | null>(null);.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSet, setEditingSet] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    nameType: "random", // "random" | "custom"
    isRandom: true,
    school_ids: [] as string[],
    importJsonText: "",
    questions: [] as any[],
  });
  const [schools, setSchools] = useState<any[]>([]);
  const [pendingSetData, setPendingSetData] = useState<any>(null);
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

  useEffect(() => {
    fetchSets(false); // prevent unnecessary api call for sets.
    fetchSchools();
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
      // If this is a new custom set that hasn't been created yet
      if (activeSet.id === -1 && pendingSetData) {
        const existingQs = selected.filter((q) => q.id && typeof q.id === 'number');
        const newQs = selected.filter((q) => !q.id || typeof q.id === 'string' || q.isNew);

        const payload = {
          name: pendingSetData.name,
          description: pendingSetData.description,
          isRandom: false,
          questions: existingQs.map((q) => ({
            question_id: q.id,
            difficulty_level: q.difficulty_level || 1
          })),
          newQuestions: newQs.map((q) => {
            // Remove temp ids and ui flags
            const { id, isNew, ...rest } = q;
            return rest;
          }),
          school_ids: pendingSetData.school_ids.map(Number),
          success: true
        };

        await createQuestionSet(payload);
        toast({
          title: "✅ Set Created Successfully",
          description: `"${pendingSetData.name}" has been created with ${selected.length} questions.`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });

        setActiveSet(null);
        setPendingSetData(null);
        await fetchSets(false);
        return;
      }

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

      // Delete removed mappings
      // if (removed.length > 0) {
      //   const removePayload = removed.map((q) => ({
      //     question_set_id: activeSet.id,
      //     question_id: q.id,
      //   }));
      //   await deleteQuestionFromSet(removePayload);
      // }

      if (removed.length > 0) {
        await Promise.all(removed.map((q) => deleteQuestionFromSet(q.id)));
      }
      // Update local state
      setSets((prev) =>
        prev.map((s) =>
          s.id === activeSet.id ? { ...s, questions: selected } : s,
        ),
      );

      toast({
        title: "✅ Questions Added Successfully",
        description: `Added: ${added.length}`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
      });
    } catch (err: any) {
      toast({
        title: " Failed to Update Questions",
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
    const randomName = `Set ${sets.length + 1}`;
    setFormData({ name: randomName, description: "", nameType: "random", isRandom: true, school_ids: [], importJsonText: "", questions: [] });
    setIsModalOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isCSV = file.type === "text/csv" || file.name.endsWith(".csv");
    const isJSON = file.type === "application/json" || file.name.endsWith(".json");

    if (!isCSV && !isJSON) {
      toast({
        title: "⚠️ Invalid File",
        description: "Please upload a CSV or JSON file",
        variant: "destructive",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        setFormData({ ...formData, importJsonText: e.target.result });
        toast({
          title: "✅ File Loaded",
          description: `${file.name} has been loaded. Click Import to populate fields.`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
      }
    };
    reader.readAsText(file);

    // Reset the input so the same file can be uploaded again
    event.target.value = "";
  };

  const downloadCSVTemplate = () => {
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

    toast({
      title: "✅ Template Downloaded",
      description: "Question import CSV template has been downloaded",
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900",
      duration: 1000,
    });
  };

  const handleImportJson = () => {
    if (!formData.importJsonText.trim()) {
      toast({
        title: "⚠️ Empty Data",
        description: "Please paste JSON data or upload a file",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    try {
      const dataText = formData.importJsonText.trim();
      let parsedData: any = {};

      // Check if data is JSON (starts with { or [)
      if (dataText.startsWith('{') || dataText.startsWith('[')) {
        // Parse as JSON
        parsedData = JSON.parse(dataText);
      } else {
        // Parse as CSV
        const parseResult = Papa.parse(dataText, {
          header: true,
          skipEmptyLines: true,
          transform: (value) => value.trim(),
        });

        if (parseResult.errors.length > 0) {
          throw new Error(`CSV parsing error: ${parseResult.errors[0].message}`);
        }

        const csvData = parseResult.data;

        if (csvData.length === 0) {
          throw new Error("CSV file is empty or invalid");
        }

        // Check if it's key-value format (field, value columns)
        const firstRow: any = csvData[0];
        if (firstRow.field && firstRow.value) {
          // Key-value format: field,value
          csvData.forEach((row: any) => {
            if (row.field && row.value) {
              if (row.field === 'school_ids') {
                // Parse comma-separated school IDs
                parsedData.school_ids = row.value.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));
              } else if (row.field === 'isRandom') {
                parsedData.isRandom = row.value.toLowerCase() === 'true';
              } else {
                parsedData[row.field] = row.value;
              }
            }
          });
        } else if (firstRow.english_text !== undefined || firstRow.question_type !== undefined || firstRow.difficulty_level !== undefined) {
          // This is a CSV containing a list of questions directly
          parsedData = csvData;
        } else {
          // Standard format: name,description,school_ids (first data row)
          parsedData = firstRow;
          if (parsedData.school_ids && typeof parsedData.school_ids === 'string') {
            parsedData.school_ids = parsedData.school_ids.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id));
          }
          if (parsedData.isRandom !== undefined) {
            parsedData.isRandom = String(parsedData.isRandom).toLowerCase() === 'true';
          }
        }
      }

      // Log parsed data for debugging
      // console.log("Parsed data:", parsedData);

      // Normalize questions array - convert question_id to id if needed
      let questions = [];
      if (Array.isArray(parsedData)) {
        questions = parsedData;
      } else {
        questions = parsedData.questions || [];
      }
      
      console.log("[DEBUG] handleImportJson - extracted raw questions:", questions);

      if (questions.length > 0) {
        // Parse stringified JSON arrays like answer_key, english_options if they exist
        const tryParseList = (val: any) => {
          if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
            try { return JSON.parse(val); } catch(e) { return val; }
          }
          return val;
        };

        const tryParseOptions = (val: any) => {
          const parsed = tryParseList(val);
          if (Array.isArray(parsed)) {
            // Extract the 'text' property if it's an object with an 'id' and 'text', otherwise keep string
            return parsed.map(item => typeof item === 'object' && item.text !== undefined ? String(item.text) : String(item));
          }
          return parsed;
        };

        const tryParseIntArray = (val: any) => {
          const parsed = tryParseList(val);
          if (Array.isArray(parsed)) {
            return parsed.map(item => parseInt(item, 10));
          } else if (typeof parsed === 'string' || typeof parsed === 'number') {
            return [parseInt(String(parsed), 10)];
          }
          return parsed;
        };

        questions = questions.map((q: any) => ({
          ...q,
          id: q.id ? parseInt(q.id, 10) : (q.question_id ? parseInt(q.question_id, 10) : undefined),
          difficulty_level: q.difficulty_level ? parseInt(q.difficulty_level, 10) : 1, // Default to level 1
          english_options: tryParseOptions(q.english_options),
          hindi_options: tryParseOptions(q.hindi_options),
          marathi_options: tryParseOptions(q.marathi_options),
          answer_key: tryParseIntArray(q.answer_key),
        }));
      }

      // Populate form fields with whatever data we have
      const updatedFormData = {
        ...formData,
        name: parsedData.name || formData.name,
        description: parsedData.description || formData.description,
        school_ids: parsedData.school_ids ? parsedData.school_ids.map(String) : formData.school_ids,
        nameType: "custom",
        isRandom: parsedData.isRandom !== undefined ? parsedData.isRandom : false,
        questions: questions,
      };

      setFormData(updatedFormData);

      // Build a helpful message about what was imported
      const importedFields = [];
      if (parsedData.name) importedFields.push("name");
      if (parsedData.description) importedFields.push("description");
      if (parsedData.school_ids && parsedData.school_ids.length > 0) {
        importedFields.push(`${parsedData.school_ids.length} school(s)`);
      }
      if (questions && questions.length > 0) {
        importedFields.push(`${questions.length} question(s)`);
      }

      toast({
        title: "✅ Data Imported",
        description: `Imported: ${importedFields.join(", ") || "some fields"}. Please fill in any remaining required fields.`,
        variant: "default",
        className: "border-green-500 bg-green-50 text-green-900",
        duration:1000,
      });
    } catch (err: any) {
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
      nameType: "custom", // Always custom when editing
      isRandom: false,
      school_ids: set.school_ids ? set.school_ids.map(String) : [],
      importJsonText: "",
      questions: [],
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    // Validation
    // let limit = 0; // Default limit since we removed the field
    let finalName = formData.name;

    if (!formData.name.trim()) {
      toast({
        title: "⚠️ Required Field Missing",
        description: "Please enter a set name",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        title: "⚠️ Required Field Missing",
        description: "Please enter a description",
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
        description: formData.description,
        isRandom: formData.isRandom,
        school_ids: formData.school_ids.map(Number),
        success: true,
      };

      if (editingSet) {
        // Update existing set
        await updateQuestionSet(editingSet.id, payload);
        toast({
          title: "✅ Set Updated Successfully",
          description: `"${finalName}" has been updated successfully.`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });
        setIsModalOpen(false);
        await fetchSets(false);
      } else {
        // Create new set

        // If Custom Name (and thus "Next" flow), defer creation
        if (formData.nameType === "custom") {
          setIsModalOpen(false);
          setPendingSetData({
            name: finalName,
            description: formData.description,
            school_ids: formData.school_ids
          });

          // Map imported question IDs to full question objects from allQuestions
          let fullQuestions = [];
          if (formData.questions && formData.questions.length > 0 && allQuestions) {
            const notFoundIds: number[] = [];
            let newQuestionsCount = 0;

            fullQuestions = formData.questions
              .map((importedQ: any) => {
                const qId = importedQ.id || importedQ.question_id;

                // If ID is provided, try to find existing question
                if (qId) {
                  const fullQuestion = allQuestions.find((q: any) => q.id === qId);
                  if (fullQuestion) {
                    return {
                      ...fullQuestion,
                      difficulty_level: importedQ.difficulty_level || fullQuestion.difficulty_level,
                    };
                  } else {
                    notFoundIds.push(qId);
                    return null;
                  }
                }
                // Alternatively, if it's a completely new question data block without an ID
                else if (importedQ.english_text && importedQ.english_options && importedQ.answer_key) {
                  newQuestionsCount++;
                  return {
                    ...importedQ,
                    isNew: true, // Flag it so we know it hasn't been saved yet
                    id: `tmp-${Date.now()}-${Math.random()}`, // Temporary ID for UI keys
                    difficulty_level: importedQ.difficulty_level || 1
                  };
                }

                return null;
              })
              .filter((q: any) => q !== null);

            // console.log("Imported questions:", formData.questions);
            // console.log("Available allQuestions count:", allQuestions?.length);
            // console.log("Mapped imported questions to full objects:", fullQuestions);

            if (notFoundIds.length > 0) {
              console.warn("Question IDs not found:", notFoundIds);
              if (newQuestionsCount > 0) {
                toast({
                  title: "⚠️ Some Questions Not Found",
                  description: `${notFoundIds.length} question(s) with IDs: ${notFoundIds.join(", ")} were not found in the database. Loaded ${newQuestionsCount} new inline question(s).`,
                  variant: "default",
                  className: "border-orange-500 bg-orange-50 text-orange-900",
                });
              } else {
                toast({
                  title: "⚠️ Some Questions Not Found",
                  description: `${notFoundIds.length} question(s) with IDs: ${notFoundIds.join(", ")} were not found in the database.`,
                  variant: "default",
                  className: "border-orange-500 bg-orange-50 text-orange-900",
                });
              }
            } else if (fullQuestions.length > 0) {
              const loadedExisting = fullQuestions.length - newQuestionsCount;
              toast({
                title: "✅ Questions Loaded",
                description: `Pre-selected ${loadedExisting} existing questions and ${newQuestionsCount} new inline questions.`,
                variant: "default",
                className: "border-green-500 bg-green-50 text-green-900",
              });
            }
          }

          // Create a temporary "fake" set to trigger the picker
          const tempSet = {
            id: -1, // signal that this is new
            name: finalName,
            limit: 0,
            questions: fullQuestions, // Pre-load imported questions with full data
            active: true,
            isNewCustom: true // Optional helper flag
          };
          
          console.log("[DEBUG] handleSubmit - tempSet created:", tempSet);
          
          setActiveSet(tempSet);
          return;
        }

        const newSet = await createQuestionSet(payload);
        toast({
          title: "✅ Set Created Successfully",
          description: `"${finalName}" has been added.`,
          variant: "default",
          className: "border-green-500 bg-green-50 text-green-900",
        });

        setIsModalOpen(false);
        await fetchSets(false);
      }
    } catch (err: any) {
      toast({
        title: "Oops!",
        description: "There was a small issue while processing your request. Please try again.",
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
          // allQuestions={allQuestions}
          activeSet={sets.find((s) => s.id === activeSet.id) || activeSet}
          onClose={() => setActiveSet(null)}
          difficultyLevel={difficultyLevels}
          onSave={(selected) => handleSaveQuestions(selected, activeSet)}
        />
      )}
      {/* Add/Edit Set Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSet ? "Edit Question Set" : "Create Question Set"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
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
                  <RadioGroupItem value="random" id="r-random" />
                  <Label htmlFor="r-random">Random</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="r-custom" />
                  <Label htmlFor="r-custom">Custom Name</Label>
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
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this question set"
                rows={3}
              />
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
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="import-json" className="text-sm font-semibold">Import from File/JSON</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={downloadCSVTemplate}
                      className="h-7 text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Template
                    </Button>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileUpload}
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
                      <Upload className="h-3 w-3 mr-1" />
                      Upload File
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleImportJson}
                      className="h-7 text-xs"
                    >
                      Import
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="import-json"
                  value={formData.importJsonText}
                  onChange={(e) =>
                    setFormData({ ...formData, importJsonText: e.target.value })
                  }
                  placeholder="Paste csv here"
                  rows={6}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  💡 First download the template, add questions according to the template format, then upload the questions CSV file, click Import to parse it, and finally click Next.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingSet ? "Update" : (formData.nameType === "custom" ? "Next" : "Create")}
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
