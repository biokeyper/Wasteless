/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Heart } from "lucide-react";
import sampleItems from "@/assets/sample-items.jpg";
import { useLocation } from "@/context/LocationProvider";
import { formatDistance, itemMapsUrl, itemPlace } from "@/lib/itemLocation";
import moment from "moment";
type ItemCardProps = {
  item: any;
};
export function ItemCard({ item }: ItemCardProps) {
  const { getDistanceFromLatLonInMeters } = useLocation();

  const distance = getDistanceFromLatLonInMeters(
    item?.location?.latitude as number,
    item?.location?.longitude as number
  );
  const place = itemPlace(item?.location);
  const mapsUrl = itemMapsUrl(item?.location);

  return (
    <Card className="group overflow-hidden border-0 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={item?.images?.[0]?.url ?? sampleItems}
          alt={item?.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {item?.title}
            </h3>
            <p>
              {item.description.slice(0, 50)}
              {item.description.length > 50 ? "...." : ""}
            </p>
            <Badge variant="secondary" className="text-xs">
              {item?.category.replace(/_/g, " ")}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-60 hover:opacity-100"
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary" />
            {distance != null ? (
              <span>{formatDistance(distance)}</span>
            ) : mapsUrl ? (
              // Without the viewer's location, show where the item is instead of a distance
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:text-primary hover:underline"
              >
                {place ?? "View on map"}
              </a>
            ) : (
              <span>{place ?? "Location not shared"}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{moment(item?.createdAt).fromNow()}</span>
          </div>
        </div>

        <Button className="w-full" variant="outline">
          Request Item
        </Button>
      </CardContent>
    </Card>
  );
}
