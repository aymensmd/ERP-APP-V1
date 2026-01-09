
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
import { Card, Button, Drawer, Typography, Space, Input, message, Tooltip, Switch, Collapse, Modal, Upload } from 'antd';
import { MailOutlined, ApiOutlined, ClockCircleOutlined, PlusOutlined, DeleteOutlined, SaveOutlined, FolderOpenOutlined, EditOutlined, CopyOutlined, UndoOutlined, RedoOutlined, LinkOutlined, BulbOutlined, ImportOutlined, ExportOutlined, PlayCircleOutlined, CloseOutlined, MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const nodeTypes = {
  // Custom node types can be added here
};

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 100, y: 100 },
  },
];

const initialEdges = [];

const TOOLBOX = [
  {
    type: 'http',
    label: 'HTTP Request',
    icon: <ApiOutlined />,
    node: {
      type: 'default',
      data: { label: 'HTTP Request' },
    },
  },
  {
    type: 'email',
    label: 'Send Email',
    icon: <MailOutlined />,
    node: {
      type: 'default',
      data: { label: 'Send Email' },
    },
  },
  {
    type: 'delay',
    label: 'Delay',
    icon: <ClockCircleOutlined />,
    node: {
      type: 'default',
      data: { label: 'Delay' },
    },
  },
];

const WORKFLOW_STORAGE_KEY = 'workflow_builder_v1';
const THEME_KEY = 'workflow_builder_theme';

export default function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [workflowTitle, setWorkflowTitle] = useState('My Workflow');
  const [editingTitle, setEditingTitle] = useState(false);
  const dragNodeType = useRef(null);
  const [theme, setTheme] = useState(localStorage.getItem(THEME_KEY) || 'light');
  const [toolboxCollapsed, setToolboxCollapsed] = useState(false);
  const [log, setLog] = useState([]);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [importModal, setImportModal] = useState(false);
  // Theme toggle
  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };

  // Save/load/export/import workflow
  useEffect(() => {
    const saved = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (saved) {
      try {
        const { nodes, edges, title } = JSON.parse(saved);
        if (nodes && edges) {
          setNodes(nodes);
          setEdges(edges);
          if (title) setWorkflowTitle(title);
        }
      } catch {}
    }
    // eslint-disable-next-line
  }, []);

  const saveWorkflow = () => {
    localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify({ nodes, edges, title: workflowTitle }));
    message.success('Workflow saved!');
  };
  const loadWorkflow = () => {
    const saved = localStorage.getItem(WORKFLOW_STORAGE_KEY);
    if (saved) {
      try {
        const { nodes, edges, title } = JSON.parse(saved);
        setNodes(nodes);
        setEdges(edges);
        if (title) setWorkflowTitle(title);
        message.success('Workflow loaded!');
      } catch {
        message.error('Failed to load workflow.');
      }
    }
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
        const { nodes, edges, title } = JSON.parse(e.target.result);
        setNodes(nodes);
        setEdges(edges);
        if (title) setWorkflowTitle(title);
        message.success('Workflow imported!');
        setImportModal(false);
      } catch {
        message.error('Invalid workflow file.');
      }
    };
    reader.readAsText(file);
    return false;
  };

  // Undo/redo
  const pushHistory = () => {
    setHistory((h) => [...h, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
    setFuture([]);
  };
  const undo = () => {
    if (history.length === 0) return;
    setFuture((f) => [ { nodes, edges }, ...f ]);
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

  // Log actions
  const addLog = (msg) => setLog((l) => [msg, ...l.slice(0, 19)]);

  const onConnect = useCallback((params) => {
    pushHistory();
    setEdges((eds) => addEdge(params, eds));
    addLog(`Connected node ${params.source} to ${params.target}`);
  }, [setEdges, nodes, edges]);

  const onNodeClick = (_evt, node) => {
    setSelectedNode(node);
    setDrawerOpen(true);
    addLog(`Selected node ${node.id}`);
  };

  const onPaneClick = () => {
    setDrawerOpen(false);
    setSelectedNode(null);
  };

  // Drag-and-drop from toolbox
  const onDragStart = (event, tool) => {
    dragNodeType.current = tool;
    event.dataTransfer.effectAllowed = 'move';
  };
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = event.target.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      const tool = dragNodeType.current;
      if (!tool) return;
      pushHistory();
      const id = (nodes.length + 1 + Math.floor(Math.random() * 10000)).toString();
      setNodes((nds) => [
        ...nds,
        {
          id,
          position,
          ...tool.node,
          data: { ...tool.node.data, id },
        },
      ]);
      addLog(`Added node ${tool.label}`);
      dragNodeType.current = null;
    },
    [nodes, setNodes]
  );
  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  // Node deletion
  const deleteNode = (id) => {
    pushHistory();
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setDrawerOpen(false);
    setSelectedNode(null);
    addLog(`Deleted node ${id}`);
  };

  // Edge deletion
  const onEdgeClick = (evt, edge) => {
    evt.stopPropagation();
    pushHistory();
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    addLog(`Deleted edge ${edge.id}`);
  };

  // Node label editing
  const updateNodeLabel = (id, label) => {
    pushHistory();
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label } } : n))
    );
    setSelectedNode((node) => node ? { ...node, data: { ...node.data, label } } : node);
    addLog(`Renamed node ${id} to ${label}`);
  };

  // Copy/paste
  const copyNode = () => {
    if (!selectedNode) return;
    const copy = { ...selectedNode, id: (nodes.length + 1 + Math.floor(Math.random() * 10000)).toString(), position: { x: selectedNode.position.x + 40, y: selectedNode.position.y + 40 } };
    pushHistory();
    setNodes((nds) => [...nds, copy]);
    addLog(`Copied node ${selectedNode.id}`);
  };

  // Run/test mode (simulate)
  const runWorkflow = () => {
    addLog('Simulated workflow run!');
    message.info('Workflow run simulated. (Add real logic as needed)');
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: theme === 'dark' ? 'linear-gradient(90deg, #23272f 60%, #1a1d23 100%)' : 'linear-gradient(90deg, #f8fafc 60%, #f0f4ff 100%)', color: theme === 'dark' ? '#fff' : '#222' }}>
      {/* Toolbox */}
      <div style={{ width: toolboxCollapsed ? 48 : 260, background: theme === 'dark' ? '#23272f' : '#fff', borderRight: '1px solid #e6e6e6', padding: toolboxCollapsed ? 8 : 20, boxShadow: '2px 0 8px #0001', zIndex: 2, transition: 'width 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: toolboxCollapsed ? 'center' : 'space-between', marginBottom: toolboxCollapsed ? 0 : 18 }}>
          {!toolboxCollapsed && <Title level={4} style={{ margin: 0, color: theme === 'dark' ? '#fff' : '#2a3a4a' }}>Workflow Toolbox</Title>}
          <Button icon={toolboxCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} size="small" onClick={() => setToolboxCollapsed(v => !v)} style={{ marginLeft: 8 }} />
        </div>
        {!toolboxCollapsed && <>
        <Space direction="vertical" style={{ width: '100%' }}>
          {TOOLBOX.map((tool) => (
            <Card
              key={tool.type}
              size="small"
              hoverable
              style={{ marginBottom: 10, cursor: 'grab', borderRadius: 10, border: '1px solid #e6e6e6', background: theme === 'dark' ? '#23272f' : '#f7faff', color: theme === 'dark' ? '#fff' : '#222', transition: 'background 0.2s' }}
              draggable
              onDragStart={(e) => onDragStart(e, tool)}
              onClick={() => {
                // fallback for click-to-add
                pushHistory();
                const id = (nodes.length + 1 + Math.floor(Math.random() * 10000)).toString();
                setNodes((nds) => [
                  ...nds,
                  {
                    id,
                    position: { x: 200 + Math.random() * 200, y: 100 + Math.random() * 200 },
                    ...tool.node,
                    data: { ...tool.node.data, id },
                  },
                ]);
                addLog(`Added node ${tool.label}`);
              }}
            >
              <Space>
                {tool.icon}
                <Text>{tool.label}</Text>
                <Tooltip title="Drag to canvas or click to add"><Button icon={<PlusOutlined />} size="small" /></Tooltip>
              </Space>
            </Card>
          ))}
        </Space>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button icon={<SaveOutlined />} type="primary" style={{ marginRight: 8 }} onClick={saveWorkflow}>Save</Button>
          <Button icon={<FolderOpenOutlined />} onClick={loadWorkflow} style={{ marginRight: 8 }}>Load</Button>
          <Tooltip title="Export Workflow"><Button icon={<ExportOutlined />} onClick={exportWorkflow} style={{ marginRight: 8 }} /></Tooltip>
          <Tooltip title="Import Workflow"><Button icon={<ImportOutlined />} onClick={() => setImportModal(true)} /></Tooltip>
        </div>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Tooltip title="Undo"><Button icon={<UndoOutlined />} onClick={undo} style={{ marginRight: 8 }} /></Tooltip>
          <Tooltip title="Redo"><Button icon={<RedoOutlined />} onClick={redo} /></Tooltip>
        </div>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Tooltip title="Toggle dark/light mode"><Switch checkedChildren={<BulbOutlined />} unCheckedChildren={<BulbOutlined />} checked={theme === 'dark'} onChange={toggleTheme} /></Tooltip>
        </div>
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Tooltip title="Simulate workflow run"><Button icon={<PlayCircleOutlined />} onClick={runWorkflow} type="dashed" /></Tooltip>
        </div>
        </>}
      </div>
      {/* Canvas and log */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column', background: theme === 'dark' ? '#23272f' : undefined }}>
        {/* Header */}
        <div style={{ padding: '18px 32px 8px 32px', background: theme === 'dark' ? 'rgba(30,32,38,0.98)' : 'rgba(255,255,255,0.95)', borderBottom: '1px solid #e6e6e6', display: 'flex', alignItems: 'center', zIndex: 1 }}>
          {editingTitle ? (
            <Input
              value={workflowTitle}
              onChange={e => setWorkflowTitle(e.target.value)}
              onBlur={() => setEditingTitle(false)}
              onPressEnter={() => setEditingTitle(false)}
              style={{ fontSize: 22, fontWeight: 600, width: 320 }}
              maxLength={40}
              autoFocus
            />
          ) : (
            <Title level={3} style={{ margin: 0, color: theme === 'dark' ? '#fff' : '#2a3a4a', fontWeight: 700, cursor: 'pointer' }} onClick={() => setEditingTitle(true)}>
              <EditOutlined style={{ marginRight: 8, color: '#b3b3b3' }} />{workflowTitle}
            </Title>
          )}
        </div>
        {/* React Flow Canvas */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            nodeTypes={nodeTypes}
            onDrop={onDrop}
            onDragOver={onDragOver}
            style={{ background: theme === 'dark' ? 'linear-gradient(135deg, #23272f 60%, #1a1d23 100%)' : 'linear-gradient(135deg, #f8fafc 60%, #e6f0ff 100%)', borderRadius: 0 }}
            onEdgeClick={onEdgeClick}
          >
            <MiniMap nodeColor={n => n.type === 'input' ? '#1890ff' : '#13c2c2'} />
            <Controls />
            <Background gap={16} color={theme === 'dark' ? '#444' : '#e6e6e6'} />
          </ReactFlow>
        </div>
        {/* Mini log panel */}
        <div style={{ position: 'absolute', right: 24, bottom: 24, width: 320, background: theme === 'dark' ? '#23272f' : '#fff', border: '1px solid #e6e6e6', borderRadius: 8, boxShadow: '0 2px 12px #0002', zIndex: 10, maxHeight: 220, overflow: 'auto', fontSize: 13 }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #e6e6e6', fontWeight: 600, background: theme === 'dark' ? '#23272f' : '#f7faff' }}>
            <LinkOutlined style={{ marginRight: 6 }} />Workflow Log
            <Button icon={<CloseOutlined />} size="small" style={{ float: 'right', marginTop: 2 }} onClick={() => setLog([])} />
          </div>
          <div style={{ padding: 8 }}>
            {log.length === 0 ? <Text type="secondary">No actions yet.</Text> : log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
        {/* Node Config Drawer */}
        <Drawer
          title={selectedNode ? `Configure: ${selectedNode.data.label}` : ''}
          placement="right"
          onClose={() => setDrawerOpen(false)}
          open={drawerOpen}
          width={360}
          styles={{ body: { background: theme === 'dark' ? '#23272f' : '#fff', color: theme === 'dark' ? '#fff' : '#222' } }}
        >
          {selectedNode ? (
            <div>
              <Text strong>ID:</Text> <Text code>{selectedNode.id}</Text>
              <br />
              <Text strong>Type:</Text> <Text>{selectedNode.type}</Text>
              <br />
              <div style={{ margin: '16px 0' }}>
                <Text strong>Label:</Text>
                <Input
                  value={selectedNode.data.label}
                  onChange={e => updateNodeLabel(selectedNode.id, e.target.value)}
                  style={{ marginTop: 4, width: '100%' }}
                  maxLength={32}
                />
              </div>
              <Space>
                <Button icon={<CopyOutlined />} onClick={copyNode}>Copy</Button>
                <Button danger icon={<DeleteOutlined />} onClick={() => deleteNode(selectedNode.id)} style={{ marginTop: 0 }}>Delete Node</Button>
              </Space>
            </div>
          ) : null}
        </Drawer>
        {/* Import Modal */}
        <Modal
          title="Import Workflow"
          open={importModal}
          onCancel={() => setImportModal(false)}
          footer={null}
        >
          <Upload.Dragger
            accept=".json"
            beforeUpload={importWorkflow}
            showUploadList={false}
            style={{ padding: 24 }}
          >
            <p className="ant-upload-drag-icon">
              <ImportOutlined style={{ fontSize: 32 }} />
            </p>
            <p className="ant-upload-text">Click or drag a workflow JSON file to import</p>
          </Upload.Dragger>
        </Modal>
      </div>
    </div>
  );
}
