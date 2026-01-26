
export interface SidebarItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    order: number;
    roles: string[];
    sectionId: string;
}

export interface SidebarSection {
    id: string;
    title: string;
    order: number;
    icon?: string;
    path?: string;
    roles?: string[];
    items: SidebarItem[];
}