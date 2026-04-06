export type OnboardingFaq = {
  question: string;
  answer: string;
};

export type OnboardingDemo = {
  title: string;
  embedUrl: string;
  note?: string;
};

export type OnboardingStep = {
  id: string;
  target: string;
  text: string;
  onBeforeShow?: () => void;
};
