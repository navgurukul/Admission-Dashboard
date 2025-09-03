import React from 'react';

const NavgurukulTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
    
      {/* Logo */}
      <div className="flex justify-start px-8 py-6">
        <div className="flex items-center">
          <span className="text-orange-500 font-bold text-xl">nav</span>
          <span className="text-gray-800 font-bold text-xl">gurukul</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-8 py-16">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl md:text-5xl font-light text-gray-800 mb-12">
            One More Thing:
          </h1>
          
          <div className="space-y-6 mb-12">
            <p className="text-gray-600 text-lg">
              Now, you will be asked some questions in the test. Answer them carefully.
            </p>
            
            <p className="text-gray-700 text-xl font-medium">
              But also keep an eye on time
            </p>
            
            <p className="text-gray-700 text-xl font-medium">
              You have to answer 18 questions in 1 Hour & 30 Minutes
            </p>
          </div>
          
          <button 
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-12 py-4 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
            onClick={() => console.log('Starting test...')}
          >
            START THE TEST
          </button>
        </div>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 text-center py-4">
        <p className="text-gray-300 text-sm">
          For more queries, write at <a href="mailto:hi@navgurukul.org" className="text-blue-400 hover:text-blue-300">hi@navgurukul.org</a>
        </p>
      </footer>
    </div>
  );
};

export default NavgurukulTestPage;