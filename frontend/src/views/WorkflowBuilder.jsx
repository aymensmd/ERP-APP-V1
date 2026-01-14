import React, { useCallback, useState, useMemo } from 'react';
import ReactFlow, {
  MiniMap, Controls, Background, addEdge, useNodesState, useEdgesState,
  MarkerType, Handle, Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Button, Drawer, Typography, Space, Input, message, Form, Select,
  Tag, InputNumber, Tabs, Card
} from 'antd';
import {
  MailOutlined, ApiOutlined, ThunderboltOutlined, PartitionOutlined,
  SaveOutlined, BulbOutlined, PlayCircleOutlined, RobotOutlined,
  ClockCircleOutlined, CodeOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const ICON_MAP = {
  trigger: <ThunderboltOutlined />,
  http: <ApiOutlined />,
  email: <MailOutlined />,
  condition: <PartitionOutlined />,
  ai: <RobotOutlined />,
  delay: <ClockCircleOutlined />,
  erp: <SaveOutlined />
};

// --- CUSTOM NODE ---
const CustomNode = ({ data, selected }) => {
  const isDark = data.theme === 'dark';
  const hasError = !data.label || (data.type === 'http' && !data.settings?.url) ||
    (data.type === 'condition' && !data.settings?.leftSide);
  const isExecuting = data.executing;
  const isComplete = data.completed;

  return (
    <div style={{
      padding: 12,
      borderRadius: 10,
      background: isDark ? '#1e1e1e' : '#fff',
      color: isDark ? '#fff' : '#222',
      border: `2px solid ${selected ? '#1890ff' : hasError ? '#ff4d4f' : isComplete ? '#52c41a' : 'transparent'}`,
      boxShadow: selected ? '0 8px 24px rgba(24,144,255,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
      width: 180,
      position: 'relative',
      opacity: isExecuting ? 0.7 : 1,
      transition: 'all 0.2s'
    }}>
      {hasError && <div style={{
        position: 'absolute', top: -6, right: -6, background: '#ff4d4f', color: '#fff',
        borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>!</div>}
      {isComplete && <div style={{
        position: 'absolute', top: -6, right: -6, background: '#52c41a', color: '#fff',
        borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>✓</div>}

      {data.type !== 'trigger' && (
        <Handle type="target" position={Position.Left} style={{ background: '#1890ff', width: 10, height: 10, border: '2px solid #fff' }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          background: data.color, color: '#fff', padding: 6, borderRadius: 6, fontSize: 16, position: 'relative'
        }}>
          {ICON_MAP[data.type]}
          {isExecuting && <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.3)', borderRadius: 6,
            animation: 'pulse 1.5s infinite'
          }} />}
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <Text strong style={{ fontSize: 12 }} ellipsis>{data.label}</Text>
          <div style={{ fontSize: 10, opacity: 0.5 }}>{data.type.toUpperCase()}</div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#1890ff', width: 10, height: 10, border: '2px solid #fff'
        }}
        id={data.type === 'trigger' ? 'single' : undefined}
      />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.5;} }
      `}</style>
    </div>
  );
};

const nodeTypes = { workflowNode: CustomNode };

const TOOLBOX = [
  { type: 'trigger', label: 'Start Trigger', color: '#ff4d4f', desc: 'Manual/Cron' },
  { type: 'erp', label: 'ERP Action', color: '#722ed1', desc: 'Internal Logic' },
  { type: 'http', label: 'HTTP Request', color: '#1890ff', desc: 'External API' },
  { type: 'condition', label: 'Logic Branch', color: '#faad14', desc: 'If/Else' },
  { type: 'ai', label: 'AI Processor', color: '#eb2f96', desc: 'LLM Analysis' },
  { type: 'email', label: 'Send Email', color: '#13c2c2', desc: 'Notifications' },
  { type: 'delay', label: 'Wait/Delay', color: '#52c41a', desc: 'Pause Flow' },
];

// --- NODE CONFIGURATION FIELDS ---
const NODE_CONFIG_FIELDS = {
  trigger: [
    { label: 'Label', name: 'label', component: <Input placeholder="Node label..." />, rules: [{ required: true }] },
    { label: 'Schedule', name: 'schedule', component: <Input placeholder="Cron / Manual" /> }
  ],
  http: [
    { label: 'Label', name: 'label', component: <Input placeholder="Node label..." />, rules: [{ required: true }] },
    { label: 'URL', name: 'url', component: <Input placeholder="https://api.example.com" />, rules: [{ required: true }] },
    { label: 'Method', name: 'method', component: <Select><Option value="GET">GET</Option><Option value="POST">POST</Option></Select> },
    { label: 'Headers', name: 'headers', component: <Input placeholder='{"Authorization":"Bearer ..."}' /> },
    { label: 'Body', name: 'body', component: <Input.TextArea placeholder='{"key":"value"}' /> }
  ],
  condition: [
    { label: 'Label', name: 'label', component: <Input placeholder="Node label..." />, rules: [{ required: true }] },
    { label: 'Left Operand', name: 'leftSide', component: <Input placeholder="{{context.outputs.node_id.value}}" />, rules: [{ required: true }] },
    {
      label: 'Operator', name: 'operator', component: <Select>
        <Option value="eq">= Equals</Option>
        <Option value="neq">≠ Not Equals</Option>
        <Option value="gt">&gt; Greater Than</Option>
        <Option value="gte">≥ Greater or Equal</Option>
        <Option value="lt">&lt; Less Than</Option>
        <Option value="lte">≤ Less or Equal</Option>
        <Option value="contains">Contains</Option>
      </Select>, rules: [{ required: true }]
    },
    { label: 'Right Operand', name: 'rightSide', component: <Input placeholder="100" />, rules: [{ required: true }] }
  ],
  ai: [
    { label: 'Label', name: 'label', component: <Input placeholder="Node label..." />, rules: [{ required: true }] },
    { label: 'Prompt', name: 'prompt', component: <Input.TextArea placeholder="AI prompt..." />, rules: [{ required: true }] },
    { label: 'Temperature', name: 'temperature', component: <InputNumber min={0} max={1} step={0.1} /> }
  ],
  email: [
    { label: 'Label', name: 'label', component: <Input placeholder="Node label..." />, rules: [{ required: true }] },
    { label: 'Recipient', name: 'recipient', component: <Input placeholder="email@example.com" />, rules: [{ required: true }] },
    { label: 'Subject', name: 'subject', component: <Input placeholder="Email Subject" /> },
    { label: 'Body', name: 'body', component: <Input.TextArea placeholder="Email Body" /> }
  ],
  delay: [
    { label: 'Label', name: 'label', component: <Input placeholder="Node label..." />, rules: [{ required: true }] },
    { label: 'Delay (ms)', name: 'delay', component: <InputNumber min={0} step={100} />, rules: [{ required: true }] }
  ],
  erp: [
    { label: 'Label', name: 'label', component: <Input placeholder="Node label..." />, rules: [{ required: true }] },
    { label: 'Module', name: 'module', component: <Input placeholder="ERP module name..." /> },
    { label: 'Action', name: 'action', component: <Input placeholder="Action name..." /> }
  ]
};

export default function WorkflowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [form] = Form.useForm();
  const [executionLog, setExecutionLog] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const getNodeOutputs = (type) => {
    switch (type) {
      case 'http': return ['response', 'status', 'headers'];
      case 'condition': return ['result'];
      case 'ai': return ['output', 'confidence'];
      case 'erp': return ['result', 'recordId'];
      case 'trigger': return ['payload', 'timestamp'];
      case 'email': return ['status', 'messageId'];
      case 'delay': return ['completed'];
      default: return ['output'];
    }
  };

  const availableVariables = useMemo(() => {
    if (!selectedNode) return [];
    const ancestors = new Set();
    const queue = [selectedNode.id];
    while (queue.length) {
      const currentId = queue.shift();
      edges.filter(e => e.target === currentId).forEach(e => {
        if (!ancestors.has(e.source)) { ancestors.add(e.source); queue.push(e.source); }
      });
    }
    return nodes
      .filter(n => ancestors.has(n.id) || n.data.type === 'trigger')
      .map(n => ({ id: n.id, label: n.data.label, type: n.data.type, outputs: getNodeOutputs(n.data.type) }));
  }, [nodes, edges, selectedNode]);

  const onConnect = useCallback((params) => {
    const source = nodes.find(n => n.id === params.source);
    const isCondition = source?.data.type === 'condition';
    const outCount = edges.filter(e => e.source === params.source).length;

    setEdges(eds => addEdge({
      ...params,
      label: isCondition ? (outCount === 0 ? 'TRUE' : 'FALSE') : '',
      animated: !isCondition,
      style: { stroke: isCondition ? (outCount === 0 ? '#52c41a' : '#ff4d4f') : '#1890ff', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#1890ff' },
    }, eds));
  }, [nodes, edges]);

  const onDrop = (event) => {
    event.preventDefault();
    const reactFlowBounds = document.querySelector('.react-flow-wrapper').getBoundingClientRect();
    const tool = JSON.parse(event.dataTransfer.getData('application/reactflow'));
    const position = { x: event.clientX - reactFlowBounds.left - 90, y: event.clientY - reactFlowBounds.top - 20 };
    const newNode = { id: `${tool.type}_${Math.random().toString(36).substr(2, 5)}`, type: 'workflowNode', position, data: { ...tool, theme, settings: {} } };
    setNodes(nds => nds.concat(newNode));
    message.success(`${tool.label} added`, 1);
  };

  const updateNodeData = (values) => {
    if (!selectedNode) return;
    setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...values, settings: values, completed: false } } : n));
  };

  const simulateExecution = async () => {
    const triggerNode = nodes.find(n => n.data.type === 'trigger');
    if (!triggerNode) { message.error('No trigger node found'); return; }
    setIsSimulating(true);
    setExecutionLog([]);
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, executing: false, completed: false } })));

    const executeNode = async (nodeId, depth = 0) => {
      if (depth > 50) return;
      setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, executing: true } } : n));
      await new Promise(r => setTimeout(r, 600));
      const node = nodes.find(n => n.id === nodeId);
      setExecutionLog(log => [...log, { nodeId, label: node.data.label, type: node.data.type, time: new Date().toLocaleTimeString() }]);
      setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, executing: false, completed: true } } : n));
      const outgoingEdges = edges.filter(e => e.source === nodeId);
      if (node.data.type === 'condition') { if (outgoingEdges.length) await executeNode(outgoingEdges[0].target, depth + 1); }
      else { for (const e of outgoingEdges) { await executeNode(e.target, depth + 1); } }
    };

    await executeNode(triggerNode.id);
    setIsSimulating(false);
    message.success('Simulation complete');
  };

  const validateWorkflow = () => {
    const errors = [];
    const triggerNodes = nodes.filter(n => n.data.type === 'trigger');
    if (triggerNodes.length === 0) errors.push('No trigger node');
    if (triggerNodes.length > 1) errors.push('Multiple trigger nodes');
    nodes.forEach(node => {
      if (!node.data.label) errors.push(`Node ${node.id} missing label`);
      if (node.data.type === 'http' && !node.data.settings?.url) errors.push(`HTTP node "${node.data.label}" missing URL`);
      if (node.data.type === 'condition' && !node.data.settings?.leftSide) errors.push(`Condition node "${node.data.label}" missing condition`);
    });
    if (errors.length) { message.error(`Validation failed: ${errors[0]}`, 3); return false; }
    message.success('Workflow is valid ✓');
    return true;
  };

  const DataPicker = ({ targetField }) => (
    <div style={{ marginTop: 8, padding: '10px', background: '#f5f5f5', borderRadius: 6, border: '1px dashed #d9d9d9' }}>
      <Text type="secondary" style={{ fontSize: 11 }}><CodeOutlined /> Reference Variables:</Text>
      {availableVariables.length === 0 ? <Text type="secondary" style={{ fontSize: 11 }}>No upstream nodes yet</Text> :
        <div style={{ maxHeight: 120, overflowY: 'auto' }}>
          {availableVariables.map(v => (
            <div key={v.id} style={{ marginBottom: 8 }}>
              <Text strong style={{ fontSize: 11 }}>{v.label}</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {v.outputs.map(out => (
                  <Tag key={out} color="blue" style={{ cursor: 'pointer', fontSize: 10 }} onClick={() => {
                    const current = form.getFieldValue(targetField) || '';
                    form.setFieldsValue({ [targetField]: `${current}{{context.outputs.${v.id}.${out}}}` });
                    updateNodeData(form.getFieldsValue());
                    message.success('Variable inserted', 1);
                  }}>{out}</Tag>
                ))}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', padding: 20, background: theme === 'dark' ? '#141414' : '#f0f2f5', gap: 20 }}>
      {/* Toolbox */}
      <Card style={{ width: 260, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Title level={5} style={{ marginBottom: 12 }}>Workflow Nodes</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          {TOOLBOX.map(tool => (
            <div key={tool.type} draggable onDragStart={e => e.dataTransfer.setData('application/reactflow', JSON.stringify(tool))}
              style={{ padding: 10, borderRadius: 8, border: '1px solid #f0f0f0', cursor: 'grab', background: '#fff' }}>
              <Space>
                <div style={{ color: tool.color, fontSize: 18 }}>{ICON_MAP[tool.type]}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{tool.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.5 }}>{tool.desc}</div>
                </div>
              </Space>
            </div>
          ))}
        </Space>
      </Card>

      {/* Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 15 }}>
        <div style={{ background: '#fff', padding: '12px 20px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="large"><Text strong style={{ fontSize: 16 }}>Automation Builder</Text></Space>
          <Space>
            <Button type="primary" ghost icon={<PlayCircleOutlined />} onClick={simulateExecution} loading={isSimulating}>{isSimulating ? 'Running...' : 'Dry Run'}</Button>
            <Button icon={<BulbOutlined />} onClick={validateWorkflow}>Validate</Button>
          </Space>
        </div>

        <div className="react-flow-wrapper" style={{ flex: 1, background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
          <ReactFlow
            nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} nodeTypes={nodeTypes} onDrop={onDrop} onDragOver={e => e.preventDefault()}
            onNodeClick={(_, node) => { setSelectedNode(node); setDrawerOpen(true); form.resetFields(); form.setFieldsValue({ ...node.data.settings, label: node.data.label }); }}
            fitView
          >
            <Background color="#aaa" gap={20} />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      {/* Node Settings Drawer */}
      <Drawer title="Configure Node" width={480} open={drawerOpen} onClose={() => { setDrawerOpen(false); form.resetFields(); }}>
        {selectedNode && (
          <Form layout="vertical" form={form} initialValues={{ ...selectedNode.data.settings, label: selectedNode.data.label }} onValuesChange={(_, values) => updateNodeData(values)}>
            <Tabs defaultActiveKey="1" size="small">
              <TabPane tab="Configuration" key="1">
                {NODE_CONFIG_FIELDS[selectedNode.data.type]?.map(field => (
                  <Form.Item key={field.name} label={field.label} name={field.name} rules={field.rules || []}>
                    {field.component}
                  </Form.Item>
                ))}
              </TabPane>
            </Tabs>
            <DataPicker targetField="outputs" />
          </Form>
        )}
      </Drawer>
    </div>
  );
}
