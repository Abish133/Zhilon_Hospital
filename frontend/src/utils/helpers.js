import dayjs from 'dayjs';

export const formatDate = (date, format = 'DD-MM-YYYY') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return dayjs(date).format('DD-MM-YYYY HH:mm');
};

export const calculateAge = (dob) => {
  if (!dob) return 0;
  return dayjs().diff(dayjs(dob), 'year');
};

export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount);
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const generateUHID = (id) => {
  return `UHID-${dayjs().year()}-${String(id).padStart(5, '0')}`;
};

export const validateMobile = (mobile) => {
  return /^[6-9]\d{9}$/.test(mobile);
};

export const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const hasRole = (user, roles) => {
  if (!user || !user.role) return false;
  const userRole = user.role.toLowerCase();

  if (Array.isArray(roles)) {
    return roles.some(role => role.toLowerCase() === userRole);
  }
  return roles.toLowerCase() === userRole;
};

export const getTableColumns = (columns, actions) => {
  return actions ? [...columns, {
    title: 'Actions',
    key: 'actions',
    fixed: 'right',
    width: 150,
    render: (_, record) => actions(record)
  }] : columns;
};

export const downloadFile = (data, filename, type = 'text/csv') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
};

export const maskAadhaar = (aadhaar) => {
  if (!aadhaar) return '-';
  const str = String(aadhaar).replace(/\D/g, '');
  if (str.length < 4) return '****';
  return 'XXXX-XXXX-' + str.slice(-4);
};

export const maskMobile = (mobile) => {
  if (!mobile) return '-';
  const str = String(mobile).replace(/\D/g, '');
  if (str.length < 4) return '****';
  return str.slice(0, 2) + 'XXXXXX' + str.slice(-2);
};
