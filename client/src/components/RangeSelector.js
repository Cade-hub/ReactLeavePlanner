// src/components/RangeSelector.js
import React, { useState } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';

function RangeSelector() {
  const [dateRange, setDateRange] = useState(null);
  const [bestPeriods, setBestPeriods] = useState([]);

  const handleDateChange = (value) => {
    setDateRange(value);
  };

  const handleCalculate = async () => {
    if (!dateRange || dateRange.length !== 2) {
      alert('Please select a date range first.');
      return;
    }

    try {
      const response = await axios.get('http://localhost:5000/api/best-leave-periods-range', {
        params: {
          startDate: dateRange[0].toISOString().split('T')[0],
          endDate: dateRange[1].toISOString().split('T')[0],
        },
      });
      setBestPeriods(response.data);
    } catch (error) {
      console.error('Error fetching best leave periods:', error);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <div className="bg-secondary p-6 rounded-lg shadow-lg mb-6">
        <h2 className="text-2xl font-bold mb-4 text-white">Select Date Range</h2>
        {dateRange && dateRange.length === 2 && (
          <div className="text-white text-center mb-4 p-2 bg-gray-700 rounded-md">
            {formatDate(dateRange[0])} - {formatDate(dateRange[1])}
          </div>
        )}
        <Calendar
          onChange={handleDateChange}
          value={dateRange}
          selectRange={true}
          className="mb-4 custom-calendar"
        />
        <button
          onClick={handleCalculate}
          className="w-full px-6 py-2 bg-accent text-white rounded-md text-lg hover:bg-green-600 transition"
        >
          Calculate Best Leave Periods
        </button>
      </div>
      {bestPeriods.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-white">Best Leave Periods</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestPeriods.map((period, index) => (
              <li key={index} className="transition-all duration-300 hover:scale-105">
                <div className="w-full text-left px-4 py-3 bg-gray-700 rounded-md text-white">
                  <strong>{period.startDate} to {period.endDate}:</strong>
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

export default RangeSelector;