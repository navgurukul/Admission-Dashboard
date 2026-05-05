export type QuestionTextBlock = {
  type: "title" | "description" | "callout" | "question";
  text: string;
};

export type QuestionFormattingExample = {
  id: string;
  rawText: string;
  blocks: QuestionTextBlock[];
};

export type TopicExplanation = {
  explanation: string;
  example: string;
};

export const TOPIC_EXPLANATIONS: Record<string, TopicExplanation> = {
  "Linear Equations in Two Variables": {
    explanation:
      "Think of these questions like real-life situations. Two values are unknown. Use letters like x and y to represent them. Then use the given information to write an equation.",
    example:
      "If the total cost of apples and oranges is ₹100, and apples cost ₹3 each while oranges cost ₹2 each, the equation can be written as: 3x + 2y = 100",
  },
  "Profit and Loss": {
    explanation:
      "Profit and loss help us understand buying and selling things. Cost price (CP) is the price at which something is bought. Selling price (SP) is the price at which something is sold.",
    example:
      "If we sell something for more money than we bought it for, we get profit. If we sell something for less money than we bought it for, we get loss.",
  },
  "Simple Interest": {
    explanation:
      "Simple interest is the extra money paid or earned on a fixed amount of money for a given period of time at a fixed rate. Simple Interest = Principal × Rate × Time ÷ 100",
    example:
      "Principal (P) is the amount of money we first take or invest. The Rate of interest (R) is the percentage of interest per year. Time (T) means how many years.",
  },
  "Work and Time": {
    explanation:
      "For the next questions, think in a practical way. Work done increases with time.",
    example:
      "If you can plant 100 trees in 1 hour, then in 4 hours you can plant: 100 × 4 = 400 trees.",
  },
};

export const INSTRUCTION_PATTERNS = [
  /^Now answer the following questions?\.?$/i,
  /^now solve the following questions?\.?$/i,
  /^using the same idea,? answer the following questions?\.?$/i,
  /^Now solve the following questions?\.?$/i,
  // Hindi
  /^नीचे\s+दिए\s+गए\s+प्रश्नों\s+के\s+उत्तर\s+दीजिए[।\.]?$/i,
  /^अब\s+नीचे\s+दिए\s+गए\s+प्रश्न(ों)?\s+हल\s+करें[।\.]?$/i,
  /^नीचे\s+दिए\s+गए\s+प्रश्न(ों)?\s+हल\s+कर(ें|ो)?[।\.]?$/i,
  /^ध्यान\s+से\s+पढ़ें,\s*कदम-दर-कदम\s+सोचें,\s*और\s+प्रश्नों\s+को\s+हल\s+करें[।\.]?$/i,
  /^इसका\s+मतलब\s+है\s+कि\s+समय\s+बढ़ने\s+पर\s+किया\s+गया\s+काम\s+भी\s+बढ़ता\s+है[।\.]?\s*इसी\s+विचार\s+का\s+उपयोग\s+करके\s+नीचे\s+दिए\s+गए\s+प्रश्नों\s+के\s+उत्तर\s+दीजिए[।\.]?$/i,
  /^अब\s+निम्नलिखित\s+प्रश्न(ों)?\s+के\s+उत्तर\s+दीजिए[।\.]?$/i,
  // Marathi
  /^खाली\s+दिलेल्या\s+प्रश्न(ां|ांची)?\s+उत्तरे\s+द्या[।\.]?$/i,
  /^आता\s+पुढील\s+प्रश्न(ांना|ांचा|ांचे)?\s+सोडवा[।\.]?$/i,
  /^पुढील\s+प्रश्न\s+सोडवा[।\.]?$/i,
  /^काळजीपूर्वक\s+वाचा,\s*टप्प्याटप्प्याने\s+विचार\s+करा,\s*आणि\s+प्रश्न\s+सोडवा[।\.]?$/i,
  /^याचा\s+अर्थ\s+असा\s+की\s+वेळ\s+वाढल्यास\s+केलेले\s+कामही\s+वाढते[।\.]?\s*ह(ि|ी)च\s+पद्धत\s+वापरून\s+खाली\s+दिलेल्या\s+प्रश्नांची\s+उत्तरे\s+द्या[।\.]?$/i,
  /^आता\s+खालील\s+प्रश्न(ांची)?\s+उत्तरे\s+द्या[।\.]?$/i,
  /^पुढील\s+प्रश्न(ांची)?\s+उत्तरे\s+द्या[।\.]?$/i,
  /^खालील\s+प्रश्न(ांची)?\s+उत्तरे\s+द्या[।\.]?$/i,
  /^दिलेल्या\s+माहितीच्या\s+आधारे\s+खालील\s+प्रश्न(ांची)?\s+उत्तरे\s+द्या[।\.]?$/i,
  /^उपरोक्त\s+माहितीच्या\s+आधारे\s+खालील\s+प्रश्न(ांची)?\s+उत्तरे\s+द्या[।\.]?$/i,
];

