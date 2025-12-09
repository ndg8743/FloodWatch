export interface USGSTimeSeries {
  sourceInfo: {
    siteName: string;
    siteCode: Array<{ value: string }>;
    geoLocation: {
      geogLocation: {
        latitude: number;
        longitude: number;
      };
    };
  };
  variable: {
    variableCode: Array<{ value: string }>;
    variableName: string;
  };
  values: Array<{
    value: Array<{
      value: string | null;
      dateTime: string;
    }>;
  }>;
}

export interface USGSResponse {
  value: {
    timeSeries: USGSTimeSeries[];
  };
}

export interface OpenMeteoFloodResponse {
  latitude: number;
  longitude: number;
  daily: {
    time: string[];
    river_discharge: (number | null)[];
  };
  daily_units: {
    river_discharge: string;
  };
}

export interface OpenMeteoPrecipResponse {
  hourly: {
    time: string[];
    precipitation: number[];
    precipitation_probability: number[];
  };
  daily: {
    time: string[];
    precipitation_sum: number[];
  };
}
