import React, { useState } from 'react';
import{useEffect}from 'react';
import{supabase}from '../../lib/supabase';
import { TenantSidebar } from './TenantSidebar';
import { TenantOverview } from './TenantOverview';
import { PayRentView } from './PayRentView';
import { MaintenanceRequestView } from './MaintenanceRequestView';
import { TenantCommunityView } from './CommunityView';
import { CalendarView } from './CalendarView';
import { TenantSettingsView } from './TenantSettingsView';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X } from 'lucide-react';

export function TenantDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();
  const [tenantData,setTenantData]=useState<any>(null);
  useEffect(() => {
    if(user?.id){
    fetchTenantData();}
  }, [user]);
  useEffect(() => {
  const channel = supabase
    .channel('payments-realtime')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT / UPDATE / DELETE
        schema: 'public',
        table: 'payments'
      },
      (payload) => {
        console.log('Payment changed:', payload);

        // 🔥 Refresh tenant data or trigger UI update
        fetchTenantData();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

  // ✅ ADD THIS FUNCTION RIGHT HERE
  const fetchTenantData = async () => {
    if (!user?.id) return ;
    const { data, error } = await supabase
      .from('users')
      .select(`
  id,
  name,
  email,
  property_id,
  unit_id,
  properties:property_id ( id, name,landlord_id ),
  units:unit_id ( id, unit_number ,rent)
`)
      .eq('id', user.id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    console.log("TENANT DATA:", data);
    
    const formattedData = {
  id: data.id,
  name: data.name,
  email: data.email,

  propertyId: data.property_id,
  propertyName: data.properties?.name|| 'My Property',
landlordId:data.properties?.landlord_id,
  unitId: data.unit_id,
  landlordName:data.properties?.name,
  unitNumber: data.units?.unit_number|| '',
  rent:data.units?.rent||0
};

console.log("FORMATTED TENANT:", formattedData);

setTenantData(formattedData);
  };

if(!tenantData){
  return<div>Loading...</div>;
}
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
  <TenantOverview 
    tenantData={tenantData}
    onPayRent={() => setActiveTab('pay-rent')} 
  />
);
      case 'pay-rent':
        return <PayRentView />;
      case 'maintenance':
        return <MaintenanceRequestView />;
      case 'community':
        return <TenantCommunityView tenantData={tenantData}/>;
      case 'calendar':
        return <CalendarView />;
      case 'settings':
        return <TenantSettingsView />;
      default:
        return (
  <TenantOverview 
    tenantData={tenantData}
    onPayRent={() => setActiveTab('pay-rent')} 
  />
);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <TenantSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
      </div>

      {/* Sidebar - Mobile */}
      <div className={`
        fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 lg:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <TenantSidebar 
          activeTab={activeTab} 
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            PropTrack
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}