import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNavigation from './MobileNavigation';
import { TooltipProvider } from '@/components/ui/tooltip';

const AppLayout = () => {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background flex w-full">
        {/* Sidebar - Desktop only */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 pb-24 lg:pb-8 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
        
        {/* Mobile Navigation */}
        <MobileNavigation />
      </div>
    </TooltipProvider>
  );
};

export default AppLayout;
