import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
    getWorkshopById,
    getWorkshopEnrollments,
    approveEnrollment,
    denyEnrollment,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,

    uploadWorkshopImage
} from "../../api/workshopApi";
import { deleteVideo, moveVideoToSection } from "../../api/videoApi";
import type { Workshop, WorkshopEnrollment, WorkshopSection } from "../../Types/Workshop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Video as VideoIcon, Users, Trash, Plus, Pencil, ArrowUp, ArrowDown, ChevronDown, ListVideo, ImagePlus, Settings, Loader2, PlayCircle, Layers } from "lucide-react";
import VideoForm from "../../components/Video/VideoForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const WorkshopManagementPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [enrollments, setEnrollments] = useState<WorkshopEnrollment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [removeDialog, setRemoveDialog] = useState<{ open: boolean; videoId: string | null }>({
        open: false,
        videoId: null
    });

    const [sectionDialog, setSectionDialog] = useState<{ open: boolean; section: Partial<WorkshopSection> | null }>({
        open: false,
        section: null
    });
    const [sectionTitle, setSectionTitle] = useState("");

    // Polling state
    const [pendingUploads, setPendingUploads] = useState(0);
    const [lastVideoCount, setLastVideoCount] = useState(0);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    // Image upload state
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            const [workshopRes, enrollmentsRes] = await Promise.all([
                getWorkshopById(id!),
                getWorkshopEnrollments(id!)
            ]);
            setWorkshop(workshopRes.data);
            setEnrollments(enrollmentsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load workshop data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (enrollmentId: string) => {
        try {
            await approveEnrollment(enrollmentId);
            toast.success("Enrollment approved");
            fetchData(); // Refresh list
        } catch (error) {
            toast.error("Failed to approve enrollment");
        }
    };

    const handleDeny = async (enrollmentId: string) => {
        try {
            await denyEnrollment(enrollmentId);
            toast.success("Enrollment denied");
            fetchData(); // Refresh list
        } catch (error) {
            toast.error("Failed to deny enrollment");
        }
    };

    const handleVideoPosted = () => {
        setPendingUploads(prev => prev + 1);
        setLastVideoCount((workshop?.videos?.length || 0) + (workshop?.sections?.reduce((acc, s) => acc + (s.videos?.length || 0), 0) || 0));
        toast.info("Video upload started. Processing in background...");
    };

    // Poll for new videos when there are pending uploads
    useEffect(() => {
        if (pendingUploads > 0) {
            if (!pollInterval.current) {
                pollInterval.current = setInterval(async () => {
                    if (!id) return;

                    try {
                        const workshopRes = await getWorkshopById(id);
                        const currentVideosCount = (workshopRes.data.videos?.length || 0) + (workshopRes.data.sections?.reduce((acc: number, s: any) => acc + (s.videos?.length || 0), 0) || 0);

                        if (currentVideosCount > lastVideoCount) {
                            // Video appeared!
                            setWorkshop(workshopRes.data);
                            setLastVideoCount(currentVideosCount);
                            setPendingUploads(prev => Math.max(0, prev - 1));
                            toast.success("Video processed and ready!");
                        }
                    } catch (error) {
                        console.error("Polling error", error);
                    }
                }, 3000); // Poll every 3 seconds
            }
        } else {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
                pollInterval.current = null;
            }
        }

        return () => {
            if (pollInterval.current) {
                clearInterval(pollInterval.current);
                pollInterval.current = null;
            }
        };
    }, [pendingUploads, lastVideoCount, id]);

    const handleDeleteVideo = async (videoId: string) => {
        try {
            const result = await deleteVideo(videoId);
            if (result.success) {
                toast.success("Video deleted successfully");
                fetchData(); // Refresh list
            } else {
                toast.error(result.message || "Failed to delete video");
            }
        } catch (error) {
            toast.error("Failed to delete video");
        }
    };

    const handleSaveSection = async () => {
        if (!sectionTitle.trim()) return;

        try {
            if (sectionDialog.section?.id) {
                await updateSection(sectionDialog.section.id, { title: sectionTitle });
                toast.success("Section updated");
            } else {
                await createSection(id!, { title: sectionTitle });
                toast.success("Section created");
            }
            setSectionDialog({ open: false, section: null });
            setSectionTitle("");
            fetchData();
        } catch (error) {
            toast.error("Failed to save section");
        }
    };

    const handleDeleteSection = async (sectionId: string) => {
        try {
            await deleteSection(sectionId);
            toast.success("Section deleted");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete section");
        }
    };

    const handleReorderSection = async (sectionId: string, direction: 'up' | 'down') => {
        if (!workshop?.sections) return;

        const sections = [...workshop.sections];
        const index = sections.findIndex(s => s.id === sectionId);
        if (index === -1) return;

        if (direction === 'up' && index > 0) {
            [sections[index - 1], sections[index]] = [sections[index], sections[index - 1]];
        } else if (direction === 'down' && index < sections.length - 1) {
            [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
        } else {
            return;
        }

        try {
            await reorderSections(id!, sections.map(s => s.id));
            setWorkshop({ ...workshop, sections }); // Optimistic update
            toast.success("Order updated");
        } catch (error) {
            toast.error("Failed to reorder sections");
            fetchData(); // Revert
        }
    };

    const handleMoveVideo = async (videoId: string, sectionId: string | null) => {
        try {
            const result = await moveVideoToSection(videoId, sectionId);
            if (result.success) {
                toast.success("Video moved");
                fetchData();
            } else {
                toast.error(result.message || "Failed to move video");
            }
        } catch (error) {
            toast.error("Failed to move video");
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;

        // Validate file type
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            toast.error("Only JPEG, PNG, and WebP images are allowed");
            return;
        }
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size must be less than 5MB");
            return;
        }

        setIsUploadingImage(true);
        try {
            const response = await uploadWorkshopImage(id, file);
            setWorkshop(response.data);
            toast.success("Cover image updated!");
        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Failed to upload image");
        } finally {
            setIsUploadingImage(false);
            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    if (!workshop) {
        return <div className="p-8 text-center">Workshop not found</div>;
    }

    const allWorkshopVideos = [
        ...(workshop.videos || []),
        ...(workshop.sections?.flatMap(s => s.videos || []) || [])
    ];

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
            <Button variant="ghost" onClick={() => navigate(`/workshops/${id}`)} className="pl-0 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Workshop
            </Button>

            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{workshop.title}</h1>
                    <p className="text-muted-foreground font-medium">Management Dashboard</p>
                </div>
            </div>

            <Tabs defaultValue="content" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 dark:border dark:border-white/5 shadow-inner rounded-xl">
                    <TabsTrigger value="content" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all rounded-lg font-bold">Content & Videos</TabsTrigger>
                    <TabsTrigger value="sections" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all rounded-lg font-bold">Sections</TabsTrigger>
                    <TabsTrigger value="enrollments" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all rounded-lg font-bold">Enrollments</TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all rounded-lg font-bold">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="settings">
                    <Card className="bg-card border-border shadow-sm dark:shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground font-bold">
                                <Settings className="w-5 h-5 text-indigo-500" />
                                Workshop Settings
                            </CardTitle>
                            <CardDescription className="text-muted-foreground font-medium">
                                Customize your workshop appearance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Cover Image Section */}
                            <div className="space-y-3">
                                <Label className="text-sm font-bold text-foreground">Cover Image</Label>
                                <div className="flex flex-col md:flex-row gap-6 items-start">
                                    <div className="relative w-full md:w-64 aspect-video rounded-2xl overflow-hidden border border-border bg-muted/30 shadow-inner group">
                                        {workshop.imageUrl ? (
                                            <>
                                                <img
                                                    src={`http://localhost:5000${workshop.imageUrl}`}
                                                    alt={workshop.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent flex flex-col items-center justify-center text-center p-4">
                                                <ImagePlus className="w-8 h-8 text-muted-foreground opacity-20 mb-2" />
                                                <p className="text-xs text-muted-foreground font-medium">No cover image set</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-bold text-foreground">Update Cover</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Recommended size: 1280x720px. Supported formats: JPEG, PNG, or WebP. Max size: 5MB.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => imageInputRef.current?.click()}
                                            disabled={isUploadingImage}
                                            variant="outline"
                                            className="bg-muted/50 hover:bg-muted text-foreground font-bold rounded-xl h-11 px-6 border-border/50"
                                        >
                                            {isUploadingImage ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <ImagePlus className="mr-2 h-4 w-4 text-indigo-500" />
                                                    {workshop.imageUrl ? "Change Cover Image" : "Upload Cover Image"}
                                                </>
                                            )}
                                        </Button>
                                        <input
                                            ref={imageInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="enrollments">
                    <Card className="bg-card border-border shadow-sm dark:shadow-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-foreground font-bold">
                                <Users className="w-5 h-5 text-indigo-500" />
                                Enrollment Requests
                            </CardTitle>
                            <CardDescription className="text-muted-foreground font-medium">
                                Manage user enrollments for this workshop.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {enrollments.length === 0 ? (
                                <div className="text-center py-16 bg-muted/20 rounded-2xl border-dashed border-2 border-border/50">
                                    <Users className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
                                    <p className="text-muted-foreground font-bold italic">No enrollment requests yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {enrollments.map((enrollment) => (
                                        <div key={enrollment.id} className="flex items-center justify-between p-4 bg-muted/30 dark:bg-muted/10 border border-border/50 rounded-2xl transition-all hover:border-indigo-500/30">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                                    {enrollment.user?.first_name?.charAt(0)}{enrollment.user?.last_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">
                                                        {enrollment.user?.first_name} {enrollment.user?.last_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground font-medium">{enrollment.user?.email}</p>
                                                    <p className="text-[10px] text-muted-foreground/60 mt-1 font-bold uppercase tracking-wider">
                                                        Requested: {new Date(enrollment.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {enrollment.status === "PENDING" ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="rounded-xl h-9 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 font-bold"
                                                            onClick={() => handleApprove(enrollment.id)}
                                                        >
                                                            <Check className="w-4 h-4 mr-1.5" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="rounded-xl h-9 border-rose-500/20 text-rose-600 hover:bg-rose-500/10 font-bold"
                                                            onClick={() => handleDeny(enrollment.id)}
                                                        >
                                                            <X className="w-4 h-4 mr-1.5" />
                                                            Deny
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Badge className={cn(
                                                        "rounded-lg px-2.5 py-0.5 font-bold text-[11px] uppercase tracking-wider border",
                                                        enrollment.status === "APPROVED"
                                                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                            : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                                    )}>
                                                        {enrollment.status}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="sections">
                    <div className="grid gap-6">
                        <Card className="bg-card border-border shadow-sm dark:shadow-none">
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="text-foreground font-bold">Workshop Sections</CardTitle>
                                    <CardDescription className="text-muted-foreground font-medium">Organize your videos into groups.</CardDescription>
                                </div>
                                <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-6 font-bold shadow-lg shadow-indigo-500/20"
                                    onClick={() => {
                                        setSectionTitle("");
                                        setSectionDialog({ open: true, section: null });
                                    }}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Section
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {!workshop.sections || workshop.sections.length === 0 ? (
                                    <div className="text-center py-16 bg-muted/20 rounded-2xl border-dashed border-2 border-border/50">
                                        <Layers className="w-16 h-16 mx-auto text-muted-foreground opacity-20 mb-4" />
                                        <p className="text-muted-foreground font-bold italic">No sections created yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {workshop.sections.map((section, index) => (
                                            <div key={section.id} className="flex items-center justify-between p-5 bg-muted/30 dark:bg-muted/10 border border-border/50 rounded-2xl transition-all hover:border-indigo-500/30 group">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-7 h-7 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-600 disabled:opacity-30"
                                                            disabled={index === 0}
                                                            onClick={() => handleReorderSection(section.id, 'up')}
                                                        >
                                                            <ArrowUp className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-7 h-7 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-600 disabled:opacity-30"
                                                            disabled={index === (workshop.sections?.length || 0) - 1}
                                                            onClick={() => handleReorderSection(section.id, 'down')}
                                                        >
                                                            <ArrowDown className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-foreground group-hover:text-indigo-500 transition-colors uppercase text-sm tracking-wide">{section.title}</h3>
                                                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                                                            <VideoIcon className="w-3 h-3" />
                                                            {section.videos?.length || 0} videos
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl hover:bg-background" onClick={() => {
                                                        setSectionTitle(section.title);
                                                        setSectionDialog({ open: true, section });
                                                    }}>
                                                        <Pencil className="w-4 h-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600" onClick={() => handleDeleteSection(section.id)}>
                                                        <Trash className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="content">
                    <div className="grid gap-6">
                        <Card className="bg-card border-border shadow-sm dark:shadow-none overflow-hidden relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                            <CardHeader className="relative">
                                <CardTitle className="flex items-center gap-2 text-foreground font-bold">
                                    <VideoIcon className="w-5 h-5 text-indigo-500" />
                                    Add New Video
                                </CardTitle>
                                <CardDescription className="text-muted-foreground font-medium">
                                    Upload a video. You can assign it to a section after upload.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="relative">
                                <VideoForm
                                    onVideoPosted={handleVideoPosted}
                                    workshopId={id || ""}
                                    isProcessing={pendingUploads > 0}
                                    sections={workshop.sections}
                                />
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border shadow-sm dark:shadow-none">
                            <CardHeader>
                                <CardTitle className="text-foreground font-bold">Your Videos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {allWorkshopVideos.length > 0 ? (
                                    <div className="space-y-4">
                                        {allWorkshopVideos.map((video) => {
                                            const currentSection = workshop.sections?.find(s => s.id === video.sectionId);
                                            return (
                                                <div key={video.id} className="p-4 bg-muted/30 dark:bg-muted/10 border border-border/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group transition-all hover:border-indigo-500/30">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="font-bold text-foreground group-hover:text-indigo-500 transition-colors">{video.title}</span>
                                                        <div className="flex items-center gap-2">
                                                            {currentSection ? (
                                                                <Badge variant="outline" className="bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 flex items-center gap-1.5 px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-wider">
                                                                    <ListVideo className="w-3 h-3" />
                                                                    {currentSection.title}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border/50 flex items-center gap-1 px-2.5 py-0.5 font-bold text-[10px] uppercase tracking-wider italic">
                                                                    Not Assigned
                                                                </Badge>
                                                            )}
                                                            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">#{video.id.slice(-4)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-9 px-4 rounded-xl border-border/50 bg-background/50 text-foreground font-bold group-hover:border-indigo-500/20">
                                                                    Move to <ChevronDown className="ml-2 w-3.5 h-3.5 opacity-50" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-56 dark:border-white/10 dark:bg-card rounded-xl shadow-xl">
                                                                <DropdownMenuLabel className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Workshop Sections</DropdownMenuLabel>
                                                                <DropdownMenuSeparator className="dark:bg-white/5" />
                                                                <DropdownMenuItem onClick={() => handleMoveVideo(video.id, null)} className={cn("rounded-lg m-1 font-medium", !video.sectionId ? "bg-indigo-600 text-white" : "hover:bg-muted")}>
                                                                    None (Main list)
                                                                </DropdownMenuItem>
                                                                {workshop.sections?.map(section => (
                                                                    <DropdownMenuItem
                                                                        key={section.id}
                                                                        onClick={() => handleMoveVideo(video.id, section.id)}
                                                                        className={cn("rounded-lg m-1 font-medium", video.sectionId === section.id ? "bg-indigo-600 text-white" : "hover:bg-muted")}
                                                                    >
                                                                        {section.title}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>

                                                        {/* <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl text-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-600"
                                                            onClick={() => window.open(video.url, '_blank')}
                                                        >
                                                            <PlayCircle className="w-5 h-5" />
                                                        </Button> */}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                                                            onClick={() => setRemoveDialog({ open: true, videoId: video.id })}
                                                        >
                                                            <Trash className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-muted/20 rounded-2xl border-dashed border-2 border-border/50">
                                        <VideoIcon className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                                        <p className="text-muted-foreground font-bold italic">No videos added yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={sectionDialog.open} onOpenChange={(open) => setSectionDialog({ open, section: open ? sectionDialog.section : null })}>
                <DialogContent className="dark:bg-card dark:border-white/10 rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-foreground font-bold">{sectionDialog.section ? "Edit Section" : "Add New Section"}</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">
                            Enter a title for your workshop section.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title" className="text-sm font-bold text-foreground">Section Title</Label>
                            <Input
                                id="title"
                                value={sectionTitle}
                                onChange={(e) => setSectionTitle(e.target.value)}
                                placeholder="e.g. Introduction, Advanced Techniques..."
                                className="h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-all"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" className="rounded-xl font-bold h-11" onClick={() => setSectionDialog({ open: false, section: null })}>Cancel</Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-indigo-500/20" onClick={handleSaveSection} disabled={!sectionTitle.trim()}>
                            {sectionDialog.section ? "Update Section" : "Create Section"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={removeDialog.open} onOpenChange={(open) => setRemoveDialog({ open, videoId: null })}>
                <AlertDialogContent className="dark:bg-card dark:border-white/10 rounded-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground font-bold">Remove Video?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground font-medium">
                            Are you sure you want to remove this video? You can add it again later if you change your mind.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0 ">
                        <AlertDialogCancel className="rounded-xl font-bold h-11 bg-muted border-border text-foreground hover:bg-muted/80">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-11 px-8  font-bold shadow-lg shadow-rose-500/20"
                            onClick={() => removeDialog.videoId && handleDeleteVideo(removeDialog.videoId)}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default WorkshopManagementPage;
