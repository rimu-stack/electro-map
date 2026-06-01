# HANDOFF

## Scope
Workspace contains two projects:
- electro-map-back: FastAPI backend for electrical network calculations
- mapa: React + ReactFlow frontend map editor

## Current Product Behavior
Frontend map model is strict:
- diamond = transformer
- point = branch node (otpaika)
- rectangle = consumer

Map labels are auto-generated:
- point label: sequential number starting from 1
- rectangle label: load value in kW (example: 25 kWt)
- edge label: length in km (example: 0.35 km)
- other nodes: empty label unless explicitly computed by logic

Visual details:
- point number is rendered in white inside the point circle
- diamond label is transformer model text

## Where Main Logic Lives
- Frontend request building and topology validation:
  - mapa/src/App.jsx
  - function buildPayloadFromMap(...)
- Graph editing, auto-label updates, persistence in localStorage:
  - mapa/src/components/GraphEditor.jsx
- Property editing UI (wire, length, transformer, load):
  - mapa/src/components/PropertiesPanel.jsx
- Node visuals:
  - mapa/src/components/nodes/PointNode.jsx
  - mapa/src/components/nodes/DiamondNode.jsx
  - mapa/src/components/nodes/RectangleNode.jsx

## Frontend -> Backend Payload Rules
Payload to POST /calculate uses:
- nodes: only transformer + points (rectangles are excluded)
- edges: only network edges between transformer/points (tree expected)
- loads: aggregated from rectangles, assigned to connected point node id
- transformer: taken from diamond node
- consumer_type: currently fixed to residential

Rectangles are interpreted as load descriptors attached to points.
Distance from point to rectangle is ignored in network edges.

## Validation Before Request
Frontend blocks calculate and shows modal error if:
- there is not exactly one diamond
- unsupported node shape is present
- rectangle is not connected to exactly one point
- point has invalid neighbors or too many branch links
- network edges are missing wire/length
- network is disconnected
- network has cycle (non-tree)

## Local Persistence
Graph is saved in browser localStorage key:
- electro-map.graph.v1

This allows reloading previous map state after refresh.

## API Integration
Frontend calls:
- GET /api/reference for wires/transformers
- POST /api/calculate for calculations

In dev, Vite proxy is configured in:
- mapa/vite.config.js

## Runbook
Backend:
1) cd electro-map-back
2) activate venv
3) python src/__main__.py

Frontend:
1) cd mapa
2) npm run dev

Build check:
- cd mapa
- npm run build

## Known Constraints
- Toolbar currently allows only 3 node shapes (diamond, point, rectangle)
- Edge label unit is km by request
- Transformer selection is in diamond properties, not global toolbar

## Suggested Next Steps
- Add import/export map JSON to file (not only localStorage)
- Add explicit tree/constraint hints in canvas UI before calculate
- Add end-to-end test for payload conversion rules
