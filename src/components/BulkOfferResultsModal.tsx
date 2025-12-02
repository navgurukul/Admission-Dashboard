import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BulkOfferResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: {
    summary: {
      sent: number;
      failed: number;
      skipped?: number;
      total: number;
    };
    categorized: {
      sent: any[];
      alreadySent: any[];
      noEmail: any[];
      alreadyOnboarded: any[];
      notFound: any[];
      otherErrors: any[];
    };
  } | null;
}

export function BulkOfferResultsModal({
  isOpen,
  onClose,
  results,
}: BulkOfferResultsModalProps) {
  if (!results) return null;

  const { summary, categorized } = results;
  const isAllSuccess = summary.sent > 0 && summary.failed === 0;
  const hasFailures = summary.failed > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isAllSuccess ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-500" />
                All Offer Letters Sent Successfully
              </>
            ) : hasFailures ? (
              <>
                <AlertCircle className="w-6 h-6 text-amber-500" />
                Offer Letter Status
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-500" />
                Failed to Send Offer Letters
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Detailed Results */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {/* Successfully Sent */}
              {categorized.sent.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-green-600 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Successfully Sent ({categorized.sent.length})
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {categorized.sent.map((student: any, idx: number) => (
                      <li key={idx} className="text-muted-foreground">
                        ✓ {student.displayName}
                        {student.email && (
                          <span className="text-xs ml-2 text-muted-foreground">
                            ({student.email})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* No Email */}
              {categorized.noEmail.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                  <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    No Email Address ({categorized.noEmail.length})
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {categorized.noEmail.map((student: any, idx: number) => (
                      <li key={idx} className="text-amber-700">
                        • {student.displayName}
                        {student.email && (
                          <span className="text-xs ml-2">
                            ({student.email})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Already Sent */}
              {categorized.alreadySent.length > 0 && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Already Sent ({categorized.alreadySent.length})
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {categorized.alreadySent.map(
                      (student: any, idx: number) => (
                        <li key={idx} className="text-blue-700">
                          • {student.displayName}
                          {student.email && (
                            <span className="text-xs ml-2">
                              ({student.email})
                            </span>
                          )}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              {/* Already Onboarded */}
              {categorized.alreadyOnboarded.length > 0 && (
                <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-700 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Already Onboarded ({categorized.alreadyOnboarded.length})
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {categorized.alreadyOnboarded.map(
                      (student: any, idx: number) => (
                        <li key={idx} className="text-purple-700">
                          • {student.displayName}
                          {student.email && (
                            <span className="text-xs ml-2">
                              ({student.email})
                            </span>
                          )}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}

              {/* Not Found */}
              {categorized.notFound.length > 0 && (
                <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Student Not Found ({categorized.notFound.length})
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {categorized.notFound.map((student: any, idx: number) => (
                      <li key={idx} className="text-red-700">
                        • {student.displayName}
                        {student.email && (
                          <span className="text-xs ml-2">
                            ({student.email})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Other Errors */}
              {categorized.otherErrors.length > 0 && (
                <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                  <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Other Errors ({categorized.otherErrors.length})
                  </h4>
                  <ul className="space-y-2 text-sm">
                    {categorized.otherErrors.map(
                      (student: any, idx: number) => (
                        <li key={idx} className="text-red-700">
                          • {student.displayName}
                          {student.email && (
                            <span className="text-xs ml-2">
                              ({student.email})
                            </span>
                          )}
                          <br />
                          <span className="text-xs text-red-600 ml-3">
                            {student.errorMessage}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex justify-center pt-4">
          <Button onClick={onClose} className="px-8">
            Okay
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
