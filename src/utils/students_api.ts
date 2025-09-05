import axios from "axios";

// src/api/questionApi.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL ;


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












