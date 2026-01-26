import { useState, useEffect } from "react";
import { useSidebarStore } from "@/stores/sidebarStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Edit, ArrowUp, ArrowDown, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { ICON_LIST, ICON_MAP, type IconName } from "@/lib/icons";



const IconPicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [search, setSearch] = useState("");
    const filteredIcons = ICON_LIST.filter(icon =>
        icon.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-3">

            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search icons..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                />
            </div>
            <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-1 border border-border rounded-md [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
                {filteredIcons.map((iconName) => {

                    const Icon = ICON_MAP[iconName as IconName] ?? ICON_MAP.Home;
                    return (
                        <Button
                            key={iconName}
                            type="button"
                            variant={value === iconName ? "default" : "outline"}
                            size="icon"
                            className={cn(
                                "h-10 w-10 p-0 transition-all",
                                value === iconName ? "bg-indigo-600 text-white" : "hover:border-indigo-400 hover:text-indigo-600"
                            )}
                            onClick={() => onChange(iconName)}
                            title={iconName}
                        >
                            {Icon && <Icon className="w-5 h-5" />}
                        </Button>
                    );
                })}
            </div>
            <div className="text-[10px] text-muted-foreground text-center uppercase tracking-wider">
                Selected: <span className="font-bold text-indigo-600 dark:text-indigo-400">{value || "None"}</span>
            </div>
        </div>
    );
};

const AVAILABLE_ROLES = ["USER", "TRAINER", "ADMIN"] as const;
type Role = typeof AVAILABLE_ROLES[number];

const RolePicker = ({ value, onChange }: { value: string[], onChange: (val: string[]) => void }) => {
    const toggleRole = (role: Role) => {
        if (value.includes(role)) {
            onChange(value.filter(r => r !== role));
        } else {
            onChange([...value, role]);
        }
    };

    return (
        <div className="flex flex-wrap gap-3">
            {AVAILABLE_ROLES.map((role) => (
                <label
                    key={role}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                        value.includes(role)
                            ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400"
                            : "bg-muted/30 border-border hover:border-indigo-400/50 text-muted-foreground"
                    )}
                >
                    <Checkbox
                        checked={value.includes(role)}
                        onCheckedChange={() => toggleRole(role)}
                        className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                    />
                    <span className="text-sm font-medium">{role}</span>
                </label>
            ))}
        </div>
    );
};

