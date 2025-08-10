import { KNOWN_LOCATIONS } from "./locations";
import { getWeatherData, formatWeatherResponse } from "./weather-api";

interface Env {
  // Define any environment variables here if needed
}

// Common weather-related keywords and patterns
const WEATHER_KEYWORDS = [
  "weather",
  "forecast",
  "temperature",
  "temp",
  "rain",
  "snow",
  "sunny",
  "cloudy",
  "humidity",
  "wind",
  "storm",
  "thunderstorm",
  "precipitation",
  "climate",
  "conditions",
  "degrees",
  "celsius",
  "fahrenheit",
  "kelvin",
  "hot",
  "cold",
  "warm",
  "cool",
  "chilly",
  "freezing",
  "boiling",
  "mild",
  "harsh",
  "severe",
  "extreme",
  "drizzle",
  "shower",
  "downpour",
  "mist",
  "fog",
  "haze",
  "smog",
  "clear",
  "overcast",
  "partly cloudy",
  "mostly cloudy",
  "scattered clouds",
  "broken clouds",
  "cumulus",
  "stratus",
  "cirrus",
  "nimbus",
  "cumulonimbus",
  "blizzard",
  "sleet",
  "hail",
  "frost",
  "ice",
  "icy",
  "frozen",
  "slush",
  "flurries",
  "snowfall",
  "rainfall",
  "windchill",
  "heat index",
  "feels like",
  "real feel",
  "apparent temperature",
  "dew point",
  "barometric pressure",
  "atmospheric pressure",
  "visibility",
  "uv index",
  "ultraviolet",
  "sunrise",
  "sunset",
  "moonrise",
  "moonset",
  "high tide",
  "low tide",
  "tidal",
  "gust",
  "gusty",
  "breeze",
  "breezy",
  "windy",
  "calm",
  "still",
  "hurricane",
  "typhoon",
  "cyclone",
  "tornado",
  "twister",
  "waterspout",
  "dust storm",
  "sandstorm",
  "lightning",
  "thunder",
  "heatwave",
  "cold snap",
  "cold front",
  "warm front",
  "occluded front",
  "ridge",
  "trough",
  "high pressure",
  "low pressure",
  "anticyclone",
  "depression",
  "isobar",
  "isotherm",
  "meteorology",
  "meteorological",
  "weather station",
  "weather report",
  "weather update",
  "weather alert",
  "weather warning",
  "weather watch",
  "severe weather",
  "inclement weather",
  "fair weather",
  "foul weather",
  "pleasant weather",
  "nasty weather",
  "beautiful weather",
  "terrible weather",
  "awful weather",
  "gorgeous weather",
  "perfect weather",
  "ideal weather",
  "seasonal",
  "monsoon",
  "dry season",
  "wet season",
  "rainy season",
  "winter",
  "spring",
  "summer",
  "autumn",
  "fall",
  "equinox",
  "solstice",
];

const WEATHER_QUESTION_PATTERNS = [
  /will it rain/i,
  /chance of rain/i,
  /is it going to/i,
  /what's the weather/i,
  /how's the weather/i,
  /weather like/i,
  /going to be/i,
  /expect.*weather/i,
  /weather.*expect/i,
  /temperature.*be/i,
  /hot.*cold/i,
  /sunny.*cloudy/i,
  /rain.*snow/i,
  /storm.*coming/i,
  /weather.*today/i,
  /weather.*tomorrow/i,
  /forecast/i,
  /umbrella/i,
  /jacket.*need/i,
  /dress.*weather/i,
  /what.*wear/i,
  /outside.*like/i,
];

const TIME_INDICATORS = [
  "today",
  "tomorrow",
  "tonight",
  "this morning",
  "this afternoon",
  "this evening",
  "tonight",
  "this week",
  "next week",
  "weekend",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "7 day",
  "week",
  "daily",
  "hourly",
  "now",
  "current",
  "currently",
  "right now",
  "at the moment",
  "later",
  "soon",
  "shortly",
  "in a bit",
  "in an hour",
  "this hour",
  "next hour",
  "morning",
  "afternoon",
  "evening",
  "night",
  "dawn",
  "dusk",
  "midnight",
  "noon",
];

