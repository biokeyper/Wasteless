import { apiClient } from "@/api/api_client";
import { ItemCard } from "@/components/item-card";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/context/LocationProvider";
import { ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";

export function FeaturedItems() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(10);
  const [page, setPage] = useState(0);
  const { currentLocation } = useLocation();
  const { toast } = useToast();

  const url = currentLocation.coords
    ? `/items/location/${currentLocation?.coords?.latitude}/${currentLocation?.coords?.longitude}/${page}/${limit}`
    : "/items";

  const handleFetchItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get(url);

      // Only update items if data is successfully fetched
      if (response.status === 200 && Array.isArray(response.data)) {
        setItems(response.data);
      } else {
        toast({
          title: "Fetch Failed",
          description: "Failed to fetch items",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = (error as Error)?.message ?? "Something went wrong";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    handleFetchItems();
  }, [handleFetchItems]);
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      {items.length > 0 ? (
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Recently Posted Items
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover useful items shared by your neighbors
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {items.map((item, index) => (
              <div
                key={index}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ItemCard item={item} />
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" size="lg" className="group" asChild>
              <Link to="/browse">
                View All Items
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {error ? (
            <div className="container mx-auto px-4">
              <p className="text-center text-lg text-muted-foreground">
                {error}
              </p>
            </div>
          ) : (
            <div className="container mx-auto px-4">
              <p className="text-center text-lg text-muted-foreground">
                No Items Found
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
