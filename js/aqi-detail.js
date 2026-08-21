/* =========================================================================
   AQI DETAIL PAGE
   -------------------------------------------------------------------------
   Powers /extra-info/air-quality.html:
     - live AQI / PM2.5 / PM10 stat cards
     - "Use Current Location" button (same behaviour as the homepage widget)
     - highlights the matching row in the AQI scale explainer

   Requires js/aqi-common.js to be loaded first.

   Required HTML elements:
     #aqid-place, #aqid-updated, #aqid-location-btn,
     #aqid-aqi, #aqid-aqi-desc, #aqid-pm25, #aqid-pm10, #aqid-category,
     #aqid-scale (containing .aqi-scale__row[data-max] children)

   Source: https://open-meteo.com/en/docs/air-quality-api
   ========================================================================= */

(function () {

  const KATHMANDU = window.AQICommon.KATHMANDU;
  const levelFor = window.AQICommon.levelFor;
  const buildFeedUrl = window.AQICommon.buildFeedUrl;

  const state = {
    lat: KATHMANDU.lat,
    lon: KATHMANDU.lon,
    label: KATHMANDU.label
  };


  // -----------------------------------------------------------------------
  // HIGHLIGHT THE CURRENT ROW IN THE AQI SCALE
  // -----------------------------------------------------------------------

  function highlightScale(aqi) {

    const rows = document.querySelectorAll("#aqid-scale .aqi-scale__row");

    rows.forEach(function (row) {
      const max = parseFloat(row.getAttribute("data-max"));
      row.classList.toggle("is-current", aqi <= max && !row.dataset.claimed);
    });

    // Only mark the FIRST matching row (rows are in ascending order),
    // in case an aqi value ties the boundary between two rows.
    let claimed = false;
    rows.forEach(function (row) {
      if (claimed) {
        row.classList.remove("is-current");
        return;
      }
      if (row.classList.contains("is-current")) {
        claimed = true;
      }
    });
  }


  // -----------------------------------------------------------------------
  // FETCH + RENDER
  // -----------------------------------------------------------------------

  async function fetchAndRender() {

    const placeEl = document.getElementById("aqid-place");
    const updatedEl = document.getElementById("aqid-updated");
    const aqiEl = document.getElementById("aqid-aqi");
    const aqiDescEl = document.getElementById("aqid-aqi-desc");
    const pm25El = document.getElementById("aqid-pm25");
    const pm10El = document.getElementById("aqid-pm10");
    const categoryEl = document.getElementById("aqid-category");

    if (!placeEl || !aqiEl) {
      console.warn("AQI detail page: required HTML elements not found.");
      return;
    }

    // Show the place name immediately; keep the "Last updated" span inside it.
    placeEl.childNodes[0].textContent = state.label + " ";
    if (updatedEl) updatedEl.textContent = "Updating…";

    aqiEl.textContent = "…";
    if (aqiDescEl) aqiDescEl.textContent = "Loading";
    if (pm25El) pm25El.firstChild.textContent = "…";
    if (pm10El) pm10El.firstChild.textContent = "…";
    if (categoryEl) categoryEl.textContent = "…";

    try {

      const response = await fetch(buildFeedUrl(state.lat, state.lon), { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.current || typeof data.current.us_aqi !== "number") {
        throw new Error("AQI data not available in API response.");
      }

      const aqi = Math.round(data.current.us_aqi);
      const level = levelFor(aqi);

      aqiEl.textContent = aqi;
      aqiEl.style.color = level.color;

      if (aqiDescEl) {
        aqiDescEl.textContent = level.label;
        aqiDescEl.style.color = level.color;
      }

      if (categoryEl) {
        categoryEl.textContent = level.label;
        categoryEl.style.color = level.color;
      }

      if (pm25El && typeof data.current.pm2_5 === "number") {
        pm25El.firstChild.textContent = Math.round(data.current.pm2_5 * 10) / 10;
      }

      if (pm10El && typeof data.current.pm10 === "number") {
        pm10El.firstChild.textContent = Math.round(data.current.pm10 * 10) / 10;
      }

      if (updatedEl) {
        const updatedTime = data.current.time ? new Date(data.current.time) : new Date();
        updatedEl.textContent =
          `Last updated ${updatedTime.toLocaleString([], {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit"
          })}`;
      }

      highlightScale(aqi);

    } catch (error) {

      console.error("AQI detail page error:", error);

      aqiEl.textContent = "—";
      if (aqiDescEl) aqiDescEl.textContent = "Unavailable";
      if (categoryEl) categoryEl.textContent = "—";
      if (pm25El) pm25El.firstChild.textContent = "—";
      if (pm10El) pm10El.firstChild.textContent = "—";
      if (updatedEl) updatedEl.textContent = "Unable to retrieve AQI data";
    }
  }


  // -----------------------------------------------------------------------
  // CURRENT LOCATION
  // -----------------------------------------------------------------------

  function useCurrentLocation() {

    const btn = document.getElementById("aqid-location-btn");
    const updatedEl = document.getElementById("aqid-updated");

    if (!btn) return;

    if (!navigator.geolocation) {
      if (updatedEl) updatedEl.textContent = "Geolocation not supported";
      return;
    }

    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.textContent = "Locating…";

    navigator.geolocation.getCurrentPosition(

      function (position) {

        state.lat = position.coords.latitude;
        state.lon = position.coords.longitude;
        state.label = "Your current location";

        fetchAndRender().finally(function () {
          btn.disabled = false;
          btn.innerHTML = originalText;
        });
      },

      function (error) {

        console.error("Geolocation error:", error);

        if (updatedEl) {
          if (error.code === error.PERMISSION_DENIED) {
            updatedEl.textContent = "Location permission denied";
          } else if (error.code === error.TIMEOUT) {
            updatedEl.textContent = "Location request timed out";
          } else {
            updatedEl.textContent = "Location unavailable";
          }
        }

        btn.disabled = false;
        btn.innerHTML = originalText;
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

  function init() {

    const btn = document.getElementById("aqid-location-btn");
    if (btn) {
      btn.addEventListener("click", useCurrentLocation);
    }

    fetchAndRender();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
