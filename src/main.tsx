import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Function to determine the correct basename
const getBasename = () => {
  const pathname = window.location.pathname;
  if (pathname.includes('/dev/')) {
    return "/Admission-Dashboard/dev";
  }
  return "/Admission-Dashboard";
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={getBasename()}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
