import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AdmissionsSidebar } from "@/components/AdmissionsSidebar";
import { Pencil, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

const defaultEditStage = { stageType: "Test", stageName: "" };

const SchoolStages = () => {
  const { id } = useParams();
  const [stages, setStages] = useState([]);
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState({ open: false, idx: null, form: defaultEditStage });
  const [transitionModal, setTransitionModal] = useState({ open: false, idx: null });
  const [transitionChecks, setTransitionChecks] = useState([]);
  const [transitionPreview, setTransitionPreview] = useState("");

  useEffect(() => {
    if (!id) return;
    fetch(`https://dev-join.navgurukul.org/api/stage/${id}`)
      .then(res => res.json())
      .then(data => {
        setStages(data);
        if (data.length > 0) setSchoolName(data[0].name || "School");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  // Open edit modal
  const openEditDialog = (idx) => {
    const stage = stages[idx];
    setEditModal({
      open: true,
      idx,
      form: {
        stageType: stage.stageType || "Test",
        stageName: stage.stageName || ""
      }
    });
  };
  const closeEditDialog = () => setEditModal({ open: false, idx: null, form: defaultEditStage });
  const handleEditFormChange = (field, value) => {
    setEditModal((d) => ({ ...d, form: { ...d.form, [field]: value } }));
  };
  const handleEditSubmit = (e) => {
    e.preventDefault();
    // No API, just close modal for now
    closeEditDialog();
  };

  // Manage Transitions modal
  const openTransitionDialog = (idx) => {
    setTransitionModal({ open: true, idx });
    setTransitionChecks(stages.map((s, i) => i === idx));
    setTransitionPreview(stages[idx]?.stageName || "");
  };
  const closeTransitionDialog = () => setTransitionModal({ open: false, idx: null });
  const handleTransitionCheck = (i) => {
    setTransitionChecks((prev) => prev.map((v, idx) => idx === i ? !v : v));
  };
  const handleTransitionPreview = (e) => setTransitionPreview(e.target.value);
  const handleTransitionSave = (e) => {
    e.preventDefault();
    closeTransitionDialog();
  };

  return (
    <div className="min-h-screen bg-background">
      <AdmissionsSidebar />
      <main className="md:ml-64 flex flex-col items-center justify-center min-h-screen pt-16 md:pt-0">
        <div className="w-full max-w-4xl p-4 md:p-8">
          <div className="bg-card rounded-xl shadow-soft border border-border p-6">
            <h2 className="text-xl font-semibold text-center mb-6">{schoolName}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">S.No</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Stage Name</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">Edit</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">Manage Transitions</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground text-sm">Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center space-y-2">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading stages...</span>
                        </div>
                      </td>
                    </tr>
                  ) : stages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        No stages found
                      </td>
                    </tr>
                  ) : (
                    stages.map((stage, idx) => (
                      <tr key={stage.id} className={idx % 2 === 1 ? "bg-muted/30" : ""}>
                        <td className="py-3 px-4">{idx + 1}</td>
                        <td className="py-3 px-4">{stage.stageType}</td>
                        <td className="py-3 px-4">{stage.stageName}</td>
                        <td className="py-3 px-4 text-center">
                          <button className="hover:text-orange-600" onClick={() => openEditDialog(idx)}><Pencil size={18} /></button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button className="text-orange-600 hover:underline" onClick={() => openTransitionDialog(idx)}>Manage Transitions</button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button className="hover:text-red-600"><Trash2 size={18} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-muted-foreground">Rows per page: 10</span>
              <span className="text-sm text-muted-foreground">1-{stages.length} of {stages.length}</span>
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        <Dialog open={editModal.open} onOpenChange={v => !v && closeEditDialog()}>
          <DialogContent>
            <form onSubmit={handleEditSubmit} className="w-full max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold mb-4">Edit Admission Stage</DialogTitle>
              </DialogHeader>
              <div className="mb-4">
                <label className="block text-base font-medium mb-2">Stage Type</label>
                <div className="flex gap-6 mb-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="stageType" value="Test" checked={editModal.form.stageType === "Test"} onChange={() => handleEditFormChange("stageType", "Test")} />
                    Test
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="stageType" value="Interview" checked={editModal.form.stageType === "Interview"} onChange={() => handleEditFormChange("stageType", "Interview")} />
                    Interview
                  </label>
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-base font-medium mb-2">Stage Name</label>
                <input
                  type="text"
                  className="border-2 border-orange-400 rounded px-3 py-2 w-full text-lg"
                  placeholder="Enter Stage"
                  value={editModal.form.stageName}
                  onChange={e => handleEditFormChange("stageName", e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="w-full bg-orange-500 text-white py-2 rounded font-semibold text-lg shadow mt-2">ADD ADMISSION STAGE</button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Manage Transitions Modal */}
        <Dialog open={transitionModal.open} onOpenChange={v => !v && closeTransitionDialog()}>
          <DialogContent>
            <form onSubmit={handleTransitionSave} className="w-full max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold mb-4">Manage Transitions</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Available Transitions</h3>
                  <div className="flex flex-col gap-2">
                    {stages.map((s, i) => (
                      <label key={s.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={!!transitionChecks[i]} onChange={() => handleTransitionCheck(i)} />
                        {s.stageName}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Preview</h3>
                  <select className="border rounded px-3 py-2 w-full" value={transitionPreview} onChange={handleTransitionPreview}>
                    {stages.map((s, i) => (
                      <option key={s.id} value={s.stageName}>{s.stageName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="submit" className="mt-6 w-full bg-orange-500 text-white py-2 rounded font-semibold text-lg shadow">SAVE TRANSITION & RETURN</button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default SchoolStages; 