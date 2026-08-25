import { ReactNode, useState, useRef, useEffect } from 'react';
import {
  defineScaffoldComponent,
  defineAppBarComponent,
  defineAppBarMenuButtonComponent,
  defineAppBarNotificationButtonComponent,
  defineAppBarHelpButtonComponent,
  defineAppBarProfileButtonComponent,
  defineDrawerComponent,
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
  tylIconHomeOutline,
  tylIconErrorOutline,
  tylIconPeopleOutline,
  tylIconAccountCircleOutline,
  tylIconBusSide,
  tylIconMessageTextOutline,
  tylIconFileDocumentOutline,
  tylIconTablet,
  tylIconSourceBranch,
  tylIconShieldOutline,
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
defineDrawerComponent();
defineAppBarMenuButtonComponent();
defineAppBarNotificationButtonComponent();
defineAppBarHelpButtonComponent();
defineAppBarProfileButtonComponent();
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
  // Prod drawer icons
  tylIconHomeOutline, tylIconErrorOutline, tylIconPeopleOutline,
  tylIconAccountCircleOutline, tylIconBusSide, tylIconTablet,
  tylIconMessageTextOutline, tylIconFileDocumentOutline,
  tylIconSourceBranch, tylIconShieldOutline,
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
import { OrgSelector } from './OrgSelector';
import { IS_MULTI_DISTRICT_SITE } from '../../data/organizations';

interface AppLayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  onNavigateToCommunication?: (incidentId: string, incidentData?: any) => void;
  onNavigateToIncidentDetail?: (incident: any) => void;
  onLogout?: () => void;
}

const navItems = [
  // Icon names lifted from the Forge build so the drawer reads identically.
  // Employees keeps the icon prod uses for Drivers, since it is the same page
  // widened to non-driver staff. Locations has no counterpart there yet.
  { id: 'dashboard', label: 'Dashboard', forgeIcon: 'home_outline' },
  { id: 'incidents', label: 'Incidents', forgeIcon: 'error_outline' },
  { id: 'students', label: 'Students', forgeIcon: 'people_outline' },
  { id: 'employees', label: 'Employees', forgeIcon: 'account_circle_outline' },
  { id: 'vehicles', label: 'Vehicles', forgeIcon: 'bus_side' },
  { id: 'locations', label: 'Locations', forgeIcon: 'warehouse' },
  { id: 'communications', label: 'Communications', forgeIcon: 'message_text_outline' },
  { id: 'reports', label: 'Reports', forgeIcon: 'file_document_outline' },
  { id: 'workflows', label: 'Workflows', forgeIcon: 'source_branch' },
  { id: 'admin', label: 'Admin', forgeIcon: 'shield_outline' },
];

export function AppLayout({ children, currentPage, onNavigate, onNavigateToCommunication, onNavigateToIncidentDetail, onLogout }: AppLayoutProps) {
  // Open by default. Prod shows a persistent left rail rather than an overlay
  // you have to summon, so the nav is part of the page, not a detour.
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
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

  // Sync drawer open state, set both property and attribute for reliability
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
    <forge-scaffold>
    {/* Persistent navigation, matching the Forge build: a forge-drawer in the
        scaffold's body-left slot rather than a modal overlay. The menu button
        collapses it instead of summoning it. */}
    <forge-drawer ref={drawerRef} slot="body-left" direction="left" id="navigation-drawer">
      <aside style={{
        width: '280px', height: '100%', display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--forge-theme-surface)', color: 'var(--forge-theme-text-high)',
        overflowX: 'hidden',
      }}>
        {/* The organization selector, only on a multi-district site. It sits
            above navigation because the scope governs every page below it. With
            IsMultiDistrictSite off there is no tree and no org filtering. */}
        {IS_MULTI_DISTRICT_SITE && (
          <>
            <OrgSelector />
            <forge-divider></forge-divider>
          </>
        )}

        {/* Navigation Items */}
        <forge-list className="drawer-nav-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map((item) => (
            <forge-list-item
              key={item.id}
              {...(currentPage === item.id ? { selected: true } : {})}
              onClick={() => { onNavigate(item.id) }}
            >
              <forge-icon slot="start" name={item.forgeIcon}></forge-icon>
              {item.label}
            </forge-list-item>
          ))}
        </forge-list>

        {/* Bottom Actions */}
        <forge-divider></forge-divider>
        <forge-list className="drawer-nav-bottom">
          {/* The driver tablet used to be reachable only by clicking the avatar
              in a drawer header that prod does not have. A named entry is both
              more discoverable and more honest about it being a real view. */}
          <forge-list-item
            {...(currentPage === 'tablet' ? { selected: true } : {})}
            onClick={() => { onNavigate('tablet') }}
          >
            <forge-icon slot="start" name="tablet"></forge-icon>
            Driver Tablet
          </forge-list-item>
          <forge-list-item onClick={() => { onNavigate('help') }}>
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
          &copy; 2025 Tyler Technologies Inc. Preview build
        </div>
      </aside>
    </forge-drawer>

      {/* App Bar */}
      <div slot="header">
        <forge-app-bar elevation="raised" title-text="Incident Tracker">
          <forge-icon-button slot="start" aria-label="Menu"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            style={{ color: 'white' }}
          >
            <forge-icon name="menu"></forge-icon>
          </forge-icon-button>

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

    </forge-scaffold>
  );
}
