import React from "react";
import {
  INSTRUCTION_PATTERNS,
  splitQuestionTextIntoBlocks,
  type QuestionTextBlock,
} from "./questionFormattingContent";
import { useLanguage } from "@/routes/LaunguageContext";

interface QuestionFormattedTextProps {
  // `text` can be a plain string or a language-keyed object
  text: any;
  className?: string;
}

const EXAMPLE_MARKER_REGEX = /(For example\s*[:,-]?|Example\s*:|For exmaple\s*[:,-]?|उदाहरण(?:ार्थ)?\s*[:,-]?|उदा\.?\s*[:,-]?)/gi;

const shouldApplyStructuredFormatting = (text: string) => {
  const normalized = text.replace(/\r/g, "").trim();

  if (!normalized) {
    return false;
  }

  // Check for instruction patterns or example markers anywhere in text
  const hasInstruction = INSTRUCTION_PATTERNS.some((pattern) => pattern.test(normalized));
  const hasExampleMarker = EXAMPLE_MARKER_REGEX.test(normalized);

  // If we have instruction or example, apply formatting even with minimal line breaks
  if (hasInstruction || hasExampleMarker) {
    EXAMPLE_MARKER_REGEX.lastIndex = 0;
    return true;
  }

  // Otherwise, require actual paragraph breaks for other structured content
  const hasParagraphBreak = /\n\s*\n/.test(normalized);
  if (!hasParagraphBreak) {
    return false;
  }

  EXAMPLE_MARKER_REGEX.lastIndex = 0;
  return true;
};

const renderWithBoldExampleMarkers = (text: string) => {
  const parts = text.split(EXAMPLE_MARKER_REGEX);

  return parts.map((part, index) => {
    if (!part) {
      return null;
    }

    if (EXAMPLE_MARKER_REGEX.test(part)) {
      EXAMPLE_MARKER_REGEX.lastIndex = 0;
      return <strong key={`example-marker-${index}`}>{part}</strong>;
    }

    EXAMPLE_MARKER_REGEX.lastIndex = 0;
    return <React.Fragment key={`example-text-${index}`}>{part}</React.Fragment>;
  });
};

const renderPlainText = (text: string) => <>{text}</>;

const stripLeadingSeparatorLines = (text: string) =>
  text.replace(/^(?:\s*[-_=*]{3,}\s*)+/i, "").trim();

const renderWithBoldExample = (text: string) => {
  // Match "Example" or "उदाहरण" or "उदा" as standalone words (case-insensitive)
  const exampleRegex = /(Example|उदाहरण|उदा\.?)/gi;
  const parts = text.split(exampleRegex);

  return parts.map((part, index) => {
    if (!part) {
      return null;
    }

    if (exampleRegex.test(part)) {
      exampleRegex.lastIndex = 0;
      return <strong key={`example-${index}`}>{part}</strong>;
    }

    exampleRegex.lastIndex = 0;
    return <React.Fragment key={`desc-text-${index}`}>{part}</React.Fragment>;
  });
};

export function QuestionFormattedText({ text, className }: QuestionFormattedTextProps) {
  const { selectedLanguage } = useLanguage();

  // If `text` is an object containing language keys, pick the selected language
  const resolvedText: string = React.useMemo(() => {
    if (!text && text !== "") return "";

    if (typeof text === "string") return text;

    if (typeof text === "object") {
      // common keys we might encounter
      return (
        text[selectedLanguage] ||
        text[`${selectedLanguage}_text`] ||
        text.english ||
        text.english_text ||
        // fallback: first string property found
        Object.values(text).find((v: any) => typeof v === "string") ||
        ""
      );
    }

    return String(text || "");
  }, [text, selectedLanguage]);

  const applyStructuredFormatting = React.useMemo(
    () => shouldApplyStructuredFormatting(resolvedText),
    [resolvedText],
  );

  const questionPrefix = selectedLanguage === "english" ? "Q." : "प्र.";

  const blocks = React.useMemo(() => splitQuestionTextIntoBlocks(resolvedText), [resolvedText]);

  if (!applyStructuredFormatting) {
    return (
      <div className={className}>
          <p className="text-base leading-6 text-slate-950 whitespace-pre-line">
            {resolvedText}
          </p>
        </div>
    );
  }

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="rounded-2xl p-6">
        <div className="space-y-3">
        {blocks.map((block, index) => {
          if (block.type === "title") {
            return (
              <h1
                key={`${block.type}-${index}`}
                className="text-xl sm:text-2xl font-bold tracking-tight leading-8 text-slate-950"
              >
                {block.text}
              </h1>
            );
          }

          if (block.type === "callout") {
            return (
              <p
                key={`${block.type}-${index}`}
                className="text-base font-bold underline underline-offset-4 leading-7 text-black whitespace-pre-line"
              >
                {block.text}
              </p>
            );
          }

          if (block.type === "question") {
            let strippedQuestionText = stripLeadingSeparatorLines(
              block.text.trim().replace(/^(q\.|प्र\.?|प्रश्न\s*[:\.]?)\s*/i, ""),
            );

            // If text is empty or only contains dashes/separators, don't render prefix
            if (!strippedQuestionText || /^[\s\-_=*]+$/.test(strippedQuestionText)) {
              return null;
            }

            return (
              <p
                key={`${block.type}-${index}`}
                className="text-base leading-7 text-slate-900 whitespace-pre-line"
              >
                <strong>{questionPrefix}</strong>{" "}
                {renderWithBoldExampleMarkers(strippedQuestionText)}
              </p>
            );
          }

          return (
            <p
              key={`${block.type}-${index}`}
              className="text-base italic leading-7 text-slate-700 whitespace-pre-line"
            >
              {renderWithBoldExample(block.text)}
            </p>
          );
        })}
        </div>
      </div>
    </div>
  );
}