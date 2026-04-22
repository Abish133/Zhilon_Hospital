import { useState } from 'react';
import { Card, Button, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import DataTable from '@components/common/DataTable';
import SearchBar from '@components/common/SearchBar';
import { ipdAdmissionService } from '@services';
import { useApiQuery } from '@hooks/useApi';
import dayjs from 'dayjs';

const IpdVitalsList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useApiQuery(
    ['ipd-admissions-active'],
    () => ipdAdmissionService.getAll()
  );

  const admissions = (data?.data || []).filter(a => a.status === 'Admitted');

  const columns = [
    { title: 'UHID', dataIndex: 'uhid', key: 'uhid', width: 120 },
    { 
      title: 'Patient', 
      key: 'patient',
      render: (_, record) => `${record.patient?.first_name} ${record.patient?.last_name}`
    },
    { 
      title: 'Ward/Bed', 
      key: 'location',
      render: (_, record) => `${record.ward?.ward_name} / ${record.bed?.bed_number}`
    },
    { 
      title: 'Admission Date', 
      dataIndex: 'admission_date',
      render: (date) => dayjs(date).format('DD-MM-YYYY')
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small"
          onClick={() => navigate(`/ipd/vitals/${record.admission_id}`)}
        >
          Record Vitals
        </Button>
      )
    }
  ];

  return (
    <Card title="IPD Patients - Record Vitals">
      <SearchBar
        placeholder="Search by UHID or Patient Name"
        onSearch={setSearchQuery}
        showAddButton={false}
      />
      <DataTable
        columns={columns}
        dataSource={admissions.filter(a => 
          searchQuery === '' || 
          a.uhid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          `${a.patient?.first_name} ${a.patient?.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        loading={isLoading}
        rowKey="admission_id"
      />
    </Card>
  );
};

export default IpdVitalsList;
