import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  CreditCard, 
  Wrench, 
  MessageSquare, 
  Calendar,
  Settings,
  LogOut,
  UserCircle
} from 'lucide-react';
import { cn } from '../ui/utils';
import { useAuth } from '../../contexts/AuthContext';
import { EditProfileDialog } from '../landlord/EditProfileDialog';
import { Logo } from '../Logo';

interface TenantSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed?: boolean;
}

const menuItems = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'pay-rent', label: 'Pay Rent', icon: CreditCard },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'community', label: 'Community', icon: MessageSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function TenantSidebar({ activeTab, onTabChange, isCollapsed }: TenantSidebarProps) {
  const { logout, user } = useAuth();
  const [editProfileOpen, setEditProfileOpen] = React.useState(false);

  return (
    <aside 
      className={cn(
        'bg-sidebar border-r border-sidebar-border h-screen sticky top-0 flex flex-col transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        {isCollapsed ? (
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
        ) : (
          <Logo size="lg" showText subtitle="Tenant Portal" />
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
      <EditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
    </aside>
  );
}