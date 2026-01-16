import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, HardDrive, Youtube } from "lucide-react";
import { createVideo } from "../../api/videoApi";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WorkshopSection } from "../../Types/Workshop";

const videoSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    storageType: z.enum(["LOCAL", "YOUTUBE"]),
    sectionId: z.string().optional().nullable(),
    video: z
        .instanceof(FileList)
        .refine((files) => files.length > 0, "Video file is required")
        .refine((files) => files[0]?.size <= 1000 * 1024 * 1024, "Max file size is 1GB")
        .refine(
            (files) => ["video/mp4", "video/quicktime", "video/webm"].includes(files[0]?.type),
            "Only .mp4, .mov, and .webm formats are supported"
        ),
});

type VideoFormValues = z.infer<typeof videoSchema>;

interface VideoFormProps {
    onVideoPosted: () => void;
    workshopId: string;
    isProcessing?: boolean;
    sections?: WorkshopSection[];
}

const VideoForm = ({ onVideoPosted, workshopId, isProcessing = false, sections = [] }: VideoFormProps) => {
    const form = useForm<VideoFormValues>({
        resolver: zodResolver(videoSchema),
        defaultValues: {
            title: "",
            description: "",
            storageType: "LOCAL",
            sectionId: null,
        },
    });

    const onSubmit = async (data: VideoFormValues) => {
        try {
            const formData = new FormData();
            formData.append("title", data.title);
            if (data.description) {
                formData.append("description", data.description);
            }
            formData.append("video", data.video[0]);
            formData.append("storageType", data.storageType);
            if (workshopId) {
                formData.append("workshopId", workshopId);
            }
            if (data.sectionId) {
                formData.append("sectionId", data.sectionId);
            }

            const result = await createVideo(formData);
            if (result.success) {
                const destination = data.storageType === "YOUTUBE" ? "YouTube" : "local storage";
                toast.success(`Video uploading to ${destination}...`);
                form.reset();
                onVideoPosted();
            } else {
                toast.error(result.message || "Failed to post video");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        }
    };

    return (
        <Form {...form}>
            {form.formState.isSubmitting && (
                <div className="absolute inset-0 bg-white/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm rounded-lg">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                    <p className="text-lg font-semibold text-gray-900">Uploading Video...</p>
                    <p className="text-sm text-gray-500">Please do not close this window.</p>
                </div>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Video Title</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Full Body Workout" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {sections.length > 0 && (
                        <FormField
                            control={form.control}
                            name="sectionId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Section (Optional)</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value || undefined}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a section" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">None (Main list)</SelectItem>
                                            {sections.map(section => (
                                                <SelectItem key={section.id} value={section.id}>
                                                    {section.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Add details about this video..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="storageType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Upload Destination</FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex gap-4"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="LOCAL" id="local" />
                                        <Label htmlFor="local" className="flex items-center gap-2 cursor-pointer">
                                            <HardDrive className="w-4 h-4" />
                                            Local Storage
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="YOUTUBE" id="youtube" />
                                        <Label htmlFor="youtube" className="flex items-center gap-2 cursor-pointer">
                                            <Youtube className="w-4 h-4 text-red-600" />
                                            YouTube
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="video"
                    render={({ field: { onChange, onBlur, name, ref } }) => (
                        <FormItem>
                            <FormLabel>Video File</FormLabel>
                            <FormControl>
                                <Input
                                    type="file"
                                    accept="video/mp4,video/quicktime,video/webm"
                                    onChange={(e) => {
                                        onChange(e.target.files);
                                    }}
                                    onBlur={onBlur}
                                    name={name}
                                    ref={ref}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={form.formState.isSubmitting || isProcessing}>
                    {form.formState.isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                        </>
                    ) : isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        "Post Video"
                    )}
                </Button>
            </form>
        </Form>
    );
};

export default VideoForm;

