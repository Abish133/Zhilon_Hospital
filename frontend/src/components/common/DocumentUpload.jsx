import { Upload, Button, List, message, Popconfirm, Select, Space } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { documentService } from '@services/index';
import { useApiQuery, useApiMutation } from '@hooks/useApi';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const DOCUMENT_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'radiology', label: 'Radiology / Imaging' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'consent', label: 'Consent Form' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'other', label: 'Other' }
];

// `patientId` may be a numeric patient_id or a UHID string — backend handles both.
const DocumentUpload = ({ patientId }) => {
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('general');

  const { data: documents, refetch } = useApiQuery(
    ['patient-documents', patientId],
    () => documentService.getByPatient(patientId),
    { enabled: !!patientId }
  );

  const deleteMutation = useApiMutation(
    (docId) => documentService.deleteDocument(docId),
    {
      successMessage: 'Document deleted',
      onSuccess: refetch
    }
  );

  const beforeUpload = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      message.error(`File size must be smaller than 10MB! Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return false;
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      message.error('Only images, PDF, document, and text files are allowed!');
      return false;
    }
    return true;
  };

  const handleUpload = async ({ file, onSuccess, onError }) => {
    if (!beforeUpload(file)) {
      onError?.('Validation failed');
      return;
    }
    if (!patientId) {
      message.error('Cannot upload — patient not selected');
      onError?.('No patient');
      return;
    }
    setUploading(true);
    try {
      await documentService.upload(file, {
        patient_id: patientId,
        document_type: docType
      });
      message.success('Document uploaded successfully');
      refetch();
      onSuccess?.('ok');
    } catch (error) {
      // apiClient interceptor rejects with response.data (or message string)
      const msg = error?.message || error?.error || 'Upload failed';
      message.error(typeof msg === 'string' ? msg : 'Upload failed');
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      // apiClient interceptor unwraps response.data; with responseType:'blob'
      // that IS the Blob itself — don't wrap it as `response.data`.
      const blob = await documentService.download(docId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('Download failed');
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 12 }}>
        <Select
          value={docType}
          onChange={setDocType}
          options={DOCUMENT_TYPES}
          style={{ width: 220 }}
        />
        <Upload customRequest={handleUpload} showUploadList={false}>
          <Button icon={<UploadOutlined />} loading={uploading} type="primary">
            Upload Document
          </Button>
        </Upload>
      </Space>
      <List
        dataSource={documents?.data || []}
        locale={{ emptyText: 'No documents uploaded yet' }}
        renderItem={(doc) => (
          <List.Item
            actions={[
              <Button
                key="dl"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(doc.document_id, doc.original_filename || doc.filename)}
              />,
              <Popconfirm
                key="del"
                title="Delete this document?"
                onConfirm={() => deleteMutation.mutate(doc.document_id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ]}
          >
            <List.Item.Meta
              title={doc.original_filename || doc.filename}
              description={`${doc.document_type || 'general'} • ${doc.uploader?.name || 'unknown'} • ${new Date(doc.createdAt).toLocaleString()}`}
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default DocumentUpload;
