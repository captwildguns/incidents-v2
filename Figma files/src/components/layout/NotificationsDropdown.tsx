import { useState, useMemo } from 'react';
import * as React from 'react';
import {
  Bell, MessageSquare, ArrowRight, User, GitBranch,
  TrendingUp, UserMinus, Zap, CheckCircle, Clock, AlertCircle,
} from 'lucide-react';
import { ForgeButton, ForgeBadge, ForgeDivider } from '@tylertech/forge-react';
import { defineButtonComponent, defineBadgeComponent, defineDividerComponent } from '@tylertech/forge';

defineButtonComponent();
defineBadgeComponent();
defineDividerComponent();

// ── Types (matches Phase 1 spec) ─────────────────────────────────────────────

type NotificationType =
  | 'incident-assigned'
  | 'workflow-step-assigned'
  | 'new-message'
  | 'severity-escalated'
  | 'workflow-step-completed'
  | 'incident-unassigned'
  | 'critical-incident-created';

type Priority = 'low' | 'medium' | 'high' | 'critical';

interface ActionRoute {
  page: string;
  entityId: string;
  subView?: string;
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;       // ISO 8601
  isRead: boolean;
  priority: Priority;
  actionRoute: ActionRoute;
  metadata: Record<string, string>;
  recipientUserId: string;
  createdAt: string;       // ISO 8601
}

interface NotificationsDropdownProps {
  onNavigate: (page: string) => void;
  onNavigateToCommunication?: (incidentId: string) => void;
}

// ── Display helpers ───────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<Priority, string> = {
  critical: '#ef4444',
  high:     '#ef4444',
  medium:   '#f97316',
  low:      '#94a3b8',
};

// Hardcoded reference dates so group labels are always correct for this prototype
const REF_TODAY     = '2026-05-18';
const REF_YESTERDAY = '2026-05-17';

