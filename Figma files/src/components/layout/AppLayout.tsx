import { ReactNode, useState, useRef, useEffect } from 'react';
import {
  defineScaffoldComponent,
  defineAppBarComponent,
  defineModalDrawerComponent,
  defineIconComponent,
  defineIconButtonComponent,
  defineAvatarComponent,
  defineListComponent,
  defineListItemComponent,
  defineDividerComponent,
  defineMenuComponent,
  IconRegistry,
} from '@tylertech/forge';
import { ForgeMenu } from '@tylertech/forge-react';
import {
  tylIconMenu,
  tylIconHome,
  tylIconWarning,
  tylIconPeople,
  tylIconPerson,
  tylIconDirectionsBus,
  tylIconChat,
  tylIconDescription,
  tylIconAccountTree,
  tylIconSettings,
  tylIconHelpOutline,
  tylIconExitToApp,
  tylIconFeedback,
  tylIconAccessTime,
  tylIconAdd,
  tylIconBarChart,
  tylIconBuild,
  tylIconCalendarToday,
  tylIconFilterList,
  tylIconLocationOn,
  tylIconPhone,
  tylIconRefresh,
  tylIconSchool,
  tylIconShield,
  tylIconTrackChanges,
  tylIconArrowDownward,
  tylIconArrowDropDown,
  tylIconArrowForward,
  tylIconArrowUpward,
  tylIconCheck,
  tylIconCheckCircle,
  tylIconChevronLeft,
  tylIconContentCopy,
  tylIconDelete,
  tylIconFlashOn,
  tylIconHowToReg,
  tylIconRadioButtonUnchecked,
  tylIconChevronRight,
  tylIconClose,
  tylIconDownload,
  tylIconEdit,
  tylIconEmail,
  tylIconError,
  tylIconMoreVert,
  tylIconPersonAdd,
  tylIconPhotoCamera,
  tylIconSearch,
  tylIconSend,
  tylIconTrendingDown,
  tylIconTrendingUp,
  tylIconUnfoldMore,
  tylIconVisibility,
  tylIconZoomIn,
  // New Incident subject chooser (school and directions_bus already above)
  tylIconWarehouse,
  tylIconPublic,
  tylIconBadge,
} from '@tylertech/tyler-icons';

// Define Forge custom elements (one-time registration)
defineScaffoldComponent();
defineAppBarComponent();
defineModalDrawerComponent();
defineIconComponent();
defineIconButtonComponent();
defineAvatarComponent();
defineListComponent();
defineListItemComponent();
defineDividerComponent();
defineMenuComponent();

// Register Tyler icons
IconRegistry.define([
  tylIconMenu,
  tylIconHome, tylIconWarning, tylIconPeople, tylIconPerson,
  tylIconDirectionsBus, tylIconChat, tylIconDescription,
  tylIconAccountTree, tylIconSettings, tylIconHelpOutline,
  tylIconExitToApp, tylIconFeedback,
  tylIconAccessTime, tylIconAdd, tylIconArrowDownward, tylIconArrowDropDown, tylIconArrowForward, tylIconArrowUpward,
  tylIconBarChart, tylIconBuild, tylIconCalendarToday, tylIconFilterList, tylIconLocationOn, tylIconPhone, tylIconRefresh, tylIconSchool, tylIconShield, tylIconTrackChanges,
  tylIconCheck, tylIconCheckCircle, tylIconChevronLeft, tylIconChevronRight, tylIconClose,
  tylIconContentCopy, tylIconDelete, tylIconFlashOn, tylIconHowToReg, tylIconRadioButtonUnchecked,
  tylIconDownload, tylIconEdit, tylIconEmail, tylIconError, tylIconMoreVert, tylIconPersonAdd,
  tylIconPhotoCamera, tylIconSearch, tylIconSend, tylIconTrendingDown, tylIconTrendingUp,
  tylIconUnfoldMore, tylIconVisibility, tylIconZoomIn,
  tylIconWarehouse, tylIconPublic, tylIconBadge,
]);

import { GlobalSearch } from './GlobalSearch';
import { NotificationsDropdown } from './NotificationsDropdown';

interface AppLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onNavigateToCommunication?: (incidentId: string, incidentData?: any) => void;
  onNavigateToIncidentDetail?: (incident: any) => void;
  onLogout?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', forgeIcon: 'home' },
  { id: 'incidents', label: 'Incidents', forgeIcon: 'warning' },
  { id: 'students', label: 'Students', forgeIcon: 'people' },
  { id: 'drivers', label: 'Drivers', forgeIcon: 'person' },
  { id: 'vehicles', label: 'Vehicles', forgeIcon: 'directions_bus' },
  { id: 'communications', label: 'Communications', forgeIcon: 'chat' },
  { id: 'reports', label: 'Reports', forgeIcon: 'description' },
  { id: 'workflows', label: 'Workflows', forgeIcon: 'account_tree' },
  { id: 'admin', label: 'Admin', forgeIcon: 'settings' },
];

export function AppLayout({ children, currentPage, onNavigate, onNavigateToCommunication, onNavigateToIncidentDetail, onLogout }: AppLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);

  // Listen for drawer dismiss (clicking backdrop / pressing Escape)
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    const handler = () => setIsDrawerOpen(false);
    drawer.addEventListener('forge-modal-drawer-close', handler);
    drawer.addEventListener('forge-drawer-after-close', handler);
    return () => {
      drawer.removeEventListener('forge-modal-drawer-close', handler);
      drawer.removeEventListener('forge-drawer-after-close', handler);
    };
  }, []);

  // Sync drawer open state — set both property and attribute for reliability
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (isDrawerOpen) {
      drawer.setAttribute('open', '');
      (drawer as any).open = true;
    } else {
      drawer.removeAttribute('open');
      (drawer as any).open = false;
    }
  }, [isDrawerOpen]);

  return (
    <>
    {/* Modal Drawer for Navigation — outside scaffold so overlay renders on top */}
    <forge-modal-drawer ref={drawerRef}>
      <aside style={{
        width: '280px', height: '100%', display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--forge-theme-surface)', color: 'var(--forge-theme-text-high)',
        overflowX: 'hidden',
      }}>
        {/* Profile Section */}
        <div style={{
          padding: 'var(--forge-spacing-medium) var(--forge-spacing-large)',
          borderBottom: '1px solid var(--forge-theme-outline)',
          backgroundColor: 'var(--forge-theme-primary)',
          color: 'white',
          display: 'flex', alignItems: 'center', gap: 'var(--forge-spacing-small)',
        }}>
          <button
            type="button"
            onClick={() => { onNavigate('tablet'); setIsDrawerOpen(false); }}
            title="Open driver tablet view"
            aria-label="Open driver tablet view"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', borderRadius: '50%' }}
          >
            <forge-avatar text="SW" style={{ '--forge-avatar-background': 'var(--brand-olive-dark)', '--forge-avatar-color': 'white' } as any}></forge-avatar>
          </button>
          <span className="forge-typography--body1" style={{ fontWeight: 500, color: 'white', fontSize: '14px' }}>Sarah Williams</span>
        </div>

        {/* Navigation Items */}
        <forge-list className="drawer-nav-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map((item) => (
            <forge-list-item
              key={item.id}
              {...(currentPage === item.id ? { selected: true } : {})}
              onClick={() => { onNavigate(item.id); setIsDrawerOpen(false); }}
            >
              <forge-icon slot="start" name={item.forgeIcon}></forge-icon>
              {item.label}
            </forge-list-item>
          ))}
        </forge-list>

        {/* Bottom Actions */}
        <forge-divider></forge-divider>
        <forge-list className="drawer-nav-bottom">
          <forge-list-item onClick={() => { onNavigate('help'); setIsDrawerOpen(false); }}>
            <forge-icon slot="start" name="help_outline"></forge-icon>
            Help
          </forge-list-item>
          <forge-list-item onClick={() => { /* logout */ }}>
            <forge-icon slot="start" name="exit_to_app"></forge-icon>
            Logout
          </forge-list-item>
        </forge-list>

        <forge-divider></forge-divider>
        <div className="forge-typography--label1" style={{
          color: 'var(--forge-theme-text-low)',
          padding: 'var(--forge-spacing-small) var(--forge-spacing-large)',
          textAlign: 'center',
        }}>
          &copy; 2025 Tyler Technologies Inc. V2 test build
        </div>
      </aside>
    </forge-modal-drawer>

    <forge-scaffold>
      {/* App Bar */}
      <div slot="header">
        <forge-app-bar>
          <forge-icon-button slot="start" aria-label="Menu"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            style={{ color: 'white' }}
          >
            <forge-icon name="menu"></forge-icon>
          </forge-icon-button>

          <div slot="start" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => onNavigate('dashboard')}>
            <span className="forge-typography--heading4" style={{ color: 'var(--forge-theme-text-high-inverse)', lineHeight: 1.3 }}>
              Incident Tracker V2
            </span>
          </div>

          <div slot="center" style={{ display: 'flex', alignItems: 'center' }}>
            <GlobalSearch
              onNavigate={onNavigate}
              onNavigateToIncidentDetail={onNavigateToIncidentDetail}
              onNavigateToCommunication={onNavigateToCommunication}
            />
          </div>

          <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <NotificationsDropdown onNavigate={onNavigate} onNavigateToCommunication={onNavigateToCommunication} />
            </div>
            <forge-icon-button aria-label="Help"
              onClick={() => onNavigate('help')}
              style={{ color: 'white' }}
            >
              <forge-icon name="help_outline"></forge-icon>
            </forge-icon-button>
            <ForgeMenu
              placement="bottom-end"
              options={[{ label: 'Log Out', value: 'logout' }]}
              on-forge-menu-select={(evt: any) => {
                if (evt.detail?.value === 'logout') onLogout?.();
              }}
            >
              <button style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }} aria-label="User menu">
                <forge-avatar text="SW" style={{ '--forge-avatar-background': 'var(--brand-olive-dark)', '--forge-avatar-color': 'white', '--forge-avatar-size': '32px' } as any}></forge-avatar>
              </button>
            </ForgeMenu>
          </div>
        </forge-app-bar>
      </div>

      {/* Main Content */}
      <main slot="body" style={{ backgroundColor: 'var(--forge-theme-surface-dim)', minHeight: 'calc(100vh - 140px)', overflowX: 'hidden' }}>
        {children}
      </main>

      {/* Footer */}
      <footer
        slot="footer"
        className="forge-typography--label1"
        style={{
          backgroundColor: '#2a2a2a',
          color: 'var(--forge-theme-text-medium-inverse)',
          padding: 'var(--forge-spacing-small) var(--forge-spacing-large)',
          textAlign: 'center',
          borderTop: '1px solid #444',
        }}
      >
        &copy; 2025 Tyler Technologies Inc. - Student Transportation powered by Traversa
      </footer>
    </forge-scaffold>
    </>
  );
}
