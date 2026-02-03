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
    <div className="bg-white border border-border-color overflow-hidden font-sans shadow-sm">
      {/* Header with Weather Icon - SHARP */}
      <div className="bg-gradient-to-r from-turf-green to-turf-green-dark p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-[0.7rem] font-heading font-black uppercase tracking-[0.2em] text-white/90">
              Current Conditions
            </h3>
            <p className="text-[0.65rem] font-sans font-bold text-white/60 mt-1 uppercase tracking-widest">Banbury Golf Course</p>
          </div>
          <div className="flex items-center">
            {isRainy ? (
              <CloudRain size={32} className="text-blue-100 opacity-80" />
            ) : (
              <Sun size={32} className="text-yellow-100 opacity-80" />
            )}
          </div>
        </div>
      </div>

      {/* Temperature Section */}
      <div className="px-6 py-5 border-b border-dashboard-bg bg-white">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-heading font-black text-text-primary tracking-tighter">{temp}</span>
          <span className="text-xl font-heading font-black text-text-secondary">°F</span>
        </div>
        <p className="text-[0.75rem] font-sans font-black text-text-secondary/60 mt-2 uppercase tracking-widest">
          {isRainy ? 'Rain likely' : 'Clear & Sunny'}
        </p>
      </div>

      {/* Weather Details Grid - SHARP & WELL SPACED */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 p-6 border-b border-dashboard-bg bg-white">
        {/* Humidity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-blue-50">
            <Droplets size={16} className="text-blue-500" />
          </div>
          <div>
            <p className="text-[0.6rem] font-heading font-black text-text-muted uppercase tracking-widest">Humidity</p>
            <p className="text-xs font-sans font-black text-text-primary">{humidity}%</p>
          </div>
        </div>

        {/* Wind Speed */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-cyan-50">
            <Wind size={16} className="text-cyan-500" />
          </div>
          <div>
            <p className="text-[0.6rem] font-heading font-black text-text-muted uppercase tracking-widest">Wind</p>
            <p className="text-xs font-sans font-black text-text-primary">{windSpeed} mph</p>
          </div>
        </div>

        {/* Precipitation */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-purple-50">
            <Cloud size={16} className="text-purple-500" />
          </div>
          <div>
            <p className="text-[0.6rem] font-heading font-black text-text-muted uppercase tracking-widest">Precip</p>
            <p className="text-xs font-sans font-black text-text-primary">{precipitation}%</p>
          </div>
        </div>

        {/* Sun Times */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center bg-amber-50">
            <Sun size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[0.6rem] font-heading font-black text-text-muted uppercase tracking-widest">Sunrise</p>
            <p className="text-xs font-sans font-black text-text-primary">{sunriseTime}</p>
          </div>
        </div>
      </div>

      {/* Sunset Time */}
      <div className="px-6 py-4 bg-dashboard-bg/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.6rem] font-heading font-black text-text-muted uppercase tracking-widest">Sunset</p>
            <p className="text-xs font-sans font-black text-text-primary">{sunsetTime}</p>
          </div>
          <div className="text-right">
            <p className="text-[0.55rem] font-sans font-bold text-text-muted uppercase tracking-tighter opacity-50">Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
