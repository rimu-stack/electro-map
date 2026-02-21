import React from 'react';
import { Handle, Position } from 'reactflow';

const CircleNode = ({ data, selected }) => {
  return (
    <div
      className={`rounded-full shadow-lg border-2 transition-all flex items-center justify-center ${
        selected ? 'border-blue-500 shadow-xl' : 'border-gray-300'
      }`}
      style={{ 
        backgroundColor: data.color || '#3b82f6', 
        width: '100px', 
        height: '100px' 
      }}
    >
      <Handle type="target" position={Position.Top} id="top" className="!bg-gray-600" />
      <Handle type="source" position={Position.Top} id="top-source" className="!bg-gray-600" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-gray-600" />
      <Handle type="source" position={Position.Left} id="left-source" className="!bg-gray-600" />
      <Handle type="target" position={Position.Right} id="right" className="!bg-gray-600" />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-gray-600" />
      <Handle type="target" position={Position.Bottom} id="bottom" className="!bg-gray-600" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-gray-600" />
      <div className="text-white font-medium text-center text-sm px-2">{data.label || 'Узел'}</div>
    </div>
  );
};

export default CircleNode;
