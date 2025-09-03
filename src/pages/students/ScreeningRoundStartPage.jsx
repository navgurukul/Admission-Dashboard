import React from "react";
import { useNavigate } from "react-router-dom";

const ScreeningRoundStartPage = () => {
  const navigate = useNavigate();

  const handleStartTest = () => {
    navigate("/students/test-section");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center ">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full flex flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold mb-4">One More Thing:</h1>
          <p className="text-gray-600 mb-2">
            Now, you will be asked some questions in the test. Answer them
            carefully.
          </p>
          <p className="text-gray-800 font-medium mb-2">But also keep an eye on time</p>
          <p className="text-gray-800 font-semibold mb-6">
            You have to answer 18 questions in 1 Hour &amp; 30 Minutes
          </p>
         {/* Button */}
        <button
          onClick={handleStartTest}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200 shadow-lg"
        >
          START TEST
        </button>
    </div>
    </div>
  )
}

export default ScreeningRoundStartPage