'use client';

interface TabConfig {
  id: string;
  label: string;
  description: string;
  icon: string;
  shortLabel: string;
}

interface TabNavigationProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (tabId: any) => void;
  isTransitioning: boolean;
}

export default function TabNavigation({ 
  tabs, 
  activeTab, 
  onTabChange, 
  isTransitioning 
}: TabNavigationProps) {
  return (<>
    <div className="border-b border-gray-200">
      <nav className="flex space-x-1 px-4 sm:px-6" aria-label="Audio creation tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            disabled={isTransitioning}
            className={`flex-1 sm:flex-none py-4 px-2 sm:px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex flex-col items-center space-y-1 sm:space-y-0 sm:space-x-2">
              <span className="text-lg sm:text-xl">{tab.icon}</span>
              <div className="text-center sm:text-left">
                <div className="font-medium text-xs sm:text-sm">
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </nav>
    </div>
           <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-md">
           <div className="flex items-center space-x-2">
             <span className="text-lg">{tabs.find(t => t.id === activeTab)?.icon}</span>
             <div>
               <div className="font-medium text-blue-900">
                 {tabs.find(t => t.id === activeTab)?.label}
               </div>
               <div className="text-sm text-blue-700">
                 {tabs.find(t => t.id === activeTab)?.description}
               </div>
             </div>
           </div>
         </div>
         </>
  );
}