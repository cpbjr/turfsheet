interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
    precipitation_probability?: number;
  };
  daily: {
    sunrise: string[];
    sunset: string[];
    precipitation_probability_max?: number[];
  };
}

export type { WeatherData };
