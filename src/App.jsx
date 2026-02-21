import React, { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import GraphEditor from './components/GraphEditor';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';

function App() {
  const [selectedElement, setSelectedElement] = useState(null);
  const [nodeShape, setNodeShape] = useState('rectangle');

  return (
    <ReactFlowProvider>
      <div className="w-full h-full flex flex-col bg-gray-50">
        <Toolbar 
          nodeShape={nodeShape} 
          setNodeShape={setNodeShape}
        />
        <div className="flex-1 flex overflow-hidden">
          <GraphEditor 
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            nodeShape={nodeShape}
          />
          <PropertiesPanel 
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
          />
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
