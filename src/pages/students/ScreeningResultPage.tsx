import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ScreeningResultPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get score and total from navigation state
  const { score = 0, total = 0 } = location.state || {};

  // Decide pass/fail (example: pass if score >= 50%)
  const status = score >= Math.ceil(total * 0.5) ? "pass" : "fail";

  const handleSubmit = ()=>{
      navigate("/students/result")
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full flex flex-col items-center text-center">
        {status === "pass" ? (
          <>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Congratulations!</h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">
              You passed the test with a score of{" "}
              <span className="text-orange-500">{score}</span> /{" "}
              <span className="text-orange-500">{total}</span>
            </h2>
            <p className="text-gray-700 mb-2">Thank you for applying to NavGurukul Program.</p>
            <p className="text-gray-700 mb-4">Our admission team will contact you for the next steps.</p>

            <p className="text-gray-700 mb-4">You can send us a mail on <a href="mailto:hi@navgurukul.org" className="text-blue-500">hi@navgurukul.org</a>.</p>
            
            <div className="flex flex-col md:flex-row gap-4 mt-6 w-full justify-center">
              <a
                href="https://navgurukul.org"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-50 border border-orange-500 text-orange-600 font-semibold py-3 px-6 rounded-lg hover:bg-orange-100 transition"
              >
                VISIT NAVGURUKUL
              </a>
              <a
                href="https://www.merakilearn.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-50 border border-orange-500 text-orange-600 font-semibold py-3 px-6 rounded-lg hover:bg-orange-100 transition"
              >
                START CODING NOW
              </a>
            </div>

            {/* Button to go to results/dashboard */}
            <button
              onClick={() => handleSubmit()}
              className="mt-6 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
            >
              Go to Result Section
            </button>
          </>
        ) : (
          <>
           <h1 className="text-3xl font-semibold text-gray-900 mb-6">Oh Sorry!</h1>
            <p className="text-gray-700 mb-4 text-lg">
              You could not clear the NavGurukul Preliminary Test this time. You have scored{" "}
              <span className="font-bold">{score}</span> marks in the test. Don’t worry, you can give the test again after some preparation.
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
              . Prepare, Practice and Pass
            </p>
            <button
              onClick={() => handleSubmit()}
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
