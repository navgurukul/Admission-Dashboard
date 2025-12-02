// src/api/questionApi.ts
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

export const states = [
  { value: "Andhra Pradesh", label: "Andhra Pradesh" },
  { value: "Arunachal Pradesh", label: "Arunachal Pradesh" },
  { value: "Assam", label: "Assam" },
  { value: "Bihar", label: "Bihar" },
  { value: "Chhattisgarh", label: "Chhattisgarh" },
  { value: "Goa", label: "Goa" },
  { value: "Gujarat", label: "Gujarat" },
  { value: "Haryana", label: "Haryana" },
  { value: "Himachal Pradesh", label: "Himachal Pradesh" },
  { value: "Jharkhand", label: "Jharkhand" },
  { value: "Karnataka", label: "Karnataka" },
  { value: "Kerala", label: "Kerala" },
  { value: "Madhya Pradesh", label: "Madhya Pradesh" },
  { value: "Maharashtra", label: "Maharashtra" },
  { value: "Manipur", label: "Manipur" },
  { value: "Meghalaya", label: "Meghalaya" },
  { value: "Mizoram", label: "Mizoram" },
  { value: "Nagaland", label: "Nagaland" },
  { value: "Odisha", label: "Odisha" },
  { value: "Punjab", label: "Punjab" },
  { value: "Rajasthan", label: "Rajasthan" },
  { value: "Sikkim", label: "Sikkim" },
  { value: "Tamil Nadu", label: "Tamil Nadu" },
  { value: "Telangana", label: "Telangana" },
  { value: "Tripura", label: "Tripura" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh" },
  { value: "Uttarakhand", label: "Uttarakhand" },
  { value: "West Bengal", label: "West Bengal" },
  {
    value: "Andaman and Nicobar Islands",
    label: "Andaman and Nicobar Islands",
  },
  { value: "Chandigarh", label: "Chandigarh" },
  {
    value: "Dadra and Nagar Haveli and Daman & Diu",
    label: "Dadra and Nagar Haveli and Daman & Diu",
  },
  { value: "Delhi", label: "Delhi" },
  { value: "Jammu and Kashmir", label: "Jammu and Kashmir" },
  { value: "Ladakh", label: "Ladakh" },
  { value: "Lakshadweep", label: "Lakshadweep" },
  { value: "Puducherry", label: "Puducherry" },
];
