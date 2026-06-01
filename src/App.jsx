import React, { useEffect, useMemo, useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import GraphEditor from './components/GraphEditor';
import Toolbar from './components/Toolbar';
import PropertiesPanel from './components/PropertiesPanel';

const DEFAULT_CONSUMER_TYPE = 'residential';
const SUPPORTED_SHAPES = ['diamond', 'point', 'rectangle'];
const FALLBACK_TRANSFORMERS = [
  'TM-100/10',
  'TM-250/10',
  'TM-400/10',
  'TMG-100/10',
  'TMG-160/10',
  'TMG-250/10',
  'TMG-160/0.4',
];
const FALLBACK_WIRES = [
  'A-16',
  'A-25',
  'A-35',
  'SIP-2 4x25',
  'SIP-2 2x16',
  'SIP-2 3*50+54,6+16',
  'SIP-2 3*95+95+16',
];

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getNodeShape(node) {
  return node?.data?.shape || node?.type || '';
}

function buildPayloadFromMap(nodes, edges) {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const shapeById = new Map(nodes.map((node) => [node.id, getNodeShape(node)]));

  const unsupported = nodes.find((node) => !SUPPORTED_SHAPES.includes(getNodeShape(node)));
  if (unsupported) {
    throw new Error('Допустимы только 3 типа узлов: ромб (трансформатор), точка (отпайка), прямоугольник (потребитель).');
  }

  const diamonds = nodes.filter((node) => getNodeShape(node) === 'diamond');
  const points = nodes.filter((node) => getNodeShape(node) === 'point');
  const consumers = nodes.filter((node) => getNodeShape(node) === 'rectangle');

  if (diamonds.length !== 1) {
    throw new Error('На карте должен быть ровно один ромб (трансформатор).');
  }

  if (!points.length) {
    throw new Error('Добавьте хотя бы одну точку (отпайку).');
  }

  const transformer = diamonds[0].data?.transformer || '';
  if (!transformer) {
    throw new Error('В свойствах ромба выберите модель трансформатора.');
  }

  const neighbors = new Map(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) {
      continue;
    }
    neighbors.get(edge.source).push({ nodeId: edge.target, edge });
    neighbors.get(edge.target).push({ nodeId: edge.source, edge });
  }

  // Прямоугольник (потребитель) должен быть подключен только к одной точке.
  for (const consumer of consumers) {
    const n = neighbors.get(consumer.id) || [];
    if (n.length !== 1 || shapeById.get(n[0].nodeId) !== 'point') {
      throw new Error('Каждый прямоугольник должен иметь ровно одну связь с точкой.');
    }
  }

  // Точка может иметь не более одного прямоугольника и до двух связей с точкой/ромбом.
  for (const point of points) {
    const n = neighbors.get(point.id) || [];
    const rectNeighbors = n.filter((item) => shapeById.get(item.nodeId) === 'rectangle');
    const infraNeighbors = n.filter((item) => {
      const shape = shapeById.get(item.nodeId);
      return shape === 'point' || shape === 'diamond';
    });

    const hasForbidden = n.some((item) => {
      const shape = shapeById.get(item.nodeId);
      return !['rectangle', 'point', 'diamond'].includes(shape);
    });

    if (hasForbidden) {
      throw new Error('Точки можно соединять только с прямоугольником, точкой или ромбом.');
    }

    if (rectNeighbors.length > 1) {
      throw new Error('Одна точка может иметь не более одного прямоугольника-потребителя.');
    }

    if (infraNeighbors.length < 1 || infraNeighbors.length > 2) {
      throw new Error('У точки должно быть 1 или 2 связи с сетью (с ромбом/точками).');
    }

    const diamondLinks = infraNeighbors.filter((item) => shapeById.get(item.nodeId) === 'diamond').length;
    if (diamondLinks > 1) {
      throw new Error('Точка не может быть связана более чем с одним ромбом.');
    }
  }

  // Ромб подключается только к точкам.
  const transformerNode = diamonds[0];
  const transformerNeighbors = neighbors.get(transformerNode.id) || [];
  if (!transformerNeighbors.length) {
    throw new Error('Ромб должен быть соединен хотя бы с одной точкой.');
  }
  if (transformerNeighbors.some((item) => shapeById.get(item.nodeId) !== 'point')) {
    throw new Error('Ромб должен соединяться только с точками.');
  }

  const networkNodes = [transformerNode, ...points];
  const indexByNodeId = new Map(networkNodes.map((node, idx) => [node.id, idx]));

  const infraEdges = edges.filter((edge) => {
    const s = shapeById.get(edge.source);
    const t = shapeById.get(edge.target);
    const sourceOk = s === 'point' || s === 'diamond';
    const targetOk = t === 'point' || t === 'diamond';
    return sourceOk && targetOk;
  });

  if (!infraEdges.length) {
    throw new Error('Нужны связи между ромбом и точками для формирования основной линии.');
  }

  // Проверяем заполнение параметров провода только для сетевых ребер.
  for (const edge of infraEdges) {
    const length = toNumber(edge.data?.length, 0);
    if (!edge.data?.wire || length <= 0) {
      throw new Error('Для каждого ребра основной линии укажите марку провода и длину > 0 км.');
    }
  }

  const adjacency = new Map(networkNodes.map((node) => [node.id, []]));
  for (const edge of infraEdges) {
    adjacency.get(edge.source)?.push({ to: edge.target, edge });
    adjacency.get(edge.target)?.push({ to: edge.source, edge });
  }

  const rootId = transformerNode.id;
  const visited = new Set([rootId]);
  const queue = [rootId];
  const orientedEdges = [];

  while (queue.length) {
    const current = queue.shift();
    const neighborsList = adjacency.get(current) || [];

    for (const item of neighborsList) {
      if (visited.has(item.to)) {
        continue;
      }
      visited.add(item.to);
      queue.push(item.to);

      orientedEdges.push({
        from: indexByNodeId.get(current),
        to: indexByNodeId.get(item.to),
        length: toNumber(item.edge.data?.length, 0),
        wire: item.edge.data?.wire,
      });
    }
  }

  if (visited.size !== networkNodes.length) {
    throw new Error('Основная линия должна быть связной: все точки должны иметь путь к ромбу.');
  }

  if (infraEdges.length !== networkNodes.length - 1) {
    throw new Error('Основная линия должна быть деревом без циклов (число ребер = число сетевых узлов - 1).');
  }

  const loadsAccumulator = new Map();
  for (const consumer of consumers) {
    const pointLink = (neighbors.get(consumer.id) || [])[0];
    if (!pointLink) {
      continue;
    }
    const pointIndex = indexByNodeId.get(pointLink.nodeId);
    if (pointIndex === undefined) {
      continue;
    }

    const load = toNumber(consumer.data?.load, 0);
    if (load <= 0) {
      continue;
    }

    loadsAccumulator.set(pointIndex, (loadsAccumulator.get(pointIndex) || 0) + load);
  }

  const loads = {};
  for (const [nodeIndex, load] of loadsAccumulator.entries()) {
    loads[String(nodeIndex)] = Number(load.toFixed(3));
  }

  return {
    nodes: networkNodes.map((_, index) => index),
    edges: orientedEdges,
    loads,
    consumer_type: DEFAULT_CONSUMER_TYPE,
    transformer,
  };
}

function describeResult(result) {
  return `Оптимальная точка установки ИРГ: узел ${result.optimal_node}. ` +
    `Рекомендуемая мощность ИРГ: ${result.irg_power} кВАр. ` +
    `Потери до компенсации: ${result.losses_before} кВт, после: ${result.losses_after} кВт. ` +
    `Минимальное напряжение в сети: ${result.min_voltage} p.u.`;
}

function App() {
  const [selectedElement, setSelectedElement] = useState(null);
  const [nodeShape, setNodeShape] = useState('rectangle');
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [referenceData, setReferenceData] = useState({ transformers: {}, wires: {} });
  const [referenceError, setReferenceError] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [responseModal, setResponseModal] = useState({
    open: false,
    title: '',
    text: '',
    details: null,
  });

  const transformerOptions = useMemo(() => {
    const fromBackend = Object.keys(referenceData.transformers || {});
    return fromBackend.length ? fromBackend : FALLBACK_TRANSFORMERS;
  }, [referenceData.transformers]);

  const wireOptions = useMemo(() => {
    const fromBackend = Object.keys(referenceData.wires || {});
    return fromBackend.length ? fromBackend : FALLBACK_WIRES;
  }, [referenceData.wires]);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const response = await fetch('/api/reference');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.detail || 'Не удалось получить справочные данные.');
        }

        setReferenceData({
          transformers: data.transformers || {},
          wires: data.wires || {},
        });
      } catch (error) {
        setReferenceError('Не удалось загрузить трансформаторы и провода из бэкенда. Используются значения по умолчанию.');
        setReferenceData({
          transformers: FALLBACK_TRANSFORMERS.reduce((acc, item) => {
            acc[item] = 0;
            return acc;
          }, {}),
          wires: FALLBACK_WIRES.reduce((acc, item) => {
            acc[item] = 0;
            return acc;
          }, {}),
        });
      }
    };

    loadReferenceData();
  }, []);

  const closeModal = () => {
    setResponseModal({ open: false, title: '', text: '', details: null });
  };

  const showValidationError = (message) => {
    setResponseModal({
      open: true,
      title: 'Ошибка формирования схемы',
      text: message,
      details: null,
    });
  };

  const handleCalculate = async () => {
    closeModal();

    if (!graphData.nodes.length) {
      showValidationError('Добавьте элементы карты перед расчетом.');
      return;
    }

    let payload;
    try {
      payload = buildPayloadFromMap(graphData.nodes, graphData.edges);
    } catch (error) {
      showValidationError(error.message || 'Невозможно сформировать данные карты.');
      return;
    }

    try {
      setIsCalculating(true);
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setResponseModal({
          open: true,
          title: 'Ошибка расчета',
          text: data?.detail || 'Ошибка при выполнении расчета.',
          details: null,
        });
        return;
      }

      setResponseModal({
        open: true,
        title: 'Результат расчета',
        text: describeResult(data),
        details: data,
      });
    } catch (error) {
      setResponseModal({
        open: true,
        title: 'Ошибка подключения',
        text: 'Не удалось подключиться к API. Убедитесь, что backend запущен на порту 8000.',
        details: null,
      });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <ReactFlowProvider>
      <div className="w-full h-full flex flex-col bg-gray-50">
        <Toolbar
          nodeShape={nodeShape}
          setNodeShape={setNodeShape}
          onCalculate={handleCalculate}
          isCalculating={isCalculating}
        />

        <div className="px-4 py-2 border-b border-gray-200 bg-white">
          {referenceError && (
            <div className="rounded-md bg-yellow-50 border border-yellow-300 px-3 py-2 text-sm text-yellow-800">
              {referenceError}
            </div>
          )}
        </div>

        <div className="flex-1 flex overflow-hidden">
          <GraphEditor
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            nodeShape={nodeShape}
            onGraphChange={setGraphData}
            defaultTransformer={transformerOptions[0] || ''}
          />
          <PropertiesPanel
            selectedElement={selectedElement}
            setSelectedElement={setSelectedElement}
            wireOptions={wireOptions}
            transformerOptions={transformerOptions}
          />
        </div>

        {responseModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
              <button
                onClick={closeModal}
                className="absolute right-3 top-3 h-8 w-8 rounded-full text-gray-600 hover:bg-gray-100"
                aria-label="Закрыть окно"
              >
                ×
              </button>

              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">{responseModal.title}</h2>
              </div>

              <div className="px-6 py-4">
                <p className="text-sm leading-6 text-gray-700">{responseModal.text}</p>

                {responseModal.details && (
                  <pre className="mt-4 max-h-72 overflow-auto rounded-md bg-gray-50 p-3 text-xs text-gray-800">
{JSON.stringify(responseModal.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ReactFlowProvider>
  );
}

export default App;
