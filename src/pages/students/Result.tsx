import React from 'react';

const Result: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-3xl w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Result</h1>
        <p className="text-lg text-gray-700 mb-6">
          Your result will be displayed here.
        </p>
        <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
          <span className="text-gray-500">[ Result Data Placeholder ]</span>
        </div>
      </div>
    </div>
  );
};

export default Result;