function isWeatherQuery(query: string): boolean {
  const lowerQuery = query.toLowerCase();

  // Check for weather keywords
  const hasWeatherKeyword = WEATHER_KEYWORDS.some((keyword) =>
    lowerQuery.includes(keyword)
  );

  // Check for weather question patterns
  const hasWeatherPattern = WEATHER_QUESTION_PATTERNS.some((pattern) =>
    pattern.test(query)
  );

  return hasWeatherKeyword || hasWeatherPattern;
}

function extractLocationFromQuery(query: string): string | null | false {
  const lowerQuery = query.toLowerCase();

  // Remove common weather-related words to isolate location
  let cleanedQuery = lowerQuery;
  WEATHER_KEYWORDS.forEach((keyword) => {
    cleanedQuery = cleanedQuery.replace(
      new RegExp(`\\b${keyword}\\b`, "gi"),
      ""
    );
  });

  TIME_INDICATORS.forEach((indicator) => {
    cleanedQuery = cleanedQuery.replace(
      new RegExp(`\\b${indicator}\\b`, "gi"),
      ""
    );
  });

  // Remove common prepositions and articles
  cleanedQuery = cleanedQuery.replace(
    /\b(in|at|for|near|around|the|a|an|today|tomorrow|this|next|will|it|be|is|what|how|when|going|to|should|i|need|do|does|can|could|would|should|might|may|must|have|has|had|been|being|am|are|was|were|get|got|getting|give|gives|gave|take|takes|took|make|makes|made|see|sees|saw|come|comes|came|go|goes|went|know|knows|knew|think|thinks|thought|say|says|said|tell|tells|told|ask|asks|asked|work|works|worked|seem|seems|seemed|feel|feels|felt|try|tries|tried|leave|leaves|left|put|puts|call|calls|called|want|wants|wanted|look|looks|looked|use|uses|used|find|finds|found|give|gives|gave|way|ways|new|old|good|bad|right|wrong|long|short|first|last|best|worst|big|small|large|little|high|low|early|late|young|old|important|public|bad|good|great|small|large)\b/gi,
    ""
  );

  // Clean up extra spaces and punctuation
  cleanedQuery = cleanedQuery
    .replace(/[^\w\s]/g, "")
    .trim()
    .replace(/\s+/g, " ");

  // Check if any known location is mentioned
  for (const location of KNOWN_LOCATIONS) {
    if (cleanedQuery.includes(location)) {
      return location;
    }
  }

  // If we have remaining text after cleaning, it might be a location
  if (cleanedQuery.length > 2 && cleanedQuery.length < 50) {
    return false;
  }

  return null;
}

function getLocationFromContext(cf: CfProperties<unknown>): string | null {
  // Try to get location from Cloudflare's geolocation data
  const city = cf.city;
  const region = cf.region;
  const country = cf.country;
  return (city || region || country || null) as string | null;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    if (!query) {
      return new Response('Missing query parameter "q"', {
        status: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    let activate = isWeatherQuery(query);
    let location: string | null = null;

    if (activate) {
      // Extract location from query
      const queryLocation = extractLocationFromQuery(query);

      if (queryLocation === false) {
        return new Response(null, {
          status: 204,
          headers: { "Access-Control-Allow-Origin": "*" },
        });
      }

      if (queryLocation) {
        // Use location from query if found
        location = queryLocation;
      } else {
        // Fall back to current location from CF context
        location = getLocationFromContext(request.cf!);
      }

      // If we have a weather query and location, get the weather data
      try {
        const weatherResult = await getWeatherData(location);
        if (weatherResult) {
          const weatherResponse = formatWeatherResponse(
            weatherResult.data,
            weatherResult.locationName
          );
          return new Response(weatherResponse, {
            headers: {
              "Content-Type": "text/markdown;charset=utf8",
              "Access-Control-Allow-Origin": "*",
            },
          });
        }
      } catch (error) {
        console.error("Weather fetch error:", error);
        // Fall back to just returning the location if weather API fails
      }
    }

    return new Response(null, {
      status: 204,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  },
};
