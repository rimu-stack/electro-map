import React from 'react';
import { Handle, Position } from 'reactflow';

const DiamondNode = ({ data, selected }) => {
  return (
    <div className="relative" style={{ width: '100px', height: '100px' }}>
      <Handle type="target" position={Position.Top} id="top" className="!bg-gray-600" style={{ top: '-8px' }} />
      <Handle type="source" position={Position.Top} id="top-source" className="!bg-gray-600" style={{ top: '-8px' }} />
      <Handle type="target" position={Position.Left} id="left" className="!bg-gray-600" style={{ left: '-8px' }} />
      <Handle type="source" position={Position.Left} id="left-source" className="!bg-gray-600" style={{ left: '-8px' }} />
      <Handle type="target" position={Position.Right} id="right" className="!bg-gray-600" style={{ right: '-8px' }} />
      <Handle type="source" position={Position.Right} id="right-source" className="!bg-gray-600" style={{ right: '-8px' }} />
      <Handle type="target" position={Position.Bottom} id="bottom" className="!bg-gray-600" style={{ bottom: '-8px' }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!bg-gray-600" style={{ bottom: '-8px' }} />
      <div
        className={`absolute inset-0 shadow-lg border-2 transition-all flex items-center justify-center ${
          selected ? 'border-blue-500 shadow-xl' : 'border-gray-300'
        }`}
        style={{ 
          backgroundColor: data.color || '#3b82f6',
          transform: 'rotate(45deg)',
          transformOrigin: 'center'
        }}
      >
        <div 
          className="text-white font-medium text-center text-sm px-2"
          style={{ transform: 'rotate(-45deg)' }}
        >
          {data.label || 'Узел'}
        </div>
      </div>
    </div>
  );
};

export default DiamondNode;
