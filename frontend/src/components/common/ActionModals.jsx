// import { Modal, Form,Row,Col, Select, InputNumber, Input, Button, Space, Descriptions, Tag } from 'antd';
// import { formatCurrency, formatDate } from '@utils/helpers';
// import { useState } from 'react';
// import { useApiMutation, useApiQuery } from '@hooks/useApi';
// import { DOSAGE_FORMS, DRUG_SCHEDULES } from '@utils/constants';
// import MedicineService from '@services/MedicineService';
// // import CategoryService from '@services/CategoryService';

// export const PaymentModal = ({ open, onCancel, bill, onSuccess, loading }) => {
//   const [form] = Form.useForm();
//   const [paymentMode, setPaymentMode] = useState('');

//   const handleSubmit = async (values) => {
//     try {
//       const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           bill_id: bill?.bill_id,
//           payment_type: 'Bill Payment',
//           amount_paid: values.amount_paid,
//           payment_mode: values.payment_mode,
//           transaction_ref: values.transaction_ref || null,
//           bank_name: values.bank_name || null,
//           received_by: JSON.parse(localStorage.getItem('user'))?.user_id || 1,
//           hospital_id: JSON.parse(localStorage.getItem('user'))?.hospital_id || 1
//         })
//       });

//       if (!response.ok) {
//         const error = await response.json();
//         throw new Error(error.message || 'Payment failed');
//       }
      
//       form.resetFields();
//       onSuccess?.();
//     } catch (error) {
//
//       throw error;
//     }
//   };

//   return (
//     <Modal
//       title="Process Payment"
//       open={open}
//       onCancel={onCancel}
//       footer={null}
//       width={600}
//     >
//       {bill && (
//         <>
//           <Descriptions bordered column={1} size="small" style={{ marginBottom: 16 }}>
//             <Descriptions.Item label="Bill Number">{bill.bill_number}</Descriptions.Item>
//             <Descriptions.Item label="Patient">
//               {bill.patient?.first_name} {bill.patient?.last_name}
//             </Descriptions.Item>
//             <Descriptions.Item label="Net Amount">
//               <strong style={{ fontSize: 18, color: '#0a0a0a' }}>
//                 {formatCurrency(bill.net_amount)}
//               </strong>
//             </Descriptions.Item>
//             <Descriptions.Item label="Paid Amount">
//               {formatCurrency(bill.paid_amount || 0)}
//             </Descriptions.Item>
//             <Descriptions.Item label="Balance Amount">
//               <strong style={{ color: '#ef4444' }}>
//                 {formatCurrency(bill.balance_amount)}
//               </strong>
//             </Descriptions.Item>
//           </Descriptions>

//           <Form form={form} layout="vertical" onFinish={handleSubmit}>
//             <Form.Item
//               name="payment_mode"
//               label="Payment Mode"
//               rules={[{ required: true, message: 'Please select payment mode' }]}
//             >
//               <Select onChange={setPaymentMode} placeholder="Select payment mode">
//                 <Select.Option value="Cash">Cash</Select.Option>
//                 <Select.Option value="Card">Card</Select.Option>
//                 <Select.Option value="UPI">UPI</Select.Option>
//                 <Select.Option value="Cheque">Cheque</Select.Option>
//                 <Select.Option value="Net Banking">Net Banking</Select.Option>
//                 <Select.Option value="Insurance">Insurance</Select.Option>
//               </Select>
//             </Form.Item>

//             <Form.Item
//               name="amount_paid"
//               label="Amount to Pay"
//               rules={[
//                 { required: true, message: 'Please enter amount' },
//                 { 
//                   validator: (_, value) => {
//                     if (value > 0 && value <= bill.balance_amount) {
//                       return Promise.resolve();
//                     }
//                     return Promise.reject(new Error(`Amount must be between ₹1 and ₹${bill.balance_amount}`));
//                   }
//                 }
//               ]}
//               initialValue={bill.balance_amount}
//             >
//               <InputNumber
//                 style={{ width: '100%' }}
//                 min={0.01}
//                 max={bill.balance_amount}
//                 precision={2}
//                 formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                 parser={value => value.replace(/₹\s?|(,*)/g, '')}
//               />
//             </Form.Item>

