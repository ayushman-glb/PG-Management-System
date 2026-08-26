import React, { useState } from "react";
import { Star, Heart, ChevronLeft, ChevronRight } from "lucide-react";

export interface PropertyCardData {
  id: string | number;
  name: string;
  location: string;
  city?: string;
  price: number;
  rating?: number;
  reviews?: number;
  sharingType?: string;
  images: string[];
  isGuestFavorite?: boolean;
  isNew?: boolean;
  liked?: boolean;
}

interface PropertyCardProps {
  property: PropertyCardData;
  onClick?: () => void;
  onToggleLike?: (id: string | number) => void;
  className?: string;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onClick,
  onToggleLike,
  className = "",
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(property.liked || false);

  const images = property.images && property.images.length > 0
    ? property.images
    : ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop&auto=format"];

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onToggleLike?.(property.id);
  };

  return (
    <div
      onClick={onClick}
      className={`group flex flex-col cursor-pointer transition-all duration-200 ${className}`}
    >
      {/* Photo Plate */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100 dark:bg-neutral-800 mb-3">
        <img
          src={images[currentImageIndex]}
          alt={property.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Floating "Guest favorite" badge */}
        {property.isGuestFavorite && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-[#222222] text-[11px] font-bold shadow-md select-none">
            Guest favorite
          </div>
        )}

        {/* Floating Heart Button */}
        <button
          type="button"
          onClick={handleLike}
          aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 p-2 rounded-full hover:scale-110 active:scale-95 transition-all text-white drop-shadow-md cursor-pointer"
        >
          <Heart
            className={`w-6 h-6 transition-colors ${
              isLiked
                ? "fill-[#ff385c] text-[#ff385c]"
                : "fill-black/30 text-white stroke-[2]"
            }`}
          />
        </button>

        {/* Carousel Arrows on Hover */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevImage}
              aria-label="Previous photo"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-[#222222] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextImage}
              aria-label="Next photo"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 text-[#222222] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md hover:scale-105"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
              {images.map((_, idx) => (
                <span
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    idx === currentImageIndex ? "bg-white scale-125" : "bg-white/60"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Card Metadata */}
      <div className="flex flex-col gap-0.5 text-sm">
        <div className="flex items-center justify-between font-bold text-[#222222] dark:text-[#f7f7f7]">
          <span className="truncate pr-2">{property.location || property.name}</span>
          <div className="flex items-center gap-1 flex-shrink-0 font-medium">
            <Star className="w-3.5 h-3.5 fill-current text-[#222222] dark:text-[#f7f7f7]" />
            <span>{property.rating ? property.rating.toFixed(2) : "4.85"}</span>
          </div>
        </div>

        <p className="text-[#6a6a6a] dark:text-[#a1a1aa] text-xs truncate">
          {property.name} • {property.sharingType || "Single / Double"}
        </p>

        <p className="text-[#6a6a6a] dark:text-[#a1a1aa] text-xs">
          Available now
        </p>

        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-bold text-[#222222] dark:text-[#f7f7f7]">
            ₹{property.price.toLocaleString("en-IN")}
          </span>
          <span className="text-xs text-[#6a6a6a] dark:text-[#a1a1aa]">month</span>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
