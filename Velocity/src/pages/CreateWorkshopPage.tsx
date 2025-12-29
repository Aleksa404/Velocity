import { useState } from "react";
import { useNavigate } from "react-router";
import { createWorkshop } from "../api/workshopApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useUserStore } from "../stores/userStore";
import { Navigate } from "react-router";

const CreateWorkshopPage = () => {
    const navigate = useNavigate();
    const user = useUserStore((state) => state.user);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
    });

    // Check if user is a trainer
    if (!user || (user.role !== "TRAINER" && user.role !== "ADMIN")) {
        return <Navigate to="/workshops" />;
    }

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
            toast.success("Workshop created successfully!");
            navigate(`/workshops/${response.data.id}`);
        } catch (error: any) {
            console.error("Error creating workshop:", error);
            toast.error(error.response?.data?.message || "Failed to create workshop");
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
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create Workshop</h1>
                <p className="text-muted-foreground">
                    Create a new workshop for your followers to enroll in and access your content.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Workshop Details</CardTitle>
                    <CardDescription>
                        Provide information about your workshop. Students can request to enroll and you can approve them.
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
                                placeholder="Describe what students will learn in this workshop..."
                                value={formData.description}
                                onChange={handleChange}
                                rows={5}
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                {isSubmitting ? "Creating..." : "Create Workshop"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/workshops")}
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
