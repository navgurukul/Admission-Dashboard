import React from 'react';
import { useNavigate } from 'react-router-dom';

const Instructions: React.FC = () => {
  const navigate = useNavigate();
  
  // Get selected language from localStorage
  const selectedLanguage = localStorage.getItem('selectedLanguage') || 'english';

  // Language-specific content
  const getLanguageContent = () => {
    switch (selectedLanguage) {
      case "hindi":
        return {
          title: "NavGurukul Entrance Test",
          instructionsIntro: "परीक्षा शुरू करने से पहले कृपया निम्नलिखित महत्वपूर्ण निर्देश पढ़ें। परीक्षा देते समय ये निर्देश काम आएंगे",
          instructions: [
            "पूरी परीक्षा 1 घंटे की होगी। कृपया किसी शांत स्थान पर परीक्षा दें, जहां आप बिना किसी व्यवधान के प्रश्नों का उत्तर दे सकें।",
            "परीक्षा देते समय एक नोटबुक और एक पेन अपने पास रखें। आप किसी भी रफ नोटबुक का उपयोग कर सकते हैं।",
            "परीक्षा देते समय प्रत्येक प्रश्न का उत्तर अपने फोन पर ही दें।",
            "आपको परीक्षा में नकल करने का मौका मिल सकता है, लेकिन हमें विश्वास है कि आप नकल नहीं करेंगे।"
          ],
          imReady: "मैं तैयार हूँ",
          back: "वापस",
          next: "आगे",
        };
      case "marathi":
        return {
          title: "NavGurukul Entrance Test",
          instructionsIntro: "परीक्षा सुरू करण्यापूर्वी कृपया खालील महत्वाचे निर्देश वाचा. परीक्षा देताना हे निर्देश उपयोगी पडतील",
          instructions: [
            "संपूर्ण चाचणी 1 तासाची असेल. कृपया शांत ठिकाणी चाचणी द्या, जिथे तुम्ही कोणत्याही व्यत्ययाशिवाय प्रश्नांची उत्तरे देऊ शकता.",
            "परीक्षा देताना एक वही आणि पेन सोबत ठेवा. तुम्ही कोणतीही रफ नोटबुक वापरू शकता.",
            "परीक्षा देताना प्रत्येक प्रश्नाचे उत्तर तुमच्या फोनवरच द्या.",
            "तुम्हाला परीक्षेत फसवणूक करण्याची संधी मिळू शकते, परंतु आम्हाला विश्वास आहे की तुम्ही असे कोणतेही काम करणार नाही."
          ],
          imReady: "मी तयार आहे",
          back: "मागे",
          next: "पुढे",
        };
      default: // English
        return {
          title: "NavGurukul Entrance Test",
          instructionsIntro: "Please read the following important instructions before starting the test. These instruction will come in handy while giving the test.",
          instructions: [
            "The complete test will be of 1 hour. Please give the test in a quiet place, where you can answer the questions without any disruptions.",
            "While giving the test, keep a notebook and a pen with you. You can use any rough notebook.",
            "While giving the test, answer each question on your phone itself.",
            "You may get the chance of cheating exam, but we believe that you will not cheat."
          ],
          imReady: "I'M READY",
          back: "BACK",
          next: "NEXT",
        };
    }
  };

  const content = getLanguageContent();

  const handleNext = () => {
    localStorage.setItem("instructionsAccepted", "true");
    navigate('/students/registration');
  };

  const handlePrevious = () => {
    navigate('/students');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-4">{content.title}</h1>
        
        <p className="text-gray-600 text-center mb-8">
          {content.instructionsIntro}
        </p>

        <div className="space-y-4 mb-8">
          {content.instructions.map((instruction, index) => (
            <div key={index} className="flex items-start space-x-3">
              <span className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <p className="text-gray-700">
                {instruction}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleNext}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            {content.imReady}
          </button>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 mt-8">

          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            className="text-gray-600 hover:text-gray-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {content.back}
          </button>
          <button
            onClick={handleNext}
            className="text-orange-500 hover:text-orange-600 flex items-center"
          >
            {content.next}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Instructions;