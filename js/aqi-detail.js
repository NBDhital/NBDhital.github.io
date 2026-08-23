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
     #aqid-aqi, #aqid-aqi-desc, #aqid-dominant,
     #aqid-c-pm10, #aqid-c-pm25, #aqid-c-co, #aqid-c-no2, #aqid-c-so2, #aqid-c-o3,
     #aqid-c-co2, #aqid-c-aod,
     #aqid-scale (containing .aqi-scale__row[data-max] children)

   Source: https://open-meteo.com/en/docs/air-quality-api
   ========================================================================= */

(function () {

  const KATHMANDU = window.AQICommon.KATHMANDU;
  const levelFor = window.AQICommon.levelFor;
  const buildFeedUrl = window.AQICommon.buildFeedUrl;
  const POLLUTANTS = window.AQICommon.POLLUTANTS;

  const state = {
    lat: KATHMANDU.lat,
    lon: KATHMANDU.lon,
    label: KATHMANDU.label
  };

  // -----------------------------------------------------------------------
  // NOTE: The HTML table has been removed, but this function is still required
  // to calculate and return the dominant pollutant driving the overall AQI.
  // -----------------------------------------------------------------------
  // Renders one row per pollutant: name (+ concentration), its own US AQI
  // sub-index (or "Not applicable" for CO2 / Aerosol Optical Depth, since
  // neither has a US EPA AQI sub-index), and the overall US AQI for
  // reference. The row whose own sub-index equals the overall AQI is the
  // "dominant pollutant" driving the current reading, and gets highlighted.

 function renderPollutantTable(current, overallAqi) {
  const tbody = document.getElementById("aqid-pollutant-tbody");
  if (!POLLUTANTS) return null;

  if (tbody) {
    tbody.innerHTML = "";
  }

  // Track which pollutant's own sub-index matches the overall AQI
  let dominantLabel = null;

  POLLUTANTS.forEach(function (pollutant) {
    const concentration = current[pollutant.key];
    const subIndex = pollutant.aqiKey ? current[pollutant.aqiKey] : null;
    const isDominant = typeof subIndex === "number" && Math.round(subIndex) === overallAqi;
    if (isDominant && dominantLabel === null) dominantLabel = pollutant.label;

    // Only construct and append DOM nodes if the table exists
    if (tbody) {
      const row = document.createElement("tr");
      if (isDominant) row.className = "is-dominant";

      const concentrationText = (typeof concentration === "number" && pollutant.unit)
        ? ` (${Math.round(concentration * 10) / 10} ${pollutant.unit})`
        : "";

      const nameCell = document.createElement("td");
      nameCell.innerHTML = `${pollutant.label}<span class="aqi-pollutant-table__conc">${concentrationText}</span>`;

      const subIndexCell = document.createElement("td");
      if (pollutant.aqiKey === null) {
        subIndexCell.textContent = "Not applicable";
        subIndexCell.className = "aqi-pollutant-table__na";
      } else if (typeof subIndex === "number") {
        subIndexCell.textContent = Math.round(subIndex);
        const level = levelFor(Math.round(subIndex));
        subIndexCell.style.color = level.color;
        subIndexCell.style.fontWeight = "700";
      } else {
        subIndexCell.textContent = "\u2014";
      }

      const overallCell = document.createElement("td");
      overallCell.textContent = typeof overallAqi === "number" ? overallAqi : "\u2014";
      if (isDominant) {
        overallCell.innerHTML += ' <span class="aqi-pollutant-table__badge">Dominant</span>';
      }

      row.appendChild(nameCell);
      row.appendChild(subIndexCell);
      row.appendChild(overallCell);
      tbody.appendChild(row);
    }
  });

  return dominantLabel;
}


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
    const dominantEl = document.getElementById("aqid-dominant");
    const concPlaceEl = document.getElementById("aqid-conc-place");
    const concUpdatedEl = document.getElementById("aqid-conc-updated");

    // Concentration cards (raw values, not AQI)
    const concEls = {
      pm10: document.getElementById("aqid-c-pm10"),
      pm2_5: document.getElementById("aqid-c-pm25"),
      carbon_monoxide: document.getElementById("aqid-c-co"),
      nitrogen_dioxide: document.getElementById("aqid-c-no2"),
      sulphur_dioxide: document.getElementById("aqid-c-so2"),
      ozone: document.getElementById("aqid-c-o3"),
      carbon_dioxide: document.getElementById("aqid-c-co2"),
      aerosol_optical_depth: document.getElementById("aqid-c-aod")
    };

    if (!placeEl || !aqiEl) {
      console.warn("AQI detail page: required HTML elements not found.");
      return;
    }

    // Show the place name immediately; keep the "Last updated" span inside it.
    placeEl.childNodes[0].textContent = state.label + " ";
    if (updatedEl) updatedEl.textContent = "Updating…";
    if (concPlaceEl) concPlaceEl.textContent = state.label;
    if (concUpdatedEl) concUpdatedEl.textContent = "Updating…";

    aqiEl.textContent = "…";
    if (aqiDescEl) aqiDescEl.textContent = "Loading";
    if (dominantEl) dominantEl.textContent = "";

    Object.keys(concEls).forEach(function (key) {
      const el = concEls[key];
      if (el && el.firstChild) el.firstChild.textContent = "…";
      else if (el) el.textContent = "…";
    });

    try {

      const response = await fetch(buildFeedUrl(state.lat, state.lon), { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.current || typeof data.current.us_aqi !== "number") {
        throw new Error("AQI data not available in API response.");
      }

      const current = data.current;
      const aqi = Math.round(current.us_aqi);
      const level = levelFor(aqi);

      aqiEl.textContent = aqi;
      aqiEl.style.color = level.color;

      if (aqiDescEl) {
        aqiDescEl.textContent = level.label;
        aqiDescEl.style.color = level.color;
      }

      // Fill each concentration card with the raw current-hour reading
      Object.keys(concEls).forEach(function (key) {
        const el = concEls[key];
        if (!el) return;
        const value = current[key];
        const text = typeof value === "number"
          ? (key === "aerosol_optical_depth" ? Math.round(value * 100) / 100 : Math.round(value * 10) / 10)
          : "—";
        if (el.firstChild) {
          el.firstChild.textContent = text;
        } else {
          el.textContent = text;
        }
      });

      if (updatedEl) {
        const updatedTime = current.time ? new Date(current.time) : new Date();
        const updatedText = `Last updated ${updatedTime.toLocaleString([], {
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit"
        })}`;
        updatedEl.textContent = updatedText;
        if (concUpdatedEl) concUpdatedEl.textContent = updatedText;
      }
      if (concPlaceEl) concPlaceEl.textContent = state.label;

      highlightScale(aqi);
      const dominantLabel = renderPollutantTable(current, aqi);
      if (dominantEl) {
        dominantEl.textContent = dominantLabel ? `Main pollutant ${dominantLabel}` : "";
      }

    } catch (error) {

      console.error("AQI detail page error:", error);

      aqiEl.textContent = "—";
      if (aqiDescEl) aqiDescEl.textContent = "Unavailable";
      if (dominantEl) dominantEl.textContent = "";
      if (concPlaceEl) concPlaceEl.textContent = state.label;
      if (concUpdatedEl) concUpdatedEl.textContent = "Unable to retrieve data";
      Object.keys(concEls).forEach(function (key) {
        const el = concEls[key];
        if (!el) return;
        if (el.firstChild) el.firstChild.textContent = "—";
        else el.textContent = "—";
      });
      if (updatedEl) updatedEl.textContent = "Unable to retrieve AQI data";
      clearPollutantTable();
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
        state.label = "Data shown for your current location";

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

    const concLocateLink = document.getElementById("aqid-conc-locate-link");
    if (concLocateLink) {
      concLocateLink.addEventListener("click", function (event) {
        event.preventDefault();
        useCurrentLocation();
      });
    }

    fetchAndRender();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();


