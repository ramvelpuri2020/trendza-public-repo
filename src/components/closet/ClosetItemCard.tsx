import { motion } from "framer-motion";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CachedImage } from "@/components/ui/CachedImage";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Heart,
  Tag,
  Palette,
  Building2,
  Shirt
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ClosetItem } from "@/types/closetTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";


interface ClosetItemCardProps {
  item: ClosetItem;
  viewMode: 'grid' | 'list';
  onDelete: (itemId: string) => void;
}



export const ClosetItemCard = ({ item, viewMode, onDelete }: ClosetItemCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('trendza_closet_items' as any)
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      onDelete(item.id);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleToggleFavorite = () => {
    setIsFavorited(!isFavorited);
    // TODO: Implement favorite functionality in database
  };

  if (viewMode === 'list') {
    return (
      <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Image */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-none">
              <CachedImage
                src={item.source_image_url || '/placeholder.svg'}
                blurHash={item.blur_hash ?? null}
                width={128}
                alt={item.title || 'Closet item'}
                fit="cover"
                className="h-full w-full"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleToggleFavorite}
                className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  isFavorited 
                    ? 'bg-gray-200 text-black' 
                    : 'bg-white/80 text-gray-600 hover:text-gray-900 border border-gray-200'
                }`}
              >
                <Heart className={`w-3 h-3 ${isFavorited ? 'fill-current' : ''}`} />
              </motion.button>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-semibold truncate">
                    {item.title || 'Untitled Item'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                    {item.brand && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        <span>{item.brand}</span>
                      </div>
                    )}
                    {item.color && (
                      <div className="flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        <span>{item.color}</span>
                      </div>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border border-gray-200">
                    <DropdownMenuItem className="text-gray-900 hover:bg-gray-50">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Item
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-200" />
                    <DropdownMenuItem 
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Tags and Category */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                  {item.category}
                </Badge>
                {item.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="border-gray-200 text-gray-600 text-xs">
                    <Tag className="w-2 h-2 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 2 && (
                  <Badge variant="outline" className="border-gray-200 text-gray-600 text-xs">
                    +{item.tags.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 overflow-hidden group">
        <div className="relative">
          {/* Image */}
          <div className="aspect-square relative overflow-hidden bg-gray-100">
            <CachedImage
              src={item.source_image_url || '/placeholder.svg'}
              blurHash={item.blur_hash ?? null}
              width={320}
              alt={item.title || 'Closet item'}
              fit="cover"
              className="h-full w-full"
            />
            
            {/* Favorite Button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleFavorite}
              className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isFavorited 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white/90 text-gray-600 hover:text-gray-900 border border-gray-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            </motion.button>

            {/* Category Badge */}
            <div className="absolute top-2 left-2">
              <Badge className="bg-white/90 text-gray-700 border-gray-200 text-xs">
                {item.category}
              </Badge>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-semibold truncate">
                    {item.title || 'Untitled Item'}
                  </h3>
                  {item.brand && (
                    <p className="text-sm text-gray-600 truncate">{item.brand}</p>
                  )}
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 p-1">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border border-gray-200">
                    <DropdownMenuItem className="text-gray-900 hover:bg-gray-50">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Item
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-gray-200" />
                    <DropdownMenuItem 
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Tags */}
              {item.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {item.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="outline" className="border-gray-200 text-gray-600 text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags.length > 2 && (
                    <Badge variant="outline" className="border-gray-200 text-gray-600 text-xs">
                      +{item.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white border border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete Item</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};
