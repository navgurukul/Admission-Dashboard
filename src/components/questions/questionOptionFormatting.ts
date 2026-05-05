export type QuestionOption = string | { id?: number; text?: string; label?: string };

export const PERCENTAGE_QUESTION_REGEX = /\bpercent(?:age|ages)?\b|%|प्रतिशत|फीसदी|टक्केवारी|टक्के/i;

export const getRawOptionText = (option: QuestionOption) => {
  if (typeof option === "string") {
    return option;
  }

  return option?.text ?? option?.label ?? JSON.stringify(option);
};

export const formatOptionDisplay = (questionText: string, option: QuestionOption) => {
  const rawText = getRawOptionText(option).trim();

  if (!rawText) {
    return rawText;
  }

  const isPercentageQuestion = PERCENTAGE_QUESTION_REGEX.test(questionText);
  const isPlainNumber = /^\d+(?:\.\d+)?$/.test(rawText);

  if (isPercentageQuestion && isPlainNumber) {
    return `${rawText}%`;
  }

  return rawText;
};

export const splitCompoundOptionText = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  if (trimmed.includes(";")) {
    return trimmed
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const commaSeparatedPercentages = trimmed.match(/\d+(?:\.\d+)?%/g);
  if (commaSeparatedPercentages && commaSeparatedPercentages.length > 1) {
    return commaSeparatedPercentages;
  }

  return [trimmed];
};

export const normalizeQuestionOptions = <T extends QuestionOption>(options: T[] | undefined): T[] => {
  if (!Array.isArray(options) || options.length === 0) {
    return [];
  }

  if (options.length === 1) {
    const firstOption = options[0];
    const rawText = getRawOptionText(firstOption);
    const splitOptions = splitCompoundOptionText(rawText);

    if (splitOptions.length > 1) {
      return splitOptions.map((text, index) => {
        if (typeof firstOption === "object" && firstOption !== null) {
          return {
            ...firstOption,
            id: index + 1,
            text,
          } as T;
        }

        return text as T;
      });
    }
  }

  return options;
};