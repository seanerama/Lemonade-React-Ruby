// Event Generator for Special Location Events
// Generates convention center events, stadium games, and heatwaves at the start of the game

import { generateHeatwaves } from './weatherGenerator';

// Helper to get day of week (0 = Sunday, 6 = Saturday)
const getDayOfWeek = (year, month, day) => {
  return new Date(year, month - 1, day).getDay();
};

// Helper to check if date is valid
const isValidDate = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day;
};

// Generate Convention Center events
// 1 event per month (3 consecutive days) in April, May, June, July
export const generateConventionEvents = (year = 2024) => {
  const events = [];
  const months = [4, 5, 6, 7]; // April through July

  months.forEach(month => {
    // Pick a random start day (between 5th and 22nd to ensure 3 days fit)
    const startDay = Math.floor(Math.random() * 18) + 5;

    // Add 3 consecutive days
    for (let i = 0; i < 3; i++) {
      const day = startDay + i;
      if (isValidDate(year, month, day)) {
        events.push({
          month,
          day,
          dayOfWeek: getDayOfWeek(year, month, day),
          type: 'convention',
          name: getConventionName(month),
          description: `${getConventionName(month)} at Convention Center`
        });
      }
    }
  });

  return events;
};

// Generate Stadium events
// 2-day events (Fri-Sat, Sat-Sun, or Sun-Mon)
// 4 events per month from May through October
export const generateStadiumEvents = (year = 2024) => {
  const events = [];
  const months = [5, 6, 7, 8, 9, 10]; // May through October

  // Weekend patterns: [startDay, days]
  // 0 = Sunday, 5 = Friday, 6 = Saturday
  const weekendPatterns = [
    { start: 5, label: 'Friday-Saturday' },  // Fri-Sat
    { start: 6, label: 'Saturday-Sunday' },  // Sat-Sun
    { start: 0, label: 'Sunday-Monday' }     // Sun-Mon
  ];

  months.forEach(month => {
    const eventsThisMonth = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    // Generate 4 events per month
    let attempts = 0;
    while (eventsThisMonth.length < 4 && attempts < 100) {
      attempts++;

      // Pick random pattern
      const pattern = weekendPatterns[Math.floor(Math.random() * weekendPatterns.length)];

      // Find a day that matches this pattern
      const startDay = Math.floor(Math.random() * (daysInMonth - 2)) + 1;
      const dayOfWeek = getDayOfWeek(year, month, startDay);

      // Check if this day matches our desired pattern
      if (dayOfWeek === pattern.start) {
        // Check for conflicts with existing events
        const hasConflict = eventsThisMonth.some(e =>
          Math.abs(e.day - startDay) < 3 // At least 3 days apart
        );

        if (!hasConflict) {
          // Add 2 consecutive days
          for (let i = 0; i < 2; i++) {
            const day = startDay + i;
            if (isValidDate(year, month, day)) {
              eventsThisMonth.push({
                month,
                day,
                dayOfWeek: getDayOfWeek(year, month, day),
                type: 'stadium',
                name: getStadiumEventName(month, eventsThisMonth.length),
                description: `${getStadiumEventName(month, eventsThisMonth.length / 2)} at Stadium`,
                pattern: pattern.label
              });
            }
          }
        }
      }
    }

    events.push(...eventsThisMonth);
  });

  return events;
};

// Generate Downtown Park events
// 1 event per week (every 7 days) from March through October
export const generateDowntownEvents = (year = 2024) => {
  const events = [];
  const months = [3, 4, 5, 6, 7, 8, 9, 10]; // March through October

  months.forEach(month => {
    const daysInMonth = new Date(year, month, 0).getDate();

    // Start on a random day in the first week (1-7)
    let currentDay = Math.floor(Math.random() * 7) + 1;

    // Add events every 7 days
    while (currentDay <= daysInMonth) {
      if (isValidDate(year, month, currentDay)) {
        events.push({
          month,
          day: currentDay,
          dayOfWeek: getDayOfWeek(year, month, currentDay),
          type: 'downtown',
          name: getDowntownEventName(),
          description: `${getDowntownEventName()} at Downtown Park`
        });
      }
      currentDay += 7; // Next week
    }
  });

  return events;
};

// Generate all events for a new game
export const generateAllEvents = (year = 2024) => {
  const conventionEvents = generateConventionEvents(year);
  const stadiumEvents = generateStadiumEvents(year);
  const downtownEvents = generateDowntownEvents(year);
  const heatwaveEvents = generateHeatwaves(year);

  return {
    convention_events: conventionEvents,
    stadium_events: stadiumEvents,
    downtown_events: downtownEvents,
    heatwave_events: heatwaveEvents,
    year
  };
};

// Check if a specific date has an event
export const getEventForDate = (events, month, day) => {
  if (!events) return null;

  // Check convention events
  const conventionEvent = events.convention_events?.find(
    e => e.month === month && e.day === day
  );
  if (conventionEvent) return conventionEvent;

  // Check stadium events
  const stadiumEvent = events.stadium_events?.find(
    e => e.month === month && e.day === day
  );
  if (stadiumEvent) return stadiumEvent;

  // Check downtown events
  const downtownEvent = events.downtown_events?.find(
    e => e.month === month && e.day === day
  );
  if (downtownEvent) return downtownEvent;

  // Check heatwave events
  const heatwaveEvent = events.heatwave_events?.find(
    e => e.month === month && day >= e.start_day && day <= e.end_day
  );
  if (heatwaveEvent) return heatwaveEvent;

  return null;
};

// Get all upcoming events (next 7 days)
export const getUpcomingEvents = (events, currentMonth, currentDay) => {
  if (!events) return [];

  const upcoming = [];
  const allEvents = [
    ...(events.convention_events || []),
    ...(events.stadium_events || []),
    ...(events.downtown_events || [])
  ];

  // Add heatwave events (check if they start within 7 days)
  (events.heatwave_events || []).forEach(hw => {
    if (hw.month === currentMonth) {
      const daysUntil = hw.start_day - currentDay;
      if (daysUntil >= 0 && daysUntil <= 7) {
        allEvents.push({
          month: hw.month,
          day: hw.start_day,
          type: 'heatwave',
          name: hw.name,
          description: `${hw.name} (${hw.duration} days)`,
          duration: hw.duration
        });
      }
    }
  });

  // Simple check for events in the next 7 days
  allEvents.forEach(event => {
    if (event.month === currentMonth) {
      const daysUntil = event.day - currentDay;
      if (daysUntil >= 0 && daysUntil <= 7) {
        upcoming.push({
          ...event,
          daysUntil
        });
      }
    }
    // Check next month if we're near the end
    if (event.month === currentMonth + 1 && currentDay > 23) {
      const daysInCurrentMonth = new Date(events.year || 2024, currentMonth, 0).getDate();
      const daysUntil = (daysInCurrentMonth - currentDay) + event.day;
      if (daysUntil <= 7) {
        upcoming.push({
          ...event,
          daysUntil
        });
      }
    }
  });

  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
};

// Convention names for immersion
const getConventionName = (month) => {
  const conventions = {
    4: 'Spring Tech Expo',
    5: 'Regional Business Summit',
    6: 'Summer Innovation Conference',
    7: 'Annual Trade Show'
  };
  return conventions[month] || 'Convention';
};

// Stadium event names
const getStadiumEventName = (month, eventIndex) => {
  const events = {
    5: ['Opening Day', 'Memorial Day Tournament', 'Spring Classic', 'Rivalry Weekend'],
    6: ['Summer Series', 'Championship Qualifier', 'All-Star Weekend', 'Pride Festival'],
    7: ['Independence Day Game', 'Mid-Season Showdown', 'Summer Bash', 'League Finals'],
    8: ['Playoff Opener', 'Championship Series', 'Summer Finale', 'Tournament Finals'],
    9: ['Fall Classic', 'Homecoming Game', 'Rivalry Match', 'Season Closer'],
    10: ['Championship Game', 'World Series', 'Grand Final', 'Trophy Match']
  };

  const monthEvents = events[month] || ['Game Day'];
  return monthEvents[Math.floor(eventIndex / 2) % monthEvents.length];
};

// Downtown park event names
const getDowntownEventName = () => {
  const events = [
    'Food Truck Festival',
    'Outdoor Concert Series',
    'Art in the Park',
    'Community Yoga Day',
    'Local Craft Fair',
    'Live Music Fest',
    'Street Food Market',
    'Outdoor Movie Night',
    'Fitness Bootcamp',
    'Cultural Festival'
  ];
  return events[Math.floor(Math.random() * events.length)];
};

// Format event for news ticker
export const formatEventNews = (event) => {
  if (event.type === 'convention') {
    return `🏢 ${event.name} at Convention Center - ${getMonthName(event.month)} ${event.day}`;
  } else if (event.type === 'stadium') {
    return `🏟️ ${event.name} at Stadium - ${getMonthName(event.month)} ${event.day}`;
  } else if (event.type === 'downtown') {
    return `🌳 ${event.name} at Downtown Park - ${getMonthName(event.month)} ${event.day}`;
  } else if (event.type === 'heatwave') {
    return `🌡️ ${event.name} - ${getMonthName(event.month)} ${event.day || event.start_day}`;
  }
  return '';
};

const getMonthName = (month) => {
  const months = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month] || '';
};
