---
layout: archive
title: "Data"
permalink: /data/
author_profile: true
---

Pacific Atoll Vegetation Maps
======
The 235 vegetation maps produced by [Burnett et al. (2024)](https://doi.org/10.1088/1748-9326/ad8c66) can be downloaded from Dryad ([https://doi.org/10.5061/dryad.0k6djhb7x](https://doi.org/10.5061/dryad.0k6djhb7x)) or visualized on The Nature Conservancy's [Geospatial Conservation Atlas](https://tnc.maps.arcgis.com/apps/instant/basic/index.html?appid=2bd5e7a72c63416ca5e137d840a0da93).

The older vegetation map of Palmyra Atoll produced by [Burnett et al. (2019)](https://doi.org/10.1080/01431161.2019.1594440) can be downloaded from the Open Science Framework ([https://doi.org/10.17605/OSF.IO/J2STA](https://doi.org/10.17605/OSF.IO/J2STA)).


Congo Basin Evapotranspiration and Climate Data
====
The evapotranspiration, precipitation, terrestrial water storage, river discharge, and other data produced by [Burnett et al. (2020)](https://doi.org/10.5194/hess-24-4189-2020) for the Congo Basin can be downloaded from the Open Science Framework ([https://doi.org/10.17605/OSF.IO/JPVMB](https://doi.org/10.17605/OSF.IO/JPVMB)).


Modeling Sap Flow in the Irregular Trunks of *Pisonia grandis*
====
Data from [Burnett et al. (2026)](https://doi.org/10.1016/j.agrformet.2026.111357)'s investigation of sap flow estimates in irregularly shaped tree trunks can be downloaded from Dryad ([https://doi.org/10.5061/dryad.x0k6djj0n](https://doi.org/10.5061/dryad.x0k6djj0n)).



Tetiaroa Atoll Weather Data (January 2024 - September 2025)
====
From January 2024 to September 2025, I collected hourly weather data from the Meteo-France weather station on Tetiaroa Atoll. These data cannot be accessed publicly at time of writing, so perhaps my dataset will be useful for someone. I created a mostly complete gap-filled time series using a METER ATMOS 41 weather station and a HOBO MX2202 light intensity pendant, both positioned next to the Meteo-France station. I also have a lot of 6-minute timestep data from the Meteo-France station, but I have not done anything with these data.

Meteorological variables include:

- Air temperature (C)
- Relative humidity (%)
- Wind direction (16 compass directions)
- Wind average speed (km/hr)
- Wind gust speed (km/hr)
- Precipitation (mm)
- Solar radiation (W/m2)
- Barometric pressure (kpa; from ATMOS 41)

The gap-filled data can be downloaded [here]({{ site.baseurl }}/files/tetiaroa-gap-filled-wx-hourly-2025-09-18.csv).

A README file explaining the gap-filling protocol can be downloaded [here]({{ site.baseurl }}/files/Tetiaroa weather data readme.docx).
