import { Input, Button } from 'antd';
import { SearchOutlined, PlusOutlined, CloseCircleFilled } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import './SearchBar.css';

const SearchBar = ({
  onSearch,
  onAdd,
  placeholder = 'Search...',
  addButtonText = 'Add New',
  showAddButton = true,
  value: controlledValue
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [value, setValue] = useState(controlledValue || '');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (controlledValue !== undefined) setValue(controlledValue);
  }, [controlledValue]);

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    onSearch?.(v);
  };

  const handleClear = () => {
    setValue('');
    onSearch?.('');
  };

  return (
    <div className="search-bar-container">
      <div className="search-bar-wrapper">
        <div className={`search-bar-shell ${focused ? 'is-focused' : ''} ${value ? 'has-value' : ''}`}>
          <SearchOutlined className="search-bar-icon" />
          <Input
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onPressEnter={() => onSearch?.(value)}
            className="search-bar-native"
            bordered={false}
          />
          {value && (
            <button type="button" className="search-bar-clear" onClick={handleClear} aria-label="Clear">
              <CloseCircleFilled />
            </button>
          )}
          {!isMobile && !value && (
            <kbd className="search-bar-kbd">⌘K</kbd>
          )}
        </div>
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
