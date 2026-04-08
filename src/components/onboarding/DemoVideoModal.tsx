import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { OnboardingDemo } from "./types";

type DemoVideoModalProps = {
  demo: OnboardingDemo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DemoVideoModal({
  demo,
  open,
  onOpenChange,
}: DemoVideoModalProps) {
  // Check if it's a local video file (ends with video extensions)
  const isLocalVideo = /\.(mp4|webm|ogg|mov)$/i.test(demo.embedUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{demo.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-xl border bg-muted">
            {isLocalVideo ? (
              <video
                src={demo.embedUrl}
                title={demo.title}
                controls
                className="h-full w-full"
                style={{ objectFit: "contain", backgroundColor: "#000" }}
              />
            ) : (
              <iframe
                src={demo.embedUrl}
                title={demo.title}
                className="h-full w-full"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </AspectRatio>

          {demo.note ? (
            <p className="text-sm text-muted-foreground">{demo.note}</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
