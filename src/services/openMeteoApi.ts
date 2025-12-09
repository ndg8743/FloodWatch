import type { OpenMeteoFloodResponse, OpenMeteoPrecipResponse } from "../types";
import { API_URLS } from "../utils/constants";

export interface DischargeData {
  latitude: number;
  longitude: number;
  forecasts: Array<{
    date: Date;
    discharge: number | null;
  }>;
}

export interface PrecipitationData {
  hourly: Array<{
    time: Date;
    amount: number;
    probability: number;
  }>;
  dailySum: Array<{
    date: Date;
    total: number;
  }>;
}

export async function fetchRiverDischarge(
  lat: number,
  lon: number
): Promise<DischargeData> {
  const url = `${API_URLS.OPEN_METEO_FLOOD}?latitude=${lat}&longitude=${lon}&daily=river_discharge&forecast_days=7&past_days=7`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  const data: OpenMeteoFloodResponse = await response.json();

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    forecasts: data.daily.time.map((date, i) => ({
      date: new Date(date),
      discharge: data.daily.river_discharge[i],
    })),
  };
}

export async function fetchPrecipitation(
  lat: number,
  lon: number,
  days = 7
): Promise<PrecipitationData> {
  const url = `${API_URLS.OPEN_METEO_WEATHER}?latitude=${lat}&longitude=${lon}&hourly=precipitation,precipitation_probability&daily=precipitation_sum&forecast_days=${days}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status}`);
  }

  const data: OpenMeteoPrecipResponse = await response.json();

  return {
    hourly: data.hourly.time.map((time, i) => ({
      time: new Date(time),
      amount: data.hourly.precipitation[i],
      probability: data.hourly.precipitation_probability[i],
    })),
    dailySum: data.daily.time.map((date, i) => ({
      date: new Date(date),
      total: data.daily.precipitation_sum[i],
    })),
  };
}