const INLINE_INSTRUCTION_SEGMENT_PATTERNS = [
  /Now\s+answer\s+the\s+following\s+questions?\.?/gi,
  /now\s+solve\s+the\s+following\s+questions?\.?/gi,
  /using\s+the\s+same\s+idea,?\s*answer\s+the\s+following\s+questions?\.?/gi,
  /Now\s+solve\s+the\s+following\s+questions?\.?/gi,
  /नीचे\s+दिए\s+गए\s+प्रश्नों\s+के\s+उत्तर\s+दीजिए[।\.]?/gi,
  /अब\s+नीचे\s+दिए\s+गए\s+प्रश्न(ों)?\s+हल\s+करें[।\.]?/gi,
  /नीचे\s+दिए\s+गए\s+प्रश्न(ों)?\s+हल\s+कर(ें|ो)?[।\.]?/gi,
  /ध्यान\s+से\s+पढ़ें,\s*कदम-दर-कदम\s+सोचें,\s*और\s+प्रश्नों\s+को\s+हल\s+करें[।\.]?/gi,
  /इसका\s+मतलब\s+है\s+कि\s+समय\s+बढ़ने\s+पर\s+किया\s+गया\s+काम\s+भी\s+बढ़ता\s+है[।\.]?\s*इसी\s+विचार\s+का\s+उपयोग\s+करके\s+नीचे\s+दिए\s+गए\s+प्रश्नों\s+के\s+उत्तर\s+दीजिए[।\.]?/gi,
  /अब\s+निम्नलिखित\s+प्रश्न(ों)?\s+के\s+उत्तर\s+दीजिए[।\.]?/gi,
  /खाली\s+दिलेल्या\s+प्रश्न(ां|ांची)?\s+उत्तरे\s+द्या[।\.]?/gi,
  /आता\s+पुढील\s+प्रश्न(ांना|ांचा|ांचे)?\s+सोडवा[।\.]?/gi,
  /पुढील\s+प्रश्न\s+सोडवा[।\.]?/gi,
  /काळजीपूर्वक\s+वाचा,\s*टप्प्याटप्प्याने\s+विचार\s+करा,\s*आणि\s+प्रश्न\s+सोडवा[।\.]?/gi,
  /याचा\s+अर्थ\s+असा\s+की\s+वेळ\s+वाढल्यास\s+केलेले\s+कामही\s+वाढते[।\.]?\s*ह(ि|ी)च\s+पद्धत\s+वापरून\s+खाली\s+दिलेल्या\s+प्रश्नांची\s+उत्तरे\s+द्या[।\.]?/gi,
  /आता\s+खालील\s+प्रश्न(ांची)?\s+उत्तरे\s+द्या[।\.]?/gi,
  /पुढील\s+प्रश्न(ांची)?\s+उत्तरे\s+द्या[।\.]?/gi,
  /खालील\s+प्रश्न(ांची)?\s+उत्तरे\s+द्या[।\.]?/gi,
  /दिलेल्या\s+माहितीच्या\s+आधारे\s+खालील\s+प्रश्न(ांची)?\s+उत्तरे\s+द्या[।\.]?/gi,
  /उपरोक्त\s+माहितीच्या\s+आधारे\s+खालील\s+प्रश्न(ांची)?\s+उत्तरे\s+द्या[।\.]?/gi,
];

const KNOWN_TOPIC_TITLES = [
  "कार्य और समय",
  "दो चर वाले रैखिक समीकरण",
  "दो चर वाले रेखिक समीकरण",
  "दोन चल असलेली रेखीय समीकरणे",
  "दोन चल असलेली रेषीय समीकरणे",
  "प्रतिशत",
  "टक्केवारी",
  "टक्के",
  "लाभ और हानि",
  "नफा आणि तोटा",
  "नफा व तोटा",
  "नफा-तोटा",
  "साधारण ब्याज",
  "सरळव्याज",
  "सरळ व्याज",
  "Work and Time",
  "Linear Equations in Two Variables",
  "Profit and Loss",
  "Simple Interest",
  "Percentages",
  "काम आणि वेळ",
  "काम व वेळ",
  "काम आणि काळ",
  "कार्य आणि वेळ",
  "कार्य आणि काळ",
];

const normalizeTitleText = (value: string) => value.replace(/\s+/g, " ").trim();

const stripKnownTitlePrefix = (value: string) => {
  const normalizedValue = normalizeTitleText(value);

  for (const title of KNOWN_TOPIC_TITLES) {
    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const titlePattern = new RegExp(`^${escapedTitle}(?:\\s|$|[।\\.:,-])`, "i");
    const match = normalizedValue.match(titlePattern);

    if (match) {
      return {
        title,
        rest: normalizedValue.slice(match[0].length).trim(),
      };
    }
  }

  return null;
};
export const LEADING_ENUMERATION_PATTERN = /^\s*\d+[\).:-]?\s*/;
export const ENUMERATION_ONLY_PATTERN = /^\s*\d+[\).:-]?\s*$/;

export const QUESTION_FORMATTING_EXAMPLES: QuestionFormattingExample[] = Object.entries(
  TOPIC_EXPLANATIONS,
).map(([topic, value]) => ({
  id: topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
  rawText: `${topic}\n\n${value.explanation}\n\n${value.example}\n\nNow answer the following questions.`,
  blocks: [
    { type: "title", text: topic },
    { type: "description", text: value.explanation },
    { type: "description", text: value.example },
    { type: "callout", text: "Now answer the following questions." },
  ],
}));

export const normalizeQuestionText = (text: string) => {
  let normalized = text.replace(/\r/g, "").trim();

  // If known topic title is glued with body text in one line, split it out.
  const normalizedWithoutEnumeration = normalized.replace(LEADING_ENUMERATION_PATTERN, "");
  const titleMatch = stripKnownTitlePrefix(normalizedWithoutEnumeration);

  if (titleMatch?.rest) {
    normalized = `${titleMatch.title}\n\n${titleMatch.rest}`;
  }

  // Pull instruction lines into standalone paragraphs even when embedded in a long paragraph.
  for (const pattern of INLINE_INSTRUCTION_SEGMENT_PATTERNS) {
    pattern.lastIndex = 0;
    normalized = normalized.replace(pattern, (match) => `\n\n${match.trim()}\n\n`);
  }

  // Promote single line breaks to paragraph breaks so single-explanation blocks
  // still render as structured sections with italic explanations.
  normalized = normalized.replace(/\n(?!\n)/g, "\n\n");

  normalized = normalized.replace(/\n{3,}/g, "\n\n").trim();
  return normalized;
};

export const stripLeadingEnumeration = (text: string) =>
  text.replace(LEADING_ENUMERATION_PATTERN, "").trim();

const mergeLeadInParagraphs = (paragraphs: string[]): string[] => {
  const merged: string[] = [];

  for (let index = 0; index < paragraphs.length; index += 1) {
    const current = paragraphs[index];
    const next = paragraphs[index + 1];

    if (current && next && /^(आता|अब|Now)$/i.test(current.trim())) {
      merged.push(`${current.trim()} ${next.trim()}`);
      index += 1;
      continue;
    }

    merged.push(current);
  }

  return merged;
};

// Helper: normalize whitespace and punctuation for safer comparison
const normalizeForComparison = (text: string): string =>
  text
    .replace(/\s+/g, " ") // collapse whitespace
    .replace(/[।।\.\-_]/g, "") // remove common punctuation
    .trim()
    .toLowerCase();

