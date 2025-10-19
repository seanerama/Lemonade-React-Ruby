import React, { useState, useEffect } from 'react';
import { getUpcomingEvents, formatEventNews } from '../../utils/eventGenerator';
import { getRandomHeadline } from '../../utils/headlinesLoader';
import { isHeatwaveDay } from '../../utils/weatherGenerator';
import '../../styles/NewsFeed.css';

function NewsFeed({ gameData }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [headlines, setHeadlines] = useState([]);

  useEffect(() => {
    if (!gameData) return;

    const data = gameData.game_data || {};
    const events = data.events || {};
    const currentMonth = Math.floor(data.month || 3);
    const currentDay = data.day_num || 1;

    // Get upcoming events
    const upcoming = getUpcomingEvents(events, currentMonth, currentDay);

    // Generate headlines for upcoming events
    const newHeadlines = [];

    // Check if we're currently in a heatwave
    const inHeatwave = isHeatwaveDay(events.heatwave_events, currentMonth, currentDay);
    if (inHeatwave) {
      const heatwave = events.heatwave_events?.find(
        hw => hw.month === currentMonth && currentDay >= hw.start_day && currentDay <= hw.end_day
      );
      if (heatwave) {
        newHeadlines.push({
          type: 'heatwave',
          text: getRandomHeadline('heatwave'),
          daysUntil: 0,
          urgent: true
        });
      }
    }

    // Add headlines for upcoming events (next 7 days)
    upcoming.forEach(event => {
      const headline = getRandomHeadline(event.type);
      const daysText = event.daysUntil === 0 ? 'TODAY' :
                      event.daysUntil === 1 ? 'TOMORROW' :
                      `IN ${event.daysUntil} DAYS`;

      newHeadlines.push({
        type: event.type,
        text: headline,
        daysUntil: event.daysUntil,
        daysText,
        location: event.type === 'convention' ? 'Convention Center' :
                 event.type === 'stadium' ? 'Stadium' :
                 event.type === 'downtown' ? 'Downtown Park' : '',
        urgent: event.daysUntil <= 1
      });
    });

    // Add some general news if we don't have enough headlines
    if (newHeadlines.length === 0) {
      newHeadlines.push({
        type: 'general',
        text: 'Perfect weather for lemonade sales!',
        daysUntil: null
      });
    }

    setHeadlines(newHeadlines);
    setCurrentIndex(0);
  }, [gameData]);

  // Auto-scroll headlines every 5 seconds
  useEffect(() => {
    if (headlines.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % headlines.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [headlines.length]);

  if (headlines.length === 0) {
    return (
      <div className="news-feed">
        <div className="news-label">📰 NEWS</div>
        <div className="news-ticker">
          <div className="news-item">Welcome to your lemonade stand!</div>
        </div>
      </div>
    );
  }

  const currentHeadline = headlines[currentIndex];

  return (
    <div className="news-feed">
      <div className="news-label">📰 NEWS</div>
      <div className="news-ticker">
        <div className={`news-item ${currentHeadline.urgent ? 'urgent' : ''}`}>
          {currentHeadline.daysText && (
            <span className="news-timing">[{currentHeadline.daysText}]</span>
          )}
          {currentHeadline.text}
        </div>
      </div>
      {headlines.length > 1 && (
        <div className="news-indicators">
          {headlines.map((_, index) => (
            <span
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NewsFeed;
