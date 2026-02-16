import { useState, useEffect } from 'react';
import { getCurrentWeather } from '../services/weather';
import type { WeatherData } from '../types/weather';

export function CompactWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    getCurrentWeather().then(setWeather).catch(console.error);
  }, []);

  if (!weather) return null;

  const temp = Math.round(weather.current.temperature_2m * 9/5 + 32); // Celsius to F
  const humidity = weather.current.relative_humidity_2m;
  const windSpeed = Math.round(weather.current.wind_speed_10m);
  const precipProb = weather.current.precipitation_probability ||
                     weather.daily.precipitation_probability_max?.[0] || 0;
  const isRain = precipProb > 50;

  // Format sunrise/sunset times
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const sunrise = weather.daily.sunrise?.[0] ? formatTime(weather.daily.sunrise[0]) : 'N/A';
  const sunset = weather.daily.sunset?.[0] ? formatTime(weather.daily.sunset[0]) : 'N/A';

  return (
    <div className="flex items-center gap-4 text-xs font-sans">
      {/* Temperature & Icon */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{isRain ? '🌧️' : '☀️'}</span>
        <span className="font-heading font-bold text-sm text-text-primary">{temp}°F</span>
      </div>

      {/* Precipitation */}
      <div className="flex items-center gap-1 text-text-secondary">
        <i className="fa-solid fa-droplet text-[10px]"></i>
        <span>{precipProb}%</span>
      </div>

      {/* Humidity */}
      <div className="flex items-center gap-1 text-text-secondary">
        <i className="fa-solid fa-water text-[10px]"></i>
        <span>{humidity}%</span>
      </div>

      {/* Wind */}
      <div className="flex items-center gap-1 text-text-secondary">
        <i className="fa-solid fa-wind text-[10px]"></i>
        <span>{windSpeed} mph</span>
      </div>

      {/* Sunrise */}
      <div className="flex items-center gap-1 text-text-secondary">
        <i className="fa-solid fa-sun text-[10px]"></i>
        <span>{sunrise}</span>
      </div>

      {/* Sunset */}
      <div className="flex items-center gap-1 text-text-secondary">
        <i className="fa-solid fa-moon text-[10px]"></i>
        <span>{sunset}</span>
      </div>
    </div>
  );
}
