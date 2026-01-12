import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Card,
  Badge,
  Button,
  Drawer,
  Typography,
  Space,
  Input,
  message,
  Tooltip,
  Switch,
  Collapse,
  Modal,
  Upload,
  Divider,
  Tag,
  Row,
  Col
} from 'antd';
import {
  MailOutlined,
  ApiOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  FolderOpenOutlined,
  EditOutlined,
  CopyOutlined,
  UndoOutlined,
  RedoOutlined,
  LinkOutlined,
  BulbOutlined,
  ImportOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  CloseOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BlockOutlined,
  BranchesOutlined,
  SettingOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useStateContext } from '../contexts/ContextProvider';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const nodeTypes = {
  // Custom node types can be added here
};

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Workflow Trigger' },
    position: { x: 250, y: 100 },
    style: {
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      borderRadius: '12px',
      padding: '10px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      width: 150
    }
  },
];

const initialEdges = [];

const TOOLBOX = [
  {
    type: 'http',
    label: 'HTTP Request',
    icon: <ApiOutlined style={{ color: '#4f46e5' }} />,
    node: {
      type: 'default',
      data: { label: 'HTTP Request' },
    },
  },
  {
    type: 'email',
    label: 'Send Email',
    icon: <MailOutlined style={{ color: '#10b981' }} />,
    node: {
      type: 'default',
      data: { label: 'Send Email' },
    },
  },
  {
    type: 'delay',
    label: 'Delay',
    icon: <ClockCircleOutlined style={{ color: '#f59e0b' }} />,
    node: {
      type: 'default',
      data: { label: 'Delay' },
    },
  },
  {
    type: 'condition',
    label: 'Condition',
    icon: <BranchesOutlined style={{ color: '#ef4444' }} />,
    node: {
      type: 'default',
      data: { label: 'Check Condition' },
    },
  },
];

const WORKFLOW_STORAGE_KEY = 'workflow_builder_v1';

