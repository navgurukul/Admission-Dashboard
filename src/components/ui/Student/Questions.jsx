import React from "react";

const Questions = ({
  questionNumber,
  time,
  instruction,
  questionStatement,
  options,
  handlePrevious,
  handleNext,
}) => {
  return (
    <div>
      <p>
        <span>Current Question No. {questionNumber} </span>You have attempted 0
        so far.
      </p>
      <h1>Time Remaining : {time}</h1>
      <p>{instruction}</p>
      <p>{questionStatement}</p>
      <div>
        <p>
          <span>1. {options[0]}</span>
          <span>2. {options[1]}</span>
          <span>3. {options[2]}</span>
          <span>4. {options[3]}</span>
        </p>
      </div>
      <div>
        <button onClick={handlePrevious}>Previous</button>
        <button onClick={handleNext}>Next</button>
      </div>
    </div>
  );
};

export default Questions;
