import { Card, Tag, Tooltip } from 'antd';
import {
  CalendarOutlined, UserAddOutlined, TeamOutlined, DollarOutlined,
  ArrowRightOutlined, CheckCircleFilled
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

/**
 * A single, shared header that makes every OPD screen self-explanatory:
 *  - shows the 4-stage patient journey with the *current* stage highlighted,
 *  - says in plain words what the screen is for, and
 *  - lists which roles actually use it.
 *
 * The whole point is that any user (reception / nurse / doctor / billing) can
 * tell at a glance whether a screen is "theirs" and where it sits in the flow,
 * without confusing Appointments vs Visits vs Queue.
 *
 * Usage: <OpdFlowHeader current="queue" />
 */

const STAGES = [
  {
    key: 'appointment',
    path: '/opd/appointments',
    icon: <CalendarOutlined />,
    title: 'Appointment',
    short: 'Book / schedule',
    blurb: 'The booking. A patient is scheduled to see a doctor on a future date. Nothing clinical happens yet — this is just the calendar entry.',
    roles: ['Receptionist'],
    color: '#1890ff'
  },
  {
    key: 'visit',
    path: '/opd/visits',
    icon: <UserAddOutlined />,
    title: 'Visit',
    short: 'Check-in / walk-in',
    blurb: 'The real encounter. Created when an appointment is checked in, or registered directly for a walk-in. Every patient gets a token here — this is the record all clinical work hangs off.',
    roles: ['Receptionist', 'Nurse'],
    color: '#722ed1'
  },
  {
    key: 'queue',
    path: '/opd/queue',
    icon: <TeamOutlined />,
    title: "Queue (Today)",
    short: 'Vitals & consult',
    blurb: "Today's live worklist of checked-in patients, in order. The nurse records vitals and the doctor calls patients in, consults, and marks them done.",
    roles: ['Nurse', 'Doctor'],
    color: '#fa8c16'
  },
  {
    key: 'billing',
    path: '/opd/billing',
    icon: <DollarOutlined />,
    title: 'Billing',
    short: 'Collect payment',
    blurb: 'After the consultation is completed, charges are collected here.',
    roles: ['Receptionist', 'Accountant'],
    color: '#52c41a'
  }
];

const OpdFlowHeader = ({ current }) => {
  const navigate = useNavigate();
  const currentIndex = STAGES.findIndex(s => s.key === current);
  const active = STAGES[currentIndex] || STAGES[0];

  return (
    <Card
      size="small"
      style={{ marginBottom: 16, borderRadius: 12 }}
      styles={{ body: { padding: '14px 16px' } }}
    >
      {/* Flow strip */}
      <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap', gap: 4 }}>
        {STAGES.map((stage, i) => {
          const isCurrent = stage.key === current;
          const isDone = i < currentIndex;
          return (
            <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: '1 1 0', minWidth: 150 }}>
              <Tooltip title={stage.blurb}>
                <div
                  onClick={() => navigate(stage.path)}
                  style={{
                    flex: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: isCurrent ? `1.5px solid ${stage.color}` : '1px solid #f0f0f0',
                    background: isCurrent ? `${stage.color}14` : '#fafafa',
                    transition: 'all .15s ease'
                  }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15,
                    background: isCurrent ? stage.color : (isDone ? '#e6f4ea' : '#ffffff'),
                    color: isCurrent ? '#fff' : (isDone ? '#52c41a' : '#bfbfbf'),
                    border: isCurrent ? 'none' : '1px solid #f0f0f0'
                  }}>
                    {isDone ? <CheckCircleFilled /> : stage.icon}
                  </div>
                  <div style={{ lineHeight: 1.2, overflow: 'hidden' }}>
                    <div style={{
                      fontSize: 13,
                      fontWeight: isCurrent ? 700 : 600,
                      color: isCurrent ? stage.color : '#262626',
                      whiteSpace: 'nowrap'
                    }}>
                      <span style={{ opacity: 0.6, marginRight: 4 }}>{i + 1}.</span>{stage.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#8c8c8c', whiteSpace: 'nowrap' }}>{stage.short}</div>
                  </div>
                </div>
              </Tooltip>
              {i < STAGES.length - 1 && (
                <ArrowRightOutlined style={{ color: '#d9d9d9', fontSize: 12, margin: '0 2px', flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* What this screen is + who uses it */}
      <div style={{
        marginTop: 12, paddingTop: 12, borderTop: '1px dashed #f0f0f0',
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8
      }}>
        <span style={{ fontSize: 13, color: '#595959', flex: '1 1 320px', minWidth: 240 }}>
          <b style={{ color: active.color }}>You are here — {active.title}.</b> {active.blurb}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>Used by:</span>
          {active.roles.map(r => (
            <Tag key={r} color={active.color} style={{ marginInlineEnd: 0, borderRadius: 6 }}>{r}</Tag>
          ))}
        </span>
      </div>
    </Card>
  );
};

export default OpdFlowHeader;
