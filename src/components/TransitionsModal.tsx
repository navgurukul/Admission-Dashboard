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
import {
    getFeedbacksByStudentId,
    createFeedback,
    updateFeedback,
    deleteFeedback,
} from "@/utils/api";
import { useOnDemandReferenceData } from "@/hooks/useOnDemandReferenceData";

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
            console.log('🔄 TransitionsModal: Loading stages and statuses...');
            Promise.all([
                loadFieldData('stage'),
                loadFieldData('current_status'),
            ]).then(() => {
                console.log('✅ TransitionsModal: Data loaded');
                console.log('📊 Stages:', stageList);
                console.log('📊 Statuses:', currentstatusList);
            });
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
            setFeedbacks(Array.isArray(response?.data) ? response.data : []);
        } catch (error) {
            console.error("Failed to fetch feedbacks:", error);
            toast({
                title: "Error",
                description: "Failed to fetch feedbacks",
                variant: "destructive",
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

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this feedback?")) return;

        try {
            await deleteFeedback(id);
            toast({ title: "Success", description: "Feedback deleted successfully" });
            fetchFeedbacks();
        } catch (error) {
            console.error("Failed to delete:", error);
            toast({
                title: "Error",
                description: "Failed to delete feedback",
                variant: "destructive",
            });
        }
    };

    const handleSubmit = async () => {
        if (!formData.stage_id || !formData.stage_status_id) {
            toast({
                title: "Validation Error",
                description: "Please select both Stage and Status",
                variant: "destructive",
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
                toast({ title: "Success", description: "Feedback updated successfully" });
            } else {
                await createFeedback(payload);
                toast({ title: "Success", description: "Feedback created successfully" });
            }

            setIsFormOpen(false);
            fetchFeedbacks();
        } catch (error) {
            console.error("Failed to save:", error);
            toast({
                title: "Error",
                description: "Failed to save feedback",
                variant: "destructive",
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

    const getStatusName = (id: number) => {
        if (!id) return "-";
        const status = statuses.find((s: any) => Number(s.id) === Number(id));
        if (!status) {
            console.warn(`Status not found for id: ${id}`);
            return `Status ${id}`;
        }
        // Handle multiple possible property names
        return status.current_status_name || status.status_name || status.name || `Status ${id}`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>Transitions Feedback</DialogTitle>
                    {!isFormOpen && (
                        <Button onClick={handleAddNew} size="sm" className="ml-4 mr-8">
                            <Plus className="w-4 h-4 mr-2" /> Add Feedback
                        </Button>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-hidden mt-4">
                    {isFormOpen ? (
                        <div className="p-4 border rounded-md bg-muted/20 space-y-4">
                            <div className="flex justify-between items-center mb-4 mr-8">
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
                                        onValueChange={(val) => setFormData({ ...formData, stage_id: val })}
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
                                            {statuses.length === 0 ? (
                                                <div className="p-2 text-sm text-muted-foreground">Loading statuses...</div>
                                            ) : (
                                                statuses.map((status: any) => (
                                                    <SelectItem key={status.id} value={status.id.toString()}>
                                                        {status.current_status_name || status.status_name || status.name || `Status ${status.id}`}
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
                    ) : (
                        <ScrollArea className="h-[500px]">
                            {isLoading ? (
                                <div className="text-center p-4">Loading...</div>
                            ) : feedbacks.length === 0 ? (
                                <div className="text-center p-4 text-muted-foreground">
                                    No feedbacks found.
                                </div>
                            ) : (
                                <div className="border rounded-md overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted sticky top-0 z-10">
                                            <tr>
                                                <th className="p-3 text-left font-medium w-[120px]">Stage</th>
                                                <th className="p-3 text-left font-medium w-[120px]">Status</th>
                                                <th className="p-3 text-left font-medium">Feedback</th>
                                                <th className="p-3 text-left font-medium w-[120px]">Created At</th>
                                                <th className="p-3 text-right font-medium w-[100px]">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {feedbacks.map((item) => (
                                                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                                                    <td className="p-3 align-top">{getStageName(item.stage_id)}</td>
                                                    <td className="p-3 align-top">{getStatusName(item.stage_status_id)}</td>
                                                    <td className="p-3 align-top">
                                                        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                                            {item.feedback || "-"}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 whitespace-nowrap align-top">
                                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "-"}
                                                    </td>
                                                    <td className="p-3 text-right align-top">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => handleEdit(item)}
                                                            >
                                                                <Pencil className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => handleDelete(item.id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