function getGroupLabel(isoString: string): string {
  const dateStr = isoString.slice(0, 10);
  if (dateStr === REF_TODAY)     return 'Today';
  if (dateStr === REF_YESTERDAY) return 'Yesterday';
  return new Date(isoString).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getTypeIcon(type: NotificationType, color: string) {
  const style = { color, flexShrink: 0, marginTop: 2 };
  switch (type) {
    case 'incident-assigned':        return <User size={16} style={style} />;
    case 'workflow-step-assigned':   return <GitBranch size={16} style={style} />;
    case 'new-message':              return <MessageSquare size={16} style={style} />;
    case 'severity-escalated':       return <TrendingUp size={16} style={style} />;
    case 'workflow-step-completed':  return <CheckCircle size={16} style={style} />;
    case 'incident-unassigned':      return <UserMinus size={16} style={style} />;
    case 'critical-incident-created':return <Zap size={16} style={style} />;
    default:                         return <AlertCircle size={16} style={style} />;
  }
}

// ── Mock data (all 7 Phase 1 types) ──────────────────────────────────────────

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    type: 'critical-incident-created',
    title: 'New Critical Incident',
    body: 'Marcus Johnson, Emergency Exit Misuse on Bus 8 (Route 14A)',
    timestamp: '2026-05-18T14:52:00Z',
    isRead: false,
    priority: 'critical',
    actionRoute: { page: 'incident-detail', entityId: 'INC-2026-0087' },
    metadata: { incidentId: 'INC-2026-0087', studentName: 'Marcus Johnson', incidentType: 'Emergency Exit Misuse', busNumber: 'Bus 8', routeId: 'Route 14A', reportedBy: 'user-driver-chen' },
    recipientUserId: 'user-sarah-williams',
    createdAt: '2026-05-18T14:52:00Z',
  },
  {
    id: 'n-2',
    type: 'incident-assigned',
    title: 'Incident Assigned to You',
    body: 'Sarah Mitchell, Seat Refusal on Bus 12',
    timestamp: '2026-05-18T12:30:00Z',
    isRead: false,
    priority: 'medium',
    actionRoute: { page: 'incident-detail', entityId: 'INC-2025-0042' },
    metadata: { incidentId: 'INC-2025-0042', incidentTitle: 'Seat Refusal', severity: 'Medium', assignedBy: 'admin' },
    recipientUserId: 'user-sarah-williams',
    createdAt: '2026-05-18T12:30:00Z',
  },
  {
    id: 'n-3',
    type: 'new-message',
    title: 'New Message, INC-2025-0042',
    body: 'John Chen: "I\'ve spoken with Sarah\'s parents and they\'ve agreed to a behavioral contract..."',
    timestamp: '2026-05-18T10:15:00Z',
    isRead: false,
    priority: 'medium',
    actionRoute: { page: 'incident-detail', entityId: 'INC-2025-0042', subView: 'messages' },
    metadata: { incidentId: 'INC-2025-0042', messageId: 'msg-089', senderId: 'user-john-chen', senderName: 'John Chen', messagePreview: 'I\'ve spoken with Sarah\'s parents and they\'ve agreed to a behavioral contract' },
    recipientUserId: 'user-sarah-williams',
    createdAt: '2026-05-18T10:15:00Z',
  },
  {
    id: 'n-4',
    type: 'workflow-step-assigned',
    title: 'Action Required: Parent Notification',
    body: 'Parent Notification on INC-2025-0041 requires your completion',
    timestamp: '2026-05-18T09:00:00Z',
    isRead: false,
    priority: 'high',
    actionRoute: { page: 'incident-detail', entityId: 'INC-2025-0041', subView: 'workflow-step' },
    metadata: { incidentId: 'INC-2025-0041', workflowStepId: 'step-parent-notif', stepName: 'Parent Notification', workflowName: 'Standard Misconduct', requiresApproval: 'false', assignedBy: 'admin' },
    recipientUserId: 'user-sarah-williams',
    createdAt: '2026-05-18T09:00:00Z',
  },
  {
    id: 'n-5',
    type: 'severity-escalated',
    title: 'Severity Escalated, INC-2025-0039',
    body: 'Emma Rodriguez escalated from Medium → High',
    timestamp: '2026-05-17T16:45:00Z',
    isRead: false,
    priority: 'high',
    actionRoute: { page: 'incident-detail', entityId: 'INC-2025-0039' },
    metadata: { incidentId: 'INC-2025-0039', previousSeverity: 'Medium', newSeverity: 'High', escalatedBy: 'supervisor' },
    recipientUserId: 'user-sarah-williams',
    createdAt: '2026-05-17T16:45:00Z',
  },
  {
    id: 'n-6',
    type: 'workflow-step-completed',
    title: 'Workflow Advanced, INC-2025-0041',
    body: 'Mike Torres completed "Initial Documentation", Parent Notification is next',
    timestamp: '2026-05-17T11:20:00Z',
    isRead: true,
    priority: 'low',
    actionRoute: { page: 'incident-detail', entityId: 'INC-2025-0041', subView: 'workflow-step' },
    metadata: { incidentId: 'INC-2025-0041', completedStepId: 'step-init-doc', completedStepName: 'Initial Documentation', completedBy: 'Mike Torres', nextStepId: 'step-parent-notif', nextStepName: 'Parent Notification' },
    recipientUserId: 'user-sarah-williams',
    createdAt: '2026-05-17T11:20:00Z',
  },
  {
    id: 'n-7',
    type: 'incident-unassigned',
    title: 'Incident Removed from Your Queue',
    body: 'INC-2025-0035 (James Patterson) reassigned to Maria Gonzalez',
    timestamp: '2026-05-15T09:30:00Z',
    isRead: true,
    priority: 'low',
    actionRoute: { page: 'incident-detail', entityId: 'INC-2025-0035' },
    metadata: { incidentId: 'INC-2025-0035', previousAssigneeId: 'user-sarah-williams', newAssigneeId: 'user-maria', newAssigneeName: 'Maria Gonzalez', reassignedBy: 'admin' },
    recipientUserId: 'user-sarah-williams',
    createdAt: '2026-05-15T09:30:00Z',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationsDropdown({ onNavigate, onNavigateToCommunication }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);

  const unread = notifications.filter(n => !n.isRead);
  const unreadCount = unread.length;

  // Bell badge color driven by highest priority unread
  const badgeColor = unread.some(n => n.priority === 'critical' || n.priority === 'high')
    ? '#ef4444'
    : unread.some(n => n.priority === 'medium')
    ? '#f97316'
    : unreadCount > 0 ? '#94a3b8' : null;

  // Group notifications by day, preserving Today → Yesterday → older order
  const groups = useMemo(() => {
    const map = new Map<string, Notification[]>();
    const order: string[] = [];
    notifications.forEach(n => {
      const label = getGroupLabel(n.createdAt);
      if (!map.has(label)) { map.set(label, []); order.push(label); }
      map.get(label)!.push(n);
    });
    return order.map(label => ({ label, items: map.get(label)! }));
  }, [notifications]);

  const markAsRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

  const markAllAsRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

  const handleClick = (n: Notification) => {
    markAsRead(n.id);
    setIsOpen(false);
    if (n.actionRoute.subView === 'messages' && onNavigateToCommunication) {
      onNavigateToCommunication(n.actionRoute.entityId);
    } else if (n.actionRoute.page === 'incident-detail') {
      onNavigate('incidents');
    } else {
      onNavigate(n.actionRoute.page);
    }
  };

  return (
    <>
      {/* Bell trigger */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'white', width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '50%', position: 'relative',
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} />
        {badgeColor && unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            minWidth: 18, height: 18, padding: '0 4px',
            borderRadius: 9, backgroundColor: badgeColor,
            color: '#fff', fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop + panel */}
      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setIsOpen(false)}
          />
          <div style={{
            position: 'absolute', top: '100%', right: 0, zIndex: 50,
            width: 400, backgroundColor: '#fff',
            borderRadius: 'var(--forge-shape-large)',
            boxShadow: 'var(--forge-elevation-8)',
            overflow: 'hidden', marginTop: 6,
          }}>

            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <h3 className="forge-typography--heading4" style={{ margin: 0, color: '#0f172a' }}>Notifications</h3>
                {unreadCount > 0 && (
                  <ForgeBadge theme="error">{unreadCount} New</ForgeBadge>
                )}
              </div>
              {unreadCount > 0 && (
                <ForgeButton variant="flat" onClick={markAllAsRead} style={{ fontSize: 13, padding: 0 }}>
                  <CheckCircle size={14} style={{ marginRight: 4 }} />
                  Mark all as read
                </ForgeButton>
              )}
            </div>

            {/* Notification list, grouped by day */}
            <div style={{ maxHeight: 440, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--forge-theme-text-low)' }}>
                  <Bell size={40} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                  <p className="forge-typography--body2" style={{ margin: 0 }}>No notifications</p>
                </div>
              ) : (
                groups.map(({ label, items }, gi) => (
                  <div key={label}>
                    {/* Day header */}
                    <div style={{
                      padding: '6px 16px',
                      backgroundColor: '#f8fafc',
                      borderBottom: '1px solid #e2e8f0',
                      ...(gi > 0 ? { borderTop: '1px solid #e2e8f0' } : {}),
                    }}>
                      <span className="forge-typography--label1" style={{ color: '#64748b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {label}
                      </span>
                    </div>

                    {items.map((n, i) => {
                      const iconColor = PRIORITY_COLOR[n.priority];
                      return (
                        <div key={n.id}>
                          {i > 0 && <ForgeDivider />}
                          <button
                            onClick={() => handleClick(n)}
                            style={{
                              width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer',
                              padding: '10px 16px',
                              backgroundColor: n.isRead ? '#fff' : '#f1f5f9',
                              display: 'flex', gap: 10,
                            }}
                          >
                            {/* Priority icon */}
                            {getTypeIcon(n.type, iconColor)}

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
                                <span className="forge-typography--body2" style={{
                                  color: '#0f172a',
                                  fontWeight: n.isRead ? 400 : 700,
                                  lineHeight: 1.3,
                                }}>
                                  {n.title}
                                </span>
                                {!n.isRead && (
                                  <span style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    backgroundColor: '#4A6FA5', flexShrink: 0, marginTop: 4,
                                  }} />
                                )}
                              </div>

                              <p className="forge-typography--label1" style={{
                                margin: '0 0 6px', color: '#475569', lineHeight: 1.4,
                                overflow: 'hidden', textOverflow: 'ellipsis',
                                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                              } as React.CSSProperties}>
                                {n.body}
                              </p>

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span className="forge-typography--label1" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <Clock size={11} />
                                  {formatTime(n.timestamp)}
                                </span>
                                <span className="forge-typography--label1" style={{ color: '#4A6FA5', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 3 }}>
                                  View <ArrowRight size={11} />
                                </span>
                              </div>
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <>
                <ForgeDivider />
                <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                  <ForgeButton variant="flat" style={{ width: '100%' }}>
                    View All Notifications
                  </ForgeButton>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}
