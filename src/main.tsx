import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Function to determine the correct basename
const getBasename = () => {
  const pathname = window.location.pathname;
  const hostname = window.location.hostname;
  
  // For GitHub Pages
  if (hostname.includes('github.io')) {
    if (pathname.includes('/dev/')) {
      return "/Admission-Dashboard/dev";
    }
    return "/Admission-Dashboard";
  }
  
  // For local development or other deployments
  return "";
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={getBasename()}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
