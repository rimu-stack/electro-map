import React from 'react';

const Toolbar = ({
  nodeShape,
  setNodeShape,
  onCalculate,
  isCalculating,
}) => {
  const shapes = [
    { id: 'diamond', name: 'Ромб (трансформатор)', icon: '◆' },
    { id: 'point', name: 'Точка (отпайка)', icon: '•' },
    { id: 'rectangle', name: 'Прямоугольник (потребитель)', icon: '▭' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 shadow-sm">
      <h1 className="text-xl font-bold text-gray-800">Карта сети</h1>

      <div className="flex items-center gap-2 ml-8">
        <span className="text-sm text-gray-600 font-medium">Тип узла:</span>
        {shapes.map((shape) => (
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

      <button
        onClick={onCalculate}
        disabled={isCalculating}
        className="ml-auto px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold text-sm transition-colors"
      >
        {isCalculating ? 'Расчет...' : 'Рассчитать через API'}
      </button>

      <div className="text-sm text-gray-500">
        <span className="font-medium">Подсказка:</span> Дважды кликните на холст для создания узла.
      </div>
    </div>
  );
};

export default Toolbar;
