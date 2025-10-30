import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2, Calendar, Clock, User, Mail, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  slotData: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    interviewer_email?: string;
    interviewer_name?: string;
  } | null;
  allAvailableSlots?: Array<{
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    interviewer_email?: string;
    interviewer_name?: string;
    is_booked: boolean;
  }>;
  isDirectScheduleMode?: boolean;
  onSchedule: (
    slotId: number,
    studentId: number,
    studentEmail: string,
    studentName: string,
    interviewerEmail: string,
    interviewerName: string,
    date: string,
    startTime: string,
    endTime: string,
    topicName: string
  ) => Promise<void>;
  isLoading: boolean;
}

export const ScheduleInterviewModal = ({
  isOpen,
  onClose,
  slotData,
  allAvailableSlots = [],
  isDirectScheduleMode = false,
  onSchedule,
  isLoading,
}: ScheduleInterviewModalProps) => {
  const [studentId, setStudentId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [topicName, setTopicName] = useState("");
  const [interviewerEmail, setInterviewerEmail] = useState("");
  
  // New states for date and slot selection
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  if (!isOpen) return null;

  // Get unique dates from available slots
  const availableDates = Array.from(
    new Set(allAvailableSlots.filter(s => !s.is_booked).map(s => s.date))
  ).sort();

  // Get slots for selected date
  const slotsForSelectedDate = selectedDate
    ? allAvailableSlots.filter(s => s.date === selectedDate && !s.is_booked)
    : [];

  // Get selected slot details
  const currentSlot = isDirectScheduleMode
    ? slotsForSelectedDate.find(s => s.id === selectedSlotId)
    : slotData;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId || !studentEmail || !studentName || !topicName) {
      alert("Please fill all required fields");
      return;
    }

    if (isDirectScheduleMode && !selectedSlotId) {
      alert("Please select a date and slot");
      return;
    }

    const slotToUse = currentSlot;
    if (!slotToUse) {
      alert("Please select a valid slot");
      return;
    }

    const finalInterviewerEmail = interviewerEmail || slotToUse.interviewer_email || "";
    if (!finalInterviewerEmail) {
      alert("Please enter interviewer email");
      return;
    }

    try {
      await onSchedule(
        slotToUse.id,
        parseInt(studentId),
        studentEmail,
        studentName,
        finalInterviewerEmail,
        slotToUse.interviewer_name || finalInterviewerEmail,
        slotToUse.date,
        slotToUse.start_time,
        slotToUse.end_time,
        topicName
      );

      // Reset form
      setStudentId("");
      setStudentEmail("");
      setStudentName("");
      setTopicName("");
      setInterviewerEmail("");
      setSelectedDate("");
      setSelectedSlotId(null);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg border border-gray-200">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="flex items-center justify-between text-lg font-semibold text-gray-900">
            <span>Schedule Interview</span>
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Create Google Meet link and schedule the interview
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date and Slot Selection (only in direct schedule mode) */}
          {isDirectScheduleMode && (
            <div className="bg-blue-50 border border-orange-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                Select Date & Slot
              </h3>
              
              {/* Date Picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Date <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlotId(null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                >
                  <option value="">Choose a date</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDate(date)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Slot Selection */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Time Slot <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {slotsForSelectedDate.map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedSlotId === slot.id
                            ? "border-orange-500 bg-orange-50"
                            : "border-gray-200 hover:border-orange-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm">
                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                          </span>
                        </div>
                        {slot.interviewer_name && (
                          <p className="text-xs text-gray-600 ml-6">
                            {slot.interviewer_name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Slot Info (only show when slot is selected) */}
          {currentSlot && (
            <div className="bg-muted/30 border border-gray-200 rounded-lg p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                Selected Slot Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Date:</span>
                  <span>{formatDate(currentSlot.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Time:</span>
                  <span>
                    {formatTime(currentSlot.start_time)} - {formatTime(currentSlot.end_time)}
                  </span>
                </div>
                {currentSlot.interviewer_name && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Interviewer:</span>
                    <span>{currentSlot.interviewer_name}</span>
                  </div>
                )}
                {currentSlot.interviewer_email && (
                  <div className="flex items-center gap-2 md:col-span-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Email:</span>
                    <span>{currentSlot.interviewer_email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student Info */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <User className="w-5 h-5 mr-2 text-orange-600" />
              Student Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student ID <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter student ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="Enter student full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="student@example.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Calendar invite will be sent to this email
              </p>
            </div>
          </div>

          {/* Interviewer Info */}
          {!currentSlot?.interviewer_email && (
            <div className="p-4 bg-muted/30 rounded-lg space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-orange-600" />
                Interviewer Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interviewer Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={interviewerEmail}
                  onChange={(e) => setInterviewerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="interviewer@example.com"
                  required
                />
              </div>
            </div>
          )}

          {/* Interview Details */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-orange-600" />
              Interview Details
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interview Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="e.g., Technical Interview - Round 1"
                required
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-sm text-orange-800">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Google Meet link will be created automatically</li>
              <li>Calendar invites sent to student & interviewer</li>
              <li>Interview details saved to database</li>
              <li>Slot will be marked as booked</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="flex-1 py-3">
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-orange-500 hover:orange-600 text-white py-3 font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Meeting...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule & Create Meet Link
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
