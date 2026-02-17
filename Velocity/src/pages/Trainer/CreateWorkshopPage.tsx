import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { createWorkshop, uploadWorkshopImage } from "../../api/workshopApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useUserStore } from "../../stores/userStore";
import { Navigate } from "react-router";
import { ImagePlus, X, Loader2 } from "lucide-react";

const CreateWorkshopPage = () => {
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check if user is a trainer
    if (!user || (user.role !== "TRAINER")) {
        return <Navigate to="/course/all" />;
    }

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
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
            setSelectedImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.description) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);

        try {
            const workshopData = {
                title: formData.title,
                description: formData.description,
            };

            const response = await createWorkshop(workshopData);

            // If image is selected, upload it
            if (selectedImage && response.data.id) {
                try {
                    await uploadWorkshopImage(response.data.id, selectedImage);
                } catch (imageError) {
                    toast.warning("Course created but image upload failed");
                }
            }

            toast.success("Course created successfully!");
            navigate(`/course/${response.data.id}`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create course");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="container mx-auto p-6 max-w-3xl space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Course</h1>
                <p className="text-muted-foreground">
                    Create a new course for your followers to enroll in and access your content.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Course Details</CardTitle>
                    <CardDescription>
                        Provide information about your course. Students can request to enroll and you can approve them.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g., Advanced HIIT Training"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Describe what students will learn in this course..."
                                value={formData.description}
                                onChange={handleChange}
                                rows={5}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Cover Image (optional)</Label>
                            {imagePreview ? (
                                <div className="relative rounded-lg overflow-hidden border border-border">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-48 object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-8 w-8"
                                        onClick={removeImage}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div
                                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-indigo-400/50 hover:bg-indigo-500/5 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-sm text-muted-foreground font-medium">
                                        Click to upload a cover image
                                    </p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        JPEG, PNG, or WebP (max 5MB)
                                    </p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Course"
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/")}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateWorkshopPage;
