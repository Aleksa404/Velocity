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
    moveVideoToSection,
    uploadWorkshopImage
} from "../../api/workshopApi";
import { deleteVideo } from "../../api/videoApi";
import type { Workshop, WorkshopEnrollment, WorkshopSection } from "../../Types/Workshop";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Video as VideoIcon, Users, Trash, Plus, Pencil, ArrowUp, ArrowDown, ChevronDown, ListVideo, ImagePlus, Settings, Loader2 } from "lucide-react";
import VideoForm from "../../components/Video/VideoForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
            await moveVideoToSection(videoId, sectionId);
            toast.success("Video moved");
            fetchData();
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
            <Button variant="ghost" onClick={() => navigate(`/workshops/${id}`)} className="pl-0">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Workshop
            </Button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">{workshop.title}</h1>
                    <p className="text-muted-foreground">Management Dashboard</p>
                </div>
            </div>

            <Tabs defaultValue="content" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="content">Content & Videos</TabsTrigger>
                    <TabsTrigger value="sections">Sections</TabsTrigger>
                    <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="w-5 h-5" />
                                Workshop Settings
                            </CardTitle>
                            <CardDescription>
                                Customize your workshop appearance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Cover Image Section */}
                            <div className="space-y-3">
                                <Label>Cover Image</Label>
                                <div className="flex gap-4 items-start">
                                    <div className="relative w-64 aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                        {workshop.imageUrl ? (
                                            <img
                                                src={`http://localhost:5000${workshop.imageUrl}`}
                                                alt={workshop.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-100 via-purple-50 to-orange-50 flex items-center justify-center">
                                                <p className="text-sm text-gray-500">No image</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Button
                                            onClick={() => imageInputRef.current?.click()}
                                            disabled={isUploadingImage}
                                            variant="outline"
                                        >
                                            {isUploadingImage ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <ImagePlus className="mr-2 h-4 w-4" />
                                                    {workshop.imageUrl ? "Change Image" : "Upload Image"}
                                                </>
                                            )}
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                            JPEG, PNG, or WebP (max 5MB)
                                        </p>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Enrollment Requests
                            </CardTitle>
                            <CardDescription>
                                Manage user enrollments for this workshop.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {enrollments.length === 0 ? (
                                <p className="text-muted-foreground text-center py-8">No enrollment requests yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {enrollments.map((enrollment) => (
                                        <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-medium">
                                                    {enrollment.user?.first_name} {enrollment.user?.last_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{enrollment.user?.email}</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Requested: {new Date(enrollment.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {enrollment.status === "PENDING" ? (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            onClick={() => handleApprove(enrollment.id)}
                                                        >
                                                            <Check className="w-4 h-4 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDeny(enrollment.id)}
                                                        >
                                                            <X className="w-4 h-4 mr-1" />
                                                            Deny
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Badge variant={enrollment.status === "APPROVED" ? "default" : "destructive"}>
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
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Workshop Sections</CardTitle>
                                    <CardDescription>Organize your videos into groups.</CardDescription>
                                </div>
                                <Button onClick={() => {
                                    setSectionTitle("");
                                    setSectionDialog({ open: true, section: null });
                                }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Section
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {!workshop.sections || workshop.sections.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No sections created yet.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {workshop.sections.map((section, index) => (
                                            <div key={section.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-6 h-6"
                                                            disabled={index === 0}
                                                            onClick={() => handleReorderSection(section.id, 'up')}
                                                        >
                                                            <ArrowUp className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="w-6 h-6"
                                                            disabled={index === (workshop.sections?.length || 0) - 1}
                                                            onClick={() => handleReorderSection(section.id, 'down')}
                                                        >
                                                            <ArrowDown className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold">{section.title}</h3>
                                                        <p className="text-xs text-muted-foreground">{section.videos?.length || 0} videos</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => {
                                                        setSectionTitle(section.title);
                                                        setSectionDialog({ open: true, section });
                                                    }}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteSection(section.id)}>
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
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <VideoIcon className="w-5 h-5" />
                                    Add New Video
                                </CardTitle>
                                <CardDescription>
                                    Upload a video. You can assign it to a section after upload.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <VideoForm
                                    onVideoPosted={handleVideoPosted}
                                    workshopId={id || ""}
                                    isProcessing={pendingUploads > 0}
                                    sections={workshop.sections}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Your Videos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {allWorkshopVideos.length > 0 ? (
                                    <div className="space-y-4">
                                        {allWorkshopVideos.map((video) => {
                                            const currentSection = workshop.sections?.find(s => s.id === video.sectionId);
                                            return (
                                                <div key={video.id} className="p-4 border rounded-lg flex justify-between items-center group bg-white hover:border-indigo-200 transition-colors">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{video.title}</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            {currentSection ? (
                                                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-1">
                                                                    <ListVideo className="w-3 h-3" />
                                                                    {currentSection.title}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground italic">No section</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-8">
                                                                    Move to <ChevronDown className="ml-1 w-3 h-3" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48">
                                                                <DropdownMenuLabel>Workshop Sections</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleMoveVideo(video.id, null)} className={!video.sectionId ? "bg-indigo-50 font-medium" : ""}>
                                                                    None (Main list)
                                                                </DropdownMenuItem>
                                                                {workshop.sections?.map(section => (
                                                                    <DropdownMenuItem
                                                                        key={section.id}
                                                                        onClick={() => handleMoveVideo(video.id, section.id)}
                                                                        className={video.sectionId === section.id ? "bg-indigo-50 font-medium" : ""}
                                                                    >
                                                                        {section.title}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>

                                                        <a
                                                            href={video.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-indigo-600 hover:underline px-2"
                                                        >
                                                            View
                                                        </a>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                    <p className="text-muted-foreground text-center py-4">No videos added yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={sectionDialog.open} onOpenChange={(open) => setSectionDialog({ open, section: open ? sectionDialog.section : null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{sectionDialog.section ? "Edit Section" : "Add New Section"}</DialogTitle>
                        <DialogDescription>
                            Enter a title for your workshop section.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Section Title</Label>
                            <Input
                                id="title"
                                value={sectionTitle}
                                onChange={(e) => setSectionTitle(e.target.value)}
                                placeholder="e.g. Introduction, Advanced Techniques..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSectionDialog({ open: false, section: null })}>Cancel</Button>
                        <Button onClick={handleSaveSection} disabled={!sectionTitle.trim()}>
                            {sectionDialog.section ? "Update Section" : "Create Section"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={removeDialog.open} onOpenChange={(open) => setRemoveDialog({ open, videoId: null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Video?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this video? You can add it again later if you change your mind.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-amber-50 hover:bg-destructive/90"
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
