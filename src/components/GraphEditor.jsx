import React, { useCallback, useState, useRef } from 'react';
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

let nodeId = 1;

const GraphEditor = ({ selectedElement, setSelectedElement, nodeShape }) => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `edge-${nodeId++}`,
        type: 'smoothstep',
        animated: false,
        label: 'Ребро',
        labelStyle: { fill: '#374151', fontWeight: 600, fontSize: 12 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        data: { label: 'Ребро', weight: 1, lineStyle: 'solid', edgeType: 'smoothstep' },
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
      // Проверяем, что клик был по пустому месту холста
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
            label: `Узел ${nodeId - 1}`,
            color: '#3b82f6',
            description: '',
            shape: nodeShape,
          },
        };

        setNodes((nds) => nds.concat(newNode));
      }
    },
    [reactFlowInstance, nodeShape, setNodes]
  );

  // Обновление узлов при изменении свойств
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
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selectedElement.id
            ? { 
                ...edge, 
                data: selectedElement.data,
                label: selectedElement.data?.label || '',
                type: selectedElement.data?.edgeType || 'smoothstep',
                style: {
                  ...edge.style,
                  strokeDasharray: selectedElement.data?.lineStyle === 'dashed' ? '5,5' : 
                                   selectedElement.data?.lineStyle === 'dotted' ? '2,2' : 'none'
                }
              }
            : edge
        )
      );
    }
  }, [selectedElement, setNodes, setEdges]);

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
