import axiosInstance from "./axiosConfig";

const BASE_URL = "/sidebar";

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
}

interface SidebarItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    order: number;
    roles: string[];
    sectionId: string;
}

interface SidebarSection {
    id: string;
    title: string;
    order: number;
    icon?: string;
    path?: string;
    roles?: string[];
    items: SidebarItem[];
}

export const getSidebar = async () => {
    const response = await axiosInstance.get<ApiResponse<SidebarSection[]>>(BASE_URL);
    return response.data;
};

export const upsertSection = async (data: Partial<SidebarSection>) => {
    const response = await axiosInstance.post<ApiResponse<SidebarSection>>(`${BASE_URL}/sections`, data);
    return response.data;
};

export const deleteSection = async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/sections/${id}`);
    return response.data;
};

export const reorderSections = async (sections: { id: string; order: number }[]) => {
    const response = await axiosInstance.post<ApiResponse<null>>(`${BASE_URL}/sections/reorder`, { sections });
    return response.data;
};

export const upsertItem = async (data: Partial<SidebarItem>) => {
    const response = await axiosInstance.post<ApiResponse<SidebarItem>>(`${BASE_URL}/items`, data);
    return response.data;
};

export const deleteItem = async (id: string) => {
    const response = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/items/${id}`);
    return response.data;
};
