import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, History, Settings2, RotateCcw, Pencil, FolderPlus, Link2, ExternalLink, X } from "lucide-react";
import {
  getInterviewQuestions,
  submitCulturalFitRoundFeedback,
  updateCulturalFitRoundFeedback,
} from "@/utils/api";

interface Question {
  id?: number;
  question?: string;
  originalQuestion?: string;
  context_text?: string;
  answer?: string;
  link?: string;
  isCustom?: boolean;
  customUid?: string;
}

export const HIGHEST_QUALIFICATION_OPTIONS = [
  "12th",
  "Diploma",
  "ITI",
  "BA",
  "B.Com",
  "B.Sc",
  "BCA",
  "BBA",
  "B.Tech",
  "BE",
  "B.Pharm",
  "B.Ed",
  "LLB",
  "Graduation – Other",
  "Post Graduation",
];

export const GOVT_SCHOOL_10TH_OPTIONS = ["Yes", "No"];
export const GOVT_SCHOOL_OPTIONS = GOVT_SCHOOL_10TH_OPTIONS;

export const GOVT_SCHOOL_12TH_OPTIONS = ["Yes", "No", "Not Applicable"];

export const PARENT_QUALIFICATION_OPTIONS = [
  "No Education",
  "Below 10th",
  "10th",
  "12th",
  "ITI",
  "Diploma",
  "Graduate",
  "Post Graduate",
];

export const SIBLINGS_OPTIONS = [
  "Studying – School",
  "Studying – College",
  "Pursuing Diploma",
  "Pursuing ITI",
  "Preparing for Competitive Exams",
  "Working – Private Job",
  "Working – Government Job",
  "Business / Self-employed",
  "Looking for a Job",
  "Unemployed",
  "Married & Living with Parents",
  "Married & Living Separately",
  "Homemaker",
  "Supporting Family",
  "Not Supporting Family",
  "Dependent on Family",
  "Living Away from Family",
  "Not in Contact",
];

export const PARENT_INCOME_OPTIONS = [
  "Below ₹1 Lakh",
  "₹1–2 Lakh",
  "₹2–3 Lakh",
  "₹3–5 Lakh",
  "₹5–10 Lakh",
  "Above ₹10 Lakh",
  "Don't Know",
];

export const HOUSE_STATUS_OPTIONS = [
  "Own",
  "Rented",
  "Government / Provided House",
  "Other",
];

export const VEHICLE_OPTIONS = [
  "No Vehicle",
  "Bicycle",
  "Two-Wheeler",
  "Auto",
  "Car",
  "Tractor",
  "Other",
];

export const HOUSE_TYPE_OPTIONS = [
  "Kutcha",
  "Semi-pucca",
  "Pucca",
  "Apartment",
];

export const getMatchedDropdownValue = (val: string | undefined, options: string[]) => {
  if (!val) return "";
  const normalizedVal = val
    .toLowerCase()
    .replace(/[\u2013\u2014-]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  const found = options.find(
    (opt) =>
      opt
        .toLowerCase()
        .replace(/[\u2013\u2014-]/g, "-")
        .replace(/\s+/g, " ")
        .trim() === normalizedVal
  );
  return found || val;
};

export interface QuestionDropdownConfig {
  key: string;
  title: string;
  placeholder: string;
  defaultOptions: string[];
}

export const getStoredOptions = (key: string, defaultOptions: string[]): string[] => {
  try {
    const stored = localStorage.getItem(`cfr_options_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load options from storage", e);
  }
  return defaultOptions;
};

export const saveStoredOptions = (key: string, options: string[]) => {
  try {
    localStorage.setItem(`cfr_options_${key}`, JSON.stringify(options));
  } catch (e) {
    console.error("Failed to save options to storage", e);
  }
};

export const removeStoredOptions = (key: string) => {
  try {
    localStorage.removeItem(`cfr_options_${key}`);
  } catch (e) {
    console.error("Failed to remove options from storage", e);
  }
};

export interface StoredCustomQuestion {
  id: string;
  question: string;
  context_text: string;
}

const STORAGE_CUSTOM_TOPICS_KEY = "cfr_custom_topics_list";
const STORAGE_CUSTOM_QUESTIONS_KEY = "cfr_custom_questions_list";
const STORAGE_DELETED_QUESTIONS_KEY = "cfr_deleted_questions_list";
const STORAGE_MODIFIED_QUESTIONS_KEY = "cfr_modified_questions_map";
const STORAGE_DELETED_TOPICS_KEY = "cfr_deleted_topics_list";
const STORAGE_RENAMED_TOPICS_KEY = "cfr_renamed_topics_map";

export const getStoredCustomTopics = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_TOPICS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load custom topics", e);
  }
  return [];
};

export const saveStoredCustomTopics = (topics: string[]) => {
  try {
    localStorage.setItem(STORAGE_CUSTOM_TOPICS_KEY, JSON.stringify(topics));
  } catch (e) {
    console.error("Failed to save custom topics", e);
  }
};

export const getStoredCustomQuestions = (): StoredCustomQuestion[] => {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_QUESTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load custom questions", e);
  }
  return [];
};

export const saveStoredCustomQuestions = (questions: StoredCustomQuestion[]) => {
  try {
    localStorage.setItem(STORAGE_CUSTOM_QUESTIONS_KEY, JSON.stringify(questions));
  } catch (e) {
    console.error("Failed to save custom questions", e);
  }
};

export const getStoredDeletedQuestionIds = (): (string | number)[] => {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_QUESTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load deleted question IDs", e);
  }
  return [];
};

export const saveStoredDeletedQuestionIds = (ids: (string | number)[]) => {
  try {
    localStorage.setItem(STORAGE_DELETED_QUESTIONS_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error("Failed to save deleted question IDs", e);
  }
};

export const getStoredModifiedQuestions = (): Record<string | number, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_MODIFIED_QUESTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
  } catch (e) {
    console.error("Failed to load modified questions", e);
  }
  return {};
};

export const saveStoredModifiedQuestions = (map: Record<string | number, string>) => {
  try {
    localStorage.setItem(STORAGE_MODIFIED_QUESTIONS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save modified questions", e);
  }
};

export const getStoredDeletedTopics = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_DELETED_TOPICS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error("Failed to load deleted topics", e);
  }
  return [];
};

export const saveStoredDeletedTopics = (topics: string[]) => {
  try {
    localStorage.setItem(STORAGE_DELETED_TOPICS_KEY, JSON.stringify(topics));
  } catch (e) {
    console.error("Failed to save deleted topics", e);
  }
};

export const getStoredRenamedTopics = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(STORAGE_RENAMED_TOPICS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
  } catch (e) {
    console.error("Failed to load renamed topics", e);
  }
  return {};
};

export const saveStoredRenamedTopics = (map: Record<string, string>) => {
  try {
    localStorage.setItem(STORAGE_RENAMED_TOPICS_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save renamed topics", e);
  }
};

export interface CfrAnswerStatus {
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  isAllAnswered: boolean;
  unansweredByTopic: Record<string, string[]>;
  allQuestionsByTopic: Record<string, { question: string; answered: boolean; answer?: string }[]>;
}

export const computeCfrAnswerStatus = (
  apiQuestions: any[],
  existingQna?: any[]
): CfrAnswerStatus => {
  const deletedQIds = getStoredDeletedQuestionIds();
  const modifiedQs = getStoredModifiedQuestions();
  const deletedTopics = getStoredDeletedTopics();
  const renamedTopics = getStoredRenamedTopics();

  // 1. Process base API questions
  let mappedQuestions: { question: string; originalQuestion?: string; topic: string }[] = (apiQuestions || [])
    .filter((q: any) => !deletedQIds.some((did) => String(did) === String(q.id)))
    .map((q: any) => {
      let topic = q.context_text || "General Questions";
      if (renamedTopics[topic]) {
        topic = renamedTopics[topic];
      }
      let qText = q.question_text || "";
      if (modifiedQs[q.id]) {
        qText = modifiedQs[q.id];
      }
      return {
        question: qText,
        originalQuestion: q.question_text,
        topic,
      };
    })
    .filter((q) => q.question && q.question.trim() !== "" && !deletedTopics.includes(q.topic));

  // 2. Custom questions
  const storedCustomQs = getStoredCustomQuestions().filter(
    (sq) => sq.question && sq.question.trim() !== ""
  );
  const customQuestionsMapped = storedCustomQs
    .map((sq) => {
      let topic = sq.context_text || "Custom Questions";
      if (renamedTopics[topic]) {
        topic = renamedTopics[topic];
      }
      return {
        question: sq.question,
        originalQuestion: undefined,
        topic,
      };
    })
    .filter((q) => !deletedTopics.includes(q.topic));

  // 3. Existing QNA Map (answers)
  const existingQnaMap = new Map<string, string>();
  if (Array.isArray(existingQna)) {
    existingQna.forEach((item: any) => {
      if (item?.question) {
        existingQnaMap.set(item.question.trim().toLowerCase(), item.answer || "");
      }
    });
  }

  // 4. Any questions in existingQna that aren't in base or custom
  const allKnownQuestions = new Set([
    ...mappedQuestions.map((q) => q.question.trim().toLowerCase()),
    ...mappedQuestions.map((q) => (q.originalQuestion ? q.originalQuestion.trim().toLowerCase() : "")).filter(Boolean),
    ...customQuestionsMapped.map((q) => q.question.trim().toLowerCase()),
  ]);

  const additionalQs: { question: string; originalQuestion?: string; topic: string }[] = [];
  if (Array.isArray(existingQna)) {
    existingQna.forEach((item: any) => {
      if (item?.question && item.question.trim() !== "" && !allKnownQuestions.has(item.question.trim().toLowerCase())) {
        additionalQs.push({
          question: item.question.trim(),
          topic: "Custom Questions",
        });
      }
    });
  }

  const allActiveQuestions = [...mappedQuestions, ...customQuestionsMapped, ...additionalQs];

  const unansweredByTopic: Record<string, string[]> = {};
  const allQuestionsByTopic: Record<string, { question: string; answered: boolean; answer?: string }[]> = {};

  let answeredCount = 0;

  allActiveQuestions.forEach((q) => {
    const qLower = q.question.trim().toLowerCase();
    const origLower = q.originalQuestion ? q.originalQuestion.trim().toLowerCase() : "";

    const ans = existingQnaMap.get(qLower) ?? (origLower ? existingQnaMap.get(origLower) : undefined);
    const hasAnswer = Boolean(ans && ans.trim().length > 0);

    if (!allQuestionsByTopic[q.topic]) {
      allQuestionsByTopic[q.topic] = [];
    }
    allQuestionsByTopic[q.topic].push({
      question: q.question,
      answered: hasAnswer,
      answer: ans,
    });

    if (hasAnswer) {
      answeredCount++;
    } else {
      if (!unansweredByTopic[q.topic]) {
        unansweredByTopic[q.topic] = [];
      }
      unansweredByTopic[q.topic].push(q.question);
    }
  });

  const totalQuestions = allActiveQuestions.length;
  const unansweredCount = totalQuestions - answeredCount;
  const isAllAnswered = totalQuestions > 0 && unansweredCount === 0;

  return {
    totalQuestions,
    answeredCount,
    unansweredCount,
    isAllAnswered,
    unansweredByTopic,
    allQuestionsByTopic,
  };
};

export const getQuestionDropdownConfig = (questionText?: string): QuestionDropdownConfig | null => {
  if (!questionText) return null;
  const normalized = questionText.trim().toLowerCase();

  // Questions that must remain as standard text input (no dropdown)
  if (
    normalized.includes("how many rooms") ||
    normalized.includes("rooms are there in your house") ||
    normalized.includes("tin roof") ||
    normalized.includes("concrete roof") ||
    normalized.includes("roof")
  ) {
    return null;
  }

  // 1. Father's qualification
  if (normalized.includes("father") && (normalized.includes("qualification") || normalized.includes("education"))) {
    return {
      key: "father_qualification",
      title: "Father's Qualification",
      placeholder: "Select Father's Qualification",
      defaultOptions: PARENT_QUALIFICATION_OPTIONS,
    };
  }

  // 2. Mother's qualification
  if (normalized.includes("mother") && (normalized.includes("qualification") || normalized.includes("education"))) {
    return {
      key: "mother_qualification",
      title: "Mother's Qualification",
      placeholder: "Select Mother's Qualification",
      defaultOptions: PARENT_QUALIFICATION_OPTIONS,
    };
  }

  // 3. Highest qualification of student
  if (normalized.includes("highest qualification") || normalized.includes("what is your highest qualification")) {
    return {
      key: "highest_qualification",
      title: "Highest Qualification",
      placeholder: "Select Highest Qualification",
      defaultOptions: HIGHEST_QUALIFICATION_OPTIONS,
    };
  }

  // 4. Govt school 10th
  if (
    normalized.includes("10th") &&
    (normalized.includes("govt") || normalized.includes("government"))
  ) {
    return {
      key: "govt_school_10th",
      title: "Govt School 10th Class",
      placeholder: "Select Option",
      defaultOptions: GOVT_SCHOOL_10TH_OPTIONS,
    };
  }

  // 5. Govt school 12th
  if (
    normalized.includes("12th") &&
    (normalized.includes("govt") || normalized.includes("government"))
  ) {
    return {
      key: "govt_school_12th",
      title: "Govt School 12th Class",
      placeholder: "Select Option",
      defaultOptions: GOVT_SCHOOL_12TH_OPTIONS,
    };
  }

  // 6. Siblings
  if (normalized.includes("sibling")) {
    return {
      key: "siblings",
      title: "Siblings Activity",
      placeholder: "Select Sibling Activity",
      defaultOptions: SIBLINGS_OPTIONS,
    };
  }

  // 7. Parents' annual income
  if (
    normalized.includes("annual income") ||
    (normalized.includes("income") && (normalized.includes("parent") || normalized.includes("family")))
  ) {
    return {
      key: "parent_income",
      title: "Parents' Annual Income",
      placeholder: "Select Annual Income",
      defaultOptions: PARENT_INCOME_OPTIONS,
    };
  }

  // 8. Vehicle ownership
  if (normalized.includes("vehicle")) {
    return {
      key: "vehicle",
      title: "Vehicle Ownership",
      placeholder: "Select Vehicle",
      defaultOptions: VEHICLE_OPTIONS,
    };
  }

  // 9. Type of house (Kutcha / Semi-pucca / Pucca / Apartment)
  if (
    normalized.includes("type of house") ||
    normalized.includes("kutcha") ||
    normalized.includes("pucca")
  ) {
    return {
      key: "house_type",
      title: "House Type",
      placeholder: "Select House Type",
      defaultOptions: HOUSE_TYPE_OPTIONS,
    };
  }

  // 10. House owned or rented (Only matches "Is your house owned or rented?")
  if (
    (normalized.includes("owned") && normalized.includes("rented")) ||
    (normalized.includes("house") && (normalized.includes("owned") || normalized.includes("rented"))) ||
    normalized.includes("owned or rented")
  ) {
    return {
      key: "house_status",
      title: "House Ownership",
      placeholder: "Select House Status",
      defaultOptions: HOUSE_STATUS_OPTIONS,
    };
  }

  return null;
};

// Backwards-compatible helpers
export const isHighestQualificationQuestion = (questionText?: string) => {
  return getQuestionDropdownConfig(questionText)?.defaultOptions === HIGHEST_QUALIFICATION_OPTIONS;
};

export const getMatchedQualificationValue = (val?: string) => {
  return getMatchedDropdownValue(val, HIGHEST_QUALIFICATION_OPTIONS);
};

export const isGovtSchoolQuestion = (questionText?: string) => {
  return getQuestionDropdownConfig(questionText)?.defaultOptions === GOVT_SCHOOL_10TH_OPTIONS;
};

export const getMatchedGovtSchoolValue = (val?: string) => {
  return getMatchedDropdownValue(val, GOVT_SCHOOL_10TH_OPTIONS);
};

interface CfrFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  existingData?: any; // The CFR round data from interview_cultural_fit_round
  onSuccess?: () => void;
  studentDetails?: any;
}

export function CfrFeedbackModal({
  isOpen,
  onClose,
  studentId,
  existingData,
  onSuccess,
  studentDetails,
}: CfrFeedbackModalProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>("");

  const [status, setStatus] = useState("");
  const [comments, setComments] = useState("");

  // Manage custom dropdown options (CRD)
  const [customOptionsMap, setCustomOptionsMap] = useState<Record<string, string[]>>({});
  const [managingConfig, setManagingConfig] = useState<QuestionDropdownConfig | null>(null);
  const [newOptionInput, setNewOptionInput] = useState("");

  const getActiveOptions = (config: QuestionDropdownConfig) => {
    return customOptionsMap[config.key] || getStoredOptions(config.key, config.defaultOptions);
  };

  const handleAddOption = () => {
    if (!managingConfig || !newOptionInput.trim()) return;
    const trimmed = newOptionInput.trim();
    const current = getActiveOptions(managingConfig);
    if (current.some(opt => opt.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: "Option Exists",
        description: "This option already exists in the list.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }
    const updated = [...current, trimmed];
    setCustomOptionsMap(prev => ({ ...prev, [managingConfig.key]: updated }));
    saveStoredOptions(managingConfig.key, updated);
    setNewOptionInput("");
    toast({
      title: "Option Added",
      description: `"${trimmed}" added successfully.`,
    });
  };

  const handleDeleteOption = (optionToDelete: string) => {
    if (!managingConfig) return;
    const current = getActiveOptions(managingConfig);
    const updated = current.filter(opt => opt !== optionToDelete);
    setCustomOptionsMap(prev => ({ ...prev, [managingConfig.key]: updated }));
    saveStoredOptions(managingConfig.key, updated);
    toast({
      title: "Option Removed",
      description: `"${optionToDelete}" removed.`,
    });
  };

  const handleResetOptions = () => {
    if (!managingConfig) return;
    removeStoredOptions(managingConfig.key);
    setCustomOptionsMap(prev => ({ ...prev, [managingConfig.key]: managingConfig.defaultOptions }));
    toast({
      title: "Reset to Defaults",
      description: `Options for ${managingConfig.title} have been reset to defaults.`,
    });
  };

  // Topic & Question CRUD State
  const [defaultTopics, setDefaultTopics] = useState<string[]>([]);
  const [customTopics, setCustomTopics] = useState<string[]>(getStoredCustomTopics);
  const [isAddTopicModalOpen, setIsAddTopicModalOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [editingTopic, setEditingTopic] = useState<{ oldName: string; newName: string } | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setCustomTopics(getStoredCustomTopics());
      if (existingData?.cultural_fit_status) {
        setStatus(existingData.cultural_fit_status);
      }
      if (existingData?.comments) {
        setComments(existingData.comments);
      }
      fetchQuestions();
    }
  }, [isOpen, existingData]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const stageId = 4;
      const response = await getInterviewQuestions(stageId);
      const data = response?.data || response || [];

      const deletedQIds = getStoredDeletedQuestionIds();
      const modifiedQs = getStoredModifiedQuestions();
      const deletedTopics = getStoredDeletedTopics();
      const renamedTopics = getStoredRenamedTopics();

      // Collect and process default topics
      const rawDefaultTopics: string[] = Array.from(
        new Set(data.map((q: any) => q.context_text || "General Questions"))
      );
      const processedDefaultTopics = rawDefaultTopics
        .map((t) => renamedTopics[t] || t)
        .filter((t) => !deletedTopics.includes(t));
      setDefaultTopics(processedDefaultTopics);

      let mappedQuestions: Question[] = data
        .filter((q: any) => !deletedQIds.some((did) => String(did) === String(q.id)))
        .map((q: any) => {
          let topic = q.context_text || "General Questions";
          if (renamedTopics[topic]) {
            topic = renamedTopics[topic];
          }
          let qText = q.question_text;
          if (modifiedQs[q.id]) {
            qText = modifiedQs[q.id];
          }
          return {
            id: q.id,
            question: qText,
            originalQuestion: q.question_text,
            context_text: topic,
            answer: "",
            isCustom: false,
          };
        })
        .filter((q: Question) => !deletedTopics.includes(q.context_text || ""));

      // Load persistent custom questions (filter out blank questions from previous sessions)
      const storedCustomQs = getStoredCustomQuestions();
      const validCustomQs = storedCustomQs.filter(
        (sq) => sq.question && sq.question.trim() !== ""
      );
      if (validCustomQs.length !== storedCustomQs.length) {
        saveStoredCustomQuestions(validCustomQs);
      }
      const customQuestionsMapped: Question[] = validCustomQs.map((sq, idx) => ({
        id: -1 * (idx + 1) * 1000 - (Date.now() % 1000),
        question: sq.question,
        context_text: sq.context_text || "Custom Questions",
        answer: "",
        isCustom: true,
        customUid: sq.id,
      }));

      // Merge answers and links if we are editing existing data
      if (existingData?.qna && Array.isArray(existingData.qna)) {
        const existingQnaMap = new Map<string, { answer?: string; link?: string }>();
        existingData.qna.forEach((q: any) => {
          if (q.question) {
            existingQnaMap.set(q.question.trim().toLowerCase(), {
              answer: q.answer || "",
              link: q.link || "",
            });
          }
        });

        mappedQuestions = mappedQuestions.map((q: any) => {
          const matched =
            existingQnaMap.get(q.question?.trim().toLowerCase() || "") ||
            (q.originalQuestion ? existingQnaMap.get(q.originalQuestion.trim().toLowerCase()) : undefined);
          return {
            ...q,
            answer: matched?.answer !== undefined ? matched.answer : q.answer,
            link: matched?.link !== undefined ? matched.link : q.link,
          };
        });

        const customQsWithAnswers = customQuestionsMapped.map((q: any) => {
          const matched = existingQnaMap.get(q.question?.trim().toLowerCase() || "");
          return {
            ...q,
            answer: matched?.answer !== undefined ? matched.answer : q.answer,
            link: matched?.link !== undefined ? matched.link : q.link,
          };
        });

        const allKnownQuestions = new Set([
          ...mappedQuestions.map((q) => q.question?.trim().toLowerCase() || ""),
          ...mappedQuestions.map((q) => q.originalQuestion?.trim().toLowerCase() || ""),
          ...customQuestionsMapped.map((q) => q.question?.trim().toLowerCase() || ""),
        ]);

        const additionalQs: Question[] = [];
        let addId = Date.now();
        existingData.qna.forEach((q: any) => {
          if (q.question && !allKnownQuestions.has(q.question.trim().toLowerCase())) {
            addId++;
            additionalQs.push({
              id: addId,
              question: q.question,
              context_text: "Custom Questions",
              answer: q.answer || "",
              link: q.link || "",
              isCustom: true,
            });
          }
        });

        mappedQuestions = [...mappedQuestions, ...customQsWithAnswers, ...additionalQs];
      } else {
        mappedQuestions = [...mappedQuestions, ...customQuestionsMapped];
      }

      setQuestions(mappedQuestions);

      // Auto-redirect to first unanswered question topic and focus
      const firstPending = mappedQuestions.find(
        (q) => !q.answer || q.answer.trim() === ""
      );
      if (firstPending && firstPending.context_text) {
        setActiveGroup(firstPending.context_text);
        setTimeout(() => {
          const el = document.getElementById(`cfr-q-item-${firstPending.id}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            const inputEl = el.querySelector("input, textarea, select, button") as HTMLElement;
            if (inputEl) inputEl.focus();
          }
        }, 300);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      toast({
        title: "Error",
        description: "Failed to load interview questions.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTopic = (allExistingGroups: string[]) => {
    const trimmed = newTopicName.trim();
    if (!trimmed) return;
    if (allExistingGroups.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
      toast({
        title: "Topic Exists",
        description: "A topic with this name already exists.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }
    const updated = [...customTopics, trimmed];
    setCustomTopics(updated);
    saveStoredCustomTopics(updated);
    setActiveGroup(trimmed);
    setNewTopicName("");
    setIsAddTopicModalOpen(false);
    toast({
      title: "Topic Created",
      description: `Topic "${trimmed}" created successfully.`,
    });
  };

  const handleUpdateTopic = (allExistingGroups: string[]) => {
    if (!editingTopic || !editingTopic.newName.trim()) return;
    const oldName = editingTopic.oldName;
    const newName = editingTopic.newName.trim();
    if (oldName === newName) {
      setEditingTopic(null);
      return;
    }
    if (
      allExistingGroups.some(
        (g) => g.toLowerCase() === newName.toLowerCase() && g !== oldName
      )
    ) {
      toast({
        title: "Topic Exists",
        description: "A topic with this name already exists.",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (customTopics.includes(oldName)) {
      const updatedTopics = customTopics.map((t) => (t === oldName ? newName : t));
      setCustomTopics(updatedTopics);
      saveStoredCustomTopics(updatedTopics);
    } else {
      const renamedMap = getStoredRenamedTopics();
      for (const key in renamedMap) {
        if (renamedMap[key] === oldName) {
          renamedMap[key] = newName;
        }
      }
      renamedMap[oldName] = newName;
      saveStoredRenamedTopics(renamedMap);
      setDefaultTopics((prev) => prev.map((t) => (t === oldName ? newName : t)));
    }

    setQuestions((prev) =>
      prev.map((q) => (q.context_text === oldName ? { ...q, context_text: newName } : q))
    );

    const storedQs = getStoredCustomQuestions();
    const updatedStoredQs = storedQs.map((sq) =>
      sq.context_text === oldName ? { ...sq, context_text: newName } : sq
    );
    saveStoredCustomQuestions(updatedStoredQs);

    if (activeGroup === oldName) {
      setActiveGroup(newName);
    }
    setEditingTopic(null);
    toast({
      title: "Topic Renamed",
      description: `Topic renamed to "${newName}".`,
    });
  };

  const handleDeleteTopic = (topicToDelete: string, remainingGroups: string[]) => {
    const qCount = groupedQuestions[topicToDelete]?.length || 0;
    if (qCount > 0) {
      if (!window.confirm(`Are you sure you want to delete topic "${topicToDelete}" and its ${qCount} question(s)?`)) {
        return;
      }
    }

    if (customTopics.includes(topicToDelete)) {
      const updatedTopics = customTopics.filter((t) => t !== topicToDelete);
      setCustomTopics(updatedTopics);
      saveStoredCustomTopics(updatedTopics);
    } else {
      const deletedTopics = getStoredDeletedTopics();
      const renamedMap = getStoredRenamedTopics();
      const toDeleteList = [topicToDelete];
      for (const key in renamedMap) {
        if (renamedMap[key] === topicToDelete) {
          toDeleteList.push(key);
        }
      }
      const updatedDeleted = Array.from(new Set([...deletedTopics, ...toDeleteList]));
      saveStoredDeletedTopics(updatedDeleted);
      setDefaultTopics((prev) => prev.filter((t) => t !== topicToDelete));
    }

    setQuestions((prev) => {
      const toDelete = prev.filter((q) => q.context_text === topicToDelete);
      const defaultIds = toDelete.filter((q) => !q.isCustom && q.id).map((q) => q.id!);
      if (defaultIds.length > 0) {
        const deletedIds = getStoredDeletedQuestionIds();
        const newDeleted = [...deletedIds];
        defaultIds.forEach((did) => {
          if (!newDeleted.some((id) => String(id) === String(did))) {
            newDeleted.push(did);
          }
        });
        saveStoredDeletedQuestionIds(newDeleted);
      }
      return prev.filter((q) => q.context_text !== topicToDelete);
    });

    const storedQs = getStoredCustomQuestions();
    const updatedStoredQs = storedQs.filter((sq) => sq.context_text !== topicToDelete);
    saveStoredCustomQuestions(updatedStoredQs);

    if (activeGroup === topicToDelete) {
      const nextGroup = remainingGroups.find((g) => g !== topicToDelete) || "";
      setActiveGroup(nextGroup);
    }
    toast({
      title: "Topic Deleted",
      description: `Topic "${topicToDelete}" and its questions have been removed.`,
    });
  };

  const handleAddQuestionToTopic = (topicName: string) => {
    const newUid = `cq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newId = -1 * (Date.now() % 1000000) - Math.floor(Math.random() * 1000);
    const newQ: Question = {
      id: newId,
      question: "",
      context_text: topicName,
      answer: "",
      isCustom: true,
      customUid: newUid,
    };
    setQuestions((prev) => [...prev, newQ]);

    const storedQs = getStoredCustomQuestions();
    saveStoredCustomQuestions([
      ...storedQs,
      { id: newUid, question: "", context_text: topicName },
    ]);

    setEditingQuestionId(newId);
    setEditingQuestionText("");
  };

  const handleSaveQuestionEdit = (id: number) => {
    const trimmed = editingQuestionText.trim();
    if (!trimmed) {
      toast({
        title: "Validation Error",
        description: "Question text cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          return { ...q, question: trimmed };
        }
        return q;
      })
    );

    const target = questions.find((q) => q.id === id);
    if (target?.isCustom && target.customUid) {
      const storedQs = getStoredCustomQuestions();
      saveStoredCustomQuestions(
        storedQs.map((sq) => (sq.id === target.customUid ? { ...sq, question: trimmed } : sq))
      );
    } else if (target?.id) {
      const modified = getStoredModifiedQuestions();
      modified[target.id] = trimmed;
      saveStoredModifiedQuestions(modified);
    }

    setEditingQuestionId(null);
    setEditingQuestionText("");
    toast({
      title: "Question Saved",
      description: "Question updated successfully.",
    });
  };

  const handleCancelQuestionEdit = (id: number) => {
    const target = questions.find((q) => q.id === id);
    if (target && (!target.question || target.question.trim() === "")) {
      handleDeleteQuestion(id);
    }
    setEditingQuestionId(null);
    setEditingQuestionText("");
  };

  const handleSelectGroup = (group: string) => {
    if (editingQuestionId) {
      const target = questions.find((q) => q.id === editingQuestionId);
      if (target && (!target.question || target.question.trim() === "")) {
        handleDeleteQuestion(editingQuestionId);
      }
      setEditingQuestionId(null);
      setEditingQuestionText("");
    }
    setActiveGroup(group);
  };

  const handleDeleteQuestion = (id: number) => {
    setQuestions((prev) => {
      const target = prev.find((q) => q.id === id);
      const filtered = prev.filter((q) => q.id !== id);
      if (target) {
        if (target.isCustom && target.customUid) {
          const storedQs = getStoredCustomQuestions();
          saveStoredCustomQuestions(storedQs.filter((sq) => sq.id !== target.customUid));
        } else if (target.id) {
          const deletedIds = getStoredDeletedQuestionIds();
          if (!deletedIds.some((did) => String(did) === String(target.id))) {
            saveStoredDeletedQuestionIds([...deletedIds, target.id]);
          }
        }
      }
      return filtered;
    });
    if (editingQuestionId === id) {
      setEditingQuestionId(null);
      setEditingQuestionText("");
    }
    toast({
      title: "Question Deleted",
      description: "Question removed successfully.",
    });
  };

  const handleResetAllToDefaults = () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all topics and questions to system defaults? Any custom additions, edits, or deletions will be cleared."
      )
    ) {
      return;
    }
    localStorage.removeItem(STORAGE_CUSTOM_TOPICS_KEY);
    localStorage.removeItem(STORAGE_CUSTOM_QUESTIONS_KEY);
    localStorage.removeItem(STORAGE_DELETED_QUESTIONS_KEY);
    localStorage.removeItem(STORAGE_MODIFIED_QUESTIONS_KEY);
    localStorage.removeItem(STORAGE_DELETED_TOPICS_KEY);
    localStorage.removeItem(STORAGE_RENAMED_TOPICS_KEY);
    setCustomTopics([]);
    setDefaultTopics([]);
    setEditingQuestionId(null);
    setEditingQuestionText("");
    fetchQuestions();
    toast({
      title: "Reset Completed",
      description: "Topics and questions have been restored to defaults.",
    });
  };

  const handleAnswerChange = (id: number, value: string) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, answer: value } : q)));
  };

  const handleLinkChange = (id: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, link: value } : q))
    );
  };

  const handleDownloadReport = async () => {
    try {
      // Validate that there's data to print
      if (!status && !comments && groups.length === 0) {
        toast({
          title: "No Data Available",
          description: "Please add feedback before printing the report.",
          variant: "default",
          className: "border-orange-500 bg-orange-50 text-orange-900",
        });
        return;
      }

      const reportContainer = document.getElementById('cfr-report-container');
      if (!reportContainer) {
        toast({
          title: "Error",
          description: "Report container not found.",
          variant: "destructive",
        });
        return;
      }

      // Call the browser's native print preview
      window.print();
    } catch (error) {
      console.error("Error printing report:", error);
      toast({
        title: "Print Failed",
        description: error instanceof Error ? error.message : "Failed to print report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!status) {
      toast({
        title: "Select Status",
        description: "Please select a status before submitting.",
        // variant: "destructive",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    if (!comments || comments.trim() === "") {
      toast({
        title: "Add Feedback ",
        description: "Please add your CFR Feedback and Overall Feedback before submitting.",
        // variant: "destructive",
        variant: "default",
        className: "border-orange-500 bg-orange-50 text-orange-900",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // If a question is currently in edit mode, auto-save its text before submitting
      let questionsToSubmit = [...questions];
      if (editingQuestionId && editingQuestionText.trim()) {
        questionsToSubmit = questionsToSubmit.map((q) =>
          q.id === editingQuestionId ? { ...q, question: editingQuestionText.trim() } : q
        );
        handleSaveQuestionEdit(editingQuestionId);
      }

      const qna = questionsToSubmit
        .filter((q) => q.question && q.question.trim() !== "")
        .map((q) => ({
          question: q.question!.trim(),
          answer: q.answer || "",
          link: q.link?.trim() || "",
        }));

      const payload = {
        student_id: studentId,
        cultural_fit_status: status,
        comments,
        qna,
      };

      if (existingData?.id) {
        await updateCulturalFitRoundFeedback(existingData.id, payload);
      } else {
        await submitCulturalFitRoundFeedback(payload);
      }

      toast({
        title: "Success",
        description: "Cultural Fit Round feedback saved successfully.",
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save feedback:", error);
      toast({
        title: "Error",
        description: "Failed to save feedback.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // In read-only mode, hide questions that have no answers
  const displayQuestions = existingData?._isReadOnly
    ? questions.filter((q) => q.answer && q.answer.trim() !== "")
    : questions;

  // Group questions by context
  const groupedQuestions = useMemo(() => {
    return displayQuestions.reduce((acc: Record<string, Question[]>, q) => {
      const group = q.context_text || "General Questions";
      if (!acc[group]) acc[group] = [];
      acc[group].push(q);
      return acc;
    }, {});
  }, [displayQuestions]);

  const groups = useMemo(() => {
    if (existingData?._isReadOnly) {
      return Object.keys(groupedQuestions);
    }
    return Array.from(
      new Set([
        ...defaultTopics,
        ...Object.keys(groupedQuestions),
        ...customTopics,
      ])
    );
  }, [defaultTopics, groupedQuestions, customTopics, existingData?._isReadOnly]);

  useEffect(() => {
    if (groups.length > 0 && (!activeGroup || !groups.includes(activeGroup))) {
      setActiveGroup(groups[0]);
    }
  }, [groups, activeGroup]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] h-[95vh] flex flex-col overflow-hidden">
        <DialogHeader>
          {/* <DialogTitle>Cultural Fit Round Feedback</DialogTitle> */}
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-1 justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-1 space-y-6">
              <Tabs defaultValue="complete" className="w-full">
                <div className="flex w-full justify-center mb-6">
                  <TabsList className="bg-gray-100/80 p-1 rounded-lg">
                    <TabsTrigger
                      value="complete"
                      className="px-6 py-2 rounded-md data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-gray-500"
                    >
                      Complete Feedback
                    </TabsTrigger>
                    <TabsTrigger
                      value="general"
                      className="px-6 py-2 rounded-md data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-gray-500"
                    >
                      Overall Feedback
                    </TabsTrigger>
                    <TabsTrigger
                      value="questions"
                      className="px-6 py-2 rounded-md data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-gray-500"
                    >
                      Detailed Feedback
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="complete" className="space-y-4">
                  {/* Print Button */}
                  <div className="flex justify-end mb-2 print:hidden">
                    <Button
                      onClick={() => handleDownloadReport()}
                      className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2"
                      size="sm"
                      disabled={!status && !comments && groups.length === 0}
                      title={!status && !comments && groups.length === 0 ? "No data available to print" : "Print / Save as PDF"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print / Save as PDF
                    </Button>
                  </div>

                  {/* Report Container */}
                  <div id="cfr-report-container" className="bg-white border-2 border-gray-300 rounded-lg p-8 shadow-lg">
                    {/* Report Header */}
                    <div className="border-b-4 border-pink-600 pb-3 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wide">
                            Cultural Fit Round Report
                          </h1>
                          <p className="text-sm text-gray-500 mt-1">Interview Feedback & Assessment</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-medium">Report Date</p>
                          <p className="text-sm font-semibold text-gray-700">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Info */}
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Name</span>
                          <span className="text-xs font-medium text-gray-900 text-ellipsis overflow-hidden whitespace-nowrap" title={studentDetails?.name || [studentDetails?.first_name, studentDetails?.last_name].filter(Boolean).join(" ") || "—"}>
                            {studentDetails?.name || [studentDetails?.first_name, studentDetails?.last_name].filter(Boolean).join(" ") || "—"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Email</span>
                          <span className="text-xs font-medium text-gray-900 text-ellipsis overflow-hidden whitespace-nowrap" title={studentDetails?.email || "—"}>{studentDetails?.email || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Phone</span>
                          <span className="text-xs font-medium text-gray-900">{studentDetails?.phone_number || studentDetails?.whatsapp_number || "—"}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Qualification</span>
                          <span className="text-xs font-medium text-gray-900 text-ellipsis overflow-hidden whitespace-nowrap" title={studentDetails?.qualification_name || studentDetails?.highest_qualification || studentDetails?.qualification || "—"}>
                            {studentDetails?.qualification_name || studentDetails?.highest_qualification || studentDetails?.qualification || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interview Status */}
                    <div className="mb-6">
                      <div className="bg-gray-100 px-3 py-2 border-l-4 border-pink-600 mb-3">
                        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Interview Status</h2>
                      </div>
                      <div className="pl-4">
                        {status && status !== "disabled hidden" ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-gray-600">Status:</span>
                            <span className={`text-sm font-bold ${
                              status === "Culture Fit Round Pass" ? "text-green-700" :
                              status === "Culture Fit Round Fail" ? "text-red-700" :
                              status === "Not Eligible" ? "text-gray-700" :
                              status === "Disinterested" ? "text-yellow-700" :
                              status === "Reschedule" ? "text-orange-700" :
                              status === "No Show" ? "text-purple-700" :
                              "text-gray-700"
                            }`}>
                              {status}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Status not recorded</p>
                        )}
                      </div>
                    </div>

                    {/* Overall Feedback */}
                    <div className="mb-6">
                      <div className="bg-gray-100 px-3 py-2 border-l-4 border-pink-600 mb-3">
                        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Overall Feedback</h2>
                      </div>
                      <div className="pl-4 pr-2">
                        {comments && comments.trim() !== "" ? (
                          <div className="bg-white border border-gray-300 rounded p-3">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed break-words break-all">{comments}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No overall feedback recorded</p>
                        )}
                      </div>
                    </div>

                    {/* Detailed Interview Questions & Answers */}
                    <div className="mb-4">
                      <div className="bg-gray-100 px-3 py-2 border-l-4 border-pink-600 mb-3">
                        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Detailed Interview Assessment</h2>
                      </div>

                      {groups.length > 0 ? (
                        <div className="space-y-5 pl-4">
                          {groups.map((group, groupIdx) => {
                            const groupQuestions = groupedQuestions[group] || [];
                            if (groupQuestions.length === 0) return null;

                            return (
                              <div key={group} className="border border-gray-300 rounded-md overflow-hidden">
                                {/* Topic Header */}
                                <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-gray-800 uppercase">
                                      {groupIdx + 1}. {group}
                                    </h3>
                                    <span className="text-xs font-semibold text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-300">
                                      {groupQuestions.length} {groupQuestions.length === 1 ? 'Q' : 'Questions'}
                                    </span>
                                  </div>
                                </div>

                                {/* Questions Table */}
                                <div className="bg-white">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-gray-50 border-b border-gray-300">
                                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-700 uppercase w-12">#</th>
                                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-700 uppercase">Question</th>
                                        <th className="text-left py-2 px-3 text-xs font-bold text-gray-700 uppercase">Response</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {groupQuestions.map((q, qIndex) => (
                                        <tr key={q.id || qIndex} className="hover:bg-gray-50">
                                          <td className="py-3 px-3 align-top">
                                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-pink-600 text-white text-xs font-bold">
                                              {qIndex + 1}
                                            </span>
                                          </td>
                                          <td className="py-3 px-3 align-top w-2/5">
                                            <p className="text-sm font-semibold text-gray-800 leading-snug break-words break-all">
                                              {q.question}
                                            </p>
                                            {q.isCustom && (
                                              <span className="text-[9px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-200 inline-block mt-1">
                                                CUSTOM
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-3 px-3 align-top">
                                            {q.answer && q.answer.trim() !== "" ? (
                                              <div className="space-y-2">
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed break-words break-all">
                                                  {q.answer}
                                                </p>
                                                {q.link && q.link.trim() !== "" && (
                                                  <div className="mt-1.5">
                                                    <p className="text-xs font-semibold text-gray-500 mb-0.5">Reference Link:</p>
                                                    <a
                                                      href={(() => {
                                                        const trimmed = q.link.trim();
                                                        return trimmed.startsWith("http://") || trimmed.startsWith("https://") 
                                                          ? trimmed 
                                                          : `https://${trimmed}`;
                                                      })()}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all"
                                                    >
                                                      {q.link.trim()}
                                                    </a>
                                                  </div>
                                                )}
                                              </div>
                                            ) : (
                                              <p className="text-xs text-gray-400 italic">Not answered</p>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="pl-4 pr-2">
                          <div className="bg-gray-50 border border-gray-300 rounded-md p-6 text-center">
                            <p className="text-sm text-gray-500 italic">No detailed assessment questions recorded</p>
                          </div>
                        </div>
                      )}
                    </div>


                  </div>
                </TabsContent>

                <TabsContent value="general" className="space-y-4">
                  <div>
                    {/* <label className="text-sm font-medium">General Comments *</label> */}
                    <Textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Overall Feedback..."
                      className="mt-1 border-pink-300 focus-visible:ring-pink-500 focus-visible:border-pink-500"
                      rows={6}
                      disabled={existingData?._isReadOnly}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="questions" className="space-y-6">
                  <div className="w-1/2">
                    <label className="text-sm font-medium">Status *</label>
                    <select
                      className="w-full mt-1 p-2 border rounded-md focus:border-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={existingData?._isReadOnly}
                    >
                      <option value="disabled hidden">Selection</option>
                      <option value="Culture Fit Round Pass">Culture Fit Round Pass</option>
                      <option value="Culture Fit Round Fail">Culture Fit Round Fail</option>
                      <option value="Not Eligible">Not Eligible</option>
                      <option value="Disinterested">Disinterested</option>
                      <option value="Reschedule">Reschedule</option>
                      <option value="No Show">No Show</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center border-t pt-4">
                    <h3 className="text-lg font-semibold">Questions</h3>
                  </div>

                  {groups.length > 0 ? (
                    <div className="flex flex-col md:flex-row gap-4 border rounded-md min-h-[500px]">
                      {/* Sidebar */}
                      <div className="w-full md:w-1/3 border-r bg-gray-50/50 p-2 overflow-y-auto max-h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-2 px-1 pb-1 border-b">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Topics</span>
                          {!existingData?._isReadOnly && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleResetAllToDefaults}
                                className="h-7 px-1.5 text-xs text-gray-500 hover:text-pink-600 hover:bg-pink-50"
                                title="Reset topics and questions to default"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reset
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setNewTopicName("");
                                  setIsAddTopicModalOpen(true);
                                }}
                                className="h-7 px-2 text-xs text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                                title="Create New Topic"
                              >
                                <FolderPlus className="h-3.5 w-3.5 mr-1" />
                                Add
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 flex-1">
                          {groups.map((group) => {
                            const count = groupedQuestions[group]?.length || 0;
                            return (
                              <div
                                key={group}
                                onClick={() => handleSelectGroup(group)}
                                className={`group/topic flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                                  activeGroup === group
                                    ? "bg-pink-100 text-pink-700 font-semibold"
                                    : "bg-pink-50/30 hover:bg-pink-50 text-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
                                  <span className="truncate leading-tight block">{group}</span>
                                  <span className="text-[11px] text-gray-400 font-normal shrink-0">({count})</span>
                                </div>

                                {!existingData?._isReadOnly && (
                                  <div
                                    className="flex items-center gap-0.5 shrink-0 opacity-80 hover:opacity-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => setEditingTopic({ oldName: group, newName: group })}
                                      className="p-1 hover:text-blue-600 hover:bg-white rounded transition-colors text-gray-400"
                                      title="Rename topic"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTopic(group, groups)}
                                      className="p-1 hover:text-red-600 hover:bg-white rounded transition-colors text-gray-400"
                                      title="Delete topic"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="w-full md:w-2/3 p-4 overflow-y-auto max-h-[500px]">
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {activeGroup}
                            </h3>
                            {customTopics.includes(activeGroup) && (
                              <span className="text-[11px] font-medium text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-200">
                                Custom Topic
                              </span>
                            )}
                          </div>
                          {!existingData?._isReadOnly && activeGroup && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddQuestionToTopic(activeGroup)}
                              className="text-xs text-pink-600 border-pink-200 hover:bg-pink-50 hover:text-pink-700"
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              Add Question
                            </Button>
                          )}
                        </div>

                        {(!groupedQuestions[activeGroup] || groupedQuestions[activeGroup].length === 0) ? (
                          <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg text-gray-500 bg-gray-50/50 min-h-[220px]">
                            <p className="text-sm font-medium text-gray-600 mb-2">No questions in this topic yet.</p>
                            {!existingData?._isReadOnly && (
                              <Button
                                size="sm"
                                onClick={() => handleAddQuestionToTopic(activeGroup)}
                                className="bg-pink-600 hover:bg-pink-700 text-white"
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add Question to {activeGroup}
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {groupedQuestions[activeGroup]?.map((q, index) => {
                              const isEditingThisQ = editingQuestionId === q.id;
                              return (
                                <div
                                  key={q.id || index}
                                  id={`cfr-q-item-${q.id}`}
                                  className={`space-y-3 bg-white p-4 rounded-lg border shadow-sm transition-all hover:border-pink-200 ${
                                    !q.answer || q.answer.trim() === "" ? "border-amber-300 ring-1 ring-amber-200/70" : ""
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex gap-2 flex-1">
                                      <span className="font-bold text-gray-400 min-w-max pt-0.5 text-sm">Q {index + 1}.</span>
                                      {isEditingThisQ ? (
                                        <div className="flex-1 space-y-2">
                                          <Input
                                            value={editingQuestionText}
                                            onChange={(e) => setEditingQuestionText(e.target.value)}
                                            placeholder="Type your question here..."
                                            className="text-sm font-medium focus:border-pink-500 focus:ring-pink-500"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleSaveQuestionEdit(q.id!);
                                              } else if (e.key === "Escape") {
                                                handleCancelQuestionEdit(q.id!);
                                              }
                                            }}
                                          />
                                          <div className="flex items-center gap-2">
                                            <Button
                                              size="sm"
                                              className="h-7 px-3 text-xs bg-pink-600 hover:bg-pink-700 text-white"
                                              onClick={() => handleSaveQuestionEdit(q.id!)}
                                            >
                                              Save
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-7 px-3 text-xs"
                                              onClick={() => handleCancelQuestionEdit(q.id!)}
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex-1">
                                          <h4 className="font-medium text-md text-gray-800 leading-snug">{q.question}</h4>
                                          {q.isCustom && (
                                            <span className="text-[10px] font-semibold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100 inline-block mt-1">
                                              Custom Question
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {!existingData?._isReadOnly && !isEditingThisQ && (
                                      <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                          onClick={() => {
                                            setEditingQuestionId(q.id!);
                                            setEditingQuestionText(q.question || "");
                                          }}
                                          title="Edit Question"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                          onClick={() => handleDeleteQuestion(q.id!)}
                                          title="Delete Question"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>

                              <div className="pt-2">
                                <div className="flex justify-between items-center mb-1">
                                  <label className="text-sm font-medium text-gray-700">Answer</label>
                                  {(() => {
                                    const dropdownConfig = getQuestionDropdownConfig(q.question);
                                    if (dropdownConfig && !existingData?._isReadOnly) {
                                      return (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setManagingConfig(dropdownConfig);
                                            setNewOptionInput("");
                                          }}
                                          className="text-xs text-pink-600 hover:text-pink-700 hover:underline flex items-center gap-1 font-medium transition-colors"
                                          title={`Manage options for ${dropdownConfig.title}`}
                                        >
                                          <Settings2 className="h-3.5 w-3.5" />
                                          Manage Options
                                        </button>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                {(() => {
                                  const dropdownConfig = getQuestionDropdownConfig(q.question);
                                  if (dropdownConfig) {
                                    const optionsList = getActiveOptions(dropdownConfig);
                                    const matchedValue = getMatchedDropdownValue(q.answer, optionsList);
                                    return (
                                      <select
                                        value={matchedValue}
                                        onChange={(e) => handleAnswerChange(q.id!, e.target.value)}
                                        className="w-full p-2.5 border border-gray-300 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 text-sm text-gray-800 disabled:opacity-75 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                                        disabled={existingData?._isReadOnly}
                                      >
                                        <option value="">{dropdownConfig.placeholder}</option>
                                        {q.answer && !optionsList.includes(matchedValue) && (
                                          <option value={q.answer}>{q.answer}</option>
                                        )}
                                        {optionsList.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    );
                                  }
                                  return (
                                    <Textarea
                                      rows={4}
                                      placeholder="Type the answer here..."
                                      value={q.answer || ""}
                                      onChange={(e) => handleAnswerChange(q.id!, e.target.value)}
                                      className="bg-gray-50 focus:bg-white"
                                      disabled={existingData?._isReadOnly}
                                    />
                                  );
                                })()}
                              </div>

                              {/* Link / Attachment Section */}
                              <div className="pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                                    <Link2 className="h-3.5 w-3.5 text-pink-600" />
                                    Reference / Document Link
                                  </label>
                                  {q.link && q.link.trim() && (
                                    <a
                                      href={(() => {
                                        const trimmed = q.link.trim();
                                        return trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
                                      })()}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-pink-600 hover:text-pink-700 hover:underline flex items-center gap-1 font-medium transition-colors"
                                      title="Open link in new tab"
                                    >
                                      <span>Open Link</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  )}
                                </div>

                                {!existingData?._isReadOnly ? (
                                  <div className="relative">
                                    <Input
                                      type="url"
                                      placeholder="Paste link here (e.g. Google Drive, Docs, Portfolio, Certificate)..."
                                      value={q.link || ""}
                                      onChange={(e) => handleLinkChange(q.id!, e.target.value)}
                                      className="text-xs h-8.5 bg-gray-50/50 focus:bg-white focus:border-pink-500 focus:ring-pink-500 pr-8"
                                    />
                                    {q.link && (
                                      <button
                                        type="button"
                                        onClick={() => handleLinkChange(q.id!, "")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
                                        title="Clear link"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ) : (q.link && q.link.trim()) ? (
                                  <a
                                    href={(() => {
                                      const trimmed = q.link.trim();
                                      return trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
                                    })()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline bg-blue-50/60 px-2.5 py-1.5 rounded-md border border-blue-100 max-w-full"
                                    title={q.link.trim()}
                                  >
                                    <ExternalLink className="h-3 w-3 shrink-0 text-blue-500" />
                                    <span className="truncate">{q.link.trim()}</span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">No link provided</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl bg-gray-50/50 text-gray-500 min-h-[220px]">
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center mb-3 border shadow-sm">
                        <History className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-center text-base font-semibold text-gray-700">
                        No Detailed Feedback Available
                      </p>
                      {existingData?._isReadOnly && (
                        <div className="mt-4 pt-3 border-t border-gray-200 w-full max-w-xl">
                          <p className="text-center text-xs text-gray-400 font-medium leading-relaxed">
                            Detailed feedback has not been recorded for this candidate yet. To add or update the feedback, click the Edit icon on this record.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t bg-white shrink-0 mt-4">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                {existingData?._isReadOnly ? "Close" : "Cancel"}
              </Button>
              {!existingData?._isReadOnly && (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Manage Dropdown Options Dialog (CRD) */}
    <Dialog open={!!managingConfig} onOpenChange={(open) => { if (!open) setManagingConfig(null); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Manage Options: {managingConfig?.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Create new option */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Add New Option</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter option name..."
                value={newOptionInput}
                onChange={(e) => setNewOptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddOption();
                  }
                }}
                className="text-sm"
              />
              <Button
                type="button"
                onClick={handleAddOption}
                className="bg-pink-600 hover:bg-pink-700 text-white shrink-0"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Read & Delete options list */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-gray-600">
                Current Options ({managingConfig ? getActiveOptions(managingConfig).length : 0})
              </label>
              <button
                type="button"
                onClick={handleResetOptions}
                className="text-xs text-gray-500 hover:text-pink-600 flex items-center gap-1 transition-colors"
                title="Reset to default options"
              >
                <RotateCcw className="h-3 w-3" /> Reset Defaults
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5 border rounded-md p-2 bg-gray-50">
              {managingConfig && getActiveOptions(managingConfig).map((opt) => (
                <div
                  key={opt}
                  className="flex justify-between items-center px-3 py-2 bg-white rounded border border-gray-200 text-sm shadow-sm"
                >
                  <span className="font-medium text-gray-800 break-all">{opt}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteOption(opt)}
                    className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors ml-2 shrink-0"
                    title={`Delete "${opt}"`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setManagingConfig(null)}
              size="sm"
            >
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Create New Topic Dialog */}
    <Dialog open={isAddTopicModalOpen} onOpenChange={setIsAddTopicModalOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-pink-600" />
            Create New Topic
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Topic Name</label>
            <Input
              placeholder="e.g. Basic Information, Family Details..."
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreateTopic(groups);
                }
              }}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddTopicModalOpen(false);
                setNewTopicName("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => handleCreateTopic(groups)}
              disabled={!newTopicName.trim()}
            >
              Create Topic
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Rename Topic Dialog */}
    <Dialog
      open={!!editingTopic}
      onOpenChange={(open) => {
        if (!open) setEditingTopic(null);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Pencil className="h-5 w-5 text-blue-600" />
            Rename Topic
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              New Name for "{editingTopic?.oldName}"
            </label>
            <Input
              placeholder="Enter new topic name..."
              value={editingTopic?.newName || ""}
              onChange={(e) =>
                setEditingTopic((prev) =>
                  prev ? { ...prev, newName: e.target.value } : null
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleUpdateTopic(groups);
                }
              }}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingTopic(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-pink-600 hover:bg-pink-700 text-white"
              onClick={() => handleUpdateTopic(groups)}
              disabled={!editingTopic?.newName.trim()}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}
