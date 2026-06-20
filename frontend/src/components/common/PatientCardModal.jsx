import { useState } from 'react';
import { Button, Space, message } from 'antd';
import { IdcardOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import SliderModal from '@components/common/SliderModal';
import { getPatientCardInnerHTML, printPatientCard, downloadPatientCardPDF } from '@utils/patientCardHelper';

// Shows a print-ready patient identification card in the reusable right-side
// drawer (SliderModal), with Print / Download PDF actions.
// `patient` is any object carrying the standard patient fields (UHID, name, …);
// `hospital` supplies the branding (name + logo) and is optional.
const PatientCardModal = ({ open, onClose, patient, hospital }) => {
  const [downloading, setDownloading] = useState(false);

  if (!patient) return null;

  const cardHTML = getPatientCardInnerHTML(patient, hospital);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadPatientCardPDF(patient, hospital);
      message.success('Patient card downloaded');
    } catch {
      message.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const footer = (
    <div style={{ textAlign: 'right' }}>
      <Space>
        <Button onClick={onClose}>Close</Button>
        <Button icon={<PrinterOutlined />} onClick={() => printPatientCard(patient, hospital)}>
          Print
        </Button>
        <Button type="primary" icon={<DownloadOutlined />} loading={downloading} onClick={handleDownload}>
          Download PDF
        </Button>
      </Space>
    </div>
  );

  return (
    <SliderModal
      open={open}
      onClose={onClose}
      width={620}
      title={<Space><IdcardOutlined /> Patient Card</Space>}
      footer={footer}
    >
      <div
        style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}
        dangerouslySetInnerHTML={{ __html: cardHTML }}
      />
    </SliderModal>
  );
};

export default PatientCardModal;
