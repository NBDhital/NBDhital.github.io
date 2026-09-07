/* =========================================================================
   AQI COMMON
   -------------------------------------------------------------------------
   Shared constants + helper functions used by:
     - js/aqi-widget.js   (the small AQI bar shown on the homepage)
     - js/aqi-detail.js   (the full page at /air-quality.html)
   ========================================================================= */

window.AQICommon = (function () {

  // -----------------------------------------------------------------------
  // DEFAULT LOCATION
  // -----------------------------------------------------------------------

  const KATHMANDU = {
    lat: 27.707461,
    lon: 85.315024,
    label: "Kathmandu, Nepal"
  };


  // -----------------------------------------------------------------------
  // AQI CATEGORIES — US EPA (breakpoints revised May 2024)
  // -----------------------------------------------------------------------
  // "max" is the top of the AQI range for that category.
  // "pm25" is the matching PM2.5 (24-hr) range in µg/m3, for reference only.

  const AQI_LEVELS = [
    { max: 50,       label: "Good",                           color: "#4CA64C", pm25: "0.0 – 9.0",     health: "Air quality is satisfactory and poses little or no risk." },
    { max: 100,      label: "Moderate",                       color: "#C9A227", pm25: "9.1 – 35.4",    health: "Acceptable, but unusually sensitive people should consider limiting prolonged outdoor exertion." },
    { max: 150,      label: "Unhealthy for Sensitive Groups",  color: "#E07B39", pm25: "35.5 – 55.4",   health: "Children, older adults, and people with heart or lung disease may experience health effects." },
    { max: 200,      label: "Unhealthy",                      color: "#C0392B", pm25: "55.5 – 125.4",  health: "Everyone may begin to experience health effects; sensitive groups may experience more serious effects." },
    { max: 300,      label: "Very Unhealthy",                 color: "#7D3C98", pm25: "125.5 – 225.4", health: "Health alert — the risk of health effects is increased for everyone." },
    { max: Infinity, label: "Hazardous",                      color: "#5C2A2A", pm25: "225.5+",         health: "Health warning of emergency conditions — the entire population is more likely to be affected." }
  ];


  function levelFor(aqi) {
    return (
      AQI_LEVELS.find(function (level) { return aqi <= level.max; }) ||
      AQI_LEVELS[AQI_LEVELS.length - 1]
    );
  }


  // -----------------------------------------------------------------------
  // POLLUTANT TABLE CONFIG
  // -----------------------------------------------------------------------
  // Used to build the "Pollutant Breakdown" table on the detail page.
  // "key" = the raw concentration field in the API response.
  // "aqiKey" = the matching US AQI sub-index field, or null if that
  //            pollutant has no US EPA AQI sub-index (CO2, AOD).

  const POLLUTANTS = [
    { key: "pm10",                  aqiKey: "us_aqi_pm10",             label: "PM10",                    unit: "\u00B5g/m\u00B3" },
    { key: "pm2_5",                 aqiKey: "us_aqi_pm2_5",            label: "PM2.5",                   unit: "\u00B5g/m\u00B3" },
    { key: "carbon_monoxide",       aqiKey: "us_aqi_carbon_monoxide",  label: "CO",                      unit: "\u00B5g/m\u00B3" },
    { key: "nitrogen_dioxide",      aqiKey: "us_aqi_nitrogen_dioxide", label: "NO\u2082",                unit: "\u00B5g/m\u00B3" },
    { key: "sulphur_dioxide",       aqiKey: "us_aqi_sulphur_dioxide",  label: "SO\u2082",                unit: "\u00B5g/m\u00B3" },
    { key: "ozone",                 aqiKey: "us_aqi_ozone",            label: "O\u2083",                 unit: "\u00B5g/m\u00B3" },
    { key: "carbon_dioxide",        aqiKey: null,                      label: "CO\u2082",                unit: "ppm" },
    { key: "aerosol_optical_depth", aqiKey: null,                      label: "Aerosol Optical Depth",   unit: "" }
  ];


  // -----------------------------------------------------------------------
  // API URL
  // -----------------------------------------------------------------------

  function buildFeedUrl(lat, lon) {

    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: [
        "us_aqi",
        "pm10", "us_aqi_pm10",
        "pm2_5", "us_aqi_pm2_5",
        "carbon_monoxide", "us_aqi_carbon_monoxide",
        "nitrogen_dioxide", "us_aqi_nitrogen_dioxide",
        "sulphur_dioxide", "us_aqi_sulphur_dioxide",
        "ozone", "us_aqi_ozone",
        "carbon_dioxide",
        "aerosol_optical_depth"
      ].join(","),
      timezone: "auto"
    });

    return `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`;
  }


  // -----------------------------------------------------------------------
  // PUBLIC
  // -----------------------------------------------------------------------

  return {
    KATHMANDU: KATHMANDU,
    AQI_LEVELS: AQI_LEVELS,
    POLLUTANTS: POLLUTANTS,
    levelFor: levelFor,
    buildFeedUrl: buildFeedUrl
  };

})();
