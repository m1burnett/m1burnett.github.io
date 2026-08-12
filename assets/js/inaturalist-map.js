(function() {
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

  function getGroupLabel(group) {
    return getGroupStyle(group).label;
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
    var broadGroup = getBroadGroup(observation);
    var broadGroupLabel = escapeHtml(getGroupLabel(broadGroup));
    var observedOn = observation.observed_on ? escapeHtml(observation.observed_on) : "Date unknown";
    var uncertainty = observation.positional_accuracy ? Number(observation.positional_accuracy).toLocaleString() + " m" : "";
    var place = observation.place_guess ? escapeHtml(observation.place_guess) : "";
    var url = observation.uri || ("https://www.inaturalist.org/observations/" + observation.id);
    var photoUrl = getPhotoUrl(observation);

    return [
      '<div class="inat-popup">',
      photoUrl ? '<img class="inat-popup__image" src="' + escapeHtml(photoUrl) + '" alt="">' : "",
      '<div class="inat-popup__title">' + name + "</div>",
      scientificName && scientificName !== name ? '<p class="inat-popup__meta"><em>' + scientificName + "</em></p>" : "",
      '<p class="inat-popup__meta">' + broadGroupLabel + "</p>",
      '<p class="inat-popup__meta">' + observedOn + "</p>",
      uncertainty ? '<p class="inat-popup__meta">Location uncertainty: ' + uncertainty + "</p>" : "",
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
    var features = [];

    if (!window.L) {
      setStatus(statusElement, "The map library did not load.");
      return;
    }

    var map = L.map(mapElement, {
      preferCanvas: true,
      scrollWheelZoom: false
    }).setView([0, 180], 2);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    var observationsLayer = L.geoJSON(null, {
      pointToLayer: function(feature, latlng) {
        var style = getGroupStyle(getBroadGroup(feature.properties));

        return L.circleMarker(latlng, {
          radius: 5,
          color: style.color,
          weight: 1,
          fillColor: style.fillColor,
          fillOpacity: 0.72
        });
      },
      onEachFeature: function(feature, layer) {
        layer.bindPopup(makePopup(feature.properties));
      }
    }).addTo(map);

    addLegend(map);

    try {
      var firstPage = await fetchObservationPage(user, 1, perPage);
      var totalResults = firstPage.total_results || 0;
      var totalPages = Math.max(1, Math.ceil(totalResults / perPage));

      function addResults(results) {
        results.forEach(function(observation) {
          var feature = makeFeature(observation);
          if (feature) {
            features.push(feature);
          }
        });

        observationsLayer.addData({
          type: "FeatureCollection",
          features: features.splice(0, features.length)
        });

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

      if (observationsLayer.getLayers().length) {
        map.fitBounds(observationsLayer.getBounds(), {
          padding: [24, 24]
        });
      }

      setStatus(
        statusElement,
        "Showing " + observationsLayer.getLayers().length.toLocaleString() + " public georeferenced observations from iNaturalist user " + user + "."
      );
    } catch (error) {
      setStatus(statusElement, "Could not load iNaturalist observations. Please try refreshing the page.");
    }
  });
})();
