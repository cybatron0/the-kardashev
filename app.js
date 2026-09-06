// THE KARDASHEV — Main Application Logic (v0.5.2)

let map;
let layers = {
  choropleth: L.layerGroup(),
  oilPipelines: L.layerGroup(),
  gasPipelines: L.layerGroup(),
  refineries: L.layerGroup(),
  fields: L.layerGroup(),
  plants: L.layerGroup()
};
let currentChart = null;
let shareChart = null;
let countryLayer = null;
let pipelineLayers = { oil: [], gas: [] };

function init() {
  initMap();
  loadChoropleth();
  renderTopProducers();
  renderPipelines();
  renderRefineries();
  renderFields();
  renderPlants();
  bindLayerToggles();
  bindRegionJumps();
  bindSearch();
  bindTabs();
  bindFilters();
  bindMobileToggles();
  renderAnalytics();
  buildLegend();
  renderTicker();
  showDefaultIntel();
  maybeShowOnboarding();
  updateClock();
  setInterval(updateClock, 1000);

  document.getElementById("btn-reset-view").addEventListener("click", () => {
    map.setView([25, 20], 2.2);
  });

  const pipeEl = document.getElementById("stat-pipelines");
  const refEl = document.getElementById("stat-refineries");
  if (pipeEl) pipeEl.textContent = PIPELINES.length;
  if (refEl) refEl.textContent = REFINERIES.length;

  setTimeout(() => {
    if (localStorage.getItem("kardashev_visited")) return;
    const onb = document.getElementById("onboarding");
    if (onb && onb.style.display !== "none" && !onb.hidden) return;
    map.flyTo(REGIONS.middleeast.center, REGIONS.middleeast.zoom, { duration: 1.2 });
  }, 1200);
}

function initMap() {
  map = L.map("map", {
    zoomControl: true,
    attributionControl: false,
    minZoom: 2,
    maxZoom: 10
  }).setView([25, 20], 2.2);

  // Reliable free dark basemap (Esri World Dark Gray Canvas)
  L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
    maxZoom: 16,
    attribution: "Tiles &copy; Esri"
  }).addTo(map);

  Object.values(layers).forEach(l => l.addTo(map));
}

function loadChoropleth() {
  fetch("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson")
    .then(r => r.json())
    .then(geo => {
      countryLayer = L.geoJSON(geo, {
        style: feature => {
          const name = (feature.properties.name || "").toLowerCase();
          const iso2 = feature.properties["ISO3166-1-Alpha-2"] || feature.properties.iso_a2;
          let prod = null;
          if (iso2 && PROD_BY_CODE[iso2]) prod = PROD_BY_CODE[iso2].production;
          else if (PROD_BY_NAME[name]) prod = PROD_BY_NAME[name].production;
          else if (name === "united states of america" && PROD_BY_CODE.US) prod = PROD_BY_CODE.US.production;
          else if (name === "russian federation" && PROD_BY_CODE.RU) prod = PROD_BY_CODE.RU.production;

          return {
            fillColor: getChoroColor(prod),
            weight: 0.55,
            opacity: 1,
            color: "#1a3a4a",
            fillOpacity: prod ? 0.78 : 0.25
          };
        },
        onEachFeature: (feature, layer) => {
          const name = feature.properties.name || "Unknown";
          const iso2 = feature.properties["ISO3166-1-Alpha-2"] || feature.properties.iso_a2;
          let prodEntry = iso2 && PROD_BY_CODE[iso2] ? PROD_BY_CODE[iso2] : PROD_BY_NAME[name.toLowerCase()];
          if (!prodEntry && name.toLowerCase() === "united states of america") prodEntry = PROD_BY_CODE.US;
          if (!prodEntry && name.toLowerCase() === "russian federation") prodEntry = PROD_BY_CODE.RU;

          const prodStr = prodEntry ? `${prodEntry.production} Mb/d` : "—";
          layer.bindTooltip(`${name}<br><b>${prodStr}</b> <span style="opacity:0.7">(${DATA_METRIC})</span>`, {
            sticky: true
          });

          layer.on({
            mouseover: e => {
              e.target.setStyle({ weight: 1.5, color: "#00e5ff", fillOpacity: 0.9 });
              e.target.bringToFront();
            },
            mouseout: e => { countryLayer.resetStyle(e.target); },
            click: () => {
              if (prodEntry) {
                showCountryDetail(prodEntry);
                map.flyTo([prodEntry.lat, prodEntry.lng], 4, { duration: 0.8 });
              } else {
                showDetail({ name, production: "—", code: iso2 || "" }, "country");
              }
            }
          });
        }
      });

      layers.choropleth.addLayer(countryLayer);
      layers.oilPipelines.bringToFront();
      layers.gasPipelines.bringToFront();
      layers.refineries.bringToFront();
      layers.fields.bringToFront();
      layers.plants.bringToFront();
    })
    .catch(err => console.warn("Choropleth load failed", err));
}

function buildLegend() {
  const el = document.getElementById("legend-scale");
  if (!el) return;
  const labels = ["0", "1+", "2+", "4+", "8+", "15+", "25+"];
  el.innerHTML = CHORO_COLORS.map((c, i) =>
    `<div class="legend-row"><span class="legend-swatch" style="background:${c}"></span>${labels[i]}</div>`
  ).join("");
}

function renderTopProducers() {
  const container = document.getElementById("top-producers");
  container.innerHTML = PRODUCTION_DATA.slice(0, 12).map((p, i) => `
    <div class="producer-item" data-lat="${p.lat}" data-lng="${p.lng}" data-idx="${i}">
      <span class="rank">${i + 1}</span>
      <span class="name">${p.country}</span>
      <span class="value">${p.production}</span>
    </div>
  `).join("");

  container.querySelectorAll(".producer-item").forEach(el => {
    el.addEventListener("click", () => {
      const lat = +el.dataset.lat;
      const lng = +el.dataset.lng;
      const idx = +el.dataset.idx;
      map.flyTo([lat, lng], 4.5, { duration: 0.85 });
      showCountryDetail(PRODUCTION_DATA[idx]);
    });
  });
}

function renderPipelines() {
  pipelineLayers.oil = [];
  pipelineLayers.gas = [];

  PIPELINES.forEach(p => {
    const isOil = p.type === "oil";
    const mainColor = isOil ? "#ff9a1f" : "#00c8ff";
    const glowColor = isOil ? "rgba(255, 140, 0, 0.4)" : "rgba(0, 180, 255, 0.4)";

    const glow = L.polyline(p.coords, {
      color: glowColor, weight: 10, opacity: 0.5,
      lineCap: "round", lineJoin: "round", interactive: false
    });

    const main = L.polyline(p.coords, {
      color: mainColor, weight: 4, opacity: 0.95,
      lineCap: "round", lineJoin: "round"
    });

    main.bindPopup(`
      <strong style="font-size:1rem">${p.name}</strong><br>
      <span style="color:#7ab8d4">${p.type.toUpperCase()} • ${p.status}</span><br>
      Capacity: <b>${p.capacity}</b><br>
      Length: ${p.length}<br>
      Operator: ${p.operator}
    `, { maxWidth: 280 });

    main.on("mouseover", function () {
      this.setStyle({ weight: 7, opacity: 1 });
      glow.setStyle({ weight: 15, opacity: 0.65 });
    });
    main.on("mouseout", function () {
      this.setStyle({ weight: 4, opacity: 0.95 });
      glow.setStyle({ weight: 10, opacity: 0.5 });
    });
    main.on("click", () => showDetail(p, "pipeline"));

    const group = isOil ? layers.oilPipelines : layers.gasPipelines;
    group.addLayer(glow);
    group.addLayer(main);

    if (isOil) pipelineLayers.oil.push({ glow, main, data: p });
    else pipelineLayers.gas.push({ glow, main, data: p });
  });
}

function createIcon(type) {
  const map = {
    refinery: { bg: "#ff8c00", size: 15 },
    field: { bg: "#ffcc00", size: 13 },
    plant: { bg: "#00ff9d", size: 13 }
  };
  const c = map[type] || map.field;
  return L.divIcon({
    className: "custom-marker",
    html: `<div class="marker-dot marker-${type}" style="background:${c.bg};width:${c.size}px;height:${c.size}px;"></div>`,
    iconSize: [c.size, c.size],
    iconAnchor: [c.size / 2, c.size / 2]
  });
}

function renderRefineries() {
  REFINERIES.forEach(r => {
    const marker = L.marker([r.lat, r.lng], { icon: createIcon("refinery") });
    marker.bindPopup(`<strong>${r.name}</strong><br>${r.capacity}<br>${r.operator}<br>${r.country}`);
    marker.on("click", () => showDetail(r, "refinery"));
    layers.refineries.addLayer(marker);
  });
}

function renderFields() {
  FIELDS.forEach(f => {
    const marker = L.marker([f.lat, f.lng], { icon: createIcon("field") });
    marker.bindPopup(`<strong>${f.name}</strong><br>${f.production}<br>${f.operator}`);
    marker.on("click", () => showDetail(f, "field"));
    layers.fields.addLayer(marker);
  });
}

