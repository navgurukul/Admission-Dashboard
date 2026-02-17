import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface LearningRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
  description?: string;
}

export const LearningRoundModal: React.FC<LearningRoundModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title = "Learning Round Overview",
  description = "Watch this video to understand the learning round process",
}) => {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  // Extract YouTube video ID from URL
  const getYouTubeEmbedUrl = (url: string): string => {
    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/
    );
    const videoId = videoIdMatch ? videoIdMatch[1] : "";
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
  };

  // Load video only when modal opens
  useEffect(() => {
    if (isOpen) {
      setShouldLoadVideo(true);
    } else {
      // Cleanup: unload video when modal closes
      const timer = setTimeout(() => {
        setShouldLoadVideo(false);
      }, 300); // Wait for close animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-muted-foreground">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="p-6 pt-4">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            {shouldLoadVideo ? (
              <iframe
                src={embedUrl}
                title={title}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <div className="absolute top-0 left-0 w-full h-full bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Loading video...</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

