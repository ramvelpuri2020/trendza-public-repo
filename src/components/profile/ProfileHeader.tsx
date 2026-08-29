import { ArrowLeft, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUsageLimits } from "@/hooks/useUsageLimits";

interface ProfileHeaderProps {
  isPro: boolean;
  onLogout: () => void;
  isLoggingOut: boolean;
}

export const ProfileHeader = ({ isPro, onLogout, isLoggingOut }: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const { getAllRemaining } = useUsageLimits();

  const remaining = getAllRemaining();
  const tryonLimit = remaining.find((r) => r.key === 'outfit_tryon');

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Go back"
          className="rounded-full text-gray-700 hover:bg-gray-100"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2} />
        </Button>
        <h1 className="text-lg font-semibold text-black ml-2 tracking-tight">Profile</h1>
      </div>

      <div className="flex items-center gap-2">
        {isPro ? (
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-1.5 rounded-full border border-purple-100">
            <Crown className="h-3.5 w-3.5 text-purple-600" strokeWidth={2.5} />
            <span className="text-xs font-semibold text-purple-700 tracking-wide">Pro</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
            <Sparkles className="h-3.5 w-3.5 text-gray-500" strokeWidth={2} />
            <span className="text-xs font-semibold text-gray-600 tracking-wide">
              Free{tryonLimit ? ` · ${tryonLimit.remaining}/${tryonLimit.limit} try-ons` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
