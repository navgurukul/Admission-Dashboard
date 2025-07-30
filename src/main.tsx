import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

// Function to determine the correct basename
const getBasename = () => {
  const pathname = window.location.pathname;
  const hostname = window.location.hostname;
  
  console.log('getBasename() - Input pathname:', pathname);
  console.log('getBasename() - Input hostname:', hostname);
  
  // For GitHub Pages
  if (hostname.includes('github.io')) {
    // Check for dev branch first
    if (pathname.startsWith('/Admission-Dashboard/dev')) {
      console.log('getBasename() - Detected dev branch, returning:', "/Admission-Dashboard/dev");
      return "/Admission-Dashboard/dev";
    }
    // Check for master branch
    if (pathname.startsWith('/Admission-Dashboard')) {
      console.log('getBasename() - Detected master branch, returning:', "/Admission-Dashboard");
      return "/Admission-Dashboard";
    }
  }
  
  // For local development or other deployments
  console.log('getBasename() - Local development, returning:', "");
  return "";
};

// Debug logging to help troubleshoot
console.log('=== MAIN.TSX DEBUG INFO ===');
console.log('Current pathname:', window.location.pathname);
console.log('Current hostname:', window.location.hostname);
console.log('Current search:', window.location.search);
console.log('Current hash:', window.location.hash);
console.log('Calculated basename:', getBasename());
console.log('=== END DEBUG INFO ===');

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={getBasename()}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