//             <Form.Item 
//               name="transaction_ref" 
//               label="Transaction Reference / Cheque Number"
//               rules={[
//                 { 
//                   required: ['Card', 'UPI', 'Cheque', 'Net Banking'].includes(paymentMode),
//                   message: 'Transaction reference is required for this payment mode'
//                 }
//               ]}
//             >
//               <Input placeholder="Enter transaction/cheque/reference number" />
//             </Form.Item>

//             <Form.Item 
//               name="bank_name" 
//               label="Bank Name"
//               rules={[
//                 { 
//                   required: ['Card', 'Cheque', 'Net Banking'].includes(paymentMode),
//                   message: 'Bank name is required for this payment mode'
//                 }
//               ]}
//             >
//               <Input placeholder="Enter bank name" />
//             </Form.Item>

//             <Form.Item>
//               <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
//                 <Button onClick={onCancel}>Cancel</Button>
//                 <Button type="primary" htmlType="submit" loading={loading}>
//                   Process Payment
//                 </Button>
//               </Space>
//             </Form.Item>
//           </Form>
//         </>
//       )}
//     </Modal>
//   );
// };

// export const ViewDetailsModal = ({ open, onCancel, record, type }) => {
//   if (!record) return null;

//   return (
//     <Modal
//       title={`${type} Details`}
//       open={open}
//       onCancel={onCancel}
//       footer={[
//         <Button key="close" onClick={onCancel}>
//           Close
//         </Button>
//       ]}
//       width={700}
//     >
//       <Descriptions bordered column={2} size="small">
//         {type === 'Bill' && (
//           <>
//             <Descriptions.Item label="Bill Number" span={2}>
//               <Tag color="blue">{record.bill_number}</Tag>
//             </Descriptions.Item>
//             <Descriptions.Item label="Patient">
//               {record.patient?.first_name} {record.patient?.last_name}
//             </Descriptions.Item>
//             <Descriptions.Item label="UHID">
//               {record.patient?.uhid || record.uhid}
//             </Descriptions.Item>
//             <Descriptions.Item label="Bill Type">
//               <Tag color={record.bill_type === 'OPD' ? 'blue' : 'green'}>
//                 {record.bill_type}
//               </Tag>
//             </Descriptions.Item>
//             <Descriptions.Item label="Bill Date">
//               {formatDate(record.bill_date)}
//             </Descriptions.Item>
//             <Descriptions.Item label="Gross Amount">
//               {formatCurrency(record.gross_amount)}
//             </Descriptions.Item>
//             <Descriptions.Item label="Discount">
//               <span style={{ color: '#10b981' }}>
//                 {formatCurrency(record.discount_amount)}
//               </span>
//             </Descriptions.Item>
//             <Descriptions.Item label="Tax Amount">
//               {formatCurrency(record.tax_amount)}
//             </Descriptions.Item>
//             <Descriptions.Item label="Net Amount">
//               <strong style={{ fontSize: 16, color: '#0a0a0a' }}>
//                 {formatCurrency(record.net_amount)}
//               </strong>
//             </Descriptions.Item>
//             <Descriptions.Item label="Advance Adjusted">
//               {formatCurrency(record.advance_adjusted || 0)}
//             </Descriptions.Item>
//             <Descriptions.Item label="Paid Amount">
//               <span style={{ color: '#10b981' }}>
//                 {formatCurrency(record.paid_amount || 0)}
//               </span>
//             </Descriptions.Item>
//             <Descriptions.Item label="Balance Amount">
//               <strong style={{ color: record.balance_amount > 0 ? '#ef4444' : '#10b981' }}>
//                 {formatCurrency(record.balance_amount)}
//               </strong>
//             </Descriptions.Item>
//             <Descriptions.Item label="Payment Status" span={2}>
//               <Tag color={
//                 record.payment_status === 'Paid' ? 'green' :
//                 record.payment_status === 'Partial' ? 'orange' : 'red'
//               }>
//                 {record.payment_status}
//               </Tag>
//             </Descriptions.Item>
//             <Descriptions.Item label="Generated By" span={2}>
//               {record.generatedBy?.name || record.generatedBy?.username || 'System'}
//             </Descriptions.Item>
//           </>
//         )}
//       </Descriptions>
//     </Modal>
//   );
// };

