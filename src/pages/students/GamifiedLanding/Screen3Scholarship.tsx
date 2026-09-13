import React, { useEffect, useState } from 'react';

const Screen3Scholarship: React.FC = () => {
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showReward, setShowReward] = useState(false);

  useEffect(() => {
    // Keep original animation timings
    const timer1 = setTimeout(() => setHighlightIndex(0), 500);    
    const timer2 = setTimeout(() => setHighlightIndex(1), 4500);   
    const timer3 = setTimeout(() => setHighlightIndex(2), 9000);   
    const timer4 = setTimeout(() => setHighlightIndex(3), 13500);  
    const timer5 = setTimeout(() => {
      setHighlightIndex(4); 
      setShowReward(true);
    }, 18000);

    return () => {
      clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); clearTimeout(timer4); clearTimeout(timer5);
    };
  }, []);

  const cardsData = [
    {
      id: "zoneLearn",
      title: "Free laptop, day one",
      shortTitle: "Free Laptop",
      subtitle: "Learning power source",
      description: "Every selected candidate walks in on orientation day and walks out with a personal coding laptop — no deposit, no strings attached.",
      icon: "💻",
      bgColor: "bg-blue-50",
      textColor: "text-blue-500",
      tagColor: "text-rose-500 bg-rose-50",
    },
    {
      id: "zoneFood",
      title: "Three meals a day",
      shortTitle: "3 Meals/Day",
      subtitle: "Healthy food",
      description: "Three nutritious, wholesome meals daily provided completely free to keep you energized and focused on learning.",
      icon: <img src="/gamified-assets/indian-thali.png" alt="Indian Thali" className="w-6 h-6 md:w-8 md:h-8 object-contain" />,
      bgColor: "bg-orange-50",
      textColor: "text-orange-500",
      tagColor: "text-orange-500 bg-orange-50",
    },
    {
      id: "zoneStay",
      title: "Safe, on-campus stay",
      shortTitle: "On-Campus Stay",
      subtitle: "Safe living",
      description: "Comfortable and secure residential facilities on campus so you can study without worrying about rent or commute.",
      icon: "🏠",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-500",
      tagColor: "text-emerald-500 bg-emerald-50",
    },
    {
      id: "zoneWifi",
      title: "24/7 High-speed WiFi",
      shortTitle: "High-Speed Wifi",
      subtitle: "24/7 Internet",
      description: "Uninterrupted, high-speed internet connectivity to ensure you always have access to unlimited learning resources.",
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h.01" strokeWidth="3.2" />
          <path d="M8.5 16.5a5 5 0 0 1 7 0" />
          <path d="M5 12.5a10 10 0 0 1 14 0" />
          <path d="M2 8.5a15 15 0 0 1 20 0" />
        </svg>
      ),
      bgColor: "bg-purple-50",
      textColor: "text-purple-500",
      tagColor: "text-purple-500 bg-purple-50",
    },
    {
      id: "zonePlacement",
      title: "100% Mentor support",
      shortTitle: "Mentor Support",
      subtitle: "Guidance & Growth",
      description: "24/7 mentor support and industry expert guidance to help you clear doubts and prepare for placements.",
      icon: "🚀",
      bgColor: "bg-pink-50",
      textColor: "text-pink-500",
      tagColor: "text-pink-500 bg-pink-50",
    }
  ];

  const captions = [
    "Yeh raha tumhara laptop — ab seekhna shuru karte hain!",
    "Khana ekdum ghar jaisa, taaki focus padhai par rahe.",
    "Safe campus, comfortable stay. Tension free learning.",
    "Super fast internet, taaki resources ki kami na ho.",
    "Mentors hamesha aapke saath hain, har kadam par."
  ];

  const activeIndex = Math.max(0, highlightIndex);
  const activeCard = cardsData[activeIndex];
  const currentCaption = highlightIndex >= 0 ? captions[Math.min(highlightIndex, 4)] : captions[0];

  const handleNextClick = () => {
    const nextBtn = Array.from(document.querySelectorAll('.nav-arrow')).find(el => (el as HTMLElement).innerHTML.includes('›')) as HTMLButtonElement;
    if(nextBtn) nextBtn.click();
  };

  return (
    <section className="screen active w-full min-h-screen flex flex-col items-center justify-start pt-20 md:pt-28 px-4 md:px-8 relative overflow-hidden" data-i="2">
      
      {/* Header Section */}
      <div className="flex flex-col items-center text-center z-10 mb-8 max-w-3xl">
        <h1 className="text-2xl md:text-4xl font-serif text-gray-900 tracking-tight leading-tight mb-3">
          Everything covered.<br />
          <span className="italic text-rose-400">Zero financial barrier.</span>
        </h1>
        <p className="text-gray-600 text-xs md:text-sm font-medium max-w-xl mx-auto px-4">
          Once you're selected, every essential is arranged for you <br />
          — so all you bring is your effort.
        </p>
      </div>

      {/* Main Split Content Area */}
      <div className="relative w-full max-w-5xl z-10 flex flex-col md:flex-row gap-6 md:gap-8 mb-8 md:mb-10">
        
        {/* Left Side: Large Active Card */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-purple-100 relative overflow-hidden flex-grow transition-all duration-500 min-h-[200px]">
            {/* Top Right Decorative Shape (Solid Circle) - Reduced size */}
            <div className="absolute -top-12 -right-12 w-32 h-32 md:w-48 md:h-48 bg-[#FCEAE8] rounded-full opacity-100"></div>
            
            <div className="relative z-10">
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] md:text-xs font-bold mb-4 md:mb-6 ${activeCard.tagColor}`}>
                {activeCard.subtitle}
              </span>
              
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${activeCard.bgColor} ${activeCard.textColor} flex items-center justify-center text-xl md:text-2xl mb-4 md:mb-5 shadow-sm transition-colors duration-500`}>
                {activeCard.icon}
              </div>
              
              <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-900 mb-2 transition-all">
                {activeCard.title}
              </h2>
              
              <p className="text-gray-600 text-xs md:text-sm leading-relaxed">
                {activeCard.description}
              </p>
            </div>
          </div>
          
          {/* Guide Girl & Speech Bubble */}
          <div className="mt-4 flex flex-row items-end gap-3 transition-all duration-500 px-2 md:px-0">
            <div className="relative flex-shrink-0">
              <img src="/gamified-assets/mentor-avatar2.png" alt="Mentor" className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-md" />
            </div>
            <div className="bg-white rounded-2xl rounded-bl-none p-3 shadow-sm border border-gray-100 max-w-[200px] md:max-w-[280px]">
              <p className="text-[10px] md:text-xs font-medium text-gray-700 leading-snug">
                {currentCaption}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Small Grid of Items */}
        <div className="flex-1 flex flex-col justify-start">
          <div className="grid grid-cols-2 gap-3 md:gap-4 w-full">
            {cardsData.map((card, index) => {
              const isActive = highlightIndex === index; // Only highlight the currently active card
              return (
                <div 
                  key={card.id}
                  className={`relative overflow-hidden bg-white rounded-2xl p-4 border-2 transition-all duration-300 flex flex-col items-start ${isActive ? 'border-purple-400 shadow-md bg-purple-50/30 transform -translate-y-1' : 'border-gray-100 shadow-sm hover:border-purple-200'} cursor-pointer`}
                  onClick={() => setHighlightIndex(index)}
                >
                  <div className={`relative z-10 w-10 h-10 md:w-12 md:h-12 rounded-xl ${card.bgColor} ${card.textColor} flex items-center justify-center text-lg md:text-xl mb-3 shadow-sm`}>
                    {card.icon}
                  </div>
                  <h3 className="relative z-10 font-bold text-gray-900 text-xs md:text-sm mb-1 leading-snug">{card.shortTitle}</h3>
                  <p className="relative z-10 text-[10px] md:text-[11px] text-gray-500 font-medium">{card.subtitle}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </section>
  );
};

export default Screen3Scholarship;