// Helper: try to strip a detected title from the beginning of a paragraph
// Uses normalized comparison for tolerance of punctuation/spacing changes
const stripDetectedTitle = (paragraph: string, topTitle: string | null): string => {
  if (!topTitle) return paragraph;

  const normalizedTitle = normalizeForComparison(topTitle);
  const normalizedParagraph = normalizeForComparison(paragraph);

  if (normalizedParagraph.startsWith(normalizedTitle)) {
    // Title is at the start; find where it ends in the original text
    // by looking for a space, punctuation, or other boundary
    const pattern = new RegExp(
      `^\\s*${topTitle.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*[।\\.\\.\\-]*\\s*`,
      "i"
    );
    const match = paragraph.match(pattern);
    if (match) {
      return paragraph.slice(match[0].length).trim();
    }
  }

  return paragraph;
};

export const splitQuestionTextIntoBlocks = (text: string): QuestionTextBlock[] => {
  const normalizedText = normalizeQuestionText(text);

  if (!normalizedText) {
    return [];
  }

  let paragraphs = normalizedText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  // Merge lead-in words like "आता" with the following instruction line
  paragraphs = mergeLeadInParagraphs(paragraphs);

  // Find a paragraph that matches a known topic title. If none found,
  // fall back to returning the whole text as a single description block
  // so it renders as italic instead of being promoted to a bold title.
  const titleIndex = paragraphs.findIndex((paragraph) => {
    const candidate = stripLeadingEnumeration(paragraph);
    const normalizedCandidate = normalizeTitleText(candidate).toLowerCase();
    return KNOWN_TOPIC_TITLES.some(
      (t) => normalizeTitleText(t).toLowerCase() === normalizedCandidate,
    );
  });

  // If no explicit title at the top, check whether there are any instruction
  // lines present in the paragraphs. If there are no instructions, return a
  // single description block as before. If instructions exist, process the
  // paragraphs to emit callout/question blocks (but no title).
  const hasInlineInstruction = paragraphs.some((p) =>
    INSTRUCTION_PATTERNS.some((pattern) => pattern.test(p)),
  );

  if (titleIndex === -1 && !hasInlineInstruction) {
    return [
      {
        type: "description",
        text: paragraphs.join("\n\n"),
      },
    ];
  }

  const blocks: QuestionTextBlock[] = [];
  let hasSeenInstruction = false;
  const genericHindiInstructionPattern = /^अब\s+निम्नलिखित\s+प्रश्न(ों)?\s+के\s+उत्तर\s+दीजिए[।\.]?$/i;
  const genericMarathiInstructionPattern = /^आता\s+खालील\s+प्रश्न(ांची)?\s+उत्तरे\s+द्या[।\.]?$/i;

  // Prepare top title for stripping from description paragraphs
  const topTitle = titleIndex !== -1 ? stripLeadingEnumeration(paragraphs[titleIndex]) : null;

  paragraphs.forEach((paragraph, index) => {
    // Skip separator lines (dashes, underscores, etc.)
    if (/^[\s\-_=*]{3,}$/.test(paragraph)) {
      return;
    }

    if (index === titleIndex) {
      blocks.push({
        type: "title",
        text: stripLeadingEnumeration(paragraph),
      });
      return;
    }

    // Strip detected title from beginning of paragraph (normalized comparison)
    let paragraphText = stripDetectedTitle(paragraph, topTitle);
    if (!paragraphText) {
      return; // nothing left after stripping
    }

    if (ENUMERATION_ONLY_PATTERN.test(paragraphText)) {
      return;
    }

    if (INSTRUCTION_PATTERNS.some((pattern) => pattern.test(paragraphText))) {
      // Skip generic follow-up instruction if we already captured a stronger instruction line.
      if (
        hasSeenInstruction &&
        (genericHindiInstructionPattern.test(paragraphText) ||
          genericMarathiInstructionPattern.test(paragraphText))
      ) {
        return;
      }

      hasSeenInstruction = true;
      blocks.push({ type: "callout", text: paragraphText });
      return;
    }

    if (hasSeenInstruction) {
      // Strip leading separator lines from question text so dashes don't appear in output
      const cleanedQuestionText = paragraphText
        .replace(/^[\s\-_=*]{3,}\s*\n\s*/i, "")
        .trim();
      
      if (cleanedQuestionText) {
        blocks.push({ type: "question", text: cleanedQuestionText });
      }
      return;
    }

    blocks.push({ type: "description", text: paragraphText });
  });

  return blocks;
};