// src/components/MaxLeaveDays.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from 'react-calendar';

function MaxLeaveDays() {
  const [maxLeaveDays, setMaxLeaveDays] = useState(5);
  const [bestPeriods, setBestPeriods] = useState([]);
  const [expandedPeriod, setExpandedPeriod] = useState(null);

  useEffect(() => {
    fetchBestPeriods();
  }, [maxLeaveDays]);

  const fetchBestPeriods = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/best-leave-periods?maxDays=${maxLeaveDays}`);
      setBestPeriods(response.data);
    } catch (error) {
      console.error('Error fetching best leave periods:', error);
    }
  };

  const handleRecalculate = () => {
    fetchBestPeriods();
  };

  const handlePeriodClick = (period) => {
    setExpandedPeriod(period);
  };

  const renderHighlightedCalendar = (period) => {
    // ... (keep your existing renderHighlightedCalendar function)
  };

  return (
    <div>
      <div className="bg-secondary p-6 rounded-lg shadow-lg mb-6">
        <label htmlFor="maxLeaveDays" className="block text-lg font-medium text-white mb-2">Max Leave Days</label>
        <div className="flex items-center space-x-4">
          <input
            type="number"
            id="maxLeaveDays"
            value={maxLeaveDays}
            onChange={(e) => setMaxLeaveDays(Number(e.target.value))}
            className="flex-grow mt-1 rounded-md border-gray-600 bg-primary text-white shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50 text-lg"
          />
          <button
            onClick={handleRecalculate}
            className="px-6 py-2 bg-accent text-white rounded-md text-lg hover:bg-green-600 transition"
          >
            Recalculate
          </button>
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-4 text-white">Best Leave Periods</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestPeriods.map((period, index) => (
            <li key={index} className="transition-all duration-300 hover:scale-105">
              <button
                onClick={() => handlePeriodClick(period)}
                className="w-full text-left px-4 py-3 bg-gray-700 rounded-md hover:bg-gray-800 transition text-white"
              >
                <strong>{period.startDate} to {period.endDate}:</strong>
                <br />
                {period.totalDaysOff} days off using {period.leaveDaysNeeded} leave days
              </button>
              {expandedPeriod && expandedPeriod.startDate === period.startDate && expandedPeriod.endDate === period.endDate && (
                <div className="mt-4">
                  {renderHighlightedCalendar(period)}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MaxLeaveDays;