import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';

import RectangleNode from './nodes/RectangleNode';
import CircleNode from './nodes/CircleNode';
import DiamondNode from './nodes/DiamondNode';
import EllipseNode from './nodes/EllipseNode';
import PointNode from './nodes/PointNode';

const nodeTypes = {
  rectangle: RectangleNode,
  circle: CircleNode,
  diamond: DiamondNode,
  ellipse: EllipseNode,
  point: PointNode,
};

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchSharedState() {
  try {
    const res = await fetch('/api/state');
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data?.nodes) && Array.isArray(data?.edges)) {
      return data;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveSharedState(nodes, edges) {
  fetch('/api/state', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodes, edges }),
  }).catch(() => {});
}

function getMaxId(nodes, edges) {
  const values = [...nodes, ...edges]
    .map((item) => {
      const match = String(item.id || '').match(/-(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .filter((value) => Number.isFinite(value));

  return values.length ? Math.max(...values) : 0;
}

function formatLoadLabel(load) {
  const value = Number(load);
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }
  return `${value} кВт`;
}

function formatLengthLabel(lengthKm) {
  const value = Number(lengthKm);
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }
  const rounded = Number(value.toFixed(3));
  return `${rounded} км`;
}

function withNormalizedEdgeLabel(edge) {
  const edgeLabel = formatLengthLabel(edge?.data?.length);
  const hasSameLabel = (edge?.label || '') === edgeLabel;
  const hasSameDataLabel = (edge?.data?.label || '') === edgeLabel;

  if (hasSameLabel && hasSameDataLabel) {
    return edge;
  }

  return {
    ...edge,
    label: edgeLabel,
    data: {
      ...edge.data,
      label: edgeLabel,
    },
  };
}

let nodeId = 1;

const GraphEditor = ({ selectedElement, setSelectedElement, nodeShape, onGraphChange, defaultTransformer }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  // Tracks whether the current nodes/edges change came from the server (WS or initial load).
  // When true, the save-effect skips one cycle to avoid echo loops.
  const isRemoteUpdate = useRef(false);
  const saveTimer = useRef(null);

  // Apply remote state (from WS message or initial API load)
  const applyRemoteState = useCallback((data) => {
    isRemoteUpdate.current = true;
    setNodes(data.nodes);
    setEdges(data.edges.map(withNormalizedEdgeLabel));
    nodeId = Math.max(nodeId, getMaxId(data.nodes, data.edges) + 1);
  }, [setNodes, setEdges]);

  // Initial load from server
  useEffect(() => {
    fetchSharedState().then((data) => {
      if (data) applyRemoteState(data);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // WebSocket — real-time sync
  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/api/ws`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data?.nodes) && Array.isArray(data?.edges)) {
          applyRemoteState(data);
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => ws.close();
  }, [applyRemoteState]);

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `edge-${nodeId++}`,
        type: 'smoothstep',
        animated: false,
        label: '',
        labelStyle: { fill: '#374151', fontWeight: 600, fontSize: 12 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        data: {
          weight: 1,
          lineStyle: 'solid',
          edgeType: 'smoothstep',
          wire: '',
          length: '',
          label: '',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedElement({ ...node, type: 'node' });
  }, [setSelectedElement]);

  const onEdgeClick = useCallback((event, edge) => {
    setSelectedElement({ ...edge, type: 'edge' });
  }, [setSelectedElement]);

  const onPaneClick = useCallback(() => {
    setSelectedElement(null);
  }, [setSelectedElement]);

  const onDoubleClick = useCallback(
    (event) => {
      if (event.target.classList.contains('react-flow__pane')) {
        if (!reactFlowInstance) return;

        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = reactFlowInstance.project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });

        const newNode = {
          id: `node-${nodeId++}`,
          type: nodeShape,
          position,
          data: {
            label: '',
            color: '#3b82f6',
            description: '',
            shape: nodeShape,
            load: '',
            transformer: nodeShape === 'diamond' ? defaultTransformer : '',
          },
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [reactFlowInstance, nodeShape, defaultTransformer, setNodes]
  );

  React.useEffect(() => {
    if (selectedElement && selectedElement.type === 'node') {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedElement.id
            ? { ...node, data: selectedElement.data }
            : node
        )
      );
    } else if (selectedElement && selectedElement.type === 'edge') {
      const edgeLabel = formatLengthLabel(selectedElement.data?.length);
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selectedElement.id
            ? {
                ...edge,
                data: { ...selectedElement.data, label: edgeLabel },
                label: edgeLabel,
                type: selectedElement.data?.edgeType || 'smoothstep',
                style: {
                  ...edge.style,
                  strokeDasharray:
                    selectedElement.data?.lineStyle === 'dashed'
                      ? '5,5'
                      : selectedElement.data?.lineStyle === 'dotted'
                        ? '2,2'
                        : 'none',
                },
              }
            : edge
        )
      );
    }
  }, [selectedElement, setNodes, setEdges]);

  React.useEffect(() => {
    setNodes((nds) => {
      let pointNumber = 1;
      let changed = false;

      const updated = nds.map((node) => {
        const shape = node.data?.shape || node.type;
        let computedLabel = '';

        if (shape === 'point') {
          computedLabel = String(pointNumber);
          pointNumber += 1;
        } else if (shape === 'rectangle') {
          computedLabel = formatLoadLabel(node.data?.load);
        } else if (shape === 'diamond') {
          computedLabel = node.data?.transformer || '';
        }

        if ((node.data?.label || '') === computedLabel) {
          return node;
        }

        changed = true;
        return {
          ...node,
          data: {
            ...node.data,
            label: computedLabel,
          },
        };
      });

      return changed ? updated : nds;
    });
  }, [nodes, setNodes]);

  React.useEffect(() => {
    onGraphChange?.({ nodes, edges });
  }, [nodes, edges, onGraphChange]);

  // Persist to server (debounced, skipped for remote-originated updates)
  React.useEffect(() => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveSharedState(nodes, edges);
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [nodes, edges]);

  const onNodesDelete = useCallback(
    (deleted) => {
      if (selectedElement && deleted.some((n) => n.id === selectedElement.id)) {
        setSelectedElement(null);
      }
    },
    [selectedElement, setSelectedElement]
  );

  const onEdgesDelete = useCallback(
    (deleted) => {
      if (selectedElement && deleted.some((e) => e.id === selectedElement.id)) {
        setSelectedElement(null);
      }
    },
    [selectedElement, setSelectedElement]
  );

  return (
    <div className="flex-1 bg-gray-100" ref={reactFlowWrapper} onDoubleClick={onDoubleClick}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        zoomOnDoubleClick={false}
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => node.data.color || '#3b82f6'}
          className="bg-white border border-gray-300"
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default GraphEditor;
