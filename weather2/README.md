# weather2 — the weather centre behind /nccweather_fix

Port of the NISO NAS v2 weather app. New files only: the old `/nccweather` page and `/api/weather/*`
routes are unchanged.

## How it works
- Stations: the existing `station_coords_2` table (read only; rows without coordinates or with a
  repeated name are skipped).
- Every 120 min: Open-Meteo forecast for each station's centre plus 4 points on a 15 km ring,
  combined (inverse-distance weights) into one forecast per station, with area maxima.
- Every 15 min (when `WEATHER_API`, the existing OpenWeatherMap key, is set): live observations
  correct the next hours and teach the engine each station's bias over 7 days.
- Risk per hour: thunderstorm, gusts, heavy rain, 24 h flood rainfall, heat, visibility, into
  Normal / Advisory / Watch / Warning, and alerts.
- Kept in memory. The `weather2_*` tables (`database/migrations/002_weather2.sql`, created on start
  when the database user may) keep admin nodes, observations, the learned bias and alert history.

## Routes (routes/api2.js, server session from /auth2)
| Route | Who |
|---|---|
| `GET /api2/weather/overview`, `/stations/:name`, `/point?lat&lon`, `/alerts`, `/status`, `/meta` | NCC users |
| `POST /api2/weather/forecast-report` (Excel, 72 h) | NCC users |
| `POST /api2/weather/refresh`, `POST /stations/:name/nodes`, `DELETE /nodes/:id` | NCC administrators (`NAS_AUDIT_ADMINS`) |

Node changes, refreshes and report downloads are written to the audit log.

## Settings (.env, all optional)
See the top of `config.js`. `WEATHER2_ENABLED=false` turns the engine off.

## Network
- The server needs outbound HTTPS to `api.open-meteo.com` and `api.openweathermap.org`.
- Browsers load map tiles from `server.arcgisonline.com`; without them the map shows the stations on
  a plain background and everything else works.

## Open-Meteo quota (free tier: 10 000 calls a day, non-commercial)
60 stations × 5 points × 2 (more than 10 variables) × 12 runs a day ≈ 7 200 calls. Map-click point
forecasts cost about 10 calls each and are capped (`WEATHER2_POINT_LIMIT` per 10 min,
`WEATHER2_POINT_DAILY_LIMIT` per day). The page footer shows the estimated daily use. Adding models
(`WEATHER2_MODELS`) multiplies the calls: lengthen `WEATHER2_FORECAST_REFRESH_MIN` or use a paid key.
