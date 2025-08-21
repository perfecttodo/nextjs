import React from 'react';
import  TabNavigation  from './TabNavigation';

interface AudioTabsProps {
  tabs: TabConfig[];
  activeTab: string;
  onTabChange: (newTab: string) => void;
  isTransitioning: boolean;
}

const AudioTabs: React.FC<AudioTabsProps> = ({ tabs, activeTab, onTabChange, isTransitioning }) => (
  <TabNavigation
    tabs={tabs}
    activeTab={activeTab}
    onTabChange={onTabChange}
    isTransitioning={isTransitioning}
  />
);

export default AudioTabs;