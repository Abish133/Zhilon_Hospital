import { Input, Button } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import './SearchBar.css';

const SearchBar = ({ 
  onSearch, 
  onAdd, 
  placeholder = 'Search...', 
  addButtonText = 'Add New',
  showAddButton = true 
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="search-bar-container">
      <div className="search-bar-wrapper">
        <Input.Search
          placeholder={placeholder}
          onSearch={onSearch}
          className="search-bar-input"
          prefix={<SearchOutlined className="search-icon" />}
          allowClear
          size="large"
        />
        {showAddButton && onAdd && (
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={onAdd}
            className="search-bar-add-button"
            size="large"
          >
            {isMobile ? 'Add' : addButtonText}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
