import { memo } from 'react';
import { Plus, Heart } from 'lucide-react';
import { CachedImage } from '@/components/ui/CachedImage';
import type { ClosetItem } from '@/hooks/useClosetData';

// Ultra-fast item card with instant image loading via BlurHash + disk cache.
const SimpleItemCard = memo(({
  item: rawItem,
  onClick,
  onToggleFavorite,
}: {
  item: ClosetItem;
  onClick: () => void;
  onToggleFavorite: () => void;
}) => {
  // Normalize to the shape CachedImage expects. PiecesTab declares its
  // own local interface (see below) for backwards compat with the old
  // <img>-driven layout; it doesn't include blur_hash.
  const item = rawItem as ClosetItem & { blur_hash?: string | null };

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
    >
      {/* Image only, small tile */}
      <div className="aspect-square relative bg-white">
        <CachedImage
          src={item.source_image_url ?? null}
          blurHash={item.blur_hash ?? null}
          width={240}
          alt={item.title ?? 'Closet item'}
          fit="contain"
          className="absolute inset-0 h-full w-full p-2"
        />

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-2 right-2 w-8 h-8 bg-white/95 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors"
        >
          <Heart className={`w-4 h-4 ${item.favorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
      </div>
      {/* No text under tiles for ultra-clean grid */}
    </div>
  );
});

interface ClosetItem {
  id: string;
  title: string;
  brand?: string;
  category: string;
  color: string;
  season?: string;
  tags: string[];
  attributes: Record<string, any>;
  source_image_url?: string;
  created_at: string;
  favorite?: boolean;
  blur_hash?: string | null;
}

interface FilterChip {
  key: string;
  label: string;
  icon?: React.ComponentType<any>;
}

interface PiecesTabProps {
  items: ClosetItem[];
  filteredItems: ClosetItem[];
  isUploading: boolean;
  freeLimit: number;
  filterChips: FilterChip[];
  activeFilters: Record<string, string>;
  onToggleFilter: (filterKey: string) => void;
  onClearFilters: () => void;
  onAddPiece: () => void;
  onItemClick: (item: ClosetItem) => void;
  onToggleFavorite: (itemId: string) => void;
}

export default function PiecesTab({
  items,
  filteredItems,
  isUploading,
  freeLimit,
  filterChips,
  activeFilters,
  onToggleFilter,
  onClearFilters,
  onAddPiece,
  onItemClick,
  onToggleFavorite
}: PiecesTabProps) {
  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Closet</h2>
        <p className="text-gray-600">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {/* Filter Chips */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterChips.map((chip) => {
            const Icon = chip.icon;
            const isActive = activeFilters[chip.key];
            
            return (
              <button
                key={chip.key}
                onClick={() => onToggleFilter(chip.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-gray-200 text-black'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Items Grid */}
      <div className="space-y-4">
        {isUploading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black mx-auto mb-3"></div>
            <p className="text-gray-600">Uploading items...</p>
          </div>
        )}

        {!isUploading && filteredItems.length === 0 && !hasActiveFilters && (
          <div className="flex items-center justify-center py-24">
            <button
              onClick={onAddPiece}
              className="w-20 h-20 bg-gray-100 hover:bg-gray-200 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center transition-all"
            >
              <Plus className="w-8 h-8 text-gray-600" />
            </button>
          </div>
        )}

        {!isUploading && filteredItems.length === 0 && hasActiveFilters && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No items match your filters</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        )}

        {!isUploading && filteredItems.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {/* Add Piece Card - first tile */}
            <button
              onClick={onAddPiece}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-3 flex flex-col items-center justify-center text-center bg-white hover:border-gray-400 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center mb-2">
                <Plus className="w-6 h-6 text-gray-700" />
              </div>
              <p className="text-gray-900 font-semibold text-sm">Add Piece</p>
            </button>

            {/* Ultra-fast render - instant loading */}
            {filteredItems.map((item) => (
              <SimpleItemCard
                key={item.id}
                item={item}
                onClick={() => onItemClick(item)}
                onToggleFavorite={() => onToggleFavorite(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