export const SidebarManagementPage = () => {
    const {
        sections,
        fetchSidebar,
        addSection,
        updateSection,
        removeSection,
        addItem,
        updateItem,
        removeItem,
        reorderAllSections,
        isLoading
    } = useSidebarStore();

    // State for Section Dialog
    const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<any>(null);
    const [sectionForm, setSectionForm] = useState({
        title: "",
        icon: "",
        path: "",
        roles: ["USER", "TRAINER", "ADMIN"] as string[]
    });

    // State for Item Dialog
    const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [itemForm, setItemForm] = useState({
        label: "",
        icon: "",
        path: "",
        roles: ["USER", "TRAINER", "ADMIN"] as string[],
        sectionId: ""
    });

    useEffect(() => {
        fetchSidebar();
    }, [fetchSidebar]);

    // Section Handlers
    const handleOpenSectionDialog = (section?: any) => {
        if (section) {
            setEditingSection(section);
            setSectionForm({
                title: section.title,
                icon: section.icon || "",
                path: section.path || "",
                roles: section.roles?.length ? section.roles : ["USER", "TRAINER", "ADMIN"]
            });
        } else {
            setEditingSection(null);
            setSectionForm({
                title: "",
                icon: "",
                path: "",
                roles: ["USER", "TRAINER", "ADMIN"]
            });
        }
        setIsSectionDialogOpen(true);
    };

    const handleSaveSection = async () => {
        const sectionData = {
            title: sectionForm.title,
            icon: sectionForm.icon || undefined,
            path: sectionForm.path || undefined,
            roles: sectionForm.roles
        };

        if (editingSection) {
            await updateSection(editingSection.id, sectionData);
        } else {
            await addSection(sectionData);
        }
        setIsSectionDialogOpen(false);
    };

    const handleMoveSection = async (index: number, direction: 'up' | 'down') => {
        const newSections = [...sections];
        if (direction === 'up' && index > 0) {
            [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
        } else if (direction === 'down' && index < newSections.length - 1) {
            [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
        } else {
            return;
        }

        const reorderData = newSections.map((s, idx) => ({ id: s.id, order: idx }));
        await reorderAllSections(reorderData);
    };

    // Item Handlers
    const handleOpenItemDialog = (sectionId: string, item?: any) => {
        if (item) {
            setEditingItem(item);
            setItemForm({
                label: item.label,
                icon: item.icon,
                path: item.path,
                roles: item.roles?.length ? item.roles : ["USER", "TRAINER", "ADMIN"],
                sectionId
            });
        } else {
            setEditingItem(null);
            setItemForm({
                label: "",
                icon: "FolderOpen",
                path: "",
                roles: ["USER", "TRAINER", "ADMIN"],
                sectionId
            });
        }
        setIsItemDialogOpen(true);
    };

    const handleSaveItem = async () => {
        const itemData = {
            label: itemForm.label,
            icon: itemForm.icon,
            path: itemForm.path,
            roles: itemForm.roles,
            sectionId: itemForm.sectionId
        };

        if (editingItem) {
            await updateItem(editingItem.id, itemData);
        } else {
            await addItem(itemData);
        }
        setIsItemDialogOpen(false);
    };

    const handleMoveItem = async (sectionId: string, itemIdx: number, direction: 'up' | 'down') => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;

        const newItems = [...section.items];
        if (direction === 'up' && itemIdx > 0) {
            [newItems[itemIdx], newItems[itemIdx - 1]] = [newItems[itemIdx - 1], newItems[itemIdx]];
        } else if (direction === 'down' && itemIdx < newItems.length - 1) {
            [newItems[itemIdx], newItems[itemIdx + 1]] = [newItems[itemIdx + 1], newItems[itemIdx]];
        } else {
            return;
        }

        // Update items one by one
        for (let i = 0; i < newItems.length; i++) {
            if (newItems[i].order !== i) {
                await updateItem(newItems[i].id, { order: i });
            }
        }
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading sidebar configuration...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Sidebar Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">Configure navigation structure, roles, and ordering.</p>
                </div>
                <Button onClick={() => handleOpenSectionDialog()} size="lg" className="bg-indigo-600 hover:bg-indigo-700 shadow-sm text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Section
                </Button>
            </div>

            <div className="space-y-6">
                {sections.map((section, sectionIdx) => (
                    <Card key={section.id} className="relative group border-border overflow-hidden hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3 flex flex-row items-center justify-between bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-indigo-600"
                                        disabled={sectionIdx === 0}
                                        onClick={() => handleMoveSection(sectionIdx, 'up')}
                                    >
                                        <ArrowUp className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-gray-400 hover:text-indigo-600"
                                        disabled={sectionIdx === sections.length - 1}
                                        onClick={() => handleMoveSection(sectionIdx, 'down')}
                                    >
                                        <ArrowDown className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex flex-col">
                                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                                        {section.title || <span className="text-muted-foreground italic font-normal">Untitled Section</span>}
                                        {section.path && <Badge variant="secondary" className="text-[10px] py-0">{section.path}</Badge>}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 mt-1">
                                        {section.icon && <span className="text-xs text-muted-foreground flex items-center gap-1"><Edit className="w-3 h-3" /> {section.icon}</span>}
                                        {section.roles && section.roles.length > 0 && (
                                            <span className="text-[10px] text-muted-foreground/80 flex items-center gap-1 uppercase tracking-tighter">
                                                <Shield className="w-3 h-3" /> {section.roles.join(", ")}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 transition-opacity">
                                <Button variant="outline" size="sm" onClick={() => handleOpenSectionDialog(section)} className="h-8">
                                    <Edit className="w-4 h-4 mr-1" /> Edit
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => removeSection(section.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="space-y-2">
                                {section.items.map((item, itemIdx) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-border group/item hover:border-indigo-400/50 transition-all shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col gap-0.5">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 text-muted-foreground/40 hover:text-indigo-600"
                                                    disabled={itemIdx === 0}
                                                    onClick={() => handleMoveItem(section.id, itemIdx, 'up')}
                                                >
                                                    <ArrowUp className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 text-muted-foreground/40 hover:text-indigo-600"
                                                    disabled={itemIdx === section.items.length - 1}
                                                    onClick={() => handleMoveItem(section.id, itemIdx, 'down')}
                                                >
                                                    <ArrowDown className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">{item.label}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{item.path}</span>
                                            </div>
                                            <div className="flex gap-1 ml-2">
                                                <Badge variant="outline" className="text-[10px] font-medium bg-muted uppercase text-muted-foreground px-1.5 h-4">
                                                    {item.icon}
                                                </Badge>
                                                {item.roles.map(role => (
                                                    <Badge key={role} className="text-[10px] h-4 px-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20">
                                                        {role}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" onClick={() => handleOpenItemDialog(section.id, item)} className="h-7 w-7 p-0">
                                                <Edit className="w-3.5 h-3.5 text-gray-500" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="h-7 w-7 p-0 hover:bg-red-50">
                                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    className="w-full mt-4 border-dashed border-border text-muted-foreground hover:text-indigo-600 hover:border-indigo-400/50 hover:bg-indigo-500/5 font-medium h-10 transition-all"
                                    onClick={() => handleOpenItemDialog(section.id)}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Item to {section.title}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Section Dialog */}
            <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingSection ? "Edit Section" : "New Section"}</DialogTitle>
                        <DialogDescription>
                            {editingSection ? "Update the details of this sidebar section." : "Create a new section for the sidebar navigation."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={sectionForm.title} onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })} placeholder="e.g., Main Menu" />
                            </div>
                            <div className="space-y-2">
                                <Label>Icon</Label>
                                <IconPicker
                                    value={sectionForm.icon}
                                    onChange={(val) => setSectionForm({ ...sectionForm, icon: val })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Header Link Path (Optional)</Label>
                            <Input value={sectionForm.path} onChange={(e) => setSectionForm({ ...sectionForm, path: e.target.value })} placeholder="e.g., /dashboard" />
                        </div>
                        <div className="space-y-2">
                            <Label>Visible to Roles</Label>
                            <RolePicker
                                value={sectionForm.roles}
                                onChange={(roles) => setSectionForm({ ...sectionForm, roles })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSectionDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSection} className="bg-indigo-600 hover:bg-indigo-700">Save Section</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Item Dialog */}
            <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Item" : "New Item"}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? "Update the details of this sidebar item." : "Add a new item to this sidebar section."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Label</Label>
                                <Input value={itemForm.label} onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })} placeholder="e.g., Dashboard" />
                            </div>
                            <div className="space-y-2">
                                <Label>Icon</Label>
                                <IconPicker
                                    value={itemForm.icon}
                                    onChange={(val) => setItemForm({ ...itemForm, icon: val })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Path</Label>
                            <Input value={itemForm.path} onChange={(e) => setItemForm({ ...itemForm, path: e.target.value })} placeholder="e.g., /dashboard" />
                        </div>
                        <div className="space-y-2">
                            <Label>Visible to Roles</Label>
                            <RolePicker
                                value={itemForm.roles}
                                onChange={(roles) => setItemForm({ ...itemForm, roles })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveItem} className="bg-indigo-600 hover:bg-indigo-700">Save Item</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
