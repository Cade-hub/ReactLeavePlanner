// Server code (index.js or server.js)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const calendarData = JSON.parse(fs.readFileSync(path.join(__dirname, 'calendar.json'), 'utf8'));

app.get('/api/best-leave-periods', (req, res) => {
  const maxLeaveDays = req.query.maxDays ? parseInt(req.query.maxDays) : 5;
  const startDate = new Date(req.query.startDate);
  const endDate = new Date(req.query.endDate);
  const bestPeriods = calculateBestLeavePeriods(calendarData, maxLeaveDays, startDate, endDate);
  res.json(bestPeriods);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Server code (index.js or server.js)

function calculateBestLeavePeriods(calendarData, maxLeaveDays = 5, startDate, endDate) {
  const allPeriods = [];

  Object.entries(calendarData).forEach(([year, months]) => {
    Object.entries(months).forEach(([month, days]) => {
      for (let startIndex = 0; startIndex < days.length; startIndex++) {
        for (let endIndex = startIndex; endIndex < days.length; endIndex++) {
          const period = days.slice(startIndex, endIndex + 1);
          const periodStats = analyzePeriod(period);

          const periodStartDate = new Date(period[0].date);
          const periodEndDate = new Date(period[period.length - 1].date);

          // Ensure the period is within the specified start and end dates
          if (
            periodStats.leaveDaysNeeded <= maxLeaveDays &&
            periodStartDate >= startDate &&
            periodEndDate <= endDate
          ) {
            allPeriods.push({
              startDate: periodStartDate.toISOString(),
              endDate: periodEndDate.toISOString(),
              year: parseInt(year),
              month: parseInt(month),
              days: period,
              ...periodStats
            });
          }
        }
      }
    });
  });

  allPeriods.sort((a, b) => {
    if (b.totalDaysOff !== a.totalDaysOff) {
      return b.totalDaysOff - a.totalDaysOff;
    }
    return (b.totalDaysOff / b.leaveDaysNeeded) - (a.totalDaysOff / a.leaveDaysNeeded);
  });

  return allPeriods.slice(0, 10);
}

function analyzePeriod(period) {
  let totalDaysOff = 0;
  let leaveDaysNeeded = 0;

  period.forEach(day => {
    if (day.isNonWorkingDay) {
      totalDaysOff++;
    } else {
      totalDaysOff++;
      leaveDaysNeeded++;
    }
  });

  return { totalDaysOff, leaveDaysNeeded };
}
