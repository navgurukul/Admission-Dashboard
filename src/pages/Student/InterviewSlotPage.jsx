import React from 'react'

const InterviewSlotPage = () => {
  return (
   <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center ">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center justify-center">
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Interview Slot Booked
        </h1>

        {/* Slot Details */}
        <h2 className="text-lg font-medium text-gray-700 mb-4 text-center">
          Slot Details
        </h2>

        <div className="space-y-3 text-gray-700">
          <p>
            <span className="font-bold">Student Name:</span> Shilpi Gupta
          </p>
          <p>
            <span className="font-bold">Topic:</span> Interview Scheduled
          </p>
          <p>
            <span className="font-bold">On:</span> 30 Aug 2025
          </p>
          <p>
            <span className="font-bold">From:</span> 11:00 AM{" "}
            <span className="font-bold">To:</span> 12:00 PM
          </p>
        </div>

        {/* Button */}
        <div className="mt-8 text-center">
          <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200">
            RESCHEDULE SLOT
          </button>
        </div>
    </div>
  </div>
  )
}

export default InterviewSlotPage