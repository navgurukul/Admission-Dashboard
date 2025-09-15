import React from 'react';
import { Calendar, Clock, User, Video, CheckCircle } from 'lucide-react';

interface BookedSlotProps {
  slot: {
    student_name: string;
    topic_name: string;
    on_date: string;
    start_time: string;
    end_time_expected: string;
  };
  onReschedule: () => void;
}

const BookedSlotDetails: React.FC<BookedSlotProps> = ({ slot, onReschedule }) => {
  const formatTime = (timeString: string) => {
    const [hour, minute] = timeString.split(':');
    const time = new Date();
    time.setHours(parseInt(hour), parseInt(minute));
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDisplayDate = (date: string) => new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden p-8">
      <div className="flex items-center space-x-3 mb-4">
        <CheckCircle className="w-8 h-8 text-green-500" />
        <h1 className="text-2xl font-bold">Interview Slot Booked</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
              <p className="text-lg font-semibold text-gray-800">{formatDisplayDate(slot.on_date)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-500">Time</p>
              <p className="text-lg font-semibold text-gray-800">{formatTime(slot.start_time)} - {formatTime(slot.end_time_expected)}</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onReschedule}
        className="w-full md:w-auto py-3 px-8 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-lg hover:shadow-lg"
      >
        Reschedule Slot
      </button>
    </div>
  );
};

export default BookedSlotDetails;