function renderPlants() {
  POWER_PLANTS.forEach(p => {
    const marker = L.marker([p.lat, p.lng], { icon: createIcon("plant") });
    marker.bindPopup(`<strong>${p.name}</strong><br>${p.capacity} • ${p.type}<br>${p.country}`);
    marker.on("click", () => showDetail(p, "plant"));
    layers.plants.addLayer(marker);
  });
}

function bindLayerToggles() {
  const toggles = {
    "layer-choropleth": layers.choropleth,
    "layer-oil-pipelines": layers.oilPipelines,
    "layer-gas-pipelines": layers.gasPipelines,
    "layer-refineries": layers.refineries,
    "layer-fields": layers.fields,
    "layer-plants": layers.plants
  };
  Object.entries(toggles).forEach(([id, layer]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", () => {
      if (el.checked) map.addLayer(layer);
      else map.removeLayer(layer);
    });
  });
}

function bindRegionJumps() {
  document.querySelectorAll("#region-jumps button").forEach(btn => {
    btn.addEventListener("click", () => {
      const r = REGIONS[btn.dataset.region];
      if (r) map.flyTo(r.center, r.zoom, { duration: 0.9 });
    });
  });
}

function bindFilters() {
  const sel = document.getElementById("filter-status");
  if (!sel) return;
  sel.addEventListener("change", () => {
    const val = sel.value;
    [...pipelineLayers.oil, ...pipelineLayers.gas].forEach(({ glow, main, data }) => {
      const show = val === "all" || data.status === val;
      if (show) {
        const group = data.type === "oil" ? layers.oilPipelines : layers.gasPipelines;
        if (!group.hasLayer(main)) {
          group.addLayer(glow);
          group.addLayer(main);
        }
      } else {
        layers.oilPipelines.removeLayer(glow);
        layers.oilPipelines.removeLayer(main);
        layers.gasPipelines.removeLayer(glow);
        layers.gasPipelines.removeLayer(main);
      }
    });
  });
}

function bindSearch() {
  const input = document.getElementById("global-search");
  const results = document.getElementById("search-results");
  if (!input || !results) return;

  const index = [];
  PRODUCTION_DATA.forEach(p => index.push({ kind: "Country", name: p.country, data: p, type: "country" }));
  PIPELINES.forEach(p => index.push({ kind: "Pipeline", name: p.name, data: p, type: "pipeline" }));
  REFINERIES.forEach(r => index.push({ kind: "Refinery", name: r.name, data: r, type: "refinery" }));
  FIELDS.forEach(f => index.push({ kind: "Field", name: f.name, data: f, type: "field" }));
  POWER_PLANTS.forEach(p => index.push({ kind: "Plant", name: p.name, data: p, type: "plant" }));

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) { results.hidden = true; return; }
    const hits = index.filter(i => i.name.toLowerCase().includes(q)).slice(0, 12);
    if (!hits.length) {
      results.innerHTML = `<div class="search-item">No matches</div>`;
      results.hidden = false;
      return;
    }
    results.innerHTML = hits.map((h, i) =>
      `<div class="search-item" data-idx="${i}"><span>${h.name}</span><span class="kind">${h.kind}</span></div>`
    ).join("");
    results.hidden = false;
    results.querySelectorAll(".search-item").forEach((el, i) => {
      el.addEventListener("click", () => {
        const hit = hits[i];
        results.hidden = true;
        input.value = hit.name;
        flyToAsset(hit);
      });
    });
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Escape") { results.hidden = true; input.blur(); }
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".search-wrap")) results.hidden = true;
  });
}

function flyToAsset(hit) {
  const d = hit.data;
  if (hit.type === "country") {
    map.flyTo([d.lat, d.lng], 4.5, { duration: 0.85 });
    showCountryDetail(d);
  } else if (hit.type === "pipeline") {
    const mid = d.coords[Math.floor(d.coords.length / 2)];
    map.flyTo(mid, 5, { duration: 0.85 });
    showDetail(d, "pipeline");
  } else {
    map.flyTo([d.lat, d.lng], 6, { duration: 0.85 });
    showDetail(d, hit.type);
  }
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
    });
  });
}

function bindMobileToggles() {
  const left = document.getElementById("left-panel");
  const right = document.getElementById("right-panel");
  document.getElementById("toggle-left")?.addEventListener("click", () => {
    left.classList.toggle("collapsed");
  });
  document.getElementById("toggle-right")?.addEventListener("click", () => {
    right.classList.toggle("collapsed");
  });
}

function showCountryDetail(p) {
  showDetail({
    name: p.country,
    production: `${p.production} Mb/d`,
    code: p.code,
    lat: p.lat,
    lng: p.lng
  }, "country");
}

function showDefaultIntel() {
  const panel = document.getElementById("detail-content");
  if (!panel) return;
  const top5 = PRODUCTION_DATA.slice(0, 5);
  const totalTop = top5.reduce((s, p) => s + p.production, 0).toFixed(1);
  panel.innerHTML = `
    <div class="default-intel">
      <h2>GLOBAL SNAPSHOT</h2>
      <p>Showing aggregate view. Click any country, pipeline, field or plant — or use search — to drill into a specific asset.</p>
      <div class="detail-stats">
        <div class="detail-stat"><div class="label">World liquids (approx)</div><div class="value">~102 Mb/d</div></div>
        <div class="detail-stat"><div class="label">Top 5 share</div><div class="value">${totalTop} Mb/d</div></div>
      </div>
      <p style="font-size:0.72rem;margin-bottom:0.5rem;color:var(--text-dim)">Top 5 producers (${DATA_AS_OF})</p>
      <div class="producers-list">
        ${top5.map((p, i) => `
          <div class="producer-item" data-idx="${i}">
            <span class="rank">${i + 1}</span>
            <span class="name">${p.country}</span>
            <span class="value">${p.production}</span>
          </div>
        `).join("")}
      </div>
      <p style="font-size:0.65rem;color:var(--text-dim);margin-top:0.9rem">
        Metric: <strong style="color:var(--accent-dim)">${DATA_METRIC}</strong>. Data as of ${DATA_AS_OF}.
      </p>
    </div>
  `;
  panel.querySelectorAll(".producer-item").forEach(el => {
    el.addEventListener("click", () => {
      const idx = +el.dataset.idx;
      const p = top5[idx];
      map.flyTo([p.lat, p.lng], 4.5, { duration: 0.85 });
      showCountryDetail(p);
    });
  });
}

function showDetail(asset, kind) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelector('[data-tab="intel"]').classList.add("active");
  document.getElementById("tab-intel").classList.add("active");

  const panel = document.getElementById("detail-content");
  let title, badge, meta, statsHtml, chartLabel;

  if (kind === "country") {
    title = asset.name;
    badge = "COUNTRY";
    meta = `<span>ISO: <b>${asset.code || "—"}</b></span><span>Metric: ${DATA_METRIC}</span><span>As of: ${DATA_AS_OF}</span>`;
    statsHtml = `
      <div class="detail-stat"><div class="label">Total liquids</div><div class="value">${asset.production}</div></div>
      <div class="detail-stat"><div class="label">Location</div><div class="value">${asset.lat?.toFixed?.(1) ?? "—"}°, ${asset.lng?.toFixed?.(1) ?? "—"}°</div></div>
    `;
    chartLabel = "Production history (illustrative)";
  } else if (kind === "pipeline") {
    title = asset.name;
    badge = asset.type.toUpperCase() + " PIPELINE";
    meta = `
      <span>Status: <b>${asset.status}</b></span>
      <span>Operator: ${asset.operator}</span>
      <span>Countries: ${asset.countries.join(", ")}</span>
    `;
    statsHtml = `
      <div class="detail-stat"><div class="label">Capacity</div><div class="value">${asset.capacity}</div></div>
      <div class="detail-stat"><div class="label">Length</div><div class="value">${asset.length}</div></div>
    `;
    chartLabel = "Relative throughput (illustrative)";
  } else if (kind === "refinery") {
    title = asset.name;
    badge = "REFINERY";
    meta = `<span>Operator: ${asset.operator}</span><span>Country: ${asset.country}</span>`;
    statsHtml = `
      <div class="detail-stat"><div class="label">Capacity</div><div class="value">${asset.capacity}</div></div>
      <div class="detail-stat"><div class="label">Location</div><div class="value">${asset.lat.toFixed(1)}°, ${asset.lng.toFixed(1)}°</div></div>
    `;
    chartLabel = "Utilization trend (sample)";
  } else if (kind === "field") {
    title = asset.name;
    badge = "PRODUCTION FIELD";
    meta = `<span>Operator: ${asset.operator}</span><span>Country: ${asset.country}</span>`;
    statsHtml = `
      <div class="detail-stat"><div class="label">Production</div><div class="value">${asset.production}</div></div>
      <div class="detail-stat"><div class="label">Location</div><div class="value">${asset.lat.toFixed(1)}°, ${asset.lng.toFixed(1)}°</div></div>
    `;
    chartLabel = "Historical output (illustrative)";
  } else {
    title = asset.name;
    badge = (asset.type || "POWER").toUpperCase() + " PLANT";
    meta = `<span>Country: ${asset.country}</span>`;
    statsHtml = `
      <div class="detail-stat"><div class="label">Capacity</div><div class="value">${asset.capacity}</div></div>
      <div class="detail-stat"><div class="label">Type</div><div class="value">${asset.type}</div></div>
    `;
    chartLabel = "Output profile (sample)";
  }

  panel.innerHTML = `
    <div class="detail-header">
      <h2>${title}</h2>
      <span class="type-badge">${badge}</span>
    </div>
    <div class="detail-meta">${meta}</div>
    <div class="detail-stats">${statsHtml}</div>
    <h3 style="font-size:0.68rem;color:var(--accent-dim);letter-spacing:0.1em;margin-bottom:0.45rem;">${chartLabel}</h3>
    <div class="chart-container">
      <canvas id="detail-chart"></canvas>
    </div>
    <p style="font-size:0.65rem;color:var(--text-dim);margin-top:0.85rem;">
      Curated snapshot · ${DATA_AS_OF}. Live feeds planned.
    </p>
  `;

  setTimeout(() => {
    const ctx = document.getElementById("detail-chart");
    if (!ctx) return;
    if (currentChart) currentChart.destroy();
    const historyKey = asset.country || asset.name || (asset.countries && asset.countries[0]) || "default";
    const data = SAMPLE_HISTORY[historyKey] || SAMPLE_HISTORY.default;
    currentChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: YEARS,
        datasets: [{
          label: "Index",
          data: data,
          borderColor: "#00e5ff",
          backgroundColor: "rgba(0, 229, 255, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: "#00e5ff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#7ab8d4", font: { size: 10 } }, grid: { color: "rgba(0, 100, 150, 0.12)" } },
          y: { ticks: { color: "#7ab8d4", font: { size: 10 } }, grid: { color: "rgba(0, 100, 150, 0.12)" } }
        }
      }
    });
  }, 40);
}

