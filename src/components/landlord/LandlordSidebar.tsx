import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  DollarSign, 
  Wrench, 
  MessageSquare, 
  Settings,
  LogOut,
  UserCircle,
  Brain
} from 'lucide-react';
import { cn } from '../ui/utils';
import { useAuth } from '../../contexts/AuthContext';
import { EditProfileDialog } from './EditProfileDialog';
import { Logo } from '../Logo';

interface LandlordSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed?: boolean;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'properties', label: 'Properties', icon: Building2 },
  { id: 'tenants', label: 'Tenants', icon: Users },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'community', label: 'Community', icon: MessageSquare },
  { id: 'rent-prediction', label: 'Rent Prediction', icon: Brain },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function LandlordSidebar({ activeTab, onTabChange, isCollapsed }: LandlordSidebarProps) {
  const { logout, user } = useAuth();
  const [editProfileOpen, setEditProfileOpen] = React.useState(false);
  const [scrollToPayment, setScrollToPayment] = React.useState(false);

  // Listen for the 'open-edit-profile' event from "Setup Now" button
  React.useEffect(() => {
    const handleOpenEditProfile = () => {
      setScrollToPayment(true);
      setEditProfileOpen(true);
    };

    window.addEventListener('open-edit-profile', handleOpenEditProfile);
    
    return () => {
      window.removeEventListener('open-edit-profile', handleOpenEditProfile);
    };
  }, []);

  // Reset scroll flag when modal closes
  const handleEditProfileChange = (open: boolean) => {
    setEditProfileOpen(open);
    if (!open) {
      setScrollToPayment(false);
    }
  };

  return (
    <aside 
      className={cn(
        'bg-sidebar border-r border-sidebar-border h-screen sticky top-0 flex flex-col transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
      data-tour="sidebar"
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        {isCollapsed ? (
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
        ) : (
          <Logo size="lg" showText subtitle="Admin Portal" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                    'hover:bg-sidebar-accent',
                    isActive 
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg' 
                      : 'text-sidebar-foreground',
                    isCollapsed && 'justify-center'
                  )}
                  data-tour={item.id === 'settings' ? 'settings' : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border">
        {!isCollapsed && (
          <div className="mb-3">
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex-1">
                <p className="font-medium text-sidebar-foreground">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <button
                onClick={() => setEditProfileOpen(true)}
                className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
                title="Edit Profile"
              >
                <UserCircle className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-lg',
            'text-destructive hover:bg-destructive/10 transition-colors',
            isCollapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog open={editProfileOpen} onOpenChange={handleEditProfileChange} scrollToPayment={scrollToPayment} />
    </aside>
  );
}