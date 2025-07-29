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
    // Check for dev branch first
    if (pathname.startsWith('/Admission-Dashboard/dev')) {
      return "/Admission-Dashboard/dev";
    }
    // Check for master branch
    if (pathname.startsWith('/Admission-Dashboard')) {
      return "/Admission-Dashboard";
    }
  }
  
  // For local development or other deployments
  return "";
};

// Debug logging to help troubleshoot
console.log('Current pathname:', window.location.pathname);
console.log('Calculated basename:', getBasename());
console.log('Current hostname:', window.location.hostname);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={getBasename()}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
