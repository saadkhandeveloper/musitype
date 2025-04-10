
import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import { Music, X, Clock } from 'lucide-react';
import { RecentMusic } from '@/hooks/use-recent-music';

interface RecentMusicSidebarProps {
  recentMusic: RecentMusic[];
  onMusicSelect: (videoId: string) => void;
  onMusicRemove: (videoId: string) => void;
}

const RecentMusicSidebar: React.FC<RecentMusicSidebarProps> = ({
  recentMusic,
  onMusicSelect,
  onMusicRemove,
}) => {
  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-musitype-primary" />
            <span className="font-medium">Recent Music</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>History</SidebarGroupLabel>
          <SidebarMenu>
            {recentMusic.length > 0 ? (
              recentMusic.map((item) => (
                <SidebarMenuItem key={item.videoId}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={() => onMusicSelect(item.videoId)}
                  >
                    <Music className="text-musitype-primary" size={16} />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    onClick={(e) => {
                      e.stopPropagation();
                      onMusicRemove(item.videoId);
                    }}
                    showOnHover
                  >
                    <X size={14} />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-musitype-gray">
                No recent music
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default RecentMusicSidebar;
