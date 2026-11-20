# Map data and design references

| Asset | Source and maintenance notes |
| --- | --- |
| Neighborhood outlines | [City of Milwaukee DCD and ITMD-GIS, neighborhood layer 0](https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/AGO/neighborhoods/MapServer/0). The [bundled paths](../src/features/map/boundaries.json) use `NEIGHBORHD`, GeoJSON in EPSG:4326, and generalization of 0.00035°. Project into the 360 × 240 frame with `x = (longitude + 87.951) × 4400` and `y = (43.09 − latitude) × 6000`. Keep rings whose bounds intersect the frame and round coordinates to one decimal. |
| Homicides and nonfatal shootings | [MHRC 2016 annual report, appendix tables 16–17](https://city.milwaukee.gov/ImageLibrary/Groups/healthAuthors/OVP/Reports/2016MHRCAnnualReport9-29-2017FINAL.pdf). The [incident series](../src/domain/seed.ts) uses 2014–2016 neighborhood totals. Update the map’s period and attribution whenever you replace this series. |
| Winter drive photo | [Original image](https://images.unsplash.com/photo-1445205170230-053b83016050) · [Unsplash license](https://unsplash.com/license) |

**Original concept screens** · [Community and requests](references/community.jpg) · [Map and coordination](references/map.jpg) · [Impact and partners](references/impact.jpg)
