/* =========================================================================
   AQI DETAIL PAGE
   -------------------------------------------------------------------------
   Powers /extra-info/air-quality.html:
     - live AQI / PM2.5 / PM10 stat cards (merged "Air Quality Overview"
       section — headline reading + concentration grid in one card)
     - Custom Location section: "Use Current Location" button, latitude/
       longitude fields, "Get Data Here" button, and a click-to-select
       Leaflet map. All three entry points feed the same setLocation()
       function, so the map marker, the lat/long fields, and the fetched
       data never fall out of sync with each other.
     - highlights the matching row in the AQI scale explainer

   Requires js/aqi-common.js to be loaded first.

   Required HTML elements:
     #aqid-place, #aqid-updated, #aqid-aqi, #aqid-aqi-desc, #aqid-dominant,
     #aqid-c-pm10, #aqid-c-pm25, #aqid-c-co, #aqid-c-no2, #aqid-c-so2, #aqid-c-o3,
     #aqid-c-co2, #aqid-c-aod, #aqid-conc-place, #aqid-conc-updated,
     #aqid-scale (containing .aqi-scale__row[data-max] children),
     #aqi-map, #aqid-map-hint,
     #aqid-custom-locate-btn, #aqid-custom-lat, #aqid-custom-lon,
     #aqid-custom-fetch-btn, #aqid-custom-error

   Source: https://open-meteo.com/en/docs/air-quality-api
   ========================================================================= */

(function () {

  const KATHMANDU = window.AQICommon.KATHMANDU;
  const levelFor = window.AQICommon.levelFor;
  const buildFeedUrl = window.AQICommon.buildFeedUrl;
  const POLLUTANTS = window.AQICommon.POLLUTANTS;

  // Label used everywhere a manually-picked point is shown — no raw
  // lat/long in the reading itself; the coordinates live only in the
  // latitude/longitude fields in the Custom Location section.
  const CUSTOM_LABEL = "Custom location";

  const state = {
    lat: KATHMANDU.lat,
    lon: KATHMANDU.lon,
    label: KATHMANDU.label
  };

  // Leaflet map + marker, created in initMap(). Kept at module scope so
  // every entry point (current-location button, "Get Data Here", and map
  // clicks) can move the marker / re-centre the map.
  let map = null;
  let marker = null;


  // -----------------------------------------------------------------------
  // LAT / LON VALIDATION
  // -----------------------------------------------------------------------
  // Only plain decimal numbers are accepted (optional leading "-",
  // optional decimal point) — letters, symbols, and scientific notation
  // are rejected — and the value must fall inside a valid coordinate range.

  const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

  function parseCoordinate(raw, min, max) {
    const value = String(raw).trim();
    if (!DECIMAL_PATTERN.test(value)) return null;
    const num = parseFloat(value);
    if (Number.isNaN(num) || num < min || num > max) return null;
    return num;
  }

  function showCoordError(message) {
    const errorEl = document.getElementById("aqid-custom-error");
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.toggle("is-visible", Boolean(message));
  }

  // Reads + validates whatever is currently typed in the lat/long fields.
  // Returns {lat, lon} on success, or null (and marks the bad field(s)
  // + shows an error message) on failure.
  function readCustomLatLon() {
    const latEl = document.getElementById("aqid-custom-lat");
    const lonEl = document.getElementById("aqid-custom-lon");
    if (!latEl || !lonEl) return null;

    const lat = parseCoordinate(latEl.value, -90, 90);
    const lon = parseCoordinate(lonEl.value, -180, 180);

    latEl.classList.toggle("is-invalid", lat === null);
    lonEl.classList.toggle("is-invalid", lon === null);

    if (lat === null || lon === null) {
      showCoordError("Enter valid decimal coordinates (latitude \u201390 to 90, longitude \u2013180 to 180).");
      return null;
    }

    showCoordError("");
    return { lat: lat, lon: lon };
  }

  // Fills the lat/long fields (used when a point is picked via geolocation
  // or a map click, so the fields always reflect what's on the map).
  function writeCustomLatLon(lat, lon) {
    const latEl = document.getElementById("aqid-custom-lat");
    const lonEl = document.getElementById("aqid-custom-lon");
    if (latEl) { latEl.value = lat.toFixed(6); latEl.classList.remove("is-invalid"); }
    if (lonEl) { lonEl.value = lon.toFixed(6); lonEl.classList.remove("is-invalid"); }
    showCoordError("");
  }


  // Scrolls the "Air Quality Overview" section into view — used after
  // picking a point via the current-location button or "Get Data Here",
  // so the person immediately sees the reading update in place.
  function scrollToOverview() {
    const overviewEl = document.getElementById("overall-aqi");
    if (overviewEl) {
      overviewEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }


  // -----------------------------------------------------------------------
  // SET LOCATION (shared by every entry point, so the map, the lat/long
  // fields, and the fetched data always stay in sync with each other)
  // -----------------------------------------------------------------------

  function setLocation(lat, lon, label, opts) {
    opts = opts || {};

    state.lat = lat;
    state.lon = lon;
    state.label = label;

    if (map && marker) {
      marker.setLatLng([lat, lon]);
      if (opts.recenter) {
        map.setView([lat, lon], Math.max(map.getZoom(), 10));
      }
    }

    if (opts.updateFields !== false) {
      writeCustomLatLon(lat, lon);
    }

    return fetchAndRender();
  }

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
  // MAP — click anywhere to select a point. A click only fills the
  // lat/long fields and moves the marker; press "Get Data Here" (or use
  // the current-location button) to actually load air quality data.
  // -----------------------------------------------------------------------

  function initMap() {

    const mapEl = document.getElementById("aqi-map");
    const hintEl = document.getElementById("aqid-map-hint");
    if (!mapEl) return;

    if (typeof L === "undefined") {
      console.warn("AQI detail page: Leaflet (L) is not loaded — map skipped.");
      mapEl.textContent = "Map unavailable.";
      return;
    }

    map = L.map(mapEl, { scrollWheelZoom: false }).setView([KATHMANDU.lat, KATHMANDU.lon], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\" rel=\"noopener\">OpenStreetMap</a> contributors",
      maxZoom: 18
    }).addTo(map);

    marker = L.marker([KATHMANDU.lat, KATHMANDU.lon]).addTo(map);

    // Re-enable scroll-wheel zoom only once the map has focus, so the page
    // itself can still be scrolled normally by default.
    map.on("focus", function () { map.scrollWheelZoom.enable(); });
    map.on("blur", function () { map.scrollWheelZoom.disable(); });

    map.on("click", function (event) {
      const lat = event.latlng.lat;
      const lon = event.latlng.lng;

      marker.setLatLng([lat, lon]);
      writeCustomLatLon(lat, lon);

      if (hintEl) {
        hintEl.innerHTML = `Selected <strong>${lat.toFixed(3)}, ${lon.toFixed(3)}</strong> &mdash; filled in on the left. Click &ldquo;Get Data Here&rdquo; to load air quality there.`;
      }
    });
  }

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
    }
  }


  // -----------------------------------------------------------------------
  // CUSTOM LOCATION — "Use Current Location" button
  // -----------------------------------------------------------------------
  // Gets the browser's geolocation, moves the map marker + lat/long
  // fields to that point, and loads its air quality — all in one step.

  function useCurrentLocation() {

    const btn = document.getElementById("aqid-custom-locate-btn");
    const hintEl = document.getElementById("aqid-map-hint");

    if (!btn) return;

    if (!navigator.geolocation) {
      showCoordError("Geolocation is not supported by your browser.");
      return;
    }

    const originalHTML = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<span class="aqi-widget__location-icon">⌖</span> Locating…';

    navigator.geolocation.getCurrentPosition(

      function (position) {

        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        scrollToOverview();

        setLocation(lat, lon, CUSTOM_LABEL, { recenter: true })
          .finally(function () {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
            if (hintEl) {
              hintEl.innerHTML = "Showing your current location. Click anywhere on the map to check a different point.";
            }
          });
      },

      function (error) {

        console.error("Geolocation error:", error);

        if (error.code === error.PERMISSION_DENIED) {
          showCoordError("Location permission denied.");
        } else if (error.code === error.TIMEOUT) {
          showCoordError("Location request timed out.");
        } else {
          showCoordError("Location unavailable.");
        }

        btn.disabled = false;
        btn.innerHTML = originalHTML;
      },

      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }


  // -----------------------------------------------------------------------
  // CUSTOM LOCATION — "Get Data Here" button
  // -----------------------------------------------------------------------
  // Uses whatever is currently in the lat/long fields — typed manually,
  // or filled in by a map click / the current-location button — moves
  // the marker there, and loads its air quality.

  function getDataForFields() {

    const coords = readCustomLatLon();
    if (!coords) return;

    scrollToOverview();

    const btn = document.getElementById("aqid-custom-fetch-btn");
    const hintEl = document.getElementById("aqid-map-hint");

    if (btn) btn.disabled = true;

    setLocation(coords.lat, coords.lon, CUSTOM_LABEL, { recenter: true, updateFields: false })
      .finally(function () {
        if (btn) btn.disabled = false;
        if (hintEl) {
          hintEl.innerHTML = `Showing <strong>${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}</strong>. Click elsewhere on the map to check another point.`;
        }
      });
  }


  // -----------------------------------------------------------------------
  // INITIALIZE
  // -----------------------------------------------------------------------

  function init() {

    const locateBtn = document.getElementById("aqid-custom-locate-btn");
    if (locateBtn) {
      locateBtn.addEventListener("click", useCurrentLocation);
    }

    const fetchBtn = document.getElementById("aqid-custom-fetch-btn");
    if (fetchBtn) {
      fetchBtn.addEventListener("click", getDataForFields);
    }

    // Clear the validation error as soon as the person starts fixing a field
    ["aqid-custom-lat", "aqid-custom-lon"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", function () {
          el.classList.remove("is-invalid");
          showCoordError("");
        });
      }
    });

    initMap();
    fetchAndRender();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
