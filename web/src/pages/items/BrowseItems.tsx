import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus } from "lucide-react";
import { apiClient } from "@/api/api_client";
import { ItemCard } from "@/components/item-card";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LocationProvider, useLocation } from "@/context/LocationProvider";
import { categories } from "@/constants/items";

const PAGE_SIZE = 12;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Item = any;

function BrowseItemsContent() {
  const { currentLocation } = useLocation();
  const coords = currentLocation?.coords;
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("ALL");

  // With the browser's location, items come nearest-first in pages (the path takes an offset);
  // without it the backend returns every item at once
  const urlFor = useCallback(
    (offset: number) =>
      coords
        ? `/items/location/${coords.latitude}/${coords.longitude}/${offset}/${PAGE_SIZE}`
        : "/items",
    [coords]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiClient
      .get<Item[]>(urlFor(0))
      .then(({ data }) => {
        if (cancelled) return;
        setItems(data);
        setHasMore(!!coords && data.length === PAGE_SIZE);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load items. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [urlFor, coords]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data } = await apiClient.get<Item[]>(urlFor(items.length));
      setItems((previous) => [...previous, ...data]);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setError("Couldn't load more items. Please try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  // Filters what's loaded so far; the backend has no category filter
  const visible =
    category === "ALL" ? items : items.filter((item) => item?.category === category);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-10 flex-grow">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Browse Items</h1>
            <p className="text-muted-foreground">
              {coords
                ? "Nearest to you first"
                : "Allow location access to see the items nearest to you first"}
            </p>
          </div>
          <Button asChild variant="hero">
            <Link to="/post">
              <Plus className="h-4 w-4" />
              Post Item
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {[{ label: "All", value: "ALL" }, ...categories].map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={category === option.value ? "default" : "outline"}
              onClick={() => setCategory(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-lg" />
            ))}
          </div>
        ) : error && items.length === 0 ? (
          <p className="text-center text-lg text-muted-foreground py-16">{error}</p>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <p className="text-lg text-muted-foreground">
              {items.length === 0 ? "No items have been posted yet." : "No items in this category yet."}
            </p>
            <Button asChild variant="outline">
              <Link to="/post">Be the first to post one</Link>
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {visible.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div className="text-center mt-10">
            <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Load more
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

const BrowseItems = () => (
  <LocationProvider>
    <BrowseItemsContent />
  </LocationProvider>
);

export default BrowseItems;
