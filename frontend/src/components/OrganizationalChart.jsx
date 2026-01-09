import React, { useState, useEffect, useRef } from 'react';
import { Card, Tree, Spin, Empty, Avatar, Typography, Space, Tag, message, Button, Dropdown } from 'antd';
import { UserOutlined, TeamOutlined, ApartmentOutlined, DownloadOutlined, PrinterOutlined, FilePdfOutlined, FileImageOutlined, DownOutlined } from '@ant-design/icons';
import axios from '../axios';
import { useCompany } from '../contexts/CompanyContext';

const { Title, Text } = Typography;

const OrganizationalChart = () => {
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const chartRef = useRef(null);
  const { currentCompany } = useCompany();

  useEffect(() => {
    if (currentCompany) {
      fetchHierarchy();
    }
  }, [currentCompany]);

  const fetchHierarchy = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/organizational-chart');
      setHierarchy(response.data || []);
    } catch (error) {
      console.error('Error fetching organizational chart:', error);
      message.error('Failed to load organizational chart');
    } finally {
      setLoading(false);
    }
  };

  const buildTreeData = (nodes) => {
    return nodes.map(node => ({
      title: (
        <Space style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 8, width: '100%' }}>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
            {node.name?.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{node.name}</div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{node.position || 'Employee'}</div>
            <div style={{ fontSize: 11, color: '#8c8c8c' }}>{node.email}</div>
          </div>
          <Tag color="blue">{node.role_id === 1 ? 'Admin' : node.role_id === 2 ? 'Manager' : 'Employee'}</Tag>
        </Space>
      ),
      key: node.id,
      children: node.children && node.children.length > 0 ? buildTreeData(node.children) : undefined,
    }));
  };

  const captureChart = async () => {
    if (!chartRef.current) return null;

    try {
      // Dynamically import html2canvas only when needed
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
      });
      
      return canvas;
    } catch (error) {
      console.error('Error capturing chart:', error);
      message.error('Failed to capture chart. Please install html2canvas: npm install html2canvas');
      return null;
    }
  };

  const handleExportPNG = async () => {
    try {
      setExporting(true);
      const canvas = await captureChart();
      
      if (!canvas) {
        setExporting(false);
        return;
      }

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `organizational-chart-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        message.success('Chart exported as PNG successfully');
        setExporting(false);
      }, 'image/png');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export chart');
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const canvas = await captureChart();
      
      if (!canvas) {
        setExporting(false);
        return;
      }

      // Try to use jsPDF if available, otherwise fallback to image download
      try {
        const { jsPDF } = await import('jspdf');
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 297; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 210; // A4 height in mm

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= 210;
        }

        pdf.save(`organizational-chart-${new Date().toISOString().split('T')[0]}.pdf`);
        message.success('Chart exported as PDF successfully');
      } catch (jsPdfError) {
        // Fallback to PNG if jsPDF is not available
        console.warn('jsPDF not available, falling back to PNG:', jsPdfError);
        handleExportPNG();
        message.info('PDF export requires jsPDF. Exported as PNG instead. Install: npm install jspdf');
      }
      
      setExporting(false);
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export chart');
      setExporting(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('Please allow popups to print');
      return;
    }

    const chartElement = chartRef.current;
    if (!chartElement) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Organizational Chart</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }
            .org-chart-print {
              width: 100%;
            }
            .org-chart-print .ant-tree {
              font-size: 12px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          <h1>Organizational Chart</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <p>Total Employees: ${countEmployees(hierarchy)}</p>
          <div class="org-chart-print">
            ${chartElement.innerHTML}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (hierarchy.length === 0) {
    return (
      <Card>
        <Empty
          description="No organizational data available. Assign managers to employees to build the hierarchy."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const treeData = buildTreeData(hierarchy);

  const exportMenuItems = [
    {
      key: 'png',
      label: 'Export as PNG',
      icon: <FileImageOutlined />,
      onClick: handleExportPNG,
    },
    {
      key: 'pdf',
      label: 'Export as PDF',
      icon: <FilePdfOutlined />,
      onClick: handleExportPDF,
    },
  ];

  return (
    <Card
      title={
        <Space>
          <ApartmentOutlined />
          <span>Organizational Chart</span>
        </Space>
      }
      extra={
        <Space>
          <Text type="secondary">Total Employees: {countEmployees(hierarchy)}</Text>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
            disabled={loading || hierarchy.length === 0}
          >
            Print
          </Button>
          <Dropdown
            menu={{ items: exportMenuItems }}
            trigger={['click']}
            disabled={loading || hierarchy.length === 0 || exporting}
          >
            <Button
              icon={<DownloadOutlined />}
              loading={exporting}
            >
              Export <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      }
    >
      <div 
        ref={chartRef}
        style={{ overflowX: 'auto', padding: '20px' }}
        id="org-chart-container"
      >
        <Tree
          showLine
          defaultExpandAll
          treeData={treeData}
          style={{ minWidth: 400 }}
        />
      </div>
    </Card>
  );
};

const countEmployees = (nodes) => {
  let count = 0;
  nodes.forEach(node => {
    count++;
    if (node.children) {
      count += countEmployees(node.children);
    }
  });
  return count;
};

export default OrganizationalChart;



