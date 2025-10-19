import React from 'react';
import { getForecastFromData } from '../../utils/weatherGenerator';
import '../../styles/WeatherForecast.css';

function WeatherForecast({ gameData }) {
  if (!gameData) return null;

  const data = gameData.game_data || {};
  const currentMonth = Math.floor(data.month || 3);
  const currentDay = data.day_num || 1;
  const currentDayName = data.day_name || 'Monday';
  const weatherData = data.weather?.weather_data || [];

  // Get 4-day forecast from pre-generated data
  const forecast = getForecastFromData(weatherData, currentMonth, currentDay, 4);

  const getDayLabel = (index) => {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIndex = daysOfWeek.indexOf(currentDayName);
    const futureDayIndex = (currentDayIndex + index) % 7;
    const futureDayName = daysOfWeek[futureDayIndex];

    if (index === 0) return `Today (${futureDayName})`;
    if (index === 1) return `Tomorrow (${futureDayName})`;
    return futureDayName;
  };

  return (
    <div className="weather-forecast">
      <h3>4-Day Forecast</h3>
      <div className="forecast-grid">
        {forecast.map((day, index) => (
          <div key={index} className={`forecast-day ${day.isHeatwave ? 'heatwave' : ''}`}>
            <div className="forecast-day-label">{getDayLabel(index)}</div>
            <div className="forecast-icon">{day.weather.icon}</div>
            <div className="forecast-temp">{day.temp}°F</div>
            <div className="forecast-weather">{day.weather.name}</div>
            {day.isHeatwave && (
              <div className="forecast-alert">🌡️ Heatwave</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WeatherForecast;