function renderAnalytics() {
  const top = PRODUCTION_DATA.slice(0, 8);
  const ctx = document.getElementById("share-chart");
  if (ctx) {
    if (shareChart) shareChart.destroy();
    shareChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: top.map(p => p.country),
        datasets: [{
          data: top.map(p => p.production),
          backgroundColor: [
            "#00e5ff", "#00c8e0", "#00a8cc", "#3ec4a8",
            "#7dd87a", "#f0e76b", "#ff9a1f", "#7ab8d4"
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: { color: "#7ab8d4", font: { size: 10 }, boxWidth: 10 }
          }
        }
      }
    });
  }

  const snap = document.getElementById("capacity-snapshot");
  if (snap) {
    const items = [
      { label: "Tracked pipelines", val: PIPELINES.length },
      { label: "Key refineries", val: REFINERIES.length },
      { label: "Major fields", val: FIELDS.length },
      { label: "Power plants", val: POWER_PLANTS.length },
      { label: "Top producer", val: "USA 21.1 Mb/d" },
      { label: "Kardashev index", val: "0.73" },
      { label: "Data vintage", val: DATA_AS_OF }
    ];
    snap.innerHTML = items.map(i =>
      `<div class="capacity-item"><span>${i.label}</span><span class="val">${i.val}</span></div>`
    ).join("");
  }
}

function renderTicker() {
  const track = document.getElementById("ticker-track");
  if (!track) return;
  const items = [...INTEL_EVENTS, ...INTEL_EVENTS];
  track.innerHTML = items.map(e =>
    `<span class="ticker-item"><strong>${e.text}</strong><span class="ago">${e.ago}</span></span>`
  ).join("");
}

function closeOnboarding() {
  const el = document.getElementById("onboarding");
  if (!el) return;
  el.hidden = true;
  el.style.display = "none";
  el.setAttribute("aria-hidden", "true");
  localStorage.setItem("kardashev_visited", "1");
}

function maybeShowOnboarding() {
  const key = "kardashev_visited";
  if (localStorage.getItem(key)) return;

  const el = document.getElementById("onboarding");
  if (!el) return;

  el.hidden = false;
  el.style.display = "flex";
  el.removeAttribute("aria-hidden");

  const btn = document.getElementById("onboarding-dismiss");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeOnboarding();
    });
  }

  el.addEventListener("click", (e) => {
    if (e.target === el) closeOnboarding();
  });

  document.addEventListener("keydown", function onEsc(e) {
    if (e.key === "Escape") {
      closeOnboarding();
      document.removeEventListener("keydown", onEsc);
    }
  });
}

function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toUTCString().replace("GMT", "UTC");
}

document.addEventListener("DOMContentLoaded", init);
