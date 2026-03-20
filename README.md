# StarMap10

Interactive 3D star map of all known stellar systems within 10 parsecs of the Sun.

Built within 10 prompts at Claude with Vue 3, Three.js, and real astronomical data from the most complete nearby-star catalogs available.

![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883)
![Three.js](https://img.shields.io/badge/Three.js-r183-000000)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

## Features

- **3D visualization** of ~500 stellar objects rendered via InstancedMesh (single draw call)
- **Real astrophysical data**: positions from Gaia EDR3 parallaxes, magnitudes, spectral types
- **Physically-based star colors** using the Ballesteros (2012) B-V to RGB formula
- **Post-processing bloom** (UnrealBloomPass) for realistic glow effects
- **Background starfield** — procedural distant stars beyond the 10 pc sample
- **Interactive controls**: OrbitControls (rotate/zoom/pan), click to select, hover tooltips
- **Smooth camera fly-to** with cubic ease-in-out interpolation
- **Measurement tape**: Shift+Click two stars to measure distance in parsecs and light-years
- **Search** with autocomplete across the full catalog
- **Filters**: distance, magnitude, spectral class toggles (O B A F G K M L T Y)
- **Catalog toggle**: switch between main stars and the full 10pc sample
- **Proximity labels** for notable stars (Sirius, Proxima Centauri, Barnard's Star, etc.)
- **HUD**: coordinate axes, camera position, scale bar, star count
- **Star info sidebar** with photometry, position, and links to SIMBAD/Wikipedia

## Example

<video src="assets/example.mp4" controls width="600"></video>

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

The app opens at `http://localhost:5173`. Use mouse to orbit, scroll to zoom, click stars for details.

## Controls

| Action | Input |
| --- | --- |
| Orbit | Left mouse drag |
| Zoom | Scroll wheel |
| Pan | Right mouse drag |
| Select star | Click |
| Measure distance | Shift+Click two stars |
| Search | Type in search box (top-left) |

## Project Structure

```text
src/
├── api/            # Catalog loaders (JSON, CSV, The10pcSample_v2)
├── math/           # Coordinate conversion, B-V color, luminosity
├── engine/         # Three.js core (SceneManager, StarRenderer, CameraManager,
│                   #   InteractionManager, SunObject, BackgroundStarfield, StarLabels)
├── components/     # Vue UI (StarMap, StarInfo, SearchPanel, MapControls, HUD, ViewToggle)
└── stores/         # Pinia state (starStore)

public/
├── data/
│   └── catalog-10pc.json       # Curated catalog (~80 well-known stars)
└── The10pcSample_v2.csv        # Full 10pc sample (562 objects)
```

## Tech Stack

- **Vue 3** — Composition API with `<script setup lang="ts">`
- **Three.js** — WebGL rendering, InstancedMesh, EffectComposer, UnrealBloomPass
- **Pinia** — Reactive state management
- **TypeScript** — Strict mode
- **Vite** — Build tooling
- **d3-dsv** — CSV parsing

## Coordinate System

Stars are placed in a heliocentric Cartesian frame:

- **X** — toward the vernal equinox (RA = 0h)
- **Y** — toward RA = 6h
- **Z** — toward the North Celestial Pole (Dec = +90°)
- **Units** — parsecs (1 pc = 3.26 light-years)
- **Sun** at the origin (0, 0, 0)

Conversion from equatorial coordinates:

```text
x = D · cos(δ) · cos(α)
y = D · cos(δ) · sin(α)
z = D · sin(δ)
```

where D = 1000 / π (distance in parsecs from parallax in milliarcseconds).

## Data Sources & Credits

This project would not be possible without the work of the astronomical community that produced and maintains the catalogs of nearby stars.

### The 10 Parsec Sample (v2)

> C. Reylé, K. Jardine, P. Fouqué, J.A. Caballero, R.L. Smart, A. Sozzetti
> *The 10 parsec sample in the Gaia era*
> Astronomy & Astrophysics, 650, A201 (2021)
> DOI: [10.1051/0004-6361/202140985](https://doi.org/10.1051/0004-6361/202140985)

The primary dataset (`The10pcSample_v2.csv`) is maintained at the [GUCDS/GCNS portal](https://gucds.inaf.it/GCNS/The10pcSample/).

### Gaia Mission

> Gaia Collaboration, et al.
> *Gaia Early Data Release 3: Summary of the contents and survey properties*
> A&A, 649, A1 (2021)

Parallaxes, proper motions, and photometry (G, G_BP, G_RP) used in this project come from the Gaia EDR3 catalog. Gaia is an ESA mission processed by the Gaia Data Processing and Analysis Consortium (DPAC).

### RECONS (Research Consortium on Nearby Stars)

> T.J. Henry, W.-C. Jao, and the RECONS team
> [www.recons.org](http://www.recons.org/)

Historical reference for the nearest star census and distance measurements.

### Additional Resources

- [gruze.org/10pc](https://gruze.org/10pc/resources/) — Community-maintained 10 pc resources and visualizations
- [SIMBAD](https://simbad.u-strasbg.fr/) — Astronomical database for object identification (CDS, Strasbourg)
- [Ballesteros (2012)](https://doi.org/10.1209/0295-5075/97/34008) — B-V color index to effective temperature and RGB conversion formula used for star colors

## License

Private project. Star catalog data is subject to the original authors' terms — see citations above.
