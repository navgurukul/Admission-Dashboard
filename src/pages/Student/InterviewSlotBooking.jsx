import React, { useState } from "react";
import { format } from "date-fns"; // for formatting dates
import Calendar from "react-calendar"; // install with: npm install react-calendar date-fns
import "react-calendar/dist/Calendar.css";

const InterviewSlotBooking = () => {
  const [date, setDate] = useState(new Date());
  const [slots, setSlots] = useState([]); // empty = no slots available

  const handleDateChange = (selectedDate) => {
    setDate(selectedDate);

    // Example: only allow slots on Mon/Wed
    const day = selectedDate.getDay();
    if (day === 1 || day === 3) {
      setSlots(["10:00 AM", "2:00 PM"]);
    } else {
      setSlots([]);
    }
  };

  const handleBook = () => {
    alert(`Interview booked on ${format(date, "PPP")} at ${slots[0]}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center ">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold mb-2">Book Interview Slot</h1>
      <h2 className="text-lg font-medium mb-6">
        Book Interview Slot for <span className="font-bold">Shilpi Gupta</span>
      </h2>

      {/* Calendar */}
      <div className="bg-white shadow rounded-lg p-4">
        <Calendar
          onChange={handleDateChange}
          value={date}
          className="react-calendar"
        />
      </div>

      {/* Slots / No Slots */}
      <div className="mt-6 text-center">
        {slots.length === 0 ? (
          <p className="text-red-600 font-medium">
            No Slots Available on {format(date, "PPP")}
          </p>
        ) : (
          <div>
            <p className="mb-2 font-medium">Available Slots:</p>
            <div className="flex gap-3 justify-center mb-4">
              {slots.map((slot) => (
                <button
                  key={slot}
                  className="px-4 py-2 border rounded-md bg-gray-100 hover:bg-gray-200"
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Book button */}
      <button
        className={`mt-4 px-6 py-2 rounded-lg shadow text-white ${
          slots.length === 0
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-orange-500 hover:bg-orange-600"
        }`}
        disabled={slots.length === 0}
        onClick={handleBook}
      >
        Book Slot
      </button>
      </div>
    </div>
  );
};

export default InterviewSlotBooking;