// export const MedicineFormModal = ({ open, onCancel, onSuccess, initialData }) => {
//   const [form] = Form.useForm();
 
//   const { data: categoriesData } = useApiQuery(
//     ['categories'],
//     () => CategoryService.getAll()
//   );
 
//   const categories = categoriesData?.data || [];
//   const categoryOptions = categories.map(cat => ({
//     label: cat.category_name,
//     value: cat.category_id
//   }));
 
//   const mutation = useApiMutation(
//     (data) => initialData ? MedicineService.update(initialData.medicine_id, data) : MedicineService.register(data),
//     {
//       successMessage: initialData ? 'Medicine updated successfully' : 'Medicine added successfully',
//       invalidateKeys: ['medicines'],
//       onSuccess: () => {
//         onSuccess?.();
//         form.resetFields();
//       }
//     }
//   );
 
//   const handleSubmit = async () => {
//     try {
//       const values = await form.validateFields();
// // Debug log
//       mutation.mutate(values);
//     } catch (error) {
//
//     }
//   };
 
//   return (
//     <Modal
//       open={open}
//       onCancel={onCancel}
//       onOk={handleSubmit}
//       title={initialData ? 'Edit Medicine' : 'Add Medicine'}
//       width={700}
//       confirmLoading={mutation.isPending}
//     >
//       <Form form={form} layout="vertical" initialValues={initialData}>
//         <Row gutter={16}>
//           <Col span={12}>
//             <Form.Item name="medicine_code" label="Medicine Code" rules={[{ required: true }]}>
//               <Input placeholder="e.g., MED001" />
//             </Form.Item>
//           </Col>
//           <Col span={12}>
//             <Form.Item name="medicine_name" label="Medicine Name" rules={[{ required: true }]}>
//               <Input placeholder="Enter medicine name" />
//             </Form.Item>
//           </Col>
//         </Row>
//         <Row gutter={16}>
//           <Col span={12}>
//             <Form.Item name="category_id" label="Category" rules={[{ required: false }]}>
//               <Select
//                 placeholder="Select category"
//                 options={categoryOptions}
//                 allowClear
//                 showSearch
//                 filterOption={(input, option) =>
//                   (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
//                 }
//               />
//             </Form.Item>
//           </Col>
//           <Col span={12}>
//             <Form.Item name="strength" label="Strength">
//               <Input placeholder="e.g., 500mg" />
//             </Form.Item>
//           </Col>
//         </Row>
//         <Row gutter={16}>
//           <Col span={12}>
//             <Form.Item name="dosage_form" label="Dosage Form">
//               <Select
//                 placeholder="Select form"
//                 options={DOSAGE_FORMS}
//                 allowClear
//               />
//             </Form.Item>
//           </Col>
//           <Col span={12}>
//             <Form.Item name="manufacturer" label="Manufacturer">
//               <Input placeholder="Manufacturer name" />
//             </Form.Item>
//           </Col>
//         </Row>
//         <Row gutter={16}>
//           <Col span={8}>
//             <Form.Item name="hsn_code" label="HSN Code">
//               <Input placeholder="HSN code" />
//             </Form.Item>
//           </Col>
//           <Col span={8}>
//             <Form.Item name="gst_percentage" label="GST Percentage">
//               <InputNumber
//                 min={0}
//                 max={100}
//                 step={0.01}
//                 style={{ width: '100%' }}
//                 placeholder="GST rate"
//               />
//             </Form.Item>
//           </Col>
//           <Col span={8}>
//             <Form.Item name="schedule" label="Schedule">
//               <Select
//                 placeholder="Select schedule"
//                 options={DRUG_SCHEDULES}
//                 allowClear
//               />
//             </Form.Item>
//           </Col>
//         </Row>
//         <Row gutter={16}>
//           <Col span={12}>
//             <Form.Item name="isActive" label="Status">
//               <Select
//                 options={[
//                   { label: 'Active', value: true },
//                   { label: 'Inactive', value: false }
//                 ]}
//                 defaultValue={true}
//               />
//             </Form.Item>
//           </Col>
//         </Row>
//       </Form>
//     </Modal>
//   );
// };
 

