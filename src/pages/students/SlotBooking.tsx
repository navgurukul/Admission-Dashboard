import React, { useEffect, useState, useCallback } from "react";
import { Calendar, Clock, User, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTests } from "../../utils/TestContext";
import { useStudent } from "../../utils/StudentContext";

// ================== Types ==================
interface TimeSlot {
  id: number;
  from: string;
  to: string;
  availiblity?: boolean;
}

interface SlotData {
  id: number | null;
  from: string;
  to: string;
  is_cancelled: boolean;
  on_date?: string;
  start_time?: string;
  end_time_expected?: string;
  student_name?: string;
  topic_name?: string;
}

// ================== Component ==================
const SlotBooking: React.FC = () => {
  // ---------- Context ----------
  const { student } = useStudent();
  const { tests, updateSlot } = useTests();
  const { id: testIdParam } = useParams<{ id: string }>();
  const testId = Number(testIdParam);

  const test = tests.find((t) => t.id === testId);

  // ---------- Mock API ----------
  const defaultTimings: TimeSlot[] = [
    { id: 1, from: "9:00", to: "10:00" },
    { id: 2, from: "10:00", to: "11:00" },
    { id: 3, from: "11:00", to: "12:00" },
    { id: 4, from: "12:00", to: "13:00" },
    { id: 5, from: "13:00", to: "14:00" },
    { id: 6, from: "14:00", to: "15:00" },
  ];

  // ---------- State ----------
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<SlotData>({
    from: "",
    to: "",
    id: null,
    is_cancelled: true,
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timings, setTimings] = useState<TimeSlot[]>(defaultTimings);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] =
    useState<"success" | "error" | "info">("success");

  const navigate = useNavigate();

  // ---------- Utilities ----------
  const formatDate = (date: Date): string => date.toISOString().split("T")[0];

  const formatTime = (timeString: string): string => {
    const [hour, minute] = timeString.split(":");
    const time = new Date();
    time.setHours(parseInt(hour), parseInt(minute));
    return time.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDisplayDate = (date: Date): string =>
    date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const showNotificationMessage = (
    message: string,
    type: "success" | "error" | "info"
  ) => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  // ---------- Slot Actions ----------
  const handleSlotBooking = async () => {
    if (!slot.id || !student || !test) return;

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const bookedSlot: SlotData = {
        ...slot,
        is_cancelled: false,
        on_date: formatDate(selectedDate),
        start_time: slot.from,
        end_time_expected: slot.to,
        student_name: `${student.firstName} ${student.lastName}`,
        topic_name: test.name,
      };

      setSlot(bookedSlot);
      // Save to localStorage (per test)
      localStorage.setItem(`bookedSlot_${testId}`, JSON.stringify(bookedSlot));
      // Update context
      updateSlot(testId, {
        status: "Booked",
        scheduledTime: `${bookedSlot.on_date} ${bookedSlot.start_time}`,
      });

      showNotificationMessage("Slot Booked & Meet Scheduled Successfully!", "success");
    } catch {
      showNotificationMessage("Failed to book slot. Please try again.", "error");
    }
  };

  const handleDeleteSlot = async () => {
    if (!test) return;
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSlot({ from: "", to: "", id: null, is_cancelled: true });
      localStorage.removeItem(`bookedSlot_${testId}`);
      updateSlot(testId, { status: "Pending", scheduledTime: "" });
      showNotificationMessage("Slot Cancelled & Meet Removed", "info");
    } catch {
      showNotificationMessage("Error cancelling slot", "error");
    }
  };

  const handleNavigationOnStudentPage = () => navigate("/students/result");

  const loadSlotFromLocalStorage = () => {
    const storedSlot = localStorage.getItem(`bookedSlot_${testId}`);
    if (storedSlot) {
      try {
        setSlot(JSON.parse(storedSlot));
      } catch {
        setSlot({ from: "", to: "", id: null, is_cancelled: true });
      }
    } else {
      setSlot({ from: "", to: "", id: null, is_cancelled: true });
    }
  };

  // ---------- Effects ----------
  useEffect(() => {
    const initialize = async () => {
      try {
        loadSlotFromLocalStorage();
        setTimings(defaultTimings);
      } catch {
        showNotificationMessage("Failed to load data", "error");
      } finally {
        setLoading(false);
      }
    };

    initialize();
    window.addEventListener("storage", loadSlotFromLocalStorage);
    return () => window.removeEventListener("storage", loadSlotFromLocalStorage);
    // eslint-disable-next-line
  }, [testId]);

  // ---------- Conditions ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (!student || !test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Cannot Book Slot
          </h2>
          <p className="text-gray-600">
            Student or test data not found.
          </p>
        </div>
      </div>
    );
  }

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-500 to-red-500 py-8 px-4">
      {/* Notification */}
      {showNotification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
            notificationType === "success"
              ? "bg-green-500"
              : notificationType === "error"
              ? "bg-red-500"
              : "bg-orange-500"
          } text-white`}
        >
          <div className="flex items-center space-x-2">
            {notificationType === "success" && <CheckCircle className="w-5 h-5" />}
            {notificationType === "error" && <XCircle className="w-5 h-5" />}
            {notificationType === "info" && <Calendar className="w-5 h-5" />}
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {slot.is_cancelled ? (
          // ---------- Booking Section ----------
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-orange-400 px-8 py-6 text-white">
              <h1 className="text-3xl font-bold mb-2">Book Interview Slot</h1>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span className="text-lg">
                  Book Interview Slot for {student.firstName} {student.lastName}
                </span>
              </div>
            </div>

            <div className="p-8">
              {/* Date Picker */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-orange-600" />
                  Select Date
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={formatDate(selectedDate)}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    min={formatDate(new Date())}
                    max={formatDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000))}
                    className="w-full p-3 border border-gray-300 rounded-lg"
                  />
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Selected Date:</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {formatDisplayDate(selectedDate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-orange-600" />
                  Available Time Slots
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {timings.map(({ id, from, to }) => (
                    <button
                      key={id}
                      onClick={() => setSlot({ id, from, to, is_cancelled: true })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        slot.id === id
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {formatTime(from)} - {formatTime(to)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSlotBooking}
                disabled={!slot.id}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                  !slot.id
                    ? "bg-gray-300 text-gray-500"
                    : "bg-gradient-to-r from-orange-600 to-orange-400 text-white"
                }`}
              >
                {slot.id ? "Book Selected Slot" : "Select a Time Slot"}
              </button>
            </div>
          </div>
        ) : (
          // ---------- Booked Details Section ----------
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-orange-400 px-8 py-6 text-white">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <CheckCircle className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Interview Slot Booked</h1>
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Slot Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-sm text-gray-500">Student Name</p>
                  <p className="text-lg font-semibold">{slot.student_name}</p>

                  <p className="text-sm text-gray-500 mt-4">Topic</p>
                  <p className="text-lg font-semibold">{slot.topic_name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-lg font-semibold">
                    {slot.on_date && formatDisplayDate(new Date(slot.on_date))}
                  </p>

                  <p className="text-sm text-gray-500 mt-4">Time</p>
                  <p className="text-lg font-semibold">
                    {slot.start_time &&
                      slot.end_time_expected &&
                      `${formatTime(slot.start_time)} - ${formatTime(
                        slot.end_time_expected
                      )}`}
                  </p>
                </div>
              </div>

              <button
                onClick={handleDeleteSlot}
                className="w-full md:w-auto py-3 px-8 m-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg"
              >
                Reschedule Slot
              </button>

              <button
                onClick={handleNavigationOnStudentPage}
                className="w-full md:w-auto py-3 px-8 m-2 bg-gradient-to-r from-green-400 to-green-500 text-white font-semibold rounded-lg"
              >
                Result Section
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotBooking;