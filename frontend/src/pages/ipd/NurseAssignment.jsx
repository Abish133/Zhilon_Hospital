import { useState, useEffect } from 'react';
import { Card, Form, Button, Space, message, Select, Modal, DatePicker, Tag } from 'antd';
import SliderModal from '@components/common/SliderModal';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { ipdNurseAssignmentService, ipdAdmissionService, employeeService, wardService } from '@services';
import DataTable from '@components/common/DataTable';
import { useAuthStore } from '@store';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import dayjs from 'dayjs';

const NurseAssignment = () => {
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);

  const { data: assignmentsData, isLoading, refetch } = useApiQuery(
    ['nurse-assignments'],
    () => ipdNurseAssignmentService.getAll()
  );

  const { data: admissionsData } = useApiQuery(
    ['ipd-admissions-active'],
    () => ipdAdmissionService.getAll()
  );

  const { data: employeesData } = useApiQuery(
    ['employees'],
    () => employeeService.getAll()
  );

  const { data: wardsData } = useApiQuery(
    ['wards'],
    () => wardService.getAll()
  );

  const createMutation = useApiMutation(
    (data) => ipdNurseAssignmentService.create(data),
    {
      onSuccess: () => {
        message.success('Nurse assigned successfully');
        setModalOpen(false);
        form.resetFields();
        refetch();
      },
      onError: (error) => message.error(error?.response?.data?.message || 'Failed to assign nurse')
    }
  );

  const updateMutation = useApiMutation(
    ({ id, data }) => ipdNurseAssignmentService.update(id, data),
    {
      onSuccess: () => {
        message.success('Assignment updated successfully');
        setModalOpen(false);
        setEditingAssignment(null);
        form.resetFields();
        refetch();
      },
      onError: (error) => message.error(error?.response?.data?.message || 'Failed to update assignment')
    }
  );

  const deleteMutation = useApiMutation(
    (id) => ipdNurseAssignmentService.delete(id),
    {
      onSuccess: () => {
        message.success('Assignment deleted successfully');
        refetch();
      },
      onError: () => message.error('Failed to delete assignment')
    }
  );

  const assignments = assignmentsData?.data || [];
  const admissions = (admissionsData?.data || []).filter(a => a.status === 'Admitted');
  const employees = employeesData?.data || [];
  const nurses = employees.filter(e => e.role === 'Nurse' || e.role === 'Staff Nurse');
  const wards = wardsData?.data || [];

  const handleSubmit = async (values) => {
    const selectedAdmission = admissions.find(a => a.admission_id === values.admission_id);
    
    const assignmentData = {
      admission_id: values.admission_id,
      patient_id: selectedAdmission?.patient_id,
      nurse_id: values.nurse_id,
      ward_id: values.ward_id,
      shift: values.shift,
      assigned_from: values.assigned_from.format('YYYY-MM-DD HH:mm:ss'),
      assigned_to: values.assigned_to ? values.assigned_to.format('YYYY-MM-DD HH:mm:ss') : null,
      is_primary_nurse: values.is_primary_nurse || false,
      status: values.status || 'Active',
      hospital_id: user?.hospital_id
    };

    if (editingAssignment) {
      updateMutation.mutate({ id: editingAssignment.assignment_id, data: assignmentData });
    } else {
      createMutation.mutate(assignmentData);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    form.setFieldsValue({
      ...assignment,
      assigned_from: assignment.assigned_from ? dayjs(assignment.assigned_from) : null,
      assigned_to: assignment.assigned_to ? dayjs(assignment.assigned_to) : null
    });
    setModalOpen(true);
  };

  const handleDelete = (assignmentId) => {
    Modal.confirm({
      title: 'Delete Assignment',
      content: 'Are you sure you want to delete this nurse assignment?',
      onOk: () => deleteMutation.mutate(assignmentId)
    });
  };

  const columns = [
    { 
      title: 'Patient', 
      key: 'patient',
      render: (_, record) => record.patient ? `${record.patient.first_name} ${record.patient.last_name}` : '-'
    },
    { 
      title: 'Nurse', 
      key: 'nurse',
      render: (_, record) => record.nurse?.full_name || '-'
    },
    { 
      title: 'Ward', 
      key: 'ward',
      render: (_, record) => record.ward?.ward_name || '-'
    },
    { title: 'Shift', dataIndex: 'shift', key: 'shift' },
    { 
      title: 'From', 
      dataIndex: 'assigned_from',
      key: 'assigned_from',
      render: (date) => date ? dayjs(date).format('DD-MM-YYYY HH:mm') : '-'
    },
    { 
      title: 'To', 
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      render: (date) => date ? dayjs(date).format('DD-MM-YYYY HH:mm') : '-'
    },
    { 
      title: 'Primary', 
      dataIndex: 'is_primary_nurse',
      key: 'is_primary_nurse',
      render: (isPrimary) => isPrimary ? <Tag color="blue">Primary</Tag> : <Tag>Secondary</Tag>
    },
    { 
      title: 'Status', 
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={status === 'Active' ? 'green' : 'default'}>{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.assignment_id)} />
        </Space>
      )
    }
  ];

  return (
    <Card 
      title="Nurse Assignments" 
      extra={
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => { 
            setEditingAssignment(null); 
            form.resetFields(); 
            setModalOpen(true); 
          }}
        >
          Assign Nurse
        </Button>
      }
    >
      <DataTable 
        columns={columns} 
        dataSource={assignments} 
        rowKey="assignment_id" 
        loading={isLoading} 
      />

      <SliderModal
        title={editingAssignment ? 'Edit Assignment' : 'Assign Nurse'}
        open={modalOpen}
        onCancel={() => { 
          setModalOpen(false); 
          setEditingAssignment(null); 
          form.resetFields(); 
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item 
            name="admission_id" 
            label="Patient (Admission)" 
            rules={[{ required: true, message: 'Please select patient' }]}
          >
            <Select
              showSearch
              placeholder="Select patient"
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={admissions.map(a => ({
                label: `${a.patient?.first_name} ${a.patient?.last_name} - ${a.uhid}`,
                value: a.admission_id
              }))}
            />
          </Form.Item>

          <Form.Item 
            name="nurse_id" 
            label="Nurse" 
            rules={[{ required: true, message: 'Please select nurse' }]}
          >
            <Select
              showSearch
              placeholder="Select nurse"
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={nurses.map(n => ({
                label: `${n.full_name} - ${n.role}`,
                value: n.employee_id
              }))}
            />
          </Form.Item>

          <Form.Item 
            name="ward_id" 
            label="Ward" 
            rules={[{ required: true, message: 'Please select ward' }]}
          >
            <Select
              placeholder="Select ward"
              options={wards.map(w => ({
                label: `${w.ward_name} (${w.ward_type})`,
                value: w.ward_id
              }))}
            />
          </Form.Item>

          <Form.Item 
            name="shift" 
            label="Shift" 
            rules={[{ required: true, message: 'Please select shift' }]}
          >
            <Select
              placeholder="Select shift"
              options={[
                { label: 'Morning (6 AM - 2 PM)', value: 'Morning' },
                { label: 'Evening (2 PM - 10 PM)', value: 'Evening' },
                { label: 'Night (10 PM - 6 AM)', value: 'Night' }
              ]}
            />
          </Form.Item>

          <Form.Item 
            name="assigned_from" 
            label="Assigned From" 
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} format="DD-MM-YYYY HH:mm" />
          </Form.Item>

          <Form.Item name="assigned_to" label="Assigned To">
            <DatePicker showTime style={{ width: '100%' }} format="DD-MM-YYYY HH:mm" />
          </Form.Item>

          <Form.Item name="is_primary_nurse" label="Primary Nurse" valuePropName="checked">
            <Select
              options={[
                { label: 'Yes', value: true },
                { label: 'No', value: false }
              ]}
            />
          </Form.Item>

          <Form.Item name="status" label="Status" initialValue="Active">
            <Select
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Completed', value: 'Completed' }
              ]}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingAssignment ? 'Update' : 'Assign'}
              </Button>
              <Button onClick={() => { 
                setModalOpen(false); 
                setEditingAssignment(null); 
                form.resetFields(); 
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </SliderModal>
    </Card>
  );
};

export default NurseAssignment;
