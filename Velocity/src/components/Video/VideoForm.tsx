import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
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

const videoSchema = z.object({
    title: z.string().min(1, "Title is required"),
    video: z
        .instanceof(FileList)
        .refine((files) => files.length > 0, "Video file is required")
        .refine((files) => files[0]?.size <= 100 * 1024 * 1024, "Max file size is 100MB") // 100MB limit
        .refine(
            (files) => ["video/mp4", "video/quicktime", "video/webm"].includes(files[0]?.type),
            "Only .mp4, .mov, and .webm formats are supported"
        ),
});

type VideoFormValues = z.infer<typeof videoSchema>;

interface VideoFormProps {
    onVideoPosted: () => void;
    workshopId?: string;
}

const VideoForm = ({ onVideoPosted, workshopId }: VideoFormProps) => {
    const form = useForm<VideoFormValues>({
        resolver: zodResolver(videoSchema),
        defaultValues: {
            title: "",
        },
    });

    const onSubmit = async (data: VideoFormValues) => {
        try {
            const formData = new FormData();
            formData.append("title", data.title);
            formData.append("video", data.video[0]);
            if (workshopId) {
                formData.append("workshopId", workshopId);
            }

            const result = await createVideo(formData);
            if (result.success) {
                toast.success("Video posted successfully");
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
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
