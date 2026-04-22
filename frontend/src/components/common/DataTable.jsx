import { useState } from 'react';
import { Table } from 'antd';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@utils/constants';
 
const DataTable = ({
  title,
  columns,
  dataSource,
  loading = false,
  pagination = true,
  rowKey = 'id',
  scroll,
  extra,
  ...props
}) => {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [current, setCurrent] = useState(1);
 
  const defaultPagination = pagination === true ? {
    current,
    pageSize,
    showSizeChanger: true,
    pageSizeOptions: PAGE_SIZE_OPTIONS,
    showTotal: (total) => `Total ${total} items`,
    responsive: true,
    placement: ['bottomRight'],
    onChange: (page, size) => {
      setCurrent(page);
      if (size !== pageSize) {
        setPageSize(size);
        setCurrent(1);
      }
    }
  } : pagination;
 
  const responsiveScroll = scroll || { x: 'max-content' };
 
  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      rowKey={rowKey}
      pagination={defaultPagination}
      scroll={responsiveScroll}
      style={{
        borderRadius: 16,
        overflow: 'hidden'
      }}
      {...props}
    />
  );
};
 
export default DataTable;
 
 