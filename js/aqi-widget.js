/* =========================================================================
   AQI WIDGET
   -------------------------------------------------------------------------
   Default location: Kathmandu
   User can request AQI for their current browser location.

   Required HTML elements:
     #aqi-label
     #aqi-value
     #aqi-desc
     #aqi-updated
     #aqi-location-btn
   
   Source: https://open-meteo.com/en/docs/air-quality-api
   ========================================================================= */

(function () {

  // -----------------------------------------------------------------------
  // SETTINGS
  // -----------------------------------------------------------------------
  // Shared constants/helpers (KATHMANDU, AQI_LEVELS, levelFor, buildFeedUrl)
  // now live in js/aqi-common.js, which must be loaded before this file.

  const KATHMANDU = window.AQICommon.KATHMANDU;
  const levelFor = window.AQICommon.levelFor;
  const buildFeedUrl = window.AQICommon.buildFeedUrl;

  const REFRESH_MS = 30 * 60 * 1000; // 30 minutes


  // -----------------------------------------------------------------------
  // CURRENT STATE
  // -----------------------------------------------------------------------

  const state = {
    lat: KATHMANDU.lat,
    lon: KATHMANDU.lon,
    label: "In " + KATHMANDU.label
  };

  let refreshTimer = null;


  // -----------------------------------------------------------------------
  // UPDATE DISPLAY
  // -----------------------------------------------------------------------

  async function fetchAndRender() {

    const labelEl = document.getElementById("aqi-label");
    const valueEl = document.getElementById("aqi-value");
    const descEl = document.getElementById("aqi-desc");
    const updatedEl = document.getElementById("aqi-updated");

    if (!labelEl || !valueEl || !descEl) {
      console.warn("AQI widget: required HTML elements not found.");
      return;
    }

    // Show current location label immediately
    labelEl.textContent = state.label;

    // Temporary loading state
    valueEl.textContent = "…";
    descEl.textContent = "Updating…";
    descEl.style.color = "var(--color-text-muted)";

    try {

      const response = await fetch(
        buildFeedUrl(state.lat, state.lon),
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}`);
      }

      const data = await response.json();

      // Make sure the expected API data exists
      if (
        !data.current ||
        typeof data.current.us_aqi !== "number"
      ) {
        throw new Error("AQI data not available in API response.");
      }

      const aqi = Math.round(data.current.us_aqi);
      const level = levelFor(aqi);

      // AQI
      valueEl.textContent = aqi;
      valueEl.style.color = level.color;

      // Description
      descEl.textContent = level.label;
      descEl.style.color = level.color;

      // Last updated time
      if (updatedEl) {

        const updatedTime = data.current.time
          ? new Date(data.current.time)
          : new Date();

        updatedEl.textContent =
          `Last updated ${updatedTime.toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          })}`;
      }

      console.log(
        `AQI updated: ${aqi} (${level.label})`,
        data.current
      );

    } catch (error) {

      console.error("AQI widget error:", error);

      valueEl.textContent = "—";
      valueEl.style.color = "var(--color-text-muted)";

      descEl.textContent = "Unavailable";
      descEl.style.color = "var(--color-text-muted)";

      if (updatedEl) {
        updatedEl.textContent = "Unable to retrieve AQI";
      }
    }
  }


  // -----------------------------------------------------------------------
  // AUTO REFRESH
  // -----------------------------------------------------------------------

  function startAutoRefresh() {

    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    refreshTimer = setInterval(
      fetchAndRender,
      REFRESH_MS
    );
  }


  // -----------------------------------------------------------------------
  // CURRENT LOCATION
  // -----------------------------------------------------------------------

  function useCurrentLocation() {

    const btn = document.getElementById("aqi-location-btn");
    const descEl = document.getElementById("aqi-desc");
    const labelEl = document.getElementById("aqi-label");

    if (!btn) return;

    if (!navigator.geolocation) {

      if (descEl) {
        descEl.textContent = "Geolocation not supported";
      }

      return;
    }

    const originalText = btn.textContent;

    btn.disabled = true;
    btn.textContent = "Locating…";

    navigator.geolocation.getCurrentPosition(

      // ---------------------------------------------------------------
      // SUCCESS
      // ---------------------------------------------------------------

      function (position) {

        state.lat = position.coords.latitude;
        state.lon = position.coords.longitude;
        state.label = "At your current location";

        if (labelEl) {
          labelEl.textContent = state.label;
        }

        fetchAndRender().finally(function () {

          btn.disabled = false;
          btn.textContent = originalText;

        });
      },


      // ---------------------------------------------------------------
      // ERROR
      // ---------------------------------------------------------------

      function (error) {

        console.error("Geolocation error:", error);

        if (descEl) {

          if (error.code === error.PERMISSION_DENIED) {
            descEl.textContent = "Location permission denied";
          }

          else if (error.code === error.TIMEOUT) {
            descEl.textContent = "Location request timed out";
          }

          else {
            descEl.textContent = "Location unavailable";
          }

          descEl.style.color = "var(--color-text-muted)";
        }

        btn.disabled = false;
        btn.textContent = originalText;
      },

      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }


  // -----------------------------------------------------------------------
  // INITIALIZE
  // -----------------------------------------------------------------------

  function initAQIWidget() {

    const btn = document.getElementById("aqi-location-btn");

    if (btn) {
      btn.addEventListener(
        "click",
        useCurrentLocation
      );
    }

    // ALWAYS START WITH KATHMANDU
    state.lat = KATHMANDU.lat;
    state.lon = KATHMANDU.lon;
    state.label = "In " + KATHMANDU.label;

    fetchAndRender();

    startAutoRefresh();
  }


  // -----------------------------------------------------------------------
  // PAGE LOAD
  // -----------------------------------------------------------------------

  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      initAQIWidget
    );

  } else {

    initAQIWidget();

  }


  // -----------------------------------------------------------------------
  // REFRESH WHEN TAB BECOMES VISIBLE AGAIN
  // -----------------------------------------------------------------------

  document.addEventListener(
    "visibilitychange",
    function () {

      if (document.visibilityState === "visible") {
        fetchAndRender();
      }

    }
  );

})();
