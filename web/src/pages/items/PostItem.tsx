import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, MapPin, X } from "lucide-react";
import { apiClient } from "@/api/api_client";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { LocationProvider, useLocation } from "@/context/LocationProvider";
import { categories, conditions } from "@/constants/items";

const MAX_IMAGES = 3;
// The backend's spring.servlet.multipart.max-file-size
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

// Same rules as the mobile app's share-item form
const postItemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(50, "Max 50 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Please add a description")
    .max(400, "Max 400 characters"),
  category: z.string().min(1, "Please select a category"),
  condition: z.string().min(1, "Please select a condition"),
  tags: z.string().max(100, "Max 100 characters").optional(),
});

type PostItemValues = z.infer<typeof postItemSchema>;

function PostItemForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentLocation } = useLocation();
  const coords = currentLocation?.coords;
  const fileInput = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PostItemValues>({
    resolver: zodResolver(postItemSchema),
    defaultValues: { title: "", description: "", category: "", condition: "", tags: "" },
  });

  // Thumbnails, released when the selection changes or the page closes
  const previews = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const addImages = (fileList: FileList | null) => {
    if (!fileList) return;
    const picked = Array.from(fileList).filter((file) => file.type.startsWith("image/"));
    const tooBig = picked.filter((file) => file.size > MAX_IMAGE_BYTES);
    if (tooBig.length > 0) {
      toast({
        title: "Photo too large",
        description: `${tooBig[0].name} is over 10 MB.`,
        variant: "destructive",
      });
    }
    const accepted = picked.filter((file) => file.size <= MAX_IMAGE_BYTES);
    if (images.length + accepted.length > MAX_IMAGES) {
      toast({ title: `Up to ${MAX_IMAGES} photos`, description: "Extra photos were left out." });
    }
    setImages([...images, ...accepted].slice(0, MAX_IMAGES));
  };

  const onSubmit = async (values: PostItemValues) => {
    // Location is required: it is how people nearby find the item
    if (!coords) return;
    setSubmitting(true);
    const formData = new FormData();
    images.forEach((file) => formData.append("files", file));
    // The owner comes from the login token. Only fields the backend's ItemCreationDTO
    // knows may be sent: it parses this JSON strictly.
    formData.append(
      "metadata",
      JSON.stringify({
        title: values.title,
        description: values.description,
        category: values.category,
        condition: values.condition,
        tags: values.tags?.trim() || undefined,
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          address: "",
          city: "",
        },
      })
    );
    try {
      await apiClient.post("/items", formData);
      toast({ title: "Item posted", description: "It's now visible to people nearby." });
      navigate("/browse");
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)?.message
        : undefined;
      toast({
        title: "Couldn't post the item",
        description: message ?? "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-10 flex justify-center">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Post an item</CardTitle>
            <CardDescription>Give away something you no longer need.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Wooden chair" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="What is it, and what shape is it in?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid sm:grid-cols-2 gap-5">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {conditions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. wood, dining, kids" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Photos (up to {MAX_IMAGES})</p>
                  <div className="flex flex-wrap gap-3">
                    {previews.map((url, i) => (
                      <div key={url} className="relative h-24 w-24 overflow-hidden rounded-md border">
                        <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, index) => index !== i))}
                          className="absolute right-1 top-1 rounded-full bg-background/80 p-1"
                          aria-label={`Remove photo ${i + 1}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        <ImagePlus className="h-5 w-5" />
                        Add photo
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => {
                      addImages(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </div>

                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {coords
                    ? "Your current location is attached so people nearby can find it."
                    : "Location is required to post. Allow location access for this site, then reload the page."}
                </p>

                <Button type="submit" className="w-full" disabled={submitting || !coords}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Post item
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Posting needs an account; signed-out visitors are sent to login
const PostItem = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <LocationProvider>
      <PostItemForm />
    </LocationProvider>
  );
};

export default PostItem;