import { Modal, Form, Input, Select, DatePicker, InputNumber, Row, Col, Drawer, Button, Space } from 'antd';
import { useEffect } from 'react';
import { dummyData } from '@/data/dummyData';
import { useApiMutation, useApiQuery } from '@hooks/useApi';
import MedicineService from '@services/MedicineService';
import MedicineCategoryService from '@services/MedicineCategoryService';
import SliderModal from '@components/common/SliderModal';
import { DOSAGE_FORMS, DRUG_SCHEDULES } from '@utils/constants';
 
export const MedicineFormModal = ({ open, onCancel, onSuccess, initialData }) => {
  const [form] = Form.useForm();
 
  useEffect(() => {
    if (open) {
      if (initialData) {
        form.setFieldsValue(initialData);
      } else {
        form.resetFields();
      }
    }
  }, [open, initialData, form]);
 
  const { data: categoriesData } = useApiQuery(
    ['categories'],
    () => MedicineCategoryService.getAll()
  );
 
  const categories = categoriesData?.data || [];
  const categoryOptions = categories.map(cat => ({
    label: cat.category_name,
    value: cat.category_id
  }));
 
  const mutation = useApiMutation(
    (data) => initialData ? MedicineService.update(initialData.medicine_id, data) : MedicineService.register(data),
    {
      successMessage: initialData ? 'Medicine updated successfully' : 'Medicine added successfully',
      invalidateKeys: ['medicines'],
      onSuccess: () => {
        onSuccess?.();
        form.resetFields();
      }
    }
  );
 
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
 // Debug log
      mutation.mutate(values);
    } catch (error) {
    }
  };
 
  return (
    <SliderModal
      open={open}
      onCancel={onCancel}
      title={initialData ? 'Edit Medicine' : 'Add Medicine'}
      width="50%"
      onOk={handleSubmit}
      okText="Save"
      confirmLoading={mutation.isPending}
    >
        <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="medicine_code" label="Medicine Code" rules={[{ required: true }]}>
              <Input placeholder="e.g., MED001" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="medicine_name" label="Medicine Name" rules={[{ required: true }]}>
              <Input placeholder="Enter medicine name" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="category_id" label="Category" rules={[{ required: false }]}>
              <Select
                placeholder="Select category"
                options={categoryOptions}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="strength" label="Strength">
              <Input placeholder="e.g., 500mg" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="dosage_form" label="Dosage Form">
              <Select
                placeholder="Select form"
                options={DOSAGE_FORMS}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="manufacturer" label="Manufacturer">
              <Input placeholder="Manufacturer name" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="hsn_code" label="HSN Code">
              <Input placeholder="HSN code" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="gst_percentage" label="GST Percentage">
              <InputNumber
                min={0}
                max={100}
                step={0.01}
                style={{ width: '100%' }}
                placeholder="GST rate"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="schedule" label="Schedule">
              <Select
                placeholder="Select schedule"
                options={DRUG_SCHEDULES}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="reorder_level"
              label="Reorder Level"
              initialValue={100}
              tooltip="Low-stock alerts trigger when available quantity falls to or below this number."
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g. 100" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="isActive" label="Status">
              <Select
                options={[
                  { label: 'Active', value: true },
                  { label: 'Inactive', value: false }
                ]}
                defaultValue={true}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </SliderModal>
  );
};
 
 
export const LabOrderModal = ({ open, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
 
  const handleSubmit = async () => {
    const values = await form.validateFields();
    onSuccess?.();
    form.resetFields();
  };
 
  return (
    <Drawer
      open={open}
      onClose={onCancel}
      title="Create Lab Order"
      width="100vw"
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit}>Submit</Button>
          </Space>
        </div>
      }
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Form form={form} layout="vertical">
        <Form.Item name="patient_uhid" label="Patient" rules={[{ required: true }]}>
          <Select
            showSearch
            placeholder="Search patient"
            options={dummyData.patients.map(p => ({
              label: `${p.uhid} - ${p.first_name} ${p.last_name}`,
              value: p.uhid
            }))}
          />
        </Form.Item>
        <Form.Item name="tests" label="Tests" rules={[{ required: true }]}>
          <Select
            mode="multiple"
            placeholder="Select tests"
            options={dummyData.labTests.map(t => ({
              label: `${t.test_name} - ₹${t.charge}`,
              value: t.test_code
            }))}
          />
        </Form.Item>
        <Form.Item name="doctor_id" label="Ordered By" rules={[{ required: true }]}>
          <Select
            options={dummyData.doctors.map(d => ({
              label: d.full_name,
              value: d.doctor_id
            }))}
          />
        </Form.Item>
      </Form>
      </div>
    </Drawer>
  );
};
 
