/**
 * WMO weather interpretation codes (the set Open-Meteo returns, plus 5/6 haze/dust which
 * matter a lot in the harmattan season). `severity` orders codes for "significant weather".
 */
const CODES = {
  0: { label: 'Clear sky', icon: 'clear', severity: 0 },
  1: { label: 'Mainly clear', icon: 'mostly-clear', severity: 1 },
  2: { label: 'Partly cloudy', icon: 'partly-cloudy', severity: 2 },
  3: { label: 'Overcast', icon: 'overcast', severity: 3 },
  5: { label: 'Haze', icon: 'haze', severity: 4 },
  6: { label: 'Dust haze', icon: 'dust', severity: 5 },
  45: { label: 'Fog', icon: 'fog', severity: 6 },
  48: { label: 'Rime fog', icon: 'fog', severity: 6 },
  51: { label: 'Light drizzle', icon: 'drizzle', severity: 7 },
  53: { label: 'Drizzle', icon: 'drizzle', severity: 8 },
  55: { label: 'Dense drizzle', icon: 'drizzle', severity: 9 },
  56: { label: 'Freezing drizzle', icon: 'drizzle', severity: 9 },
  57: { label: 'Freezing drizzle', icon: 'drizzle', severity: 9 },
  61: { label: 'Light rain', icon: 'rain', severity: 10 },
  63: { label: 'Rain', icon: 'rain', severity: 12 },
  65: { label: 'Heavy rain', icon: 'heavy-rain', severity: 14 },
  66: { label: 'Freezing rain', icon: 'rain', severity: 12 },
  67: { label: 'Freezing rain', icon: 'heavy-rain', severity: 14 },
  71: { label: 'Light snow', icon: 'snow', severity: 10 },
  73: { label: 'Snow', icon: 'snow', severity: 12 },
  75: { label: 'Heavy snow', icon: 'snow', severity: 14 },
  77: { label: 'Snow grains', icon: 'snow', severity: 10 },
  80: { label: 'Light showers', icon: 'showers', severity: 11 },
  81: { label: 'Showers', icon: 'showers', severity: 13 },
  82: { label: 'Violent showers', icon: 'heavy-rain', severity: 15 },
  85: { label: 'Snow showers', icon: 'snow', severity: 12 },
  86: { label: 'Snow showers', icon: 'snow', severity: 13 },
  95: { label: 'Thunderstorm', icon: 'thunder', severity: 16 },
  96: { label: 'Thunderstorm, hail', icon: 'thunder', severity: 17 },
  99: { label: 'Severe thunderstorm, hail', icon: 'thunder', severity: 18 },
};

const describe = (code) => CODES[code] || { label: 'Unknown', icon: 'unknown', severity: 0 };
const isRainCode = (code) => code >= 51 && code <= 99 && !(code >= 71 && code <= 77) && code !== 85 && code !== 86;
const isThunder = (code) => code >= 95;

/** Map an OpenWeatherMap condition id to the WMO scale used everywhere else. */
function fromOwmId(id) {
  if (id >= 200 && id < 300) return id === 202 || id === 212 || id === 221 ? 99 : 95;
  if (id >= 300 && id < 400) return id <= 301 ? 51 : 53;
  if (id === 500) return 61;
  if (id === 501) return 63;
  if (id >= 502 && id <= 504) return 65;
  if (id === 511) return 66;
  if (id >= 520 && id <= 531) return id === 520 ? 80 : id === 521 ? 81 : 82;
  if (id >= 600 && id < 700) return 73;
  if (id === 701 || id === 741) return 45;
  if (id === 711 || id === 721) return 5;
  if (id === 731 || id === 751 || id === 761 || id === 762) return 6;
  if (id === 771 || id === 781) return 99;
  if (id === 800) return 0;
  if (id === 801) return 1;
  if (id === 802) return 2;
  if (id === 803 || id === 804) return 3;
  return 3;
}

module.exports = { CODES, describe, isRainCode, isThunder, fromOwmId };
