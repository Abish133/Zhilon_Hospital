import { useState, useEffect } from 'react';
import { Card, Button, Table, Form, Select, InputNumber, DatePicker, message, Space, Input } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined } from '@ant-design/icons';
import PageHeader from '@components/common/PageHeader';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import { goodsReceiptNoteService, purchaseOrderService, medicineService } from '@services/index';
import { useAuthStore } from '@store';
import dayjs from 'dayjs';

const GoodsReceipt = () => {
  const { user } = useAuthStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [selectedPO, setSelectedPO] = useState(null);
  const [receivedItems, setReceivedItems] = useState([]);
  const [grnNumber, setGrnNumber] = useState('');

  const { data: pos } = useApiQuery(['purchase-orders-approved'], () =>
    purchaseOrderService.getAll({ status: 'Approved' })
  );

  const { data: grns, refetch } = useApiQuery(['grns'], () =>
    goodsReceiptNoteService.getAll()
  );

  const { data: medicines } = useApiQuery(['medicines'], () => medicineService.getAll());

  useEffect(() => {
    generateGRNNumber();
  }, []);

  const generateGRNNumber = () => {
    const timestamp = Date.now();
    setGrnNumber(`GRN-${timestamp}`);
  };

  const createMutation = useApiMutation(
    (data) => goodsReceiptNoteService.create(data),
    {
      successMessage: 'GRN recorded successfully',
      onSuccess: () => {
        refetch();
        setModalOpen(false);
        form.resetFields();
        setReceivedItems([]);
        setSelectedPO(null);
        generateGRNNumber();
      }
    }
  );

  const handlePOSelect = (poId) => {
    const po = pos?.data?.find((p) => p.po_id === poId);
    setSelectedPO(po);
    
    if (po && po.items) {
      setReceivedItems(
        po.items.map((item) => ({
          item_id: item.item_id,
          medicine_id: null,
          ordered_quantity: item.quantity,
          received_quantity: item.quantity,
          batch_number: '',
          expiry_date: null,
          purchase_rate: item.rate,
          selling_rate: item.rate * 1.2,
          mrp: item.rate * 1.3,
          item_name: item.item_name
        }))
      );
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...receivedItems];
    newItems[index][field] = value;
    setReceivedItems(newItems);
  };

  const handleSubmit = (values) => {
    if (!selectedPO) {
      message.error('Please select a purchase order');
      return;
    }

    if (receivedItems.some(item => !item.batch_number || !item.expiry_date)) {
      message.error('Please fill batch number and expiry date for all items');
      return;
    }

    createMutation.mutate({
      grn_number: grnNumber,
      po_id: selectedPO.po_id,
      vendor_id: selectedPO.vendor_id,
      received_date: values.received_date.format('YYYY-MM-DD'),
      invoice_number: values.invoice_number || null,
      invoice_date: values.invoice_date ? values.invoice_date.format('YYYY-MM-DD') : null,
      received_by: user?.id || 1,
      hospital_id: user?.hospital_id,
      items: receivedItems.map(item => ({
        item_id: item.item_id,
        medicine_id: item.medicine_id || null,
        ordered_quantity: item.ordered_quantity,
        received_quantity: item.received_quantity,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date.format('YYYY-MM-DD'),
        purchase_rate: item.purchase_rate || 0,
        selling_rate: item.selling_rate || 0,
        mrp: item.mrp || 0
      }))
    });
  };

  const columns = [
    { title: 'GRN Number', dataIndex: 'grn_number', key: 'grn_number' },
    { 
      title: 'PO Number', 
      key: 'po_number',
      render: (_, record) => record.purchaseOrder?.po_number || '-'
    },
    { 
      title: 'Received Date', 
      dataIndex: 'received_date', 
      key: 'received_date', 
      render: (date) => dayjs(date).format('DD MMM YYYY') 
    },
    { 
      title: 'Vendor',
      key: 'vendor',
      render: (_, record) => record.vendor?.vendor_name || '-'
    },
    { 
      title: 'Received By', 
      key: 'received_by_name',
      render: (_, record) => record.receiver?.name || '-'
    }
  ];

  return (
    <div>
      <PageHeader
        title="Goods Receipt Notes"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Record GRN
          </Button>
        }
      />
      <Card>
        <Table columns={columns} dataSource={grns?.data || []} rowKey="grn_id" />
      </Card>

      <SliderModal
        title="Record Goods Receipt"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedPO(null);
          setReceivedItems([]);
        }}
        onOk={() => form.submit()}
        width={1000}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="GRN Number">
            <Input value={grnNumber} disabled />
          </Form.Item>
          <Form.Item name="po_id" label="Purchase Order" rules={[{ required: true }]}>
            <Select
              placeholder="Select PO"
              onChange={handlePOSelect}
              options={pos?.data?.map((po) => ({
                label: `${po.po_number} - ${po.vendor?.vendor_name}`,
                value: po.po_id
              }))}
            />
          </Form.Item>
          <Form.Item name="received_date" label="Received Date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="invoice_number" label="Invoice Number">
            <Input placeholder="Enter invoice number" />
          </Form.Item>
          <Form.Item name="invoice_date" label="Invoice Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          {receivedItems.length > 0 && (
            <div>
              <strong>Received Items:</strong>
              {receivedItems.map((item, index) => (
                <Card key={index} size="small" style={{ marginTop: 8 }}>
                  <div><strong>Item:</strong> {item.item_name}</div>
                  <Space style={{ marginTop: 8, width: '100%' }} wrap>
                    <InputNumber
                      addonBefore="Ordered"
                      value={item.ordered_quantity}
                      disabled
                      style={{ width: 150 }}
                    />
                    <InputNumber
                      addonBefore="Received"
                      value={item.received_quantity}
                      min={0}
                      max={item.ordered_quantity}
                      onChange={(val) => handleItemChange(index, 'received_quantity', val)}
                      style={{ width: 150 }}
                    />
                  </Space>
                  <Space style={{ marginTop: 8, width: '100%' }} wrap>
                    <Select
                      style={{ width: 200 }}
                      placeholder="Link Medicine"
                      value={item.medicine_id}
                      onChange={(val) => handleItemChange(index, 'medicine_id', val)}
                      options={medicines?.data?.map(m => ({ label: m.medicine_name, value: m.medicine_id }))}
                      allowClear
                    />
                    <Input
                      placeholder="Batch Number"
                      value={item.batch_number}
                      onChange={(e) => handleItemChange(index, 'batch_number', e.target.value)}
                      style={{ width: 150 }}
                    />
                    <DatePicker
                      placeholder="Expiry Date"
                      value={item.expiry_date}
                      onChange={(date) => handleItemChange(index, 'expiry_date', date)}
                      style={{ width: 150 }}
                    />
                  </Space>
                  <Space style={{ marginTop: 8, width: '100%' }} wrap>
                    <InputNumber
                      addonBefore="Purchase Rate"
                      prefix="â‚¹"
                      value={item.purchase_rate}
                      onChange={(val) => handleItemChange(index, 'purchase_rate', val)}
                      style={{ width: 180 }}
                    />
                    <InputNumber
                      addonBefore="Selling Rate"
                      prefix="â‚¹"
                      value={item.selling_rate}
                      onChange={(val) => handleItemChange(index, 'selling_rate', val)}
                      style={{ width: 180 }}
                    />
                    <InputNumber
                      addonBefore="MRP"
                      prefix="â‚¹"
                      value={item.mrp}
                      onChange={(val) => handleItemChange(index, 'mrp', val)}
                      style={{ width: 150 }}
                    />
                  </Space>
                </Card>
              ))}
            </div>
          )}
        </Form>
      </SliderModal>
    </div>
  );
};

export default GoodsReceipt;
