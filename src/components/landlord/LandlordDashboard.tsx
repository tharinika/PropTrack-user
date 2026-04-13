import React, { useState } from 'react';
import { LandlordSidebar } from './LandlordSidebar';
import { OverviewDashboard } from './OverviewDashboard';
import { PropertiesView } from './PropertiesView';
import { TenantsView } from './TenantsView';
import { PaymentsView } from './PaymentsView';
import { MaintenanceView } from './MaintenanceView';
import { CommunityView } from './CommunityView';
import { SettingsView } from './SettingsView';
import { RentPredictionView } from './RentPredictionView';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Menu, X } from 'lucide-react';

export function LandlordDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewDashboard onNavigateToProperties={() => setActiveTab('properties')} />;
      case 'properties':
        return <PropertiesView />;
      case 'tenants':
        return <TenantsView />;
      case 'payments':
        return <PaymentsView />;
      case 'maintenance':
        return <MaintenanceView />;
      case 'community':
        return <CommunityView />;
      case 'rent-prediction':
        return <RentPredictionView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewDashboard onNavigateToProperties={() => setActiveTab('properties')} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Onboarding Tour - only for new landlords */}
      {!user?.isDemo && <OnboardingTour />}
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <LandlordSidebar 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
      </div>

      {/* Sidebar - Mobile */}
      <div className={`
        fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 lg:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <LandlordSidebar 
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