import { Upload, Button, List, message, Popconfirm } from 'antd';
import { UploadOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { documentService } from '@services/index';
import { useApiQuery, useApiMutation } from '@hooks/useApi';

const DocumentUpload = ({ entityType, entityId }) => {
  const [uploading, setUploading] = useState(false);

  const { data: documents, refetch } = useApiQuery(
    ['documents', entityType, entityId],
    () => documentService.getByEntity(entityType, entityId)
  );

  const deleteMutation = useApiMutation(
    (docId) => documentService.deleteDocument(docId),
    {
      successMessage: 'Document deleted',
      onSuccess: refetch
    }
  );

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const beforeUpload = (file) => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      message.error(`File size must be smaller than 10MB! Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return false;
    }
    // Check file type
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
    setUploading(true);
    try {
      await documentService.upload(file, { entityType, entityId });
      message.success('Document uploaded successfully');
      refetch();
      onSuccess?.('ok');
    } catch (error) {
      message.error(error?.response?.data?.message || 'Upload failed');
      onError?.(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      const response = await documentService.download(docId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error('Download failed');
    }
  };

  return (
    <div>
      <Upload customRequest={handleUpload} showUploadList={false}>
        <Button icon={<UploadOutlined />} loading={uploading}>
          Upload Document
        </Button>
      </Upload>
      <List
        style={{ marginTop: 16 }}
        dataSource={documents?.data || []}
        renderItem={(doc) => (
          <List.Item
            actions={[
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => handleDownload(doc.document_id, doc.filename)}
              />,
              <Popconfirm
                title="Delete this document?"
                onConfirm={() => deleteMutation.mutate(doc.document_id)}
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ]}
          >
            {doc.filename}
          </List.Item>
        )}
      />
    </div>
  );
};

export default DocumentUpload;
