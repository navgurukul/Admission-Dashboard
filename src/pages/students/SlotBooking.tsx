import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, Video, Loader2 } from 'lucide-react';

// Types
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

interface StudentData {
  name: string;
  stage: string;
  transitionID: number;
}

const SlotBooking: React.FC = () => {
  // Default time slots
  const defaultTimings: TimeSlot[] = [
    { id: 1, from: "9:00", to: "10:00" },
    { id: 2, from: "10:00", to: "11:00" },
    { id: 3, from: "11:00", to: "12:00" },
    { id: 4, from: "12:00", to: "13:00" },
    { id: 5, from: "13:00", to: "14:00" },
    { id: 6, from: "14:00", to: "15:00" },
  ];

  // State
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<SlotData>({
    from: "",
    to: "",
    id: null,
    is_cancelled: true,
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [studentData, setStudentData] = useState<StudentData>({
    name: "John Doe",
    stage: "Screening Test Pass",
    transitionID: 1,
  });
  const [timings, setTimings] = useState<TimeSlot[]>(defaultTimings);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('success');

  // Utility functions
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (timeString: string): string => {
    const [hour, minute] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hour), parseInt(minute));
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const formatDisplayDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const showNotificationMessage = (message: string, type: 'success' | 'error' | 'info') => {
    setNotificationMessage(message);
    setNotificationType(type);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  // Mock API functions (replace with actual API calls)
  const fetchSlotData = useCallback(async (): Promise<SlotData | null> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      id: null,
      from: "",
      to: "",
      is_cancelled: true,
    };
  }, []);

  const fetchStudentData = useCallback(async (): Promise<StudentData> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      name: "Alice Johnson",
      stage: "Screening Test Pass",
      transitionID: 1,
    };
  }, []);

  const handleDateChange = useCallback(async (date: Date) => {
    setSelectedDate(date);
    // Simulate fetching available slots for the date
    await new Promise(resolve => setTimeout(resolve, 300));
    setTimings(defaultTimings);
  }, []);

  const handleSlotBooking = async () => {
    if (!slot.id) return;

    try {
      // Simulate booking API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSlot({
        ...slot,
        is_cancelled: false,
        on_date: formatDate(selectedDate),
        start_time: slot.from,
        end_time_expected: slot.to,
        student_name: studentData.name,
        topic_name: studentData.stage,
      });
      
      showNotificationMessage("Slot Booked & Meet Scheduled Successfully!", 'success');
    } catch (error) {
      showNotificationMessage("Failed to book slot. Please try again.", 'error');
    }
  };

  const handleDeleteSlot = async () => {
    try {
      // Simulate delete API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSlot({
        from: "",
        to: "",
        id: null,
        is_cancelled: true,
      });
      
      showNotificationMessage("Slot Cancelled & Meet Removed", 'info');
    } catch (error) {
      showNotificationMessage("Error cancelling slot", 'error');
    }
  };

  // Initialize component
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const [slotData, student] = await Promise.all([
          fetchSlotData(),
          fetchStudentData()
        ]);
        
        if (slotData) setSlot(slotData);
        setStudentData(student);
        await handleDateChange(selectedDate);
      } catch (error) {
        showNotificationMessage("Failed to load data", 'error');
      } finally {
        setLoading(false);
      }
    };

    initializeComponent();
  }, [fetchSlotData, fetchStudentData, handleDateChange, selectedDate]);

  // Check if student can book slots
  const canBookSlot = [
    "Screening Test Pass",
    "Learning Round Pass",
    "Pending Culture Fit Re-Interview",
    "Interview Scheduled",
  ].includes(studentData.stage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!canBookSlot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Cannot Book Slot</h2>
          <p className="text-gray-600">You are not eligible to book interview slots at this stage.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-500 to-red-500 py-8 px-4">
      {/* Notification */}
      {showNotification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${
          notificationType === 'success' ? 'bg-green-500' : 
          notificationType === 'error' ? 'bg-red-500' : 'bg-orange-500'
        } text-white`}>
          <div className="flex items-center space-x-2">
            {notificationType === 'success' && <CheckCircle className="w-5 h-5" />}
            {notificationType === 'error' && <XCircle className="w-5 h-5" />}
            {notificationType === 'info' && <Calendar className="w-5 h-5" />}
            <span>{notificationMessage}</span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {slot.is_cancelled ? (
          /* Booking Interface */
         <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
  {/* Header */}
  <div className="bg-orange-400 px-8 py-6 text-white">
              <h1 className="text-3xl font-bold mb-2">Book Interview Slot</h1>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span className="text-lg">Book Interview Slot for {studentData.name}</span>
              </div>
            </div>

            <div className="p-8">
              {/* Date Selection */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-orange-600" />
                  Select Date
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="date"
                    value={formatDate(selectedDate)}
                    onChange={(e) => handleDateChange(new Date(e.target.value))}
                    min={formatDate(new Date())}
                    max={formatDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
                  />
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Selected Date:</p>
                    <p className="text-lg font-semibold text-orange-600">{formatDisplayDate(selectedDate)}</p>
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-orange-600" />
                  Available Time Slots
                </h3>
                
                {timings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {timings.map(({ id, from, to }) => (
                      <button
                        key={id}
                        onClick={() => setSlot({ id, from, to, is_cancelled: true })}
                        className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                          slot.id === id
                            ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
                        }`}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            {formatTime(from)} - {formatTime(to)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-lg text-gray-600">No Slots Available</p>
                    <p className="text-sm text-gray-500">on {formatDisplayDate(selectedDate)}</p>
                  </div>
                )}
              </div>

              {/* Book Button */}
              <button
                onClick={handleSlotBooking}
                disabled={!slot.id || timings.length === 0}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  !slot.id || timings.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-600 to-orange-400 text-white hover:from-orange-600 hover:to-red-500 hover:shadow-lg transform hover:scale-105'
                }`}
              >
                {slot.id ? 'Book Selected Slot' : 'Select a Time Slot'}
              </button>
            </div>
          </div>
        ) : (
          /* Booked Slot Display */
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-orange-400 px-8 py-6 text-white">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <CheckCircle className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Interview Slot Booked</h1>
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Slot Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-500">Student Name</p>
                      <p className="text-lg font-semibold text-gray-800">{slot.student_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Video className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-500">Topic</p>
                      <p className="text-lg font-semibold text-gray-800">{slot.topic_name}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {slot.on_date && formatDisplayDate(new Date(slot.on_date))}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="text-lg font-semibold text-gray-800">
                        {slot.start_time && slot.end_time_expected && 
                          `${formatTime(slot.start_time)} - ${formatTime(slot.end_time_expected)}`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reschedule Button */}
              <button
                onClick={handleDeleteSlot}
                className="w-full md:w-auto py-3 px-8 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              >
                Reschedule Slot
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotBooking;