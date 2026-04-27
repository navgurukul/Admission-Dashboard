import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { getQuestionsBySetType, getTopics, getQuestionsPaginated, type TopicOption } from "@/utils/api";
import { Search, Filter } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface QuestionPickerProps {
  activeSet: any;
  onClose: () => void;
  onSave: (selected: any[]) => void;
  difficultyLevel?: { id: number; name: string; points: number }[];
  fetchQuestionsFromApi?: boolean;
  saveLabel?: string;
  title?: string;
  footerNote?: string;
  showLanguageLabels?: boolean;
  showCorrectAnswer?: boolean;
  previewMode?: boolean;
}
type LanguageKey = "english" | "hindi" | "marathi";

export function QuestionPicker({
  activeSet,
  onClose,
  onSave,
  difficultyLevel,
  fetchQuestionsFromApi = true,
  saveLabel = "Save",
  title,
  footerNote = "Minimum 16 questions required",
  showLanguageLabels = false,
  showCorrectAnswer = false,
  previewMode = false,
}: QuestionPickerProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any[]>(activeSet.questions || []);
  const [searchText, setSearchText] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageKey>("english");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const { debouncedValue: debouncedSearchText } = useDebounce(searchText, 400);

  // Fetch Set + Remaining questions
  useEffect(() => {
    if (!activeSet?.name) return; // exit if type is missing

    const fetchQuestions = async () => {
      setLoading(true);
      try {
        if (!fetchQuestionsFromApi) {
          const initialQuestions = activeSet.questions || [];
          setQuestions(initialQuestions);
          setSelected(initialQuestions);
          return;
        }

        let mainData: any[] = [];
        try {
          const hasApiFilters =
            difficultyFilter !== null ||
            selectedTopic !== "all" ||
            debouncedSearchText.trim() !== "";
          
          if (hasApiFilters) {
            const firstPageResponse = await getQuestionsPaginated({
              topic: selectedTopic === "all" ? undefined : selectedTopic,
              difficulty_level: difficultyFilter ?? undefined,
              search: debouncedSearchText,
              page: 1,
            });

            mainData = firstPageResponse.questions || [];

            if (firstPageResponse.totalPages > 1) {
              const remainingPages = await Promise.all(
                Array.from({ length: firstPageResponse.totalPages - 1 }, (_, index) =>
                  getQuestionsPaginated({
                    topic: selectedTopic === "all" ? undefined : selectedTopic,
                    difficulty_level: difficultyFilter ?? undefined,
                    search: debouncedSearchText,
                    page: index + 2,
                  }),
                ),
              );

              mainData = [
                ...mainData,
                ...remainingPages.flatMap((pageResponse) => pageResponse.questions || []),
              ];
            }
          } else {
            const mainSet = await getQuestionsBySetType(activeSet.name);
            mainData = mainSet?.data || [];
            
            const remainingSet = await getQuestionsBySetType("Remaining");
            const remainData = remainingSet?.data || [];
            mainData = [...mainData, ...remainData];
          }
        } catch (error) {
          console.warn("Could not fetch questions:", error);
        }

        const activeQuestions = activeSet.questions || [];
        const mergedQuestions: any[] = [...mainData];

        activeQuestions.forEach((question: any) => {
          if (!mergedQuestions.some((item) => item.id === question.id)) {
            // Keep selected questions even if they don't match current filters, 
            // so they don't disappear from the UI if already selected.
            mergedQuestions.unshift(question);
          }
        });

        setQuestions(mergedQuestions);
        setSelected(activeQuestions);
      } catch (err) {
        console.error("Failed to fetch questions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [activeSet, fetchQuestionsFromApi, difficultyFilter, selectedTopic, debouncedSearchText]);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const topicData = await getTopics();
        setTopics(topicData.filter((topic) => topic?.status !== false));
      } catch (error) {
        console.warn("Could not fetch topics.", error);
      }
    };

    fetchTopics();
  }, []);

  const difficultyMap = Array.isArray(difficultyLevel)
    ? difficultyLevel.reduce(
        (acc, level) => {
          acc[level.id] = level;
          return acc;
        },
        {} as Record<number, { id: number; name: string; points: number }>,
      )
    : {};

  const toggle = (question: any) => {
    setSelected((prev) => {
      const exists = prev.find((item) => item.id === question.id);
      if (exists) {
        return prev.filter((item) => item.id !== question.id);
      }

      return [...prev, question];
    });
  };

  const getDifficultyColor = (difficultyId: number) => {
    const difficultyName = difficultyMap[difficultyId]?.name || "Unknown";

    switch (difficultyName.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-700";
      case "hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getOptionText = (option: any) => {
    if (typeof option === "string") return option;
    if (option?.text !== undefined) return String(option.text);
    if (option?.value !== undefined) return String(option.value);
    return String(option ?? "");
  };

  const compactPreviewText = (value: any, fallback: string) => {
    const raw = String(value ?? "");
    const normalized = raw
      .replace(/\r\n/g, "\n")
      .replace(/\n[\t ]+\n/g, "\n\n")
      .replace(/\n{2,}/g, "\n")
      .trim();

    return normalized || fallback;
  };

  const getCorrectAnswerRows = (question: any) => {
    const answerKey = Array.isArray(question.answer_key)
      ? question.answer_key
      : question.answer_key !== undefined && question.answer_key !== null
        ? [question.answer_key]
        : [];

    if (answerKey.length === 0) {
      return [];
    }

    const englishOptions = Array.isArray(question.english_options) ? question.english_options : [];
    const hindiOptions = Array.isArray(question.hindi_options) ? question.hindi_options : [];
    const marathiOptions = Array.isArray(question.marathi_options) ? question.marathi_options : [];

    return answerKey.map((rawValue: any) => {
      const numericKey = Number(rawValue);
      const optionIndex = englishOptions.findIndex((option: any, idx: number) => {
        const optionId = typeof option === "object" && option?.id !== undefined
          ? Number(option.id)
          : idx + 1;
        return optionId === numericKey || idx + 1 === numericKey;
      });

      if (optionIndex >= 0) {
        const englishText = getOptionText(englishOptions[optionIndex]);
        const hindiText = hindiOptions[optionIndex] !== undefined ? getOptionText(hindiOptions[optionIndex]) : "";
        const marathiText = marathiOptions[optionIndex] !== undefined ? getOptionText(marathiOptions[optionIndex]) : "";
        const optionLabel = String.fromCharCode(65 + optionIndex);
        return {
          label: optionLabel,
          englishText,
          hindiText,
          marathiText,
        };
      }

      return {
        label: String(rawValue),
        englishText: String(rawValue),
        hindiText: "",
        marathiText: "",
      };
    });
  };

  const selectedStats = useMemo(() => {
    const easyQuestions = selected.filter(
      (question) => difficultyMap[question.difficulty_level]?.name?.toLowerCase() === "easy",
    );
    const mediumQuestions = selected.filter(
      (question) => difficultyMap[question.difficulty_level]?.name?.toLowerCase() === "medium",
    );
    const hardQuestions = selected.filter(
      (question) => difficultyMap[question.difficulty_level]?.name?.toLowerCase() === "hard",
    );

    return {
      total: selected.length,
      easy: easyQuestions.length,
      medium: mediumQuestions.length,
      hard: hardQuestions.length,
      totalMarks: easyQuestions.length + mediumQuestions.length * 2 + hardQuestions.length * 3,
    };
  }, [selected, difficultyMap]);

  const availableStats = useMemo(() => {
    const easyQuestions = questions.filter(
      (question) => difficultyMap[question.difficulty_level]?.name?.toLowerCase() === "easy",
    );
    const mediumQuestions = questions.filter(
      (question) => difficultyMap[question.difficulty_level]?.name?.toLowerCase() === "medium",
    );
    const hardQuestions = questions.filter(
      (question) => difficultyMap[question.difficulty_level]?.name?.toLowerCase() === "hard",
    );

    return {
      easy: easyQuestions.length,
      medium: mediumQuestions.length,
      hard: hardQuestions.length,
    };
  }, [questions, difficultyMap]);

  const easyTarget = availableStats.easy;
  const mediumTarget = availableStats.medium;
  const hardTarget = availableStats.hard;

  const getQuestionKey = (question: any, index: number) => {
    return question.id || `${question.english_text || "question"}-${question.hindi_text || ""}-${index}`;
  };

  const getLanguageLabel = (language: LanguageKey) => {
    if (language === "hindi") return "Hindi";
    if (language === "marathi") return "Marathi";
    return "English";
  };

  const getQuestionTextByLanguage = (question: any, language: LanguageKey) => {
    if (language === "hindi") {
      return compactPreviewText(question.hindi_text, "No Hindi text");
    }
    if (language === "marathi") {
      return compactPreviewText(question.marathi_text, "No Marathi text");
    }
    return compactPreviewText(question.english_text, "No English text");
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="z-50 flex max-h-[94vh] w-[96vw] max-w-5xl flex-col gap-0 overflow-hidden border border-slate-200 bg-white p-0 shadow-2xl">
        <DialogHeader className="shrink-0 border-b border-slate-200 px-6 py-5">
          <DialogTitle className="text-2xl font-semibold text-slate-900">
            {title || (
              <>
                Choose Questions for <span className="font-semibold">{activeSet.name}</span>
              </>
            )}
          </DialogTitle>
          {!previewMode && (
            <p className="mt-1 text-sm text-slate-500">
              Review, search, and select the questions you want to keep in this set.
            </p>
          )}
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {previewMode ? "Preview Questions" : "Pick Questions"}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search questions..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="h-11 border-slate-200 bg-white pl-10 text-sm shadow-none"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setIsFilterModalOpen(true)}
                className={`h-11 gap-2 border-slate-200 bg-white px-4 text-sm font-medium transition-all hover:bg-slate-50 ${
                  difficultyFilter !== null || selectedTopic !== "all"
                    ? "border-pink-200 bg-pink-50 text-pink-600 hover:bg-pink-100 hover:text-pink-700"
                    : "text-slate-600"
                }`}
              >
                <Filter className="h-4 w-4" />
                Filter
                {(difficultyFilter !== null || selectedTopic !== "all") && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] text-white">
                    {(difficultyFilter !== null ? 1 : 0) + (selectedTopic !== "all" ? 1 : 0)}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Filter Modal */}
          <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
            <DialogContent className="max-w-md border-slate-200 p-0 shadow-2xl">
              <DialogHeader className="border-b border-slate-100 px-6 py-4">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-semibold text-slate-900">Filter Questions</DialogTitle>
                </div>
              </DialogHeader>
              <div className="space-y-6 p-6">
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Difficulty Level</label>
                  <select
                    value={difficultyFilter ?? ""}
                    onChange={(e) => setDifficultyFilter(e.target.value ? Number(e.target.value) : null)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  >
                    <option value="">All Difficulties</option>
                    {Array.isArray(difficultyLevel) &&
                      difficultyLevel.map((level) => (
                        <option key={level.id} value={level.id}>
                          {level.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700">Topic</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  >
                    <option value="all">All Topics</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={String(topic.id)}>
                        {topic.topic}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <Button 
                    variant="ghost" 
                    className="flex-1 text-slate-500 hover:text-slate-700"
                    onClick={() => {
                      setDifficultyFilter(null);
                      setSelectedTopic("all");
                    }}
                  >
                    Reset All
                  </Button>
                  <Button 
                    className="flex-[2] bg-pink-600 hover:bg-pink-700"
                    onClick={() => setIsFilterModalOpen(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
              <div className="flex w-fit flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm">
                <span className={selectedStats.easy === easyTarget ? "font-semibold text-green-600" : "text-slate-600"}>
                  Easy: {selectedStats.easy}
                </span>
                <span className="text-slate-300">|</span>
                <span className={selectedStats.medium === mediumTarget ? "font-semibold text-amber-600" : "text-slate-600"}>
                  Medium: {selectedStats.medium}
                </span>
                <span className="text-slate-300">|</span>
                <span className={selectedStats.hard === hardTarget ? "font-semibold text-rose-600" : "text-slate-600"}>
                  Hard: {selectedStats.hard}
                </span>
              </div>
              {showLanguageLabels && (
                <div className="inline-flex w-fit flex-wrap items-center gap-3 self-start text-slate-600 md:self-center">
                  <div className="inline-flex items-center gap-2">
                    <span className="font-medium text-slate-700">Language:</span>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value as LanguageKey)}
                      className="h-7 rounded border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-slate-400"
                    >
                      <option value="english">English</option>
                      <option value="hindi">Hindi</option>
                      <option value="marathi">Marathi</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            <div className="inline-flex w-fit items-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="text-sm font-semibold text-emerald-700">Total Marks: {selectedStats.totalMarks}</div>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-2">
            {loading ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                Loading questions...
              </div>
            ) : questions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                No questions found.
              </div>
            ) : (
              questions.map((question, index) => {
                const difficulty = difficultyMap[question.difficulty_level];
                const key = getQuestionKey(question, index);
                const isSelected = selected.some((item) => item.id === question.id);
                const topicId = Number(question.topic);
                const matchedTopic = Number.isInteger(topicId)
                  ? topics.find((topic) => topic.id === topicId)
                  : null;
                const topicLabel =
                  matchedTopic?.topic ||
                  (question.topic !== undefined && question.topic !== null && String(question.topic).trim() !== ""
                    ? String(question.topic)
                    : "");

                return (
                  <label
                    key={key}
                    className={`flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-colors ${
                      isSelected
                        ? "border-pink-300 bg-pink-50/40"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggle(question)}
                      className="mt-0.5"
                    />

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`${getDifficultyColor(difficulty?.id)} border-0 shadow-none`}>
                          {difficulty?.name || "Unknown"}
                        </Badge>
                        <Badge variant="outline" className="border-slate-200 text-slate-600">
                          {question.question_type || "Question"}
                        </Badge>
                        {topicLabel && (
                          <Badge variant="outline" className="border-slate-200 text-slate-500">
                            {topicLabel}
                          </Badge>
                        )}
                      </div>

                      {showLanguageLabels ? (
                        <div className="text-sm leading-6 text-slate-900 whitespace-pre-line">
                          {getQuestionTextByLanguage(question, selectedLanguage)}
                        </div>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="text-sm leading-6 text-slate-800">
                            {question.english_text || "No English text"}
                          </div>
                          <div className="text-sm leading-6 text-slate-600">
                            {question.hindi_text || "No Hindi text"}
                          </div>
                          <div className="text-sm leading-6 text-slate-600">
                            {question.marathi_text || "No Marathi text"}
                          </div>
                        </div>
                      )}

                      {showCorrectAnswer && (
                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Correct Answer</div>
                          <div className="mt-2 space-y-2">
                            {getCorrectAnswerRows(question).length > 0 ? (
                              getCorrectAnswerRows(question).map((row: any, rowIndex: number) => (
                                <div key={`${row.label}-${rowIndex}`} className="rounded-md border border-emerald-200 bg-white px-3 py-2">
                                  <div className="text-sm text-slate-900 whitespace-pre-line">
                                    <span className="font-medium">{row.label}. </span>
                                    {selectedLanguage === "hindi"
                                      ? (row.hindiText || row.englishText)
                                      : selectedLanguage === "marathi"
                                        ? (row.marathiText || row.englishText)
                                        : row.englishText}
                                    <span className="ml-2 font-semibold text-green-600">✓ Correct</span>
                                  </div>
                                 
                                </div>
                              ))
                            ) : (
                              <div className="text-sm text-emerald-900">N/A</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <div className="mr-auto space-y-1">
            <div className="text-sm font-semibold text-slate-800">Total Question: {selectedStats.total}</div>
            <div className="text-xs font-medium text-amber-600">{footerNote}</div>
          </div>
          <Button variant="outline" onClick={onClose} className="border-slate-200 bg-white">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-pink-600 hover:bg-pink-700">
            {saveLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
