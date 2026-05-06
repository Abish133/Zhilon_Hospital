import { Drawer, Button, Space } from 'antd';

const SliderModal = ({
  open,
  onCancel,
  onClose,
  onOk,
  title,
  children,
  width,
  footer,
  okText = 'OK',
  cancelText = 'Cancel',
  confirmLoading,
  okButtonProps,
  cancelButtonProps,
  closable,
  maskClosable,
  destroyOnClose,
  destroyOnHidden,
  forceRender,
  className,
  rootClassName,
  styles,
  bodyStyle,
  style,
  zIndex,
  centered,
  wrapClassName,
  afterClose,
  afterOpenChange,
  loading,
  ...rest
}) => {
  const handleClose = (e) => {
    if (onCancel) onCancel(e);
    if (onClose) onClose(e);
  };

  const showOk = typeof onOk === 'function';

  const defaultFooter = (
    <div style={{ textAlign: 'right' }}>
      <Space>
        <Button onClick={handleClose} {...(cancelButtonProps || {})}>
          {cancelText}
        </Button>
        {showOk && (
          <Button
            type="primary"
            loading={confirmLoading}
            onClick={onOk}
            {...(okButtonProps || {})}
          >
            {okText}
          </Button>
        )}
      </Space>
    </div>
  );

  const drawerFooter =
    footer === null ? null : footer === undefined ? defaultFooter : footer;

  const mergedStyles = {
    ...(styles || {}),
    body: {
      ...(bodyStyle || {}),
      ...((styles && styles.body) || {}),
    },
  };

  return (
    <Drawer
      open={open}
      title={title}
      onClose={handleClose}
      placement="right"
      width={width || '50%'}
      footer={drawerFooter}
      closable={closable}
      maskClosable={maskClosable}
      destroyOnClose={destroyOnClose}
      destroyOnHidden={destroyOnHidden}
      forceRender={forceRender}
      className={className}
      rootClassName={rootClassName}
      styles={mergedStyles}
      style={style}
      zIndex={zIndex}
      afterOpenChange={afterOpenChange || afterClose}
      loading={loading}
      {...rest}
    >
      {children}
    </Drawer>
  );
};

export default SliderModal;
