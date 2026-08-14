// THE KARDASHEV — Main Application Logic (v0.2 — visibility & density upgrade)

let map;
let layers = {
  oilPipelines: L.layerGroup(),
  gasPipelines: L.layerGroup(),
  refineries: L.layerGroup(),
  fields: L.layerGroup(),
  plants: L.layerGroup()
};
let currentChart = null;

function init() {
  initMap();
  renderTopProducers();
  renderPipelines();
  renderRefineries();
  renderFields();
  renderPlants();
  bindLayerToggles();
  updateClock();
  setInterval(updateClock, 1000);

  document.getElementById("btn-reset-view").addEventListener("click", () => {
    map.setView([25, 20], 2.2);
  });

  // Update stats with real counts
  const pipeEl = document.getElementById("stat-pipelines");
  const refEl = document.getElementById("stat-refineries");
  if (pipeEl) pipeEl.textContent = PIPELINES.length;
  if (refEl) refEl.textContent = REFINERIES.length;
}

function initMap() {
  map = L.map("map", {
    zoomControl: true,
    attributionControl: false,
    minZoom: 2,
    maxZoom: 10
  }).setView([25, 20], 2.2);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);

  Object.values(layers).forEach(l => l.addTo(map));
}

function renderTopProducers() {
  const container = document.getElementById("top-producers");
  container.innerHTML = PRODUCTION_DATA.slice(0, 10).map((p, i) => `
    <div class="producer-item">
      <span class="rank">${i + 1}</span>
      <span class="name">${p.country}</span>
      <span class="value">${p.production} Mb/d</span>
    </div>
  `).join("");
}

function renderPipelines() {
  PIPELINES.forEach(p => {
    const isOil = p.type === "oil";
    const mainColor = isOil ? "#ff9a1f" : "#00c8ff";
    const glowColor = isOil ? "rgba(255, 140, 0, 0.4)" : "rgba(0, 180, 255, 0.4)";

    // Wide glow underlay
    const glow = L.polyline(p.coords, {
      color: glowColor,
      weight: 11,
      opacity: 0.55,
      lineCap: "round",
      lineJoin: "round",
      interactive: false
    });

    // Core line
    const main = L.polyline(p.coords, {
      color: mainColor,
      weight: 4.5,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round"
    });

    main.bindPopup(`
      <strong style="font-size:1rem">${p.name}</strong><br>
      <span style="color:#7ab8d4">${p.type.toUpperCase()} • ${p.status}</span><br>
      Capacity: <b>${p.capacity}</b><br>
      Length: ${p.length}<br>
      Operator: ${p.operator}
    `, { maxWidth: 280 });

    main.on("mouseover", function () {
      this.setStyle({ weight: 7.5, opacity: 1 });
      glow.setStyle({ weight: 16, opacity: 0.7 });
    });
    main.on("mouseout", function () {
      this.setStyle({ weight: 4.5, opacity: 0.95 });
      glow.setStyle({ weight: 11, opacity: 0.55 });
    });
    main.on("click", () => showDetail(p, "pipeline"));

    if (isOil) {
      layers.oilPipelines.addLayer(glow);
      layers.oilPipelines.addLayer(main);
    } else {
      layers.gasPipelines.addLayer(glow);
      layers.gasPipelines.addLayer(main);
    }
  });
}

function createIcon(type) {
  const map = {
    refinery: { bg: "#ff8c00", size: 16 },
    field: { bg: "#ffcc00", size: 14 },
    plant: { bg: "#00ff9d", size: 14 }
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

function showDetail(asset, kind) {
  const panel = document.getElementById("detail-content");
  let title, badge, meta, statsHtml, chartLabel;

  if (kind === "pipeline") {
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
    chartLabel = "Relative Throughput Index (illustrative)";
  } else if (kind === "refinery") {
    title = asset.name;
    badge = "REFINERY";
    meta = `
      <span>Operator: ${asset.operator}</span>
      <span>Country: ${asset.country}</span>
    `;
    statsHtml = `
      <div class="detail-stat"><div class="label">Capacity</div><div class="value">${asset.capacity}</div></div>
      <div class="detail-stat"><div class="label">Location</div><div class="value">${asset.lat.toFixed(1)}°, ${asset.lng.toFixed(1)}°</div></div>
    `;
    chartLabel = "Utilization Trend (sample)";
  } else if (kind === "field") {
    title = asset.name;
    badge = "PRODUCTION FIELD";
    meta = `
      <span>Operator: ${asset.operator}</span>
      <span>Country: ${asset.country}</span>
    `;
    statsHtml = `
      <div class="detail-stat"><div class="label">Production</div><div class="value">${asset.production}</div></div>
      <div class="detail-stat"><div class="label">Location</div><div class="value">${asset.lat.toFixed(1)}°, ${asset.lng.toFixed(1)}°</div></div>
    `;
    chartLabel = "Historical Output (illustrative)";
  } else {
    title = asset.name;
    badge = (asset.type || "POWER").toUpperCase() + " PLANT";
    meta = `<span>Country: ${asset.country}</span>`;
    statsHtml = `
      <div class="detail-stat"><div class="label">Capacity</div><div class="value">${asset.capacity}</div></div>
      <div class="detail-stat"><div class="label">Type</div><div class="value">${asset.type}</div></div>
    `;
    chartLabel = "Output Profile (sample)";
  }

  panel.innerHTML = `
    <div class="detail-header">
      <h2>${title}</h2>
      <span class="type-badge">${badge}</span>
    </div>
    <div class="detail-meta">${meta}</div>
    <div class="detail-stats">${statsHtml}</div>
    <h3 style="font-size:0.75rem;color:var(--accent-dim);letter-spacing:0.1em;margin-bottom:0.5rem;">${chartLabel}</h3>
    <div class="chart-container">
      <canvas id="detail-chart"></canvas>
    </div>
    <p style="font-size:0.7rem;color:var(--text-dim);margin-top:1rem;">
      Curated data for THE KARDASHEV. Live EIA / GEM / Ember feeds planned.
    </p>
  `;

  setTimeout(() => {
    const ctx = document.getElementById("detail-chart");
    if (!ctx) return;
    if (currentChart) currentChart.destroy();

    const historyKey = asset.country || (asset.countries && asset.countries[0]) || "default";
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
          pointRadius: 3.5,
          pointBackgroundColor: "#00e5ff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: "#7ab8d4", font: { size: 10 } },
            grid: { color: "rgba(0, 100, 150, 0.15)" }
          },
          y: {
            ticks: { color: "#7ab8d4", font: { size: 10 } },
            grid: { color: "rgba(0, 100, 150, 0.15)" }
          }
        }
      }
    });
  }, 40);
}

function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toUTCString().replace("GMT", "UTC");
}

document.addEventListener("DOMContentLoaded", init);