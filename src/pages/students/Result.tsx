// import React, { useState } from "react";

// const ResultPage: React.FC = () => {
//   // Temporary hardcoded data (replace with API later)
//   const [result] = useState({
//     status: "pass", // change to "fail" to test
//     score: 18,
//   });

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-4">
//       {result.status === "pass" ? (
//         <>
//           <h1 className="text-2xl md:text-3xl font-semibold text-black mb-2">
//             Thank you! you have passed the test.
//           </h1>
//           <h2 className="text-xl md:text-2xl font-bold text-black mb-6">
//             You have scored{" "}
//             <span className="text-red-600">{result.score}</span> marks
//           </h2>

//           <p className="text-gray-700 mb-2">
//             Thank you for applying to NavGurukul Program
//           </p>
//           <p className="text-gray-700 mb-4">
//             Admission team will reach out to you for the next steps
//           </p>

//           <p className="text-gray-700 mb-6">
//             You can send us a mail on{" "}
//             <a
//               href="mailto:hi@navgurukul.org"
//               className="text-red-500 font-medium hover:underline"
//             >
//               hi@navgurukul.org
//             </a>
//             .
//           </p>

//           {/* Buttons */}
//           <div className="flex flex-col space-y-4 w-full max-w-sm">
//             <a
//               href="https://navgurukul.org"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="border border-red-400 text-red-500 font-semibold py-3 rounded-md hover:bg-red-50 transition"
//             >
//               VISIT NAVGURUKUL WEBSITE
//             </a>
//             <a
//               href="https://navgurukul.org/courses"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="border border-red-400 text-red-500 font-semibold py-3 rounded-md hover:bg-red-50 transition"
//             >
//               START LEARNING CODING NOW
//             </a>
//           </div>
//         </>
//       ) : (
//         <>
//           <h1 className="text-3xl font-semibold text-gray-800 mb-4">
//             Oh Sorry!
//           </h1>
//           <p className="text-gray-700 mb-4 text-lg">
//             You could not clear the Navgurukul Preliminary Test this time. You
//             have scored{" "}
//             <span className="font-bold">{result.score}</span> marks in the test.
//             Don&apos;t worry, you can give the test again after some preparation.
//           </p>

//           <p className="text-gray-700 mb-6">
//             You can use this study guide for more maths practice{" "}
//             <a
//               href="https://www.khanacademy.org/math"
//               target="_blank"
//               rel="noopener noreferrer"
//               className="text-blue-600 font-medium underline hover:text-blue-800"
//             >
//               Click Here
//             </a>
//             . Prepare, Practice and Pass :)
//           </p>

//           <button
//             onClick={() => (window.location.href = "/students/landing")}
//             className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
//           >
//             OK
//           </button>
//         </>
//       )}
//     </div>
//   );
// };

// export default ResultPage;
