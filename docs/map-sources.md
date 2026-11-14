# Orlando 2026 festival map research

Retrieved 2026-11-14 from the official festival's current Hours & Info page:
https://www.vanswarpedtourorlando.com/hoursandinfo

The Festival Map section has a "Download The Map" link to:
https://static.wixstatic.com/media/3f3fbe_23ef597e8a9b416392a557051e00ed34~mv2.png

Downloaded image: `orlando-2026-official-map.png`; 1080 × 1350; 1,173,872 bytes. Original art has no printed year. The current official homepage identifies Nov 14–15, 2026, and an independent 2026 lineup page explicitly identifies this same image as the festival map:
https://lineupscout.com/warped-tour-orlando

## Orientation and geometry

W Church St is at the top; S Tampa Ave at the left; S Norton Ave at the right; Long St and SR408 are at the bottom. This approximately corresponds to north-up.

This is a stylized illustration, not a surveyed/georeferenced map. Stadium and other landmarks are substantially distorted. A single geographic bounding-box overlay cannot be precise. Any GPS dot on this image must be visibly described as approximate, independently of the phone's reported GPS accuracy. Calibration at a known on-site landmark is useful but does not remove distortion elsewhere.

## Real coordinate reference points

Source: OpenStreetMap API, retrieved 2026-11-14.
https://www.openstreetmap.org/api/0.6/map?bbox=-81.407,28.533,-81.397,28.543

| Reference | Latitude | Longitude | Approx art x | Approx art y |
|---|---:|---:|---:|---:|
| Tampa Ave × West Church St | 28.5401379 | -81.4054887 | 100 | 272 |
| Norton Ave × West Church St | 28.5401628 | -81.3982898 | 978 | 272 |
| Tampa Ave × Long St | 28.5368227 | -81.4053640 | 112 | 810 |

Camping World Stadium OSM polygon bounds: north 28.5400626, south 28.5379717, west -81.4039266, east -81.4015742. Art stadium outer extent is approximately x414..553, y281..469. These are not precise matching survey points.

Raw source documents retained as `hours.html` and `osm.xml`. Do not ship those in application assets.

## Main stages shown in the map

Ghost; Beatbox; Larceny Bourbon; Alligator; Vans; Off The Wall; Club Wyndham; Verizon; Warped Unplugged.

Other marked destinations include entrance, water stations, restrooms, first aid, Artist Alley, Record Label Row, Charity Circle, Circle 6 Wrestling, Vert Ramp, Nitro Circus and Warped Museum. All map artwork remains owned by its respective rights holders; attribute the official festival source.

## Approximate stadium control points

These match the named OSM outer stadium polygon corners to the estimated outer art rectangle (not surveyed corresponding points):

| Reference | Latitude | Longitude | Art x | Art y |
|---|---:|---:|---:|---:|
| Stadium NW | 28.5399327 | -81.4038477 | 414 | 282 |
| Stadium NE | 28.5399543 | -81.4016739 | 553 | 282 |
| Stadium SW | 28.5381677 | -81.4038241 | 414 | 468 |
| Stadium SE | 28.5381919 | -81.4016486 | 553 | 468 |

Street-only affine projection places stadium center near (434,456), versus art center approximately (483,378), so it introduces a large local offset. A piecewise longitude/latitude projection incorporating the stadium footprint can reduce this systematic mismatch. This remains an approximation because the illustration does not preserve geography, and must not imply that the browser's GPS accuracy equals accuracy on the artwork.

## Implemented projection

`geo.js` uses separable piecewise interpolation. Longitude knots use Tampa at −81.4054887→100, stadium NW at −81.4038477→414, stadium NE at −81.4016739→553, and Norton at −81.3982898→978. Latitude knots average the two Church intersections (28.5401504→272), the stadium north corners (28.5399435→282), the south corners (28.5381798→468), and Tampa/Long (28.5368227→810). This simplification straightens slightly skewed real streets and stadium edges. Control-point pixel estimates are approximate.

The blue GPS accuracy circle on artwork is a local scale estimate; it cannot account for illustration distortion. Coordinates projected outside the broad illustration region x90..990 / y265..975 do not receive an artwork dot. That rectangle is an artwork extent check, not a claim that a visitor is inside the ticketed perimeter.
