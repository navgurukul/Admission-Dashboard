import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ScreeningResultPage: React.FC = () => {
  const navigate = useNavigate();

  // const onSubmit = () => {
  //   // Handle form submission
  // };

  // Temporary hardcoded data (replace with API later)
  const [result] = useState({
    status: "fail", // change to "fail" to test
    score: 0,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl flex flex-col items-center justify-center">
        {result.status === "pass" ? (
          <>
            <h1 className="text-2xl md:text-3xl font-semibold text-black mb-2">
              Thank you! you have passed the test.
            </h1>
            <h2 className="text-xl md:text-2xl font-bold text-black mb-6">
              You have scored{" "}
              <span className="text-orange-600">{result.score}</span> marks
            </h2>

            <p className="text-gray-700 mb-2">
              Thank you for applying to NavGurukul Program
            </p>
            <p className="text-gray-700 mb-4">
              Admission team will reach out to you for the next steps
            </p>

            <p className="text-gray-700 mb-6">
              You can send us a mail on{" "}
              <a
                href="mailto:hi@navgurukul.org"
                className="text-orange-500 font-medium hover:underline"
              >
                hi@navgurukul.org
              </a>
              .
            </p>

            {/* Buttons */}
            <div className="flex flex-col align-center space-y-4 w-full max-w-sm">
              <a
                href="https://navgurukul.org"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-orange-400 text-orange-500 font-semibold py-3 rounded-md hover:bg-orange-50 transition"
              >
                VISIT NAVGURUKUL WEBSITE
              </a>
              <a
                href="https://navgurukul.org/courses"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-orange-400 text-orange-500 font-semibold py-3 rounded-md hover:bg-orange-50 transition"
              >
                START LEARNING CODING NOW
              </a>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold text-gray-800 mb-4">
              Oh Sorry!
            </h1>
            <p className="text-gray-700 mb-4 text-lg">
              You could not clear the Navgurukul Preliminary Test this time. You
              have scored{" "}
              <span className="font-bold">{result.score}</span> marks in the
              test. Don&apos;t worry, you can give the test again after some
              preparation.
            </p>

            <p className="text-gray-700 mb-6">
              You can use this study guide for more maths practice{" "}
              <a
                href="https://www.khanacademy.org/math"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-medium underline hover:text-blue-800"
              >
                Click Here
              </a>
              . Prepare, Practice and Pass :)
            </p>

            <button
              onClick={() => navigate("/students/result")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
            >
              OK
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ScreeningResultPage;
