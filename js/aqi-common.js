/* =========================================================================
   AQI COMMON
   -------------------------------------------------------------------------
   Shared constants + helper functions used by:
     - js/aqi-widget.js   (the small AQI bar shown on the homepage)
     - js/aqi-detail.js   (the full page at /extra-info/air-quality.html)

   Keeping this in one file means both places always agree on the AQI
   category colours/labels and the PM2.5 breakpoints, and any future
   page in /extra-info/ can reuse it too.

   Source: https://open-meteo.com/en/docs/air-quality-api
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
  // API URL
  // -----------------------------------------------------------------------

  function buildFeedUrl(lat, lon) {

    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: "us_aqi,pm2_5,pm10",
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
    levelFor: levelFor,
    buildFeedUrl: buildFeedUrl
  };

})();
