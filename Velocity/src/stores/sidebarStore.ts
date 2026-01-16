import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getSidebar, upsertSection, deleteSection, upsertItem, deleteItem, reorderSections } from "../api/sidebarApi";
import { toast } from "sonner";

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

interface SidebarState {
    sections: SidebarSection[];
    isLoading: boolean;
    error: string | null;

    setSections: (sections: SidebarSection[]) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    fetchSidebar: () => Promise<void>;
    addSection: (section: Partial<SidebarSection>) => Promise<void>;
    updateSection: (id: string, section: Partial<SidebarSection>) => Promise<void>;
    removeSection: (id: string) => Promise<void>;
    addItem: (item: Partial<SidebarItem>) => Promise<void>;
    updateItem: (itemId: string, item: Partial<SidebarItem>) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    reorderAllSections: (sections: { id: string, order: number }[]) => Promise<void>;
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set, get) => ({
            // Initial state
            sections: [],
            isLoading: false,
            error: null,

            // Actions
            setSections: (sections) =>
                set({ sections, isLoading: false, error: null }),

            setIsLoading: (isLoading) => set({ isLoading }),

            setError: (error) => set({ error }),

            fetchSidebar: async () => {
                set({ isLoading: true, error: null });
                try {
                    const response = await getSidebar();
                    set({ sections: response.data, isLoading: false, error: null });
                } catch (error: any) {
                    set({
                        isLoading: false,
                        error: error.message || "Failed to fetch sidebar"
                    });
                }
            },

            addSection: async (section) => {
                try {
                    await upsertSection(section);
                    await get().fetchSidebar();
                    toast.success("Section added");
                } catch (error) {
                    set({ error: "Failed to add section" });
                    toast.error("Failed to add section");
                }
            },

            updateSection: async (id, section) => {
                try {
                    await upsertSection({ ...section, id });
                    await get().fetchSidebar();
                    toast.success("Section updated");
                } catch (error) {
                    set({ error: "Failed to update section" });
                    toast.error("Failed to update section");
                }
            },

            removeSection: async (id) => {
                try {
                    await deleteSection(id);
                    set((state) => ({
                        sections: state.sections.filter((s) => s.id !== id),
                        error: null,
                    }));
                    toast.success("Section removed");
                } catch (error) {
                    set({ error: "Failed to remove section" });
                    toast.error("Failed to remove section");
                }
            },

            addItem: async (item) => {
                try {
                    await upsertItem(item);
                    await get().fetchSidebar();
                    toast.success("Item added");
                } catch (error) {
                    set({ error: "Failed to add item" });
                    toast.error("Failed to add item");
                }
            },

            updateItem: async (id, item) => {
                try {
                    await upsertItem({ ...item, id });
                    await get().fetchSidebar();
                    toast.success("Item updated");
                } catch (error) {
                    set({ error: "Failed to update item" });
                    toast.error("Failed to update item");
                }
            },

            removeItem: async (id) => {
                try {
                    await deleteItem(id);
                    await get().fetchSidebar();
                    toast.success("Item removed");
                } catch (error) {
                    set({ error: "Failed to remove item" });
                    toast.error("Failed to remove item");
                }
            },

            reorderAllSections: async (sectionsData) => {
                try {
                    // Optimistic update
                    set((state) => {
                        const newSections = [...state.sections];
                        sectionsData.forEach(ud => {
                            const idx = newSections.findIndex(s => s.id === ud.id);
                            if (idx !== -1) newSections[idx].order = ud.order;
                        });
                        newSections.sort((a, b) => a.order - b.order);
                        return { sections: newSections, error: null };
                    });

                    await reorderSections(sectionsData);
                } catch (error) {
                    set({ error: "Failed to reorder sections" });
                    toast.error("Failed to reorder sections");
                    await get().fetchSidebar();
                }
            }
        }),
        {
            name: "sidebar-storage",
        }
    )
);
