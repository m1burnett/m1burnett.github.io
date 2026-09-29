(function() {
  var FEATURED_IDS = [
    390704290, 242522329, 304601944, 259071743, 390603291, 259071722,
    241216055, 239016019, 242530910, 317515817, 347162090
  ];
  var GROUP_STYLES = {
    Plantae: { label: "Plants", color: "#276419", fillColor: "#4daf4a" },
    Animalia: { label: "Other animals", color: "#1f4f8f", fillColor: "#377eb8" },
    Insecta: { label: "Insects", color: "#8a5a00", fillColor: "#f0ad2e" },
    Arachnida: { label: "Arachnids", color: "#7b3f00", fillColor: "#b86b22" },
    Aves: { label: "Birds", color: "#6a3d9a", fillColor: "#984ea3" },
    Mammalia: { label: "Mammals", color: "#7a1f1f", fillColor: "#e15759" },
    Reptilia: { label: "Reptiles", color: "#4f6b00", fillColor: "#8da63f" },
    Amphibia: { label: "Amphibians", color: "#006d5b", fillColor: "#1b9e77" },
    Actinopterygii: { label: "Ray-finned fishes", color: "#005b96", fillColor: "#56b4e9" },
    Mollusca: { label: "Mollusks", color: "#9b4a00", fillColor: "#d95f02" },
    Fungi: { label: "Fungi", color: "#5d4037", fillColor: "#8d6e63" },
    Protozoa: { label: "Protozoans", color: "#525252", fillColor: "#969696" },
    Chromista: { label: "Chromists", color: "#6b6b00", fillColor: "#bdb76b" },
    Other: { label: "Other/unknown", color: "#4d4d4d", fillColor: "#999999" }
  };

  function ready(callback) {
    if (document.readyState !== "loading") {
      callback();
      return;
    }
    document.addEventListener("DOMContentLoaded", callback);
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function(character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function setStatus(element, message) {
    if (element) {
      element.textContent = message;
    }
  }

  function sleep(ms) {
    return new Promise(function(resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function getObservationName(observation) {
    if (observation.species_guess) {
      return observation.species_guess;
    }

    if (observation.taxon) {
      return observation.taxon.preferred_common_name || observation.taxon.name;
    }

    return "iNaturalist observation";
  }

  function getBroadGroup(observation) {
    if (observation.taxon && observation.taxon.iconic_taxon_name) {
      return observation.taxon.iconic_taxon_name;
    }

    return "Other";
  }

  function getGroupStyle(group) {
    return GROUP_STYLES[group] || GROUP_STYLES.Other;
  }

  function normalizePacificLongitude(longitude) {
    return longitude < 0 ? longitude + 360 : longitude;
  }

  function getPhotoUrl(observation) {
    if (!observation.photos || !observation.photos.length || !observation.photos[0].url) {
      return "";
    }

    return observation.photos[0].url.replace("square", "small");
  }

  function getCoordinates(observation) {
    if (observation.geojson && Array.isArray(observation.geojson.coordinates)) {
      return [
        normalizePacificLongitude(Number(observation.geojson.coordinates[0])),
        Number(observation.geojson.coordinates[1])
      ];
    }

    if (observation.location) {
      var parts = observation.location.split(",");
      if (parts.length === 2) {
        return [normalizePacificLongitude(Number(parts[1])), Number(parts[0])];
      }
    }

    return null;
  }

  function makePopup(observation) {
    var name = escapeHtml(getObservationName(observation));
    var scientificName = observation.taxon && observation.taxon.name ? escapeHtml(observation.taxon.name) : "";
    var observedOn = observation.observed_on ? escapeHtml(observation.observed_on) : "Date unknown";
    var place = observation.place_guess ? escapeHtml(observation.place_guess) : "";
    var url = observation.uri || ("https://www.inaturalist.org/observations/" + observation.id);
    var photoUrl = getPhotoUrl(observation);

    return [
      '<div class="inat-popup">',
      photoUrl ? '<img class="inat-popup__image" src="' + escapeHtml(photoUrl) + '" alt="">' : "",
      '<div class="inat-popup__title">' + name + "</div>",
      scientificName && scientificName !== name ? '<p class="inat-popup__meta"><em>' + scientificName + "</em></p>" : "",
      '<p class="inat-popup__meta">' + observedOn + "</p>",
      place ? '<p class="inat-popup__meta">' + place + "</p>" : "",
      '<p class="inat-popup__meta"><a href="' + escapeHtml(url) + '" target="_blank" rel="noopener">View on iNaturalist</a></p>',
      "</div>"
    ].join("");
  }

  function makeFeature(observation) {
    var coordinates = getCoordinates(observation);

    if (!coordinates || coordinates.length !== 2 || !Number.isFinite(coordinates[0]) || !Number.isFinite(coordinates[1])) {
      return null;
    }

    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinates
      },
      properties: observation
    };
  }

  function makeGroupPopup(group) {
    var root = document.createElement("div");
    root.className = "inat-popup-group";
    var content = document.createElement("div");
    content.className = "inat-popup-group__content";
    var pager = document.createElement("div");
    pager.className = "inat-popup__pager";
    var previous = document.createElement("button");
    var next = document.createElement("button");
    var count = document.createElement("span");
    count.setAttribute("aria-live", "polite");
    previous.type = next.type = "button";
    previous.innerHTML = '<i class="fas fa-chevron-left" aria-hidden="true"></i>';
    next.innerHTML = '<i class="fas fa-chevron-right" aria-hidden="true"></i>';
    previous.title = "Previous observation";
    next.title = "Next observation";
    previous.setAttribute("aria-label", previous.title);
    next.setAttribute("aria-label", next.title);
    pager.appendChild(previous);
    pager.appendChild(count);
    pager.appendChild(next);
    root.appendChild(content);
    root.appendChild(pager);

    function render() {
      content.innerHTML = makePopup(group.observations[group.index]);
      count.textContent = (group.index + 1) + " / " + group.observations.length;
      pager.hidden = group.observations.length < 2;
    }
    function change(delta) {
      group.index = (group.index + delta + group.observations.length) % group.observations.length;
      render();
      group.marker.getPopup().update();
    }
    previous.addEventListener("click", function() { change(-1); });
    next.addEventListener("click", function() { change(1); });
    root.addEventListener("keydown", function(event) {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        event.stopPropagation();
        change(event.key === "ArrowLeft" ? -1 : 1);
      }
    });
    L.DomEvent.disableClickPropagation(root);
    render();
    return root;
  }

  function keepPopupsInBounds(map) {
    var popup;
    var frame;
    var container = map.getContainer();
    map.createPane("inatPopups", container).style.zIndex = "1100";

    function position() {
      var size = map.getSize();
      container.style.setProperty("--inat-map-width", size.x + "px");
      container.style.setProperty("--inat-map-height", size.y + "px");
      if (!popup || !popup.getElement()) return;
      var element = popup.getElement();
      // Position in container coordinates so the box stays visible without panning.
      element.style.translate = "none";
      var box = element.getBoundingClientRect();
      var bounds = container.getBoundingClientRect();
      var anchor = map.latLngToContainerPoint(popup.getLatLng());
      var left = Math.max(bounds.left + 8, Math.min(bounds.left + anchor.x - box.width / 2, bounds.right - box.width - 8));
      var top = Math.max(bounds.top + 8, Math.min(bounds.top + anchor.y - box.height - 12, bounds.bottom - box.height - 26));
      element.style.translate = (left - box.left) + "px " + (top - box.top) + "px";
    }

    function schedule() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(position);
    }

    var observer = new ResizeObserver(position);
    map.on("popupopen", function(event) {
      if (popup) popup.off("contentupdate", schedule);
      observer.disconnect();
      popup = event.popup;
      popup.on("contentupdate", schedule);
      observer.observe(popup.getElement());
      position();
    });
    map.on("popupclose", function(event) {
      if (popup !== event.popup) return;
      popup.off("contentupdate", schedule);
      observer.disconnect();
      popup = null;
    });
    map.on("move zoom resize", schedule);
    map.on("unload", function() {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    });
    position();
  }

  function addPhotoCallouts(map, groups, observationsById) {
    var container = map.getContainer();
    var overlay = L.DomUtil.create("div", "inat-callouts", map.getPane("tooltipPane"));
    var lines = L.layerGroup().addTo(map);
    var frame;

    function overlaps(a, b, gap) {
      return a.x < b.x + b.width + gap && a.x + a.width + gap > b.x &&
        a.y < b.y + b.height + gap && a.y + a.height + gap > b.y;
    }

    function layout() {
      overlay.replaceChildren();
      lines.clearLayers();
      var size = map.getSize();
      var photoSize = size.x < 500 ? 44 : 60;
      var bounds = container.getBoundingClientRect();
      var occupied = Array.prototype.map.call(container.querySelectorAll(".leaflet-control"), function(element) {
        var rect = element.getBoundingClientRect();
        return { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height };
      });
      var points = Object.keys(groups).map(function(key) {
        return map.latLngToContainerPoint(groups[key].marker.getLatLng());
      }).filter(function(point) {
        return point.x >= -10 && point.y >= -10 && point.x <= size.x + 10 && point.y <= size.y + 10;
      });

      FEATURED_IDS.forEach(function(id) {
        var entry = observationsById[id];
        if (!entry || !getPhotoUrl(entry.observation)) return;
        var anchor = map.latLngToContainerPoint(entry.group.marker.getLatLng());
        if (anchor.x < 0 || anchor.y < 0 || anchor.x > size.x || anchor.y > size.y) return;

        // Search nearby free rectangles first, keeping every observation dot unobscured.
        var candidates = [];
        for (var y = 8; y + photoSize <= size.y - 8; y += 12) {
          for (var x = 8; x + photoSize <= size.x - 8; x += 12) {
            candidates.push({ x: x, y: y, width: photoSize, height: photoSize,
              distance: Math.pow(x + photoSize / 2 - anchor.x, 2) + Math.pow(y + photoSize / 2 - anchor.y, 2) });
          }
        }
        candidates.sort(function(a, b) { return a.distance - b.distance; });
        var position = candidates.find(function(candidate) {
          return !occupied.some(function(rect) { return overlaps(candidate, rect, 6); }) &&
            !points.some(function(point) {
              return overlaps(candidate, { x: point.x - 6, y: point.y - 6, width: 12, height: 12 }, 3);
            });
        });
        if (!position) return;
        occupied.push(position);

        var button = L.DomUtil.create("button", "inat-callout", overlay);
        button.type = "button";
        button.setAttribute("aria-label", "View " + getObservationName(entry.observation));
        button.dataset.observationId = String(id);
        var layerPosition = map.containerPointToLayerPoint([position.x, position.y]);
        button.style.left = layerPosition.x + "px";
        button.style.top = layerPosition.y + "px";
        button.style.width = button.style.height = photoSize + "px";
        var photo = document.createElement("img");
        photo.src = getPhotoUrl(entry.observation);
        photo.alt = "";
        button.appendChild(photo);
        L.DomEvent.disableClickPropagation(button);
        L.DomEvent.disableScrollPropagation(button);
        button.addEventListener("click", function() {
          entry.group.index = entry.group.observations.indexOf(entry.observation);
          entry.group.marker.openPopup();
        });
        var endpoint = L.point(
          Math.max(position.x, Math.min(position.x + photoSize, anchor.x)),
          Math.max(position.y, Math.min(position.y + photoSize, anchor.y))
        );
        L.polyline([entry.group.marker.getLatLng(), map.containerPointToLatLng(endpoint)], {
          color: "#555", weight: 1, opacity: 0.65, interactive: false
        }).addTo(lines);
      });
    }

    function schedule() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(layout);
    }
    map.on("movestart zoomstart", function() {
      window.cancelAnimationFrame(frame);
      overlay.replaceChildren();
      lines.clearLayers();
    });
    map.on("moveend zoomend resize", schedule);
    return schedule;
  }

  function buildApiUrl(user, page, perPage) {
    var url = new URL("https://api.inaturalist.org/v1/observations");

    url.searchParams.set("user_id", user);
    url.searchParams.set("geo", "true");
    url.searchParams.set("verifiable", "any");
    url.searchParams.set("order_by", "observed_on");
    url.searchParams.set("order", "desc");
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));
    url.searchParams.set("locale", "en");

    return url.toString();
  }

  async function fetchObservationPage(user, page, perPage) {
    var response = await fetch(buildApiUrl(user, page, perPage), {
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("iNaturalist request failed with status " + response.status);
    }

    return response.json();
  }

  function addLegend(map) {
    var legend = L.control({
      position: "bottomright"
    });

    legend.onAdd = function() {
      var element = L.DomUtil.create("div", "inat-legend");
      var groups = [
        "Plantae",
        "Insecta",
        "Arachnida",
        "Aves",
        "Mammalia",
        "Reptilia",
        "Amphibia",
        "Actinopterygii",
        "Mollusca",
        "Fungi",
        "Animalia",
        "Protozoa",
        "Chromista",
        "Other"
      ];

      element.innerHTML = [
        '<div class="inat-legend__title">Broad group</div>',
        groups.map(function(group) {
          var style = getGroupStyle(group);
          return [
            '<div class="inat-legend__item">',
            '<span class="inat-legend__swatch" style="background-color: ' + style.fillColor + '; border-color: ' + style.color + ';"></span>',
            "<span>" + escapeHtml(style.label) + "</span>",
            "</div>"
          ].join("");
        }).join("")
      ].join("");

      L.DomEvent.disableClickPropagation(element);
      return element;
    };

    legend.addTo(map);
  }

  ready(async function() {
    var mapElement = document.querySelector("[data-inat-map]");
    if (!mapElement) return;

    var statusElement = document.querySelector("[data-inat-status]");
    var user = mapElement.getAttribute("data-inat-user") || "m1burnett";
    var perPage = 200;
    var loaded = 0;
    var groups = {};
    var observationsById = {};

    if (!window.L) {
      setStatus(statusElement, "The map library did not load.");
      return;
    }

    var map = L.map(mapElement, {
      preferCanvas: true,
      scrollWheelZoom: false
    }).setView([0, 180], 2);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var observationsLayer = L.featureGroup().addTo(map);

    addLegend(map);
    keepPopupsInBounds(map);
    var refreshCallouts = addPhotoCallouts(map, groups, observationsById);

    function addObservations(results) {
      results.forEach(function(observation) {
        if (observationsById[observation.id]) return;
        var feature = makeFeature(observation);
        if (!feature) return;
        var coordinates = feature.geometry.coordinates;
        var key = coordinates.join(",");
        var group = groups[key];
        if (!group) {
          var style = getGroupStyle(getBroadGroup(observation));
          group = { observations: [], index: 0 };
          group.marker = L.circleMarker([coordinates[1], coordinates[0]], {
            radius: 5, color: style.color, weight: 1, fillColor: style.fillColor, fillOpacity: 0.72
          }).addTo(observationsLayer);
          group.marker.bindPopup(function() { return makeGroupPopup(group); }, {
            minWidth: 220, maxWidth: 260, autoPan: false, pane: "inatPopups", className: "inat-observation-popup"
          });
          groups[key] = group;
        }
        group.observations.push(observation);
        observationsById[observation.id] = { observation: observation, group: group };
        if (group.marker.isPopupOpen()) group.marker.setPopupContent(function() { return makeGroupPopup(group); });
      });
      refreshCallouts();
    }

    // Fetch featured records directly so their photos appear before the full history loads.
    var featuredRequest = fetch("https://api.inaturalist.org/v1/observations/" + FEATURED_IDS.join(","))
      .then(function(response) {
        if (!response.ok) throw new Error("Featured observations unavailable");
        return response.json();
      }).then(function(data) { addObservations(data.results || []); })
      .catch(function() { /* The normal history request can still supply these records. */ });

    try {
      var firstPage = await fetchObservationPage(user, 1, perPage);
      var totalResults = firstPage.total_results || 0;
      var totalPages = Math.max(1, Math.ceil(totalResults / perPage));

      function addResults(results) {
        addObservations(results);

        loaded += results.length;
        setStatus(
          statusElement,
          "Loaded " + loaded.toLocaleString() + " of " + totalResults.toLocaleString() + " public georeferenced observations..."
        );
      }

      addResults(firstPage.results || []);

      for (var page = 2; page <= totalPages; page += 1) {
        await sleep(120);
        addResults((await fetchObservationPage(user, page, perPage)).results || []);
      }
      await featuredRequest;

      if (observationsLayer.getLayers().length) {
        map.fitBounds(observationsLayer.getBounds(), {
          padding: [24, 24]
        });
      }

      setStatus(
        statusElement,
        "Showing " + Object.keys(observationsById).length.toLocaleString() + " public georeferenced observations from iNaturalist user " + user + "."
      );
    } catch (error) {
      setStatus(statusElement, "Could not load iNaturalist observations. Please try refreshing the page.");
    }
  });
})();
