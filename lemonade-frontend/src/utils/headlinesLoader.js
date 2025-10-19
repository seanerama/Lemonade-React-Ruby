// Headlines Loader
// Loads and parses headlines from the eventHeadlines.txt file

import headlinesFile from '../constants/eventHeadlines.txt?raw';

// Parse the headlines file into categories
const parseHeadlines = () => {
  const lines = headlinesFile.split('\n');
  const headlines = {
    heatwave: [],
    convention: [],
    stadium: [],
    downtown: []
  };

  let currentCategory = null;

  lines.forEach(line => {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) return;

    // Check for category headers
    if (trimmed.startsWith('# Heatwave')) {
      currentCategory = 'heatwave';
    } else if (trimmed.startsWith('# Convention')) {
      currentCategory = 'convention';
    } else if (trimmed.startsWith('# Stadium')) {
      currentCategory = 'stadium';
    } else if (trimmed.startsWith('# Downtown')) {
      currentCategory = 'downtown';
    } else if (!trimmed.startsWith('#') && currentCategory) {
      // Add headline to current category
      headlines[currentCategory].push(trimmed);
    }
  });

  return headlines;
};

// Cached headlines
let cachedHeadlines = null;

/**
 * Get all headlines organized by category
 */
export const getHeadlines = () => {
  if (!cachedHeadlines) {
    cachedHeadlines = parseHeadlines();
  }
  return cachedHeadlines;
};

/**
 * Get a random headline for a specific event type
 */
export const getRandomHeadline = (eventType) => {
  const headlines = getHeadlines();
  const category = headlines[eventType] || [];

  if (category.length === 0) return `${eventType} event happening!`;

  return category[Math.floor(Math.random() * category.length)];
};

/**
 * Get headlines for upcoming events
 */
export const getHeadlinesForEvents = (events) => {
  const headlines = [];

  events.forEach(event => {
    const headline = getRandomHeadline(event.type);
    headlines.push({
      ...event,
      headline,
      fullText: headline
    });
  });

  return headlines;
};

/**
 * Get headline for active heatwave
 */
export const getHeatwaveHeadline = (heatwave) => {
  return getRandomHeadline('heatwave');
};
