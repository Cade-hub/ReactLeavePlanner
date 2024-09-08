// src/components/LeaveCalculator.js

import React, { useState } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import { RefreshCw } from 'react-feather';
import 'react-calendar/dist/Calendar.css';
import '../App.css';

function LeaveCalculator() {
  const [dateRange, setDateRange] = useState(null);
  const [maxLeaveDays, setMaxLeaveDays] = useState(5);
  const [bestPeriods, setBestPeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleDateChange = (value) => {
    setDateRange(value);
  };

  const handleMaxLeaveDaysChange = (e) => {
    setMaxLeaveDays(Number(e.target.value));
  };

  const handleCalculate = async () => {
    if (!dateRange || dateRange.length !== 2) {
      alert('Please select a date range first.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/best-leave-periods', {
        params: {
          startDate: dateRange[0].toISOString().split('T')[0],
          endDate: dateRange[1].toISOString().split('T')[0],
          maxDays: maxLeaveDays, // Ensure correct parameter name
        },
      });
      setBestPeriods(response.data);
    } catch (error) {
      console.error('Error fetching best leave periods:', error);
      alert('An error occurred while calculating leave periods. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setDateRange(null);
    setBestPeriods([]);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-secondary p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Leave Calculator</h2>
        <div className="flex items-center space-x-4">
          <div className="text-white flex items-center">
            <label htmlFor="maxLeaveDays" className="mr-2">Max Leave Days:</label>
            <input
              type="number"
              id="maxLeaveDays"
              value={maxLeaveDays}
              onChange={handleMaxLeaveDaysChange}
              className="bg-gray-700 rounded-md p-2 w-16 text-center"
            />
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition"
            title="Refresh"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      {dateRange && dateRange.length === 2 && (
        <div className="text-white text-center mb-4 p-2 bg-gray-700 rounded-md">
          {formatDate(dateRange[0])} - {formatDate(dateRange[1])}
        </div>
      )}

      <Calendar
        onChange={handleDateChange}
        value={dateRange}
        selectRange={true}
        className="mb-6 custom-calendar w-full max-w-3xl mx-auto"
      />

      <button
        onClick={handleCalculate}
        className="w-full px-6 py-3 bg-accent text-white rounded-md text-lg hover:bg-green-600 transition"
        disabled={isLoading}
      >
        {isLoading ? 'Calculating...' : 'Calculate Best Leave Periods'}
      </button>

      {bestPeriods.length > 0 && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4 text-white">Best Leave Periods</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestPeriods.map((period, index) => (
              <li key={index} className="transition-all duration-300 hover:scale-105 hover:bg-gray-800 p-4 rounded-md bg-gray-700 text-white period-item">
                <div className="w-full text-left">
                  <strong>{formatDate(period.startDate)} to {formatDate(period.endDate)}:</strong>
                  <br />
                  {period.totalDaysOff} days off using {period.leaveDaysNeeded} leave days
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default LeaveCalculator;
