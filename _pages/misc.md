---
layout: archive
title: "Miscellanea"
permalink: /misc/
author_profile: true
---

## Check out my iNaturalist observations!

This map loads observations from my [iNaturalist profile](https://www.inaturalist.org/observations?place_id=any&user_id=m1burnett&verifiable=any):

<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
  crossorigin="">

<style>
.inat-map {
  width: 100%;
  height: 620px;
  margin: 1em 0 0.35em;
  border: 1px solid var(--global-border-color);
  border-radius: 4px;
}

.inat-map-status {
  margin-top: 0.35em;
  font-size: 0.75em;
  color: var(--global-text-color-light);
}

.inat-popup {
  max-width: 230px;
}

.inat-popup__image {
  display: block;
  width: 100%;
  max-height: 150px;
  object-fit: cover;
  margin-bottom: 0.5em;
  border-radius: 4px;
}

.inat-popup__title {
  margin-bottom: 0.25em;
  font-weight: 700;
}

.inat-popup .inat-popup__meta {
  margin: 0.2em 0;
  line-height: 1.3;
}

.inat-popup__pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0 0;
  gap: 12px;
  flex-shrink: 0;
}

.inat-observation-popup .leaflet-popup-content {
  max-width: calc(var(--inat-map-width) - 60px);
}

.inat-observation-popup .leaflet-popup-tip-container {
  display: none;
}

.inat-popup-group {
  display: flex;
  flex-direction: column;
  max-height: calc(var(--inat-map-height) - 78px);
}

.inat-popup-group__content {
  min-height: 0;
  overflow-y: auto;
}

.inat-popup__pager[hidden] {
  display: none;
}

.inat-popup__pager button {
  width: 32px;
  height: 32px;
  padding: 0;
  color: #333;
  background: #f4f4f4;
  border: 1px solid #bbb;
  border-radius: 4px;
  cursor: pointer;
}

.inat-callouts {
  position: absolute;
  inset: 0;
  z-index: 450;
  pointer-events: none;
}

.inat-callout {
  position: absolute;
  padding: 2px;
  margin: 0;
  background: white;
  border: 1px solid #666;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  pointer-events: auto;
  cursor: pointer;
}

.inat-map .inat-callout img {
  display: block;
  width: 100%;
  height: 100%;
  margin: 0;
  object-fit: cover;
  border-radius: 2px;
}

.inat-callout:focus-visible,
.inat-popup__pager button:focus-visible {
  outline: 3px solid #007d92;
  outline-offset: 2px;
}

.inat-legend {
  padding: 0.65em 0.75em;
  color: var(--global-text-color);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--global-border-color);
  border-radius: 4px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.18);
  font-size: 0.78em;
  line-height: 1.25;
}

.inat-legend__title {
  margin-bottom: 0.35em;
  font-weight: 700;
}

.inat-legend__item {
  display: flex;
  align-items: center;
  gap: 0.45em;
  margin: 0.18em 0;
  white-space: nowrap;
}

.inat-legend__swatch {
  display: inline-block;
  width: 0.8em;
  height: 0.8em;
  border: 1px solid rgba(0, 0, 0, 0.35);
  border-radius: 999px;
}

@media (max-width: 700px) {
  .inat-map {
    height: 430px;
  }

  .inat-legend {
    font-size: 0.68em;
  }
}
</style>

<div id="inat-observations-map" class="inat-map" data-inat-map data-inat-user="m1burnett"></div>
<p class="inat-map-status" data-inat-status>Loading iNaturalist observations...</p>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
  integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
  crossorigin=""></script>
<script src="{{ '/assets/js/inaturalist-map.js' | relative_url }}" defer></script>

## Fieldwork GPS tracks

<figure>
  <a href="{{ site.baseurl }}/images/trackmap.png">
    <img src="{{ site.baseurl }}/images/trackmap.png" alt="GPS tracks from Tetiaroa fieldwork" style="display: block; width: 100%; height: auto; border: 1px solid var(--global-border-color); border-radius: 4px;">
  </a>
</figure>

<figure>
  <a href="{{ site.baseurl }}/images/trackmap-detail.png">
    <img src="{{ site.baseurl }}/images/trackmap-detail.png" alt="Detailed GPS tracks and field sites on Tetiaroa" style="display: block; width: 100%; height: auto; border: 1px solid var(--global-border-color); border-radius: 4px;">
  </a>
</figure>
