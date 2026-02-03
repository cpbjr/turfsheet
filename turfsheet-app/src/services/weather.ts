import type { WeatherData } from '../types/weather';

export async function getCurrentWeather(): Promise<WeatherData> {
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=42.88&longitude=-88.49&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation_probability&daily=sunrise,sunset,precipitation_probability_max&timezone=America/Chicago';

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch weather');
  }

  return response.json();
}
