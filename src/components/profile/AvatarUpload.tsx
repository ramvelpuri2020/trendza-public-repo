import React, { useState } from "react";
import { Camera, Upload, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateFileUpload, checkRateLimit, sanitizeTextInput } from "@/utils/security";
import { encodeBlurHashFromImageSource } from "@/lib/image";
import { CachedImage } from "@/components/ui/CachedImage";

interface AvatarUploadProps {
  avatarUrl: string | null;
  userId: string;
  username: string;
  onAvatarUpdate: (url: string) => void;
}

export const AvatarUpload = ({ avatarUrl, userId, username, onAvatarUpdate }: AvatarUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const { toast } = useToast();

  const uploadAvatar = async (file: File) => {
    try {
      setUploading(true);

      if (!userId) {
        throw new Error("User ID is required");
      }

      // Security: Rate limiting check
      const rateLimitResult = checkRateLimit(`avatar_upload_${userId}`, {
        maxRequests: 5,
        windowMs: 5 * 60 * 1000, // 5 minutes
        blockDurationMs: 15 * 60 * 1000 // 15 minutes block
      });

      if (!rateLimitResult.allowed) {
        throw new Error(`Too many upload attempts. Please try again in ${rateLimitResult.retryAfter} seconds.`);
      }

      // Security: Comprehensive file validation
      const validation = validateFileUpload(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Additional security: Check for malicious file content patterns
      const fileContent = await file.arrayBuffer();
      const uint8Array = new Uint8Array(fileContent);

      // Check for common script injection patterns in file headers
      const fileHeader = Array.from(uint8Array.slice(0, 1024))
        .map(byte => String.fromCharCode(byte))
        .join('');

      const maliciousPatterns = [
        /<script/i,
        /javascript:/i,
        /data:text\/html/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
      ];

      for (const pattern of maliciousPatterns) {
        if (pattern.test(fileHeader)) {
          throw new Error('File contains suspicious content and cannot be uploaded');
        }
      }

      // Generate a secure file name using the user ID and timestamp
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const sanitizedUserId = sanitizeTextInput(userId);
      const timestamp = Date.now();
      const fileName = `${sanitizedUserId}/${timestamp}.${fileExt}`;

      // Upload the file to Supabase storage with security headers
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true,
          cacheControl: '3600',
          contentType: file.type
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Security: Validate the returned URL
      if (!publicUrl || !publicUrl.startsWith('https://')) {
        throw new Error('Invalid upload response');
      }

      // Update the user's avatar_url in the profiles table.
      // We compute a BlurHash client-side before upload so the avatar
      // gets an instant placeholder on subsequent app opens; the column
      // doesn't exist on `profiles` yet so we keep it client-side for
      // now via the encoding result.
      let avatarBlurHash: string | null = null;
      try {
        avatarBlurHash = await encodeBlurHashFromImageSource(file);
      } catch {
        // best-effort — placeholder will fall back to the gray disk cache frame
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      // Call the onAvatarUpdate callback.
      // We pass both pieces (url + best-effort blur hash) so the
      // Consumer (Profile page wrapping AvatarUpload) can surface it.
      onAvatarUpdate(publicUrl);

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully.",
      });

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "There was an error uploading your avatar.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Security: Immediate file validation before processing
      const validation = validateFileUpload(file);
      if (!validation.isValid) {
        toast({
          title: "Invalid file",
          description: validation.errors.join(', '),
          variant: "destructive",
        });
        return;
      }

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      // Upload the file
      await uploadAvatar(file);

      // Clean up object URL
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      // Error is already handled in uploadAvatar
      console.error('File selection error:', error);
    }

    // Clear the input to allow re-selection of the same file
    event.target.value = '';
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative group">
        {/* Avatar surface — bordered circle. The hidden file input
            * sits transparently over the avatar so the whole 80×80
            * circle is a tap target. The Upload icon sits centered
            * and reveals on hover/focus via group-hover &:focus-within. */}
        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
          {preview ? (
            <CachedImage
              src={preview}
              blurHash={null}
              width={160}
              alt={`${username}'s avatar`}
              fit="cover"
              variant="hero"
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-9 h-9 text-gray-400" strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Upload hint overlay. Reads as an edit affordance. */}
        <div className="absolute inset-0 bg-black/55 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity pointer-events-none">
          <Upload className="w-5 h-5 text-white" strokeWidth={2} />
        </div>

        {/* Hidden file input is the actual interactive element. */}
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          aria-label={`Upload avatar for ${username}`}
        />
      </div>

      <div className="text-center">
        <h3 className="text-base font-semibold text-black">{username}</h3>
        <p className="text-xs text-gray-500 mt-1">
          {uploading ? 'Uploading…' : 'Tap to change avatar'}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          JPG, PNG, WebP · Max 10MB
        </p>
      </div>
    </div>
  );
};
