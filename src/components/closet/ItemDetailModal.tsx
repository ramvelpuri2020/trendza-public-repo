import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, ChevronDown, Heart, Loader2, Palette, Tag, X } from 'lucide-react';
import { CachedImage } from '@/components/ui/CachedImage';

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
}

/**
 * Categories the user can set on an item. Mirrors the broader set
 * exposed by `AddClosetItemModal` (8 entries) — keeping both in
 * lockstep means outfits saved as 'outerwear' / 'dresses' / 'bags' /
 * 'jewelry' through the manual flow stay reachable from the inline
 * picker. Reads are non-canonical: the row may also carry 'pending'
 * from the auto-classify flows; in that case the picker reflects the
 * stored value but shows only the 8 options the schema understands.
 */
const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'tops', label: 'Tops' },
  { value: 'bottoms', label: 'Bottoms' },
  { value: 'dresses', label: 'Dresses' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'bags', label: 'Bags' },
  { value: 'jewelry', label: 'Jewelry' },
];

interface ItemDetailModalProps {
  item: ClosetItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite: (itemId: string) => void;
  /**
   * Manual category override. Called when the user picks a different
   * category from the inline picker. Parent (ClosetView) issues the
   * UPDATE then patches local state via useClosetData.updateItem. The
   * picker mirrors the same instant-save pattern as the favorite
   * toggle — no separate "Save" button. Cheaper mode of feedback than
   * waiting for a full refetch.
   */
  onUpdateCategory?: (itemId: string, newCategory: string) => Promise<void> | void;
}

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  onToggleFavorite,
  onUpdateCategory,
}: ItemDetailModalProps) {
  // Tracks the in-flight save per item id so the picker shows a tiny
  // spinner even when the global aiOffline state isn't relevant. Cleared
  // optimistically; the parent simply re-renders with the patched item.
  const [savingCategoryFor, setSavingCategoryFor] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Reviewer caught: without this reset, dismiss-then-reopen-with-
  // different-item would leave the dropdown showing for the wrong
  // item. AnimatePresence keeps the modal mounted during exit, so
  // React state survives the close/open cycle.
  useEffect(() => {
    if (!isOpen) setPickerOpen(false);
  }, [isOpen]);
  useEffect(() => {
    setPickerOpen(false);
  }, [item?.id]);

  const handlePickCategory = async (newCategory: string) => {
    if (!item || !onUpdateCategory) return;
    if (newCategory === item.category) {
      setPickerOpen(false);
      return;
    }
    setSavingCategoryFor(item.id);
    setPickerOpen(false);
    try {
      await Promise.resolve(onUpdateCategory(item.id, newCategory));
    } finally {
      setSavingCategoryFor(null);
    }
  };

  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Item Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Image */}
              <div className="aspect-square rounded-xl overflow-hidden bg-white border border-gray-200">
                {item.source_image_url ? (
                  <CachedImage
                    src={item.source_image_url}
                    blurHash={(item as any).blur_hash ?? null}
                    width={480}
                    alt={item.title}
                    fit="contain"
                    variant="hero"
                    className="w-full h-full p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>

              {/* Title and Favorite */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  {item.brand && (
                    <p className="text-gray-600">{item.brand}</p>
                  )}
                </div>
                <motion.button
                  onClick={() => onToggleFavorite(item.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={`p-2 rounded-full transition-colors ${
                    item.favorite
                      ? 'bg-red-50 text-red-500'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${item.favorite ? 'fill-current' : ''}`} />
                </motion.button>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category — inline picker. Tap to open a small menu,
                   pick a value, fires onUpdateCategory. The parent
                   issues the DB UPDATE + local patch so the modal
                   can close the picker immediately. Saves automatically
                   (no "Save" button) to keep the interaction denser. */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Tag className="w-4 h-4" />
                    <span>Category</span>
                  </div>
                  {onUpdateCategory ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setPickerOpen((v) => !v)}
                        disabled={savingCategoryFor === item.id}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl text-left text-sm font-medium text-gray-900 capitalize hover:border-gray-400 transition-colors disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        aria-haspopup="listbox"
                        aria-expanded={pickerOpen}
                      >
                        <span className="flex items-center gap-2">
                          {savingCategoryFor === item.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                          ) : null}
                          {item.category || 'pending'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-gray-500 transition-transform ${pickerOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence>
                        {pickerOpen && (
                          <motion.ul
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            role="listbox"
                            className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                          >
                            {CATEGORY_OPTIONS.map((opt) => {
                              const selected = opt.value === item.category;
                              return (
                                <li
                                  key={opt.value}
                                  role="option"
                                  aria-selected={selected}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handlePickCategory(opt.value)}
                                    className={`w-full text-left px-3 py-2 text-sm capitalize hover:bg-gray-50 flex items-center justify-between ${selected ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                                  >
                                    {opt.label}
                                    {selected ? (
                                      <Check className="w-4 h-4 text-gray-900" />
                                    ) : null}
                                  </button>
                                </li>
                              );
                            })}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <p className="font-medium text-gray-900 capitalize">
                      {item.category}
                    </p>
                  )}
                </div>

                {/* Color */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Palette className="w-4 h-4" />
                    <span>Color</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{
                        backgroundColor: getColorValue(item.color)
                      }}
                    />
                    <p className="font-medium text-gray-900 capitalize">
                      {item.color}
                    </p>
                  </div>
                </div>

                {/* Season */}
                {item.season && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Season</span>
                    </div>
                    <p className="font-medium text-gray-900 capitalize">
                      {item.season}
                    </p>
                  </div>
                )}

                {/* Created Date */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Added</span>
                  </div>
                  <p className="font-medium text-gray-900">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {item.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Attributes */}
              {item.attributes && Object.keys(item.attributes).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Details</p>
                  <div className="space-y-1">
                    {Object.entries(item.attributes).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-gray-900 font-medium">
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helper function to get color values
function getColorValue(colorName: string): string {
  const colorMap: Record<string, string> = {
    black: '#000000',
    white: '#FFFFFF',
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    pink: '#EC4899',
    purple: '#8B5CF6',
    brown: '#A0522D',
    gray: '#6B7280',
    orange: '#F97316'
  };
  
  return colorMap[colorName.toLowerCase()] || '#6B7280';
}
