// THE KARDASHEV — Main Application Logic

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
    map.setView([25, 20], 2);
  });
}

function initMap() {
  map = L.map("map", {
    zoomControl: true,
    attributionControl: false
  }).setView([25, 20], 2);

  // Dark basemap
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);

  // Add layer groups
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
    const color = p.type === "oil" ? "#ff8c00" : "#00bfff";
    const weight = p.type === "oil" ? 3 : 2.5;
    const polyline = L.polyline(p.coords, {
      color,
      weight,
      opacity: 0.85,
      lineCap: "round"
    });

    polyline.bindPopup(`
      <strong>${p.name}</strong><br>
      Type: ${p.type.toUpperCase()} • ${p.status}<br>
      Capacity: ${p.capacity}<br>
      Length: ${p.length}<br>
      Operator: ${p.operator}
    `);

    polyline.on("click", () => showDetail(p, "pipeline"));

    if (p.type === "oil") {
      layers.oilPipelines.addLayer(polyline);
    } else {
      layers.gasPipelines.addLayer(polyline);
    }
  });
}

function createIcon(className) {
  return L.divIcon({
    className: "",
    html: `<div class="${className}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

function renderRefineries() {
  REFINERIES.forEach(r => {
    const marker = L.marker([r.lat, r.lng], {
      icon: createIcon("marker-refinery")
    });
    marker.bindPopup(`<strong>${r.name}</strong><br>${r.capacity}<br>${r.operator}`);
    marker.on("click", () => showDetail(r, "refinery"));
    layers.refineries.addLayer(marker);
  });
}

function renderFields() {
  FIELDS.forEach(f => {
    const marker = L.marker([f.lat, f.lng], {
      icon: createIcon("marker-field")
    });
    marker.bindPopup(`<strong>${f.name}</strong><br>${f.production}<br>${f.operator}`);
    marker.on("click", () => showDetail(f, "field"));
    layers.fields.addLayer(marker);
  });
}

function renderPlants() {
  POWER_PLANTS.forEach(p => {
    const marker = L.marker([p.lat, p.lng], {
      icon: createIcon("marker-plant")
    });
    marker.bindPopup(`<strong>${p.name}</strong><br>${p.capacity} • ${p.type}`);
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
    el.addEventListener("change", () => {
      if (el.checked) {
        map.addLayer(layer);
      } else {
        map.removeLayer(layer);
      }
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
      <span>Status: ${asset.status}</span>
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
    badge = asset.type.toUpperCase() + " PLANT";
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
      Data is curated for THE KARDASHEV MVP. Live feeds (EIA, GEM, Ember) can be integrated next.
    </p>
  `;

  // Simple illustrative chart
  setTimeout(() => {
    const ctx = document.getElementById("detail-chart");
    if (!ctx) return;
    if (currentChart) currentChart.destroy();

    const historyKey = asset.country || asset.countries?.[0] || "default";
    const data = SAMPLE_HISTORY[historyKey] || SAMPLE_HISTORY.default;

    currentChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: YEARS,
        datasets: [{
          label: "Index",
          data: data,
          borderColor: "#00e5ff",
          backgroundColor: "rgba(0, 229, 255, 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            ticks: { color: "#7ab8d4", font: { size: 10 } },
            grid: { color: "rgba(0, 100, 150, 0.2)" }
          },
          y: {
            ticks: { color: "#7ab8d4", font: { size: 10 } },
            grid: { color: "rgba(0, 100, 150, 0.2)" }
          }
        }
      }
    });
  }, 50);
}

function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toUTCString().replace("GMT", "UTC");
}

// Boot
document.addEventListener("DOMContentLoaded", init);