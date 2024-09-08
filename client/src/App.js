// surely src/App.js
import React from 'react';
import LeaveCalculator from './components/LeaveCalculator';
import './App.css';
import LandingPageHeader from './components/LandingPageHeader';

function App() {
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <main className="flex-grow p-6">
        <div className="max-w-4xl mx-auto">
          <LandingPageHeader />
          <LeaveCalculator />
        </div>
      </main>
    </div>
  );
}

export default App;
