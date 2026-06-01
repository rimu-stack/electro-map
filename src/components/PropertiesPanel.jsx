import React from 'react';
import { useReactFlow } from 'reactflow';

const PropertiesPanel = ({ selectedElement, setSelectedElement, wireOptions, transformerOptions }) => {
  const { deleteElements } = useReactFlow();

  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Свойства</h2>
        <p className="text-sm text-gray-500">
          Выберите узел или ребро для редактирования свойств
        </p>
      </div>
    );
  }

  const isNode = selectedElement.type === 'node';
  const shape = selectedElement.data?.shape;
  const isTransformerNode = isNode && shape === 'diamond';
  const isConsumerNode = isNode && shape === 'rectangle';

  const handleChange = (field, value) => {
    setSelectedElement((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      },
    }));
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Свойства</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
          <input
            type="text"
            value={selectedElement.id}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Метка (авто)</label>
          <input
            type="text"
            value={selectedElement.data?.label || ''}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-sm"
            placeholder="Формируется автоматически"
          />
        </div>

        {isNode && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                value={selectedElement.data?.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                rows="3"
                placeholder="Описание узла"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цвет</label>
              <input
                type="color"
                value={selectedElement.data?.color || '#3b82f6'}
                onChange={(e) => handleChange('color', e.target.value)}
                className="w-full h-10 rounded-md cursor-pointer"
              />
            </div>

            {isTransformerNode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Модель трансформатора
                </label>
                <select
                  value={selectedElement.data?.transformer || ''}
                  onChange={(e) => handleChange('transformer', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {!transformerOptions?.length && <option value="">Нет данных</option>}
                  {(transformerOptions || []).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isConsumerNode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Потребление (нагрузка), кВт
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={selectedElement.data?.load ?? ''}
                  onChange={(e) => handleChange('load', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Например: 25"
                />
              </div>
            )}
          </>
        )}

        {!isNode && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Вес ребра</label>
              <input
                type="number"
                value={selectedElement.data?.weight || ''}
                onChange={(e) => handleChange('weight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Вес"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Стиль линии</label>
              <select
                value={selectedElement.data?.lineStyle || 'solid'}
                onChange={(e) => handleChange('lineStyle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="solid">Сплошная</option>
                <option value="dashed">Пунктир</option>
                <option value="dotted">Точки</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип ребра</label>
              <select
                value={selectedElement.data?.edgeType || 'smoothstep'}
                onChange={(e) => handleChange('edgeType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="smoothstep">Плавная</option>
                <option value="straight">Прямая</option>
                <option value="step">Ступенчатая</option>
                <option value="default">Кривая Безье</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Длина линии, км</label>
              <input
                type="number"
                min="0.001"
                step="0.1"
                value={selectedElement.data?.length ?? ''}
                onChange={(e) => handleChange('length', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Например: 0.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Марка провода</label>
              <select
                value={selectedElement.data?.wire || ''}
                onChange={(e) => handleChange('wire', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="">Выберите провод</option>
                {(wireOptions || []).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Пользовательские параметры</label>
          {Object.entries(selectedElement.data || {}).map(([key, value]) => {
            if (
              [
                'label',
                'description',
                'color',
                'weight',
                'shape',
                'lineStyle',
                'edgeType',
                'load',
                'length',
                'wire',
                'transformer',
              ].includes(key)
            ) {
              return null;
            }
            return (
              <div key={key} className="mb-2">
                <label className="block text-xs text-gray-600 mb-1">{key}</label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            );
          })}

          <button
            onClick={() => {
              const key = prompt('Введите название параметра:');
              if (key && key.trim()) {
                handleChange(key.trim(), '');
              }
            }}
            className="mt-2 w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors"
          >
            + Добавить параметр
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200 space-y-2">
          <button
            onClick={() => {
              const data = {
                id: selectedElement.id,
                type: isNode ? 'node' : 'edge',
                data: selectedElement.data,
              };
              console.log('Данные для бекенда:', JSON.stringify(data, null, 2));
              alert('Данные выведены в консоль (F12)');
            }}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md transition-colors"
          >
            Экспортировать данные
          </button>

          <button
            onClick={() => {
              if (confirm(`Удалить ${isNode ? 'узел' : 'ребро'}?`)) {
                if (isNode) {
                  deleteElements({ nodes: [{ id: selectedElement.id }] });
                } else {
                  deleteElements({ edges: [{ id: selectedElement.id }] });
                }
                setSelectedElement(null);
              }
            }}
            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-md transition-colors"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPanel;
