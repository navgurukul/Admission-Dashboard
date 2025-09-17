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

// Mock API for Student Flow
export interface StudentResult {
  name: string;
  score: number;
  status: "Pass" | "Fail";
  examName: string;
}

export const getStudentResult = async (): Promise<StudentResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: "John Doe",
        score: 85,
        status: "Pass",
        examName: "Frontend Developer Test",
      });
    }, 1000); // simulate network delay
  });
};

export interface OfferLetter {
  url: string;
}

export const getOfferLetter = async (): Promise<OfferLetter> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      });
    }, 1000);
  });
};

export const uploadSignedOfferLetter = async (file: File): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("Mock upload success:", file.name);
      resolve();
    }, 1500);
  });
};









