import React, { useEffect } from 'react';
import { useStudent } from '@/pages/students/StudentContext';

const WhatsAppRedirect: React.FC = () => {
  const { student } = useStudent();

  useEffect(() => {
    // Auto-redirect to WhatsApp after 3 seconds
    const timer = setTimeout(() => {
      handleWhatsAppRedirect();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleWhatsAppRedirect = () => {
    const message = `Hello! I am ${student?.name}. I have successfully completed the test and booked my interview slot. My phone number is ${student?.phone} and email is ${student?.email}.`;
    const whatsappURL = `https://wa.me/YOUR_WHATSAPP_NUMBER?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappURL, '_blank');
  };

  return (
    <div className="whatsapp-redirect">
      <div className="success-message">
        <h2>🎉 Slot Booked Successfully!</h2>
        <p>Thank you {student?.name}! Your interview slot has been confirmed.</p>
        <p>You will be redirected to WhatsApp to connect with our team.</p>
        
        <div className="redirect-info">
          <p>Redirecting in 3 seconds...</p>
          <button 
            className="whatsapp-btn primary-btn"
            onClick={handleWhatsAppRedirect}
          >
            Connect on WhatsApp Now
          </button>
        </div>

        <div className="contact-details">
          <h3>Your Details:</h3>
          <p><strong>Name:</strong> {student?.name}</p>
          <p><strong>Email:</strong> {student?.email}</p>
          <p><strong>Phone:</strong> {student?.phone}</p>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppRedirect;