import { Badge, Dropdown, List, Button, Empty } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useApiQuery, useApiMutation } from '@hooks/useApi';
import { notificationService } from '@services/index';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const NotificationBell = () => {
  const { data: notifications, refetch } = useApiQuery(
    ['notifications'],
    () => notificationService.getUnread()
  );

  const markReadMutation = useApiMutation(
    (id) => notificationService.markAsRead(id),
    { onSuccess: refetch }
  );

  const markAllReadMutation = useApiMutation(
    () => notificationService.markAllAsRead(),
    { onSuccess: refetch }
  );

  const items = [
    {
      key: 'notifications',
      label: (
        <div style={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <strong>Notifications</strong>
            {notifications?.data?.length > 0 && (
              <Button type="link" size="small" onClick={() => markAllReadMutation.mutate()}>
                Mark all read
              </Button>
            )}
          </div>
          {notifications?.data?.length > 0 ? (
            <List
              dataSource={notifications.data}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '12px 16px' }}
                  onClick={() => markReadMutation.mutate(item.notification_id)}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <>
                        <div>{item.message}</div>
                        <small style={{ color: '#999' }}>
                          {dayjs(item.created_at).fromNow()}
                        </small>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No notifications" style={{ padding: 24 }} />
          )}
        </div>
      )
    }
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
      <Badge count={notifications?.data?.length || 0} offset={[-5, 5]}>
        <BellOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