export default function WorkflowBuilder() {
  const { theme } = useStateContext();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [workflowTitle, setWorkflowTitle] = useState('New Workflow Process');
  const [editingTitle, setEditingTitle] = useState(false);
  const dragNodeType = useRef(null);
  const [toolboxCollapsed, setToolboxCollapsed] = useState(false);
  const [log, setLog] = useState([]);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [importModal, setImportModal] = useState(false);

  // Load workflow on mount
  useEffect(() => {
    const saved = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (saved) {
      try {
        const { nodes: savedNodes, edges: savedEdges, title } = JSON.parse(saved);
        if (savedNodes && savedEdges) {
          setNodes(savedNodes);
          setEdges(savedEdges);
          if (title) setWorkflowTitle(title);
        }
      } catch (err) {
        console.error('Failed to load workflow', err);
      }
    }
  }, [setNodes, setEdges]);

  const saveWorkflow = () => {
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify({ nodes, edges, title: workflowTitle }));
    message.success('Workflow configuration saved locally');
  };

  const exportWorkflow = () => {
    const data = JSON.stringify({ nodes, edges, title: workflowTitle }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowTitle.replace(/\s+/g, '_') || 'workflow'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importWorkflow = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { nodes: impNodes, edges: impEdges, title } = JSON.parse(e.target.result);
        setNodes(impNodes);
        setEdges(impEdges);
        if (title) setWorkflowTitle(title);
        message.success('Workflow definition imported');
        setImportModal(false);
      } catch {
        message.error('Invalid JSON workflow file');
      }
    };
    reader.readAsText(file);
    return false;
  };

  // History tracking for undo/redo
  const pushHistory = () => {
    setHistory((h) => [...h, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
    setFuture([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    setFuture((f) => [{ nodes, edges }, ...f]);
    const prev = history[history.length - 1];
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setHistory((h) => h.slice(0, -1));
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((h) => [...h, { nodes, edges }]);
    setNodes(next.nodes);
    setEdges(next.edges);
    setFuture((f) => f.slice(1));
  };

  const addLog = (msg) => setLog((l) => [msg, ...l.slice(0, 5)]);

  const onConnect = useCallback((params) => {
    pushHistory();
    setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#4f46e5' } }, eds));
    addLog(`Connected ${params.source} → ${params.target}`);
  }, [setEdges, nodes, edges]);

  const onNodeClick = (_evt, node) => {
    setSelectedNode(node);
    setDrawerOpen(true);
  };

  const onDragStart = (event, tool) => {
    dragNodeType.current = tool;
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const rect = event.target.getBoundingClientRect();
      const position = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };

      const tool = dragNodeType.current;
      if (!tool) return;

      pushHistory();
      const id = `node_${Date.now()}`;
      setNodes((nds) => [
        ...nds,
        {
          id,
          position,
          type: tool.node.type,
          data: { label: tool.label, id },
          style: {
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            padding: '10px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            minWidth: 150
          }
        },
      ]);
      addLog(`Added ${tool.label}`);
    },
    [nodes, setNodes]
  );

  const deleteNode = () => {
    if (!selectedNode) return;
    pushHistory();
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setDrawerOpen(false);
    setSelectedNode(null);
  };

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', background: 'var(--bg-dashboard)', overflow: 'hidden' }}>
      {/* Premium Sidebar Sidebar */}
      <div
        className="glass-card"
        style={{
          width: toolboxCollapsed ? 60 : 280,
          margin: 16,
          height: 'calc(100% - 32px)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease',
          zIndex: 10,
          padding: toolboxCollapsed ? '16px 8px' : 20,
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          {!toolboxCollapsed && <Title level={4} className="text-gradient" style={{ margin: 0 }}>Components</Title>}
          <Button
            type="text"
            icon={toolboxCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setToolboxCollapsed(!toolboxCollapsed)}
          />
        </div>

        {!toolboxCollapsed && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>FLOW ELEMENTS</Text>
            <Space direction="vertical" style={{ width: '100%' }} size={12}>
              {TOOLBOX.map((tool) => (
                <div
                  key={tool.type}
                  className="glass-inner-card tool-item"
                  draggable
                  onDragStart={(e) => onDragStart(e, tool)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tool.icon}
                  <Text strong>{tool.label}</Text>
                </div>
              ))}
            </Space>

            <Divider style={{ margin: '24px 0' }} />

            <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12 }}>ACTIONS</Text>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Button block icon={<SaveOutlined />} onClick={saveWorkflow} className="glass-inner-card">Save</Button>
              </Col>
              <Col span={12}>
                <Button block icon={<FolderOpenOutlined />} className="glass-inner-card">Load</Button>
              </Col>
              <Col span={12}>
                <Button block icon={<ExportOutlined />} onClick={exportWorkflow} className="glass-inner-card">Export</Button>
              </Col>
              <Col span={12}>
                <Button block icon={<ImportOutlined />} onClick={() => setImportModal(true)} className="glass-inner-card">Import</Button>
              </Col>
            </Row>

            <div style={{ marginTop: 24, display: 'flex', gap: 8, justifyContent: 'center' }}>
              <Tooltip title="Undo">
                <Button shape="circle" icon={<UndoOutlined />} disabled={history.length === 0} onClick={undo} />
              </Tooltip>
              <Tooltip title="Redo">
                <Button shape="circle" icon={<RedoOutlined />} disabled={future.length === 0} onClick={redo} />
              </Tooltip>
              <Tooltip title="Test Run">
                <Button shape="circle" icon={<PlayCircleOutlined />} type="primary" style={{ background: 'var(--primary-gradient)', border: 'none' }} />
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      {/* Canvas Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: 24,
          left: 24,
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div className="glass-card" style={{ padding: '8px 24px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThunderboltOutlined style={{ color: '#4f46e5' }} />
            {editingTitle ? (
              <Input
                value={workflowTitle}
                onChange={e => setWorkflowTitle(e.target.value)}
                onBlur={() => setEditingTitle(false)}
                onPressEnter={() => setEditingTitle(false)}
                autoFocus
                variant="borderless"
                style={{ fontWeight: 600, width: 200 }}
              />
            ) : (
              <Text strong style={{ cursor: 'pointer' }} onClick={() => setEditingTitle(true)}>
                {workflowTitle} <EditOutlined style={{ fontSize: 12, opacity: 0.5, marginLeft: 4 }} />
              </Text>
            )}
          </div>

          <div className="glass-card" style={{ padding: '8px 16px', borderRadius: 100, fontSize: 12 }}>
            <Badge status="processing" text="Draft Mode" />
          </div>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          fitView
          style={{ background: 'transparent' }}
        >
          <Background color="rgba(0,0,0,0.05)" gap={20} size={1} />
          <Controls style={{ left: 24, bottom: 24 }} />
          <MiniMap
            style={{ right: 24, bottom: 24, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}
            maskColor="rgba(255,255,255,0.1)"
          />
        </ReactFlow>

        {/* Floating Log */}
        <div className="glass-card" style={{
          position: 'absolute',
          right: 24,
          top: 24,
          width: 250,
          maxHeight: 180,
          padding: 16,
          fontSize: 12,
          zIndex: 5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: 4 }}>
            <BlockOutlined /> <Text strong>Activity Log</Text>
          </div>
          {log.length === 0 ? (
            <Text type="secondary">Waiting for actions...</Text>
          ) : (
            log.map((m, i) => <div key={i} style={{ marginBottom: 4 }}>• {m}</div>)
          )}
        </div>
      </div>

      <Drawer
        title={
          <Space>
            <SettingOutlined />
            <span>Node Configuration</span>
          </Space>
        }
        placement="right"
        width={400}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        className="premium-modal"
      >
        {selectedNode && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card className="glass-inner-card">
              <Statistic title="Node Reference" value={selectedNode.id} valueStyle={{ fontSize: 14, fontFamily: 'monospace' }} />
              <Tag color="purple" style={{ marginTop: 8 }}>{selectedNode.type?.toUpperCase() || 'DEFAULT'}</Tag>
            </Card>

            <Form layout="vertical">
              <Form.Item label="Display Label">
                <Input
                  value={selectedNode.data.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label } } : n));
                  }}
                  prefix={<EditOutlined />}
                  size="large"
                />
              </Form.Item>

              <Form.Item label="Execution Priority">
                <Select defaultValue="normal">
                  <Option value="high">High Priority</Option>
                  <Option value="normal">Normal</Option>
                  <Option value="low">Low Priority</Option>
                </Select>
              </Form.Item>

              <Divider />

              <Button danger block size="large" icon={<DeleteOutlined />} onClick={deleteNode}>
                Remove Component
              </Button>
            </Form>
          </Space>
        )}
      </Drawer>

      <Modal
        title="Import Workflow Definition"
        open={importModal}
        onCancel={() => setImportModal(false)}
        footer={null}
        centered
        className="premium-modal"
      >
        <Upload.Dragger accept=".json" beforeUpload={importWorkflow} showUploadList={false}>
          <div style={{ padding: '40px 0' }}>
            <ImportOutlined style={{ fontSize: 48, color: '#4f46e5', marginBottom: 16 }} />
            <p className="ant-upload-text">Drop workflow JSON here or click to browse</p>
          </div>
        </Upload.Dragger>
      </Modal>

      <style>{`
        .tool-item:hover {
          background: rgba(255, 255, 255, 0.8) !important;
          transform: translateX(4px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .react-flow__node {
          cursor: pointer;
        }
        .react-flow__handle {
          width: 8px;
          height: 8px;
          background: #4f46e5;
        }
        .react-flow__controls-button {
          background: rgba(255, 255, 255, 0.7) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          backdrop-filter: blur(8px);
        }
      `}</style>
    </div>
  );
}
