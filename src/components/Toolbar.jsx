import React from 'react';

const Toolbar = ({ nodeShape, setNodeShape }) => {
  const shapes = [
    { id: 'rectangle', name: 'Прямоугольник', icon: '▭' },
    { id: 'circle', name: 'Круг', icon: '●' },
    { id: 'diamond', name: 'Ромб', icon: '◆' },
    { id: 'ellipse', name: 'Эллипс', icon: '⬭' },
    { id: 'point', name: 'Точка', icon: '•' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm">
      <h1 className="text-xl font-bold text-gray-800">Редактор графов</h1>
      
      <div className="flex items-center gap-2 ml-8">
        <span className="text-sm text-gray-600 font-medium">Форма узла:</span>
        {shapes.map(shape => (
          <button
            key={shape.id}
            onClick={() => setNodeShape(shape.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              nodeShape === shape.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={shape.name}
          >
            <span className="text-lg mr-1">{shape.icon}</span>
            {shape.name}
          </button>
        ))}
      </div>

      <div className="ml-auto text-sm text-gray-500">
        <span className="font-medium">Подсказка:</span> Дважды кликните на холст для создания узла • Delete для удаления
      </div>
    </div>
  );
};

export default Toolbar;
