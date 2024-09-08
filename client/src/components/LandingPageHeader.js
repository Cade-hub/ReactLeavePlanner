// src/components/LandingPageHeader.js
import React from 'react';
import './LandingPageHeader.css';

function LandingPageHeader() {
  return (
    <div className="landing-page-header text-center mb-12">
      <h1 className="landing-title text-6xl font-extrabold text-white mb-4">South African Leave Planner</h1>
      <p className="landing-subtitle text-xl text-gray-300">
        Make the most out of your leave.
      </p>
    </div>
  );
}

export default LandingPageHeader;
