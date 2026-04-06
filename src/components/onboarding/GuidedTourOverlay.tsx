import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { OnboardingStep } from "./types";

type GuidedTourOverlayProps = {
  open: boolean;
  title: string;
  steps: OnboardingStep[];
  onFinish: () => void;
  onSkip: () => void;
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const PADDING = 10;

export function GuidedTourOverlay({
  open,
  title,
  steps,
  onFinish,
  onSkip,
}: GuidedTourOverlayProps) {
  const isMobile = useIsMobile();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const currentStep = steps[currentStepIndex];

  useEffect(() => {
    if (!open) {
      setCurrentStepIndex(0);
      setRect(null);
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || !currentStep) {
      return;
    }

    currentStep.onBeforeShow?.();

    const updateRect = () => {
      const element = document.querySelector(currentStep.target) as HTMLElement | null;

      if (!element) {
        setRect(null);
        return;
      }

      // Bring the target into view before measuring the spotlight area.
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      const elementRect = element.getBoundingClientRect();
      setRect({
        top: Math.max(elementRect.top - PADDING, 8),
        left: Math.max(elementRect.left - PADDING, 8),
        width: Math.max(elementRect.width + PADDING * 2, 48),
        height: Math.max(elementRect.height + PADDING * 2, 48),
      });
    };

    const initialTimer = window.setTimeout(updateRect, 120);
    const followupTimer = window.setTimeout(updateRect, 320);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearTimeout(followupTimer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [currentStep, open]);

  const tooltipStyle = useMemo(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = isMobile ? Math.min(viewportWidth - 24, 320) : 280;

    if (!rect) {
      return {
        width,
        left: Math.max((viewportWidth - width) / 2, 12),
        top: Math.max((viewportHeight - 180) / 2, 12),
      };
    }

    const preferredLeft = rect.left + rect.width / 2 - width / 2;
    const left = Math.min(
      Math.max(preferredLeft, 12),
      Math.max(viewportWidth - width - 12, 12),
    );

    const preferredTop = rect.top + rect.height + 18;
    const top =
      preferredTop + 170 > viewportHeight
        ? Math.max(rect.top - 182, 12)
        : preferredTop;

    return { width, left, top };
  }, [isMobile, rect]);

  if (!open || !currentStep) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[160]">
      <div className="absolute inset-0 bg-slate-950/58 backdrop-blur-[1px]" />

      {rect ? (
        <div
          // A large shadow creates the spotlight effect while dimming the rest.
          className="pointer-events-none absolute rounded-2xl border border-white/80 bg-transparent shadow-[0_0_0_9999px_rgba(15,23,42,0.58)] transition-all duration-300 ease-out"
          style={rect}
        />
      ) : null}

      <div
        className="pointer-events-auto absolute rounded-[12px] border border-border bg-card p-4 transition-all duration-300 ease-out"
        style={{ ...tooltipStyle, boxShadow: "var(--shadow-medium)" }}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {title}
          </p>
          <p className="text-xs text-muted-foreground">
            {currentStepIndex + 1}/{steps.length}
          </p>
        </div>

        <p className="text-sm font-medium text-foreground">{currentStep.text}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSkip}
          >
            Skip
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentStepIndex((value) => Math.max(0, value - 1))}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>

            {currentStepIndex === steps.length - 1 ? (
              <Button type="button" size="sm" onClick={onFinish}>
                Finish
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => setCurrentStepIndex((value) => Math.min(steps.length - 1, value + 1))}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
