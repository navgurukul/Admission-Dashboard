export const getQuestions = async () => {
  return [
    {
      question: "A shopkeeper bought 20 pens at ₹x each and 15 pencils at ₹y each. He sold all the pens at a profit of 20% and all the pencils at a profit of 10%. If the total selling price was ₹860, and x = 20, find the value of y.",
      options: ["10", "12", "14", "16"],
      answer: "12"
    },
    {
      question: "The sum of the ages of a father and his son is 60 years. Five years ago, the father's age was four times the son's age. Find the present ages of the father and the son.",
      options: ["45 and 15", "50 and 10", "40 and 20", "55 and 5"],
      answer: "45 and 15"
    },
    {
      question: "A man bought two articles for ₹3000. He sold one at a profit of 20% and the other at a loss of 10%. If he made no profit or loss overall, what is the cost price of each article?",
      options: ["₹1000 and ₹2000", "₹1200 and ₹1800", "₹1500 and ₹1500", "₹1400 and ₹1600"],
      answer: "₹1200 and ₹1800"
    },
    {
      question: "If 2x + 3y = 12 and 3x + 2y = 13, what is the value of x + y?",
      options: ["4", "5", "6", "7"],
      answer: "5"
    },
    {
      question: "A train travels 60 km at a speed of x km/h and then another 90 km at a speed of (x + 15) km/h. If the total time taken is 3 hours, what is the value of x?",
      options: ["30", "40", "45", "50"],
      answer: "45"
    },
    {
      question: "The ratio of the incomes of A and B is 3:4 and the ratio of their expenditures is 2:3. If A saves ₹6000 and B saves ₹8000, find their incomes.",
      options: ["₹18,000 and ₹24,000", "₹21,000 and ₹28,000", "₹24,000 and ₹32,000", "₹27,000 and ₹36,000"],
      answer: "₹24,000 and ₹32,000"
    },
    {
      question: "The denominator of a fraction is 4 more than its numerator. If 3 is added to both numerator and denominator, the fraction becomes 3/4. Find the original fraction.",
      options: ["3/7", "4/8", "5/9", "6/10"],
      answer: "3/7"
    },
    {
      question: "A person spends 40% of his monthly income on rent, 20% on food, 10% on travel and saves the rest. If his monthly savings are ₹12,000, find his total monthly income.",
      options: ["₹20,000", "₹24,000", "₹30,000", "₹40,000"],
      answer: "₹40,000"
    },
    {
      question: "Two numbers differ by 7. If the larger number is divided by the smaller, the quotient is 2 and the remainder is 3. Find the numbers.",
      options: ["17 and 10", "19 and 12", "21 and 14", "23 and 16"],
      answer: "17 and 10"
    },
    {
      question: "If 5 workers can complete a task in 12 days, how many more workers are required to complete the same task in 8 days, assuming all work at the same rate?",
      options: ["2", "3", "4", "5"],
      answer: "3"
    },
    {
      question: "The average marks of 30 students in a class is 45. If the marks of one student are wrongly entered as 75 instead of 45, what is the correct average?",
      options: ["44", "43", "42", "41"],
      answer: "44"
    },
    {
      question: "The cost price of 12 apples is equal to the selling price of 10 apples. Find the gain percent.",
      options: ["10%", "15%", "20%", "25%"],
      answer: "20%"
    },
    {
      question: "If x men can do a piece of work in 15 days, then how many days will it take (x + 5) men to do the same work?",
      options: ["15x/(x+5)", "20x/(x+5)", "25x/(x+5)", "30x/(x+5)"],
      answer: "15x/(x+5)"
    },
    {
      question: "The present age of a man is three times the age of his son. In 15 years, the man’s age will be twice that of his son. Find their present ages.",
      options: ["45 and 15", "50 and 20", "60 and 20", "42 and 14"],
      answer: "45 and 15"
    },
    {
      question: "A man buys 2 watches for ₹1600. He sells one watch at a profit of 20% and the other at a loss of 10%. If he makes no profit or loss overall, what is the cost price of each watch?",
      options: ["₹600 and ₹1000", "₹700 and ₹900", "₹800 and ₹800", "₹750 and ₹850"],
      answer: "₹600 and ₹1000"
    },
    {
      question: "If the selling price of 15 books is equal to the cost price of 20 books, find the loss percent.",
      options: ["15%", "20%", "25%", "30%"],
      answer: "25%"
    },
    {
      question: "The sum of three consecutive multiples of 7 is 105. Find the numbers.",
      options: ["21, 28, 35", "14, 21, 28", "7, 14, 21", "28, 35, 42"],
      answer: "21, 28, 35"
    },
    {
      question: "Two friends invest ₹40,000 and ₹50,000 in a business. After one year, they earn a profit of ₹18,000. What is the share of each in the profit?",
      options: ["₹8,000 and ₹10,000", "₹9,000 and ₹9,000", "₹7,200 and ₹10,800", "₹7,500 and ₹10,500"],
      answer: "₹8,000 and ₹10,000"
    }
  ];
};

// Mock: fetch exam duration from backend (in seconds)
export const getExamDuration = async () => {
  // Simulating API delay
  return new Promise((resolve) => {
    setTimeout(() => resolve(5400), 500); // 1h30m for now
  });
};