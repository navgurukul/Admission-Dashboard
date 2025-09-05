// src/api/questionApi.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL ;
console.log("BASE_URL:", BASE_URL);

// Fetch questions
// export const getQuestions = async () => {
//   try {
//     const res = await fetch(`${BASE_URL}/questions/getQuestions`);
//     console.log("Response from getQuestions:", res);
//     if (!res.ok) {
//       throw new Error(`Error fetching questions: ${res.statusText}`);
//     }
//     const json = await res.json();
//     console.log("Data from getQuestions:", json);

//     if (!json.data || !Array.isArray(json.data.data)) {
//       console.error("Unexpected data format:", json);
//       return [];
//     }

//     // Map API structure → frontend structure
//     const questions = (json.data?.data || []).map((q: any) => ({
//       id: q.id,
//       question: q.english_text, // use english_text (or translation if needed)
//       options: q.answer_options,
//       answer: q.answer_options[q.answer_key - 1], // answer_key is 1-based
//     }));

//     return questions;
//   } catch (err) {
//     console.error("getQuestions error:", err);
//     return [];
//   }
// };


// Fetch exam duration
// export const getExamDuration = async () => {
//   try {
//     const res = await fetch(`${BASE_URL}/getExamDuration`);
//     if (!res.ok) {
//       throw new Error(`Error fetching duration: ${res.statusText}`);
//     }
//     const json = await res.json();
//     return json.duration || 0; // assuming API sends { duration: number }
//   } catch (err) {
//     console.error("getExamDuration error:", err);
//     return 0;
//   }
// };


// Stub for exam duration (e.g., 30 minutes = 1800 seconds)
export const getExamDuration = async () => {
  return 1800; // change this to any duration you want
};


export const getQuestions = async () => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return [
    {
      id: 1,
      question: "What is 2 + 2?",
      options: ["1", "2", "3", "4"],
      answer: "4",
    },
    {
      id: 2,
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Rome"],
      answer: "Paris",
    },
    {
      id: 3,
      question: "Which is a JavaScript framework?",
      options: ["React", "Django", "Laravel", "Spring"],
      answer: "React",
    },
  ];
};


