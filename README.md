# Public Situational Awareness Dashboard

A React-based dashboard for visualizing global situational awareness with interactive map, live tracking, and briefings.

## Features

- Interactive orthographic globe map with drag, zoom, and preset regions
- Real-time synthetic tracking of aircraft, vessels, and satellites
- Military and commercial asset filtering
- Live feed and event timeline
- Country intelligence briefings
- Responsive UI with dark theme

The dashboard currently uses deterministic simulated data. Previous OSINT/proxy plumbing was removed from the main runtime because it depended on optional network/provider configuration and made the demo less reliable.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:5173` (or the URL shown in the terminal).

## Project Structure

- `src/components/PublicSituationalAwarenessDashboard.jsx` - Dashboard state orchestrator
- `src/components/GlobeSurface.jsx` - Interactive SVG globe and map layers
- `src/components/ControlsPanel.jsx` - Filters, live controls, and layer toggles
- `src/components/RegistryPanel.jsx` - Filtered track registry
- `src/components/AssetDetailPanel.jsx` - Selected asset detail panel
- `src/components/RightRailPanels.jsx` - Chokepoint, military, and live feed panels
- `src/data/` - Scenario constants and mock asset definitions
- `src/lib/` - Geo helpers, track stepping, summaries, and shared utilities
- `src/components/ui/` - UI component library
- `src/App.jsx` - App entry point
- `src/main.jsx` - React root
- `index.html` - HTML template

## Dependencies

- React 18
- Vite
- D3-Geo for map projections
- Topojson-Client for world atlas data
- Lucide-React for icons

## Controls

- **Map Navigation:** Drag to rotate, scroll to zoom
- **Filters:** Search, toggle asset types, military/commercial
- **Live Mode:** Toggle real-time updates
- **Regions:** Preset views (Global, Atlantic, Europe, etc.)
- **Display:** Toggle labels, trails, traffic arcs, chokepoints
- **Briefings:** Scenario context only; no live intelligence claims are made.

## Debugging

Use VS Code's debugger with the provided launch configuration to debug in Chrome.

## Build for Production

```bash
npm run build
npm run preview
```
