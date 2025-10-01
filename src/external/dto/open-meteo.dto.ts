// DTOs for Open-Meteo API responses

export interface OpenMeteoCityDto {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  feature_code?: string;
  country_code: string;
  admin1_id?: number;
  admin2_id?: number;
  admin3_id?: number;
  admin4_id?: number;
  timezone: string;
  population?: number;
  postcodes?: string[];
  country_id?: number;
  country: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  admin4?: string;
}

export interface OpenMeteoGeocodingResponse {
  results?: OpenMeteoCityDto[];
}

export interface OpenMeteoWeatherResponse {
  latitude: number;
  longitude: number;
  elevation: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weathercode: number[];
    precipitation_sum: number[];
    rain_sum?: number[];
    showers_sum?: number[];
    snowfall_sum?: number[];
    windspeed_10m_max: number[];
    winddirection_10m_dominant?: number[];
    windgusts_10m_max?: number[];
    uv_index_max?: number[];
    sunrise?: string[];
    sunset?: string[];
    sunshine_duration?: number[];
  };
  daily_units?: {
    time: string;
    temperature_2m_max: string;
    temperature_2m_min: string;
    weathercode: string;
    precipitation_sum: string;
    rain_sum?: string;
    showers_sum?: string;
    snowfall_sum?: string;
    windspeed_10m_max: string;
    winddirection_10m_dominant?: string;
    windgusts_10m_max?: string;
    uv_index_max?: string;
    sunrise?: string;
    sunset?: string;
    sunshine_duration?: string;
  };
}

// Weather codes according to WMO
export enum WeatherCode {
  CLEAR_SKY = 0,
  MAINLY_CLEAR = 1,
  PARTLY_CLOUDY = 2,
  OVERCAST = 3,
  FOG = 45,
  DEPOSITING_RIME_FOG = 48,
  LIGHT_DRIZZLE = 51,
  MODERATE_DRIZZLE = 53,
  DENSE_DRIZZLE = 55,
  LIGHT_FREEZING_DRIZZLE = 56,
  DENSE_FREEZING_DRIZZLE = 57,
  SLIGHT_RAIN = 61,
  MODERATE_RAIN = 63,
  HEAVY_RAIN = 65,
  LIGHT_FREEZING_RAIN = 66,
  HEAVY_FREEZING_RAIN = 67,
  SLIGHT_SNOWFALL = 71,
  MODERATE_SNOWFALL = 73,
  HEAVY_SNOWFALL = 75,
  SNOW_GRAINS = 77,
  SLIGHT_RAIN_SHOWERS = 80,
  MODERATE_RAIN_SHOWERS = 81,
  VIOLENT_RAIN_SHOWERS = 82,
  SLIGHT_SNOW_SHOWERS = 85,
  HEAVY_SNOW_SHOWERS = 86,
  THUNDERSTORM = 95,
  THUNDERSTORM_SLIGHT_HAIL = 96,
  THUNDERSTORM_HEAVY_HAIL = 99,
}
