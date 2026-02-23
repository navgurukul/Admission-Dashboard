import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import {
    getFeedbacksByStudentId,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    getStageStatuses,
} from "@/utils/api";
import { useOnDemandReferenceData } from "@/hooks/useOnDemandReferenceData";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";

interface TransitionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: number;
    stages?: any[]; // Optional - will load its own if not provided
    statuses?: any[]; // Optional - will load its own if not provided
}

export function TransitionsModal({
    isOpen,
    onClose,
    studentId,
    stages: propStages,
    statuses: propStatuses,
}: TransitionsModalProps) {
    const { toast } = useToast();
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [feedbackToDelete, setFeedbackToDelete] = useState<number | null>(null);
    const [stageStatusesMap, setStageStatusesMap] = useState<Record<number, any[]>>({});

    // ✅ Load reference data on-demand
    const {
        stageList,
        currentstatusList,
        loadFieldData,
    } = useOnDemandReferenceData();

    // Use prop data if provided, otherwise use loaded data
    const stages = propStages && propStages.length > 0 ? propStages : stageList;
    const statuses = propStatuses && propStatuses.length > 0 ? propStatuses : currentstatusList;

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        stage_id: "",
        stage_status_id: "",
        feedback: "",
    });

    // ✅ Load stages and statuses when modal opens
    useEffect(() => {
        if (isOpen) {
            Promise.all([
                loadFieldData('stage'),
                loadFieldData('current_status'),
            ]);
        }
    }, [isOpen, loadFieldData]);

    // Fetch feedbacks when modal opens
    useEffect(() => {
        if (isOpen && studentId) {
            fetchFeedbacks();
        }
    }, [isOpen, studentId]);

    const fetchFeedbacks = async () => {
        setIsLoading(true);
        try {
            const response = await getFeedbacksByStudentId(studentId);
            const feedbackData = Array.isArray(response?.data) ? response.data : [];
            setFeedbacks(feedbackData);

            // Extract unique stage_ids from feedbacks
            const stageIds = Array.from(new Set(feedbackData.map((f: any) => f.stage_id).filter((id: any) => id)));

            // Convert existing map keys to numbers for comparison
            const loadedStageIds = Object.keys(stageStatusesMap).map(Number);

            // Filter stages that haven't been loaded yet
            const stagesToLoad = stageIds.filter((id) => !loadedStageIds.includes(Number(id)));

            if (stagesToLoad.length > 0) {
                const newStatusesMap = { ...stageStatusesMap };

                await Promise.all(stagesToLoad.map(async (stageId) => {
                    try {
                        const statusData = await getStageStatuses(Number(stageId));
                        // Handle different API response structures
                        const statuses = Array.isArray(statusData.data) ? statusData.data :
                            Array.isArray(statusData) ? statusData : [];
                        newStatusesMap[Number(stageId)] = statuses;
                    } catch (err) {
                        console.error(`Failed to load statuses for stage ${stageId}:`, err);
                    }
                }));

                setStageStatusesMap(newStatusesMap);
            }

        } catch (error) {
            console.error("Failed to fetch feedbacks:", error);
            toast({
                title: "❌ Unable to Load Feedbacks",
                description: getFriendlyErrorMessage(error),
                variant: "destructive",
                className: "border-red-500 bg-red-50 text-red-900",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddNew = () => {
        setEditingId(null);
        setFormData({ stage_id: "", stage_status_id: "", feedback: "" });
        setIsFormOpen(true);
    };

    const handleEdit = (feedback: any) => {
        setEditingId(feedback.id);
        setFormData({
            stage_id: feedback.stage_id?.toString() || "",
            stage_status_id: feedback.stage_status_id?.toString() || "",
            feedback: feedback.feedback || "",
        });
        setIsFormOpen(true);
    };

    const handleDelete = (id: number) => {
        setFeedbackToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!feedbackToDelete) return;

        try {
            await deleteFeedback(feedbackToDelete);
            toast({
                title: "✅ Feedback Deleted",
                description: "Feedback deleted successfully",
                variant: "default",
                className: "border-green-500 bg-green-50 text-green-900",
            });
            fetchFeedbacks();
        } catch (error) {
            console.error("Failed to delete:", error);
            toast({
                title: "❌ Unable to Delete Feedback",
                description: getFriendlyErrorMessage(error),
                variant: "destructive",
                className: "border-red-500 bg-red-50 text-red-900",
            });
        } finally {
            setDeleteDialogOpen(false);
            setFeedbackToDelete(null);
        }
    };

    const handleSubmit = async () => {
        if (!formData.stage_id || !formData.stage_status_id) {
            toast({
                title: "⚠️ Missing Information",
                description: "Please select both Stage and Status",
                variant: "default",
                className: "border-orange-500 bg-orange-50 text-orange-900",
            });
            return;
        }

        try {
            const payload = {
                student_id: studentId,
                stage_id: parseInt(formData.stage_id),
                stage_status_id: parseInt(formData.stage_status_id),
                feedback: formData.feedback,
            };

            if (editingId) {
                await updateFeedback(editingId, payload);
                toast({
                    title: "✅ Feedback Updated",
                    description: "Feedback updated successfully",
                    variant: "default",
                    className: "border-green-500 bg-green-50 text-green-900",
                });
            } else {
                await createFeedback(payload);
                toast({
                    title: "✅ Feedback Created",
                    description: "Feedback created successfully",
                    variant: "default",
                    className: "border-green-500 bg-green-50 text-green-900",
                });
            }

            setIsFormOpen(false);
            fetchFeedbacks();
        } catch (error) {
            console.error("Failed to save:", error);
            toast({
                title: "❌ Unable to Save Feedback",
                description: getFriendlyErrorMessage(error),
                variant: "destructive",
                className: "border-red-500 bg-red-50 text-red-900",
            });
        }
    };

    const getStageName = (id: number) => {
        if (!id) return "-";
        const stage = stages.find((s: any) => Number(s.id) === Number(id));
        if (!stage) {
            console.warn(`Stage not found for id: ${id}`);
            return `Stage ${id}`;
        }
        // Handle multiple possible property names
        return stage.stage_name || stage.name || `Stage ${id}`;
    };

    const getStatusName = (id: number, stageId?: number) => {
        if (!id) return "-";

        // 1. If stageId is provided, try to find in the stage-specific statuses map first
        if (stageId && stageStatusesMap[Number(stageId)]) {
            const stageStatus = stageStatusesMap[Number(stageId)].find((s: any) => Number(s.id) === Number(id));
            if (stageStatus) {
                return stageStatus.status_name || stageStatus.current_status_name || stageStatus.name || `Status ${id}`;
            }
        }

        // 2. Try to find in the main statuses list (global or prop-passed)
        const status = statuses.find((s: any) => Number(s.id) === Number(id));
        if (status) {
            return status.current_status_name || status.status_name || status.name || `Status ${id}`;
        }

        return `Status ${id}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader className="flex-shrink-0 flex flex-row items-center justify-between pb-4">
                    <DialogTitle>Transitions Feedback</DialogTitle>
                    {/* {!isFormOpen && (
                        <Button onClick={handleAddNew} size="sm" className="ml-4 mr-8">
                            <Plus className="w-4 h-4 mr-2" /> Add Feedback
                        </Button>
                    )} */}
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    {isFormOpen ? (
                        <div className="h-full overflow-y-auto pr-2">
                            <div className="p-4 border rounded-md bg-muted/20 space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold">{editingId ? "Edit Feedback" : "New Feedback"}</h3>
                                    <Button variant="ghost" size="sm" onClick={() => setIsFormOpen(false)}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Stage</label>
                                        <Select
                                            value={formData.stage_id}
                                            onValueChange={async (val) => {
                                                setFormData({ ...formData, stage_id: val, stage_status_id: "" });
                                                // Fetch statuses for this stage if not already loaded
                                                if (val && !stageStatusesMap[Number(val)]) {
                                                    try {
                                                        const statusData = await getStageStatuses(Number(val));
                                                        const fetchedStatuses = Array.isArray(statusData.data) ? statusData.data :
                                                            Array.isArray(statusData) ? statusData : [];
                                                        setStageStatusesMap((prev) => ({
                                                            ...prev,
                                                            [Number(val)]: fetchedStatuses
                                                        }));
                                                    } catch (err) {
                                                        console.error(`Failed to load statuses for stage ${val}:`, err);
                                                    }
                                                }
                                            }}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Stage" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {stages.length === 0 ? (
                                                    <div className="p-2 text-sm text-muted-foreground">Loading stages...</div>
                                                ) : (
                                                    stages.map((stage: any) => (
                                                        <SelectItem key={stage.id} value={stage.id.toString()}>
                                                            {stage.stage_name || stage.name || `Stage ${stage.id}`}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Status</label>
                                        <Select
                                            value={formData.stage_status_id}
                                            onValueChange={(val) => setFormData({ ...formData, stage_status_id: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {!formData.stage_id ? (
                                                    <div className="p-2 text-sm text-muted-foreground">Please select a stage first...</div>
                                                ) : !stageStatusesMap[Number(formData.stage_id)] ? (
                                                    <div className="p-2 text-sm text-muted-foreground">Loading statuses...</div>
                                                ) : stageStatusesMap[Number(formData.stage_id)].length === 0 ? (
                                                    <div className="p-2 text-sm text-muted-foreground">No statuses available</div>
                                                ) : (
                                                    stageStatusesMap[Number(formData.stage_id)].map((status: any) => (
                                                        <SelectItem key={status.id} value={status.id.toString()}>
                                                            {status.status_name || status.current_status_name || status.name || `Status ${status.id}`}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-2 space-y-2">
                                        <label className="text-sm font-medium">Feedback</label>
                                        <Textarea
                                            placeholder="Enter feedback comments..."
                                            value={formData.feedback}
                                            onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                                            className="min-h-[150px] resize-y"
                                            rows={6}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSubmit}>Save</Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {isLoading ? (
                                <div className="text-center p-4">Loading...</div>
                            ) : feedbacks.length === 0 ? (
                                <div className="text-center p-4 text-muted-foreground">
                                    No feedbacks found.
                                </div>
                            ) : (
                                <div className="h-full overflow-y-auto pr-2 relative">
                                    <table className="w-full text-sm border rounded-md">
                                        <thead className="bg-muted sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="p-3 text-left font-medium w-[120px] bg-muted">Stage</th>
                                                <th className="p-3 text-left font-medium w-[120px] bg-muted">Status</th>
                                                <th className="p-3 text-left font-medium bg-muted">Feedback</th>
                                                <th className="p-3 text-left font-medium w-[120px] bg-muted">Created At</th>
                                                <th className="p-3 text-right font-medium w-[100px] bg-muted">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {feedbacks.map((item) => {
                                                let hideActions = false;
                                                let createdDate = null;
                                                if (item.created_at) {
                                                    createdDate = new Date(item.created_at);
                                                    hideActions = createdDate < new Date('2026-01-01');
                                                }
                                                return (
                                                    <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                                                        <td className="p-3 align-top">{getStageName(item.stage_id)}</td>
                                                        <td className="p-3 align-top">{getStatusName(item.stage_status_id, item.stage_id)}</td>
                                                        <td className="p-3 align-top">
                                                            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                                                {item.feedback || "-"}
                                                            </div>
                                                        </td>
                                                        <td className="p-3 whitespace-nowrap align-top">
                                                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}
                                                        </td>
                                                        <td className="p-3 align-top">
                                                            <div className={hideActions ? "flex justify-middle gap-2" : "flex justify-end gap-2"}>
                                                                {hideActions ? (
                                                                    <span className="text-xs text-muted-foreground italic" title="Editing/deleting disabled for feedbacks before 2026-01-01">
                                                                        -
                                                                    </span>
                                                                ) : (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                        onClick={() => handleDelete(item.id)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DialogContent>

            <DeleteConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setFeedbackToDelete(null);
                }}
                onConfirm={confirmDelete}
                title="Delete Feedback"
                description="Are you sure you want to delete this feedback? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
            />
        </Dialog>
    );
}
