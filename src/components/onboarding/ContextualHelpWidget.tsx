import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { BookText, CircleHelp, PlayCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DemoVideoModal } from "./DemoVideoModal";
import { FaqModal } from "./FaqModal";
import { GuidedTourOverlay } from "./GuidedTourOverlay";
import { OnboardingDemo, OnboardingFaq, OnboardingStep } from "./types";

type ContextualHelpWidgetProps = {
  sectionId: string;
  sectionTitle: string;
  steps: OnboardingStep[];
  demo: OnboardingDemo;
  faqs: OnboardingFaq[];
  className?: string;
  showInlineButtons?: boolean;
  showFloatingButton?: boolean;
  autoStartOnFirstVisit?: boolean;
  floatingContainer?: "local" | "body";
  showDemoButton?: boolean;
};

export function ContextualHelpWidget({
  sectionId,
  sectionTitle,
  steps,
  demo,
  faqs,
  className,
  showInlineButtons = false,
  showFloatingButton = true,
  autoStartOnFirstVisit = true,
  floatingContainer = "local",
  showDemoButton = false,
}: ContextualHelpWidgetProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);
  const [hasVisitedBefore, setHasVisitedBefore] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const storageKeys = useMemo(
    () => ({
      visited: `contextual-help:${sectionId}:visited`,
    }),
    [sectionId],
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const visited = localStorage.getItem(storageKeys.visited) === "true";
    setHasVisitedBefore(visited);

    // First visit: launch the tour automatically for this section.
    if (!visited) {
      localStorage.setItem(storageKeys.visited, "true");
      if (!autoStartOnFirstVisit) {
        return;
      }

      const timer = window.setTimeout(() => {
        setIsTourOpen(true);
      }, 700);

      return () => window.clearTimeout(timer);
    }
  }, [autoStartOnFirstVisit, storageKeys.visited]);

  const closeMenu = () => setIsMenuOpen(false);
  const floatingHelpMenu = (
    <div
      className="fixed bottom-4 right-4 md:bottom-5 md:right-5 z-[80] pb-[env(safe-area-inset-bottom)]"
      data-contextual-help-floating="true"
    >
      {/* Rendered via portal so it stays pinned to viewport, not scroll containers. */}
      {isMenuOpen ? (
        <div className="mb-3 w-52 rounded-2xl border border-border bg-background/95 p-2 shadow-2xl backdrop-blur">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              closeMenu();
              setIsTourOpen(true);
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Start Guide
          </Button>
          {showDemoButton ? (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                closeMenu();
                setIsDemoOpen(true);
              }}
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          ) : null}
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              closeMenu();
              setIsFaqOpen(true);
            }}
          >
            <BookText className="mr-2 h-4 w-4" />
            FAQs
          </Button>
        </div>
      ) : null}

      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-xl"
        onClick={() => setIsMenuOpen((value) => !value)}
        aria-label={`Open help for ${sectionTitle}`}
      >
        <CircleHelp className="h-6 w-6" />
      </Button>
    </div>
  );

  return (
    <>
      {showInlineButtons ? (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
          {hasVisitedBefore ? (
            <Button variant="outline" size="sm" onClick={() => setIsTourOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Take Tour
            </Button>
          ) : null}

          <Button variant="outline" size="sm" onClick={() => setIsTourOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Start Guide
          </Button>

          {showDemoButton ? (
            <Button variant="outline" size="sm" onClick={() => setIsDemoOpen(true)}>
              <PlayCircle className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          ) : null}
        </div>
      ) : null}

      {showFloatingButton
        ? floatingContainer === "body"
          ? isClient
            ? createPortal(floatingHelpMenu, document.body)
            : null
          : floatingHelpMenu
        : null}

      <GuidedTourOverlay
        open={isTourOpen}
        title={sectionTitle}
        steps={steps}
        onSkip={() => setIsTourOpen(false)}
        onFinish={() => setIsTourOpen(false)}
      />

      {showDemoButton ? (
        <DemoVideoModal
          demo={demo}
          open={isDemoOpen}
          onOpenChange={setIsDemoOpen}
        />
      ) : null}

      <FaqModal
        title={sectionTitle}
        faqs={faqs}
        open={isFaqOpen}
        onOpenChange={setIsFaqOpen}
      />
    </>
  );
}
