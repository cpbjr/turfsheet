import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, Droplets, Wind } from 'lucide-react';
import type { WeatherData } from '../types/weather';
import { getCurrentWeather } from '../services/weather';

export default function WeatherDisplay() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getCurrentWeather();
        setWeather(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch weather');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded shadow p-4 border border-border-color">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-turf-green"></div>
            <p className="text-xs text-text-secondary mt-2">Loading weather...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white rounded shadow p-4 border border-border-color">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <p className="text-xs text-red-600 font-semibold">Unable to load weather</p>
            <p className="text-xs text-text-secondary mt-1">{error || 'No data available'}</p>
          </div>
        </div>
      </div>
    );
  }

  const temp = Math.round((weather.current.temperature_2m * 9) / 5 + 32);
  const humidity = weather.current.relative_humidity_2m;
  const windSpeed = Math.round(weather.current.wind_speed_10m * 0.621371);
  const precipitation = weather.current.precipitation_probability || 0;

  const sunrise = weather.daily.sunrise[0];
  const sunset = weather.daily.sunset[0];

  const formatTime = (timeString: string): string => {
    const time = new Date(timeString);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const sunriseTime = formatTime(sunrise);
  const sunsetTime = formatTime(sunset);

  const isRainy = precipitation > 50;

  return (
    <div className="bg-white rounded shadow border border-border-color overflow-hidden">
      {/* Header with Weather Icon */}
      <div className="bg-gradient-to-r from-turf-green to-turf-green-dark p-4 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xs font-heading font-bold uppercase tracking-wide">
              Current Weather
            </h3>
            <p className="text-xs text-white text-opacity-80 mt-1">Golf Course Conditions</p>
          </div>
          <div className="flex items-center">
            {isRainy ? (
              <CloudRain size={32} className="text-blue-300" />
            ) : (
              <Sun size={32} className="text-yellow-300" />
            )}
          </div>
        </div>
      </div>

      {/* Temperature Section */}
      <div className="p-4 border-b border-border-color">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-gray-900">{temp}</span>
          <span className="text-xl text-text-secondary">°F</span>
        </div>
        <p className="text-xs text-text-secondary mt-1">
          {isRainy ? 'Rainy conditions expected' : 'Clear skies'}
        </p>
      </div>

      {/* Weather Details Grid */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-border-color">
        {/* Humidity */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded">
            <Droplets size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Humidity</p>
            <p className="text-sm font-semibold text-gray-900">{humidity}%</p>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-cyan-50 rounded">
            <Wind size={16} className="text-cyan-600" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Wind</p>
            <p className="text-sm font-semibold text-gray-900">{windSpeed} mph</p>
          </div>
        </div>

        {/* Precipitation */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 rounded">
            <Cloud size={16} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Precipitation</p>
            <p className="text-sm font-semibold text-gray-900">{precipitation}%</p>
          </div>
        </div>

        {/* Sun Times */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 rounded">
            <Sun size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Sunrise</p>
            <p className="text-sm font-semibold text-gray-900">{sunriseTime}</p>
          </div>
        </div>
      </div>

      {/* Sunset Time */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-secondary">Sunset</p>
            <p className="text-sm font-semibold text-gray-900">{sunsetTime}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-secondary text-opacity-75">Last updated</p>
            <p className="text-xs font-semibold text-turf-green">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