export const SampleCollectionModal = ({ open, onCancel, onSuccess, order }) => {
  const [form] = Form.useForm();
 
  const handleSubmit = async () => {
    const values = await form.validateFields();
    onSuccess?.();
    form.resetFields();
  };
 
  return (
    <Drawer
      open={open}
      onClose={onCancel}
      title="Collect Sample"
      width="100vw"
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit}>Submit</Button>
          </Space>
        </div>
      }
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Form form={form} layout="vertical">
        <Form.Item label="Patient">
          <Input value={order?.patient_name} disabled />
        </Form.Item>
        <Form.Item label="Test">
          <Input value={order?.test_name} disabled />
        </Form.Item>
        <Form.Item name="collection_time" label="Collection Time" rules={[{ required: true }]}>
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
      </div>
    </Drawer>
  );
};
 
export const LabResultsModal = ({ open, onCancel, onSuccess, order }) => {
  const [form] = Form.useForm();
 
  const handleSubmit = async () => {
    const values = await form.validateFields();
    onSuccess?.();
    form.resetFields();
  };
 
  return (
    <Drawer
      open={open}
      onClose={onCancel}
      title="Enter Lab Results"
      width="100vw"
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit}>Submit</Button>
          </Space>
        </div>
      }
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Form form={form} layout="vertical">
        <Form.Item label="Patient">
          <Input value={order?.patient_name} disabled />
        </Form.Item>
        <Form.Item label="Test">
          <Input value={order?.test_name} disabled />
        </Form.Item>
        <Form.Item name="results" label="Results" rules={[{ required: true }]}>
          <Input.TextArea rows={4} placeholder="Enter test results" />
        </Form.Item>
        <Form.Item name="remarks" label="Remarks">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
      </div>
    </Drawer>
  );
};
 
export const ViewDetailsModal = ({ open, onCancel, record, type }) => {
  const entries = Object.entries(record || {});
  return (
    <Drawer
      open={open}
      onClose={onCancel}
      title={`${type} Details`}
      width="100vw"
      styles={{ body: { padding: 24 } }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Row gutter={[16, 16]}>
          {entries.map(([key, value]) => (
            <Col span={8} key={key}>
              <div style={{ padding: '12px 16px', background: '#f5f5f5', borderRadius: 4, height: '100%' }}>
                <strong style={{ textTransform: 'capitalize', display: 'block', marginBottom: 4 }}>{key.replace(/_/g, ' ')}:</strong>
                <span>{value?.toString() || 'N/A'}</span>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </Drawer>
  );
};
 
export const PaymentModal = ({ open, onCancel, onSuccess, bill }) => {
  const [form] = Form.useForm();
 
  const handleSubmit = async () => {
    const values = await form.validateFields();
    onSuccess?.();
    form.resetFields();
  };
 
  return (
    <Drawer
      open={open}
      onClose={onCancel}
      title="Collect Payment"
      width="100vw"
      footer={
        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit}>Submit</Button>
          </Space>
        </div>
      }
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Form form={form} layout="vertical">
        <Form.Item label="Bill Amount">
          <Input value={`₹${bill?.net_amount || 0}`} disabled />
        </Form.Item>
        <Form.Item name="payment_mode" label="Payment Mode" rules={[{ required: true }]}>
          <Select options={[
            { label: 'Cash', value: 'Cash' },
            { label: 'Card', value: 'Card' },
            { label: 'UPI', value: 'UPI' },
            { label: 'Insurance', value: 'Insurance' }
          ]} />
        </Form.Item>
        <Form.Item name="amount_paid" label="Amount" rules={[{ required: true }]}>
          <InputNumber style={{ width: '100%' }} prefix="₹" />
        </Form.Item>
        <Form.Item name="transaction_ref" label="Transaction Reference">
          <Input />
        </Form.Item>
      </Form>
      </div>
    </Drawer>
  );
};
 
 