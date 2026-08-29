import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { useStatsStore } from "@/store/statsStore";
import { useSubscription } from "@/components/subscription/SubscriptionProvider";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { AlertTriangle, Crown, Sparkles, Zap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DeleteAccountButton } from '@/components/DeleteAccountButton';

interface Profile {
  username: string;
  avatar_url: string | null;
  id: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const { stats, isLoading, error, fetchUserStats } = useStatsStore();
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const { toast } = useToast();
  const { isPro } = useSubscription();
  const { getAllRemaining } = useUsageLimits();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
    initializeStats();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('username, avatar_url, id')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Create a profile if it doesn't exist
          const username = user.email?.split('@')[0] || 'User';
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username
            });

          if (!insertError) {
            setProfile({
              username,
              avatar_url: null,
              id: user.id
            });
          }
        }
        return;
      }

      if (data && !error) {
        setProfile({
          username: (data as any).username || user.email?.split('@')[0] || 'User',
          avatar_url: (data as any).avatar_url || null,
          id: user.id
        });
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      fetchUserStats(user.id);
    }
  };

  const handleAvatarUpdate = (url: string) => {
    if (profile) {
      setProfile({
        ...profile,
        avatar_url: url
      });
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      
      toast({
        title: "Signing out...",
        description: "Clearing all data and signing out.",
      });
      
      // Use the comprehensive sign-out function that clears ALL storage
      await signOut();
      
      // The signOut function handles navigation, but just in case:
      // navigate('/auth'); - not needed, signOut handles this
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error logging out",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
      setLoggingOut(false);
    }
  };

  if (loading || isLoading) {
    return (
      // `screen-safe` = 100dvh + bottom safe-area inset built-in, so we
      // intentionally do NOT add `pb-nav` here — that would double the
      // home-indicator inset (64px extra) on already-padded iPhones.
      <div className="h-full app-content app-shell-scroll bg-white px-4 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-300 border-t-black animate-spin" />
      </div>
    );
  }

  return (
    // Profile follows the dashboard pattern (matching Index.tsx). <body>
    // is the single source of safe-area-inset-{top,bottom} (see
    // index.html + index.css @supports rule). An earlier version had
    // `screen-safe` ALSO adding env(top/bot) here on top of the body's
    // stacking — that was a (b) double-count, putting the profile header
    // at y=142 on iPhone 14 Pro (env=59 added twice + py-6) instead of
    // y=83. The Danger Zone button still clears the iOS home indicator
    // because <body> provides the env(bot) inset directly.
    // `app-shell-scroll` keeps the long profile settings list scrollable
    // inside the locked webview (see global html/body `overflow:hidden`
    // rule for why).
    <div className="h-full app-content app-shell-scroll bg-white px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-2xl mx-auto space-y-5 py-6"
      >
        <ProfileHeader
          isPro={isPro}
          onLogout={handleLogout}
          isLoggingOut={loggingOut}
        />

        {/* Subscription status card */}
        <Card className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {isPro ? (
              <div className="p-5 bg-gradient-to-r from-purple-50/80 via-purple-50/40 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-sm">
                      <Crown className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">Pro Plan</p>
                      <p className="text-sm text-gray-500">Unlimited access to all features</p>
                    </div>
                  </div>
                  <div className="bg-purple-100/80 px-3 py-1 rounded-full">
                    <span className="text-xs font-semibold text-purple-700">Active</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: 'AI Try-On', value: 'Unlimited' },
                    { label: 'Recommendations', value: 'Unlimited' },
                    { label: 'Style Analysis', value: 'Unlimited' },
                  ].map((item) => (
                    <div key={item.label} className="bg-white/70 rounded-xl p-3 text-center border border-purple-100/50">
                      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{item.label}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-gray-500" strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">Free Plan</p>
                      <p className="text-sm text-gray-500">Limited features available</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/upgrade')}
                    className="bg-black text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-gray-800 transition-colors flex items-center gap-1"
                  >
                    Upgrade
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Usage limits */}
                <div className="space-y-2">
                  {getAllRemaining().map((limit) => (
                    <div key={limit.key} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-gray-500" strokeWidth={1.8} />
                          <span className="text-sm font-medium text-gray-800">{limit.label}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {limit.remaining}/{limit.limit} remaining
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.max(0, Math.min(100, ((limit.limit - limit.remaining) / limit.limit) * 100))}%`,
                          }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${
                            limit.remaining === 0
                              ? 'bg-red-400'
                              : limit.remaining <= 1
                                ? 'bg-yellow-400'
                                : 'bg-green-400'
                          }`}
                        />
                      </div>
                      {limit.remaining === 0 && (
                        <p className="text-[11px] text-red-500 mt-1 font-medium">
                          Upgrade to Pro for unlimited access
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              {profile && (
                <AvatarUpload
                  avatarUrl={profile.avatar_url}
                  userId={profile.id}
                  username={profile.username}
                  onAvatarUpdate={handleAvatarUpdate}
                />
              )}
            </div>
          </CardContent>
        </Card>

        <ProfileStats stats={stats} />

        {error && (
          <Card className="bg-red-50 border border-red-200 rounded-2xl">
            <CardContent className="p-4">
              <p className="text-red-700 text-center text-sm font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone - Delete Account */}
        <Card className="border border-gray-200 bg-white rounded-2xl mt-6">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Danger Zone
            </div>
            <div className="text-gray-900 font-semibold text-base">Delete Account</div>
            <div className="text-gray-600 text-sm">
              Permanently delete your account and all associated data. This action cannot be undone.
            </div>
            <div className="flex justify-center">
              <DeleteAccountButton />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Profile;