import type { Gauge, GaugeReading, USGSResponse } from "../types";
import { API_URLS, USGS_PARAMS } from "../utils/constants";
import { feetToMeters, cfsToM3s } from "../utils/formatters";
import { calculateBoundingBox, formatBoundingBox } from "../utils/geoUtils";
import { calculateRiskLevel } from "./riskCalculator";

export async function fetchUSGSByBoundingBox(
  lat: number,
  lon: number,
  radiusKm: number
): Promise<Gauge[]> {
  const bbox = calculateBoundingBox(lat, lon, radiusKm);
  const bboxStr = formatBoundingBox(bbox);

  const url = `${API_URLS.USGS_BASE}?bBox=${bboxStr}&parameterCd=${USGS_PARAMS.DISCHARGE},${USGS_PARAMS.GAUGE_HEIGHT}&format=json&siteStatus=active`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS API error: ${response.status}`);
  }

  const data: USGSResponse = await response.json();
  return normalizeUSGSResponse(data);
}

export async function fetchUSGSGaugeHistory(
  siteId: string,
  days = 7
): Promise<GaugeReading[]> {
  const url = `${API_URLS.USGS_BASE}?sites=${siteId}&parameterCd=${USGS_PARAMS.GAUGE_HEIGHT}&period=P${days}D&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`USGS API error: ${response.status}`);
  }

  const data: USGSResponse = await response.json();

  if (!data.value.timeSeries.length) {
    return [];
  }

  const series = data.value.timeSeries[0];
  return series.values[0].value
    .filter((v) => v.value !== null)
    .map((v) => ({
      timestamp: new Date(v.dateTime),
      level: feetToMeters(parseFloat(v.value!)),
    }));
}

function normalizeUSGSResponse(response: USGSResponse): Gauge[] {
  const gaugeMap = new Map<string, Partial<Gauge>>();

  for (const series of response.value.timeSeries) {
    const siteCode = series.sourceInfo.siteCode[0].value;
    const paramCode = series.variable.variableCode[0].value;
    const latestValue = series.values[0]?.value[0];

    if (!gaugeMap.has(siteCode)) {
      gaugeMap.set(siteCode, {
        id: siteCode,
        usgsCode: siteCode,
        name: series.sourceInfo.siteName,
        latitude: series.sourceInfo.geoLocation.geogLocation.latitude,
        longitude: series.sourceInfo.geoLocation.geogLocation.longitude,
        source: "usgs",
        lastUpdated: latestValue ? new Date(latestValue.dateTime) : new Date(),
      });
    }

    const gauge = gaugeMap.get(siteCode)!;

    if (latestValue?.value) {
      const value = parseFloat(latestValue.value);
      if (paramCode === USGS_PARAMS.GAUGE_HEIGHT) {
        gauge.currentLevel = feetToMeters(value);
      } else if (paramCode === USGS_PARAMS.DISCHARGE) {
        gauge.currentDischarge = cfsToM3s(value);
      }
    }
  }

  return Array.from(gaugeMap.values()).map((gauge) => {
    const risk = calculateRiskLevel(gauge.currentLevel, gauge.currentDischarge);
    return {
      ...gauge,
      riskLevel: risk.level,
      riskScore: risk.score,
      trend: "stable",
    } as Gauge;
  });
}
