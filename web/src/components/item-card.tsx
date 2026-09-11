/* eslint-disable @typescript-eslint/no-explicit-any */
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Heart } from "lucide-react";
import sampleItems from "@/assets/sample-items.jpg";
import { useLocation } from "@/context/LocationProvider";
import numbro from "numbro";
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
            <span>
              {distance == null
                ? "Calculating distance..."
                : distance < 1000
                ? `${numbro(distance).format({
                    thousandSeparated: true,
                  })} M Away`
                : `${numbro(distance / 1000).format({ mantissa: 2 })} KM Away`}
            </span>
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
