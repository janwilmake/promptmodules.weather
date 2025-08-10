interface WeatherData {
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    weatherCode: number;
    time: string;
  };
  hourly: {
    time: string[];
    temperature: number[];
    humidity: number[];
    windSpeed: number[];
    precipitation: number[];
    weatherCode: number[];
  };
  daily: {
    time: string[];
    temperatureMax: number[];
    temperatureMin: number[];
    precipitation: number[];
    windSpeedMax: number[];
    weatherCode: number[];
    sunrise: string[];
    sunset: string[];
  };
}

function getWeatherDescription(code: number): string {
  const weatherCodes: { [key: number]: string } = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return weatherCodes[code] || "Unknown";
}

function getWeatherEmoji(code: number): string {
  const weatherEmojis: { [key: number]: string } = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    53: "🌦️",
    55: "🌦️",
    56: "🌧️",
    57: "🌧️",
    61: "🌧️",
    63: "🌧️",
    65: "⛈️",
    66: "🌧️",
    67: "⛈️",
    71: "❄️",
    73: "❄️",
    75: "❄️",
    77: "❄️",
    80: "🌦️",
    81: "🌧️",
    82: "⛈️",
    85: "❄️",
    86: "❄️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️",
  };
  return weatherEmojis[code] || "🌡️";
}

async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        location
      )}&count=1&language=en&format=json`
    );
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.latitude,
        lng: result.longitude,
        name: `${result.name}${result.admin1 ? `, ${result.admin1}` : ""}${
          result.country ? `, ${result.country}` : ""
        }`,
      };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

export async function getWeatherData(
  location: string
): Promise<{ data: WeatherData; locationName: string } | null> {
  try {
    // First geocode the location
    const coords = await geocodeLocation(location);
    if (!coords) {
      throw new Error(`Could not find location: ${location}`);
    }

    // Get weather data from Open-Meteo API
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code,sunrise,sunset&timezone=auto&forecast_days=7`;

    const response = await fetch(weatherUrl);
    const rawData = await response.json();

    if (!response.ok) {
      throw new Error(
        `Weather API error: ${rawData.reason || "Unknown error"}`
      );
    }

    const weatherData: WeatherData = {
      current: {
        temperature: rawData.current.temperature_2m,
        humidity: rawData.current.relative_humidity_2m,
        windSpeed: rawData.current.wind_speed_10m,
        windDirection: rawData.current.wind_direction_10m,
        weatherCode: rawData.current.weather_code,
        time: rawData.current.time,
      },
      hourly: {
        time: rawData.hourly.time,
        temperature: rawData.hourly.temperature_2m,
        humidity: rawData.hourly.relative_humidity_2m,
        windSpeed: rawData.hourly.wind_speed_10m,
        precipitation: rawData.hourly.precipitation,
        weatherCode: rawData.hourly.weather_code,
      },
      daily: {
        time: rawData.daily.time,
        temperatureMax: rawData.daily.temperature_2m_max,
        temperatureMin: rawData.daily.temperature_2m_min,
        precipitation: rawData.daily.precipitation_sum,
        windSpeedMax: rawData.daily.wind_speed_10m_max,
        weatherCode: rawData.daily.weather_code,
        sunrise: rawData.daily.sunrise,
        sunset: rawData.daily.sunset,
      },
    };

    return { data: weatherData, locationName: coords.name };
  } catch (error) {
    console.error("Weather API error:", error);
    return null;
  }
}

export function formatWeatherResponse(
  weatherData: WeatherData,
  locationName: string
): string {
  const now = new Date();
  const currentHour = now.getHours();

  // Get next 24 hours starting from current hour
  const next24Hours = weatherData.hourly.time
    .map((time, index) => ({
      time: new Date(time),
      temperature: weatherData.hourly.temperature[index],
      humidity: weatherData.hourly.humidity[index],
      windSpeed: weatherData.hourly.windSpeed[index],
      precipitation: weatherData.hourly.precipitation[index],
      weatherCode: weatherData.hourly.weatherCode[index],
    }))
    .filter((item) => item.time >= now)
    .slice(0, 24);

  const response = `# Weather Forecast for ${locationName}

## Current Weather
**${getWeatherEmoji(weatherData.current.weatherCode)} ${getWeatherDescription(
    weatherData.current.weatherCode
  )}**
- **Temperature:** ${weatherData.current.temperature.toFixed(1)}°C
- **Humidity:** ${weatherData.current.humidity}%
- **Wind:** ${weatherData.current.windSpeed.toFixed(1)} km/h
- **Last updated:** ${new Date(weatherData.current.time).toLocaleString()}

## Next 24 Hours

| Time | Temp | Weather | Humidity | Wind | Rain |
|------|------|---------|----------|------|------|
${next24Hours
  .map(
    (item) =>
      `| ${item.time
        .getHours()
        .toString()
        .padStart(2, "0")}:00 | ${item.temperature.toFixed(
        1
      )}°C | ${getWeatherEmoji(item.weatherCode)} ${getWeatherDescription(
        item.weatherCode
      )} | ${item.humidity}% | ${item.windSpeed.toFixed(
        1
      )} km/h | ${item.precipitation.toFixed(1)}mm |`
  )
  .join("\n")}

## 7-Day Forecast

| Date | Weather | High/Low | Precipitation | Wind | Sunrise | Sunset |
|------|---------|----------|---------------|------|---------|--------|
${weatherData.daily.time
  .map((date, index) => {
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const sunrise = new Date(
      weatherData.daily.sunrise[index]
    ).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const sunset = new Date(weatherData.daily.sunset[index]).toLocaleTimeString(
      "en-US",
      { hour: "2-digit", minute: "2-digit" }
    );

    return `| ${dayName} | ${getWeatherEmoji(
      weatherData.daily.weatherCode[index]
    )} ${getWeatherDescription(
      weatherData.daily.weatherCode[index]
    )} | ${weatherData.daily.temperatureMax[index].toFixed(
      1
    )}°C / ${weatherData.daily.temperatureMin[index].toFixed(
      1
    )}°C | ${weatherData.daily.precipitation[index].toFixed(
      1
    )}mm | ${weatherData.daily.windSpeedMax[index].toFixed(
      1
    )} km/h | ${sunrise} | ${sunset} |`;
  })
  .join("\n")}

*Data provided by Open-Meteo API*`;

  return response;
}
