import React from "react";
import { Share2, Bookmark } from "lucide-react";
import { CachedImage } from "@/components/ui/CachedImage";

interface PlayerRatingsCardProps {
  profileImage: string;
  mainScore: number;
  nowScore: number;
  potentialScore: number;
  onSave?: () => void;
  onShare?: () => void;
}

export const PlayerRatingsCard: React.FC<PlayerRatingsCardProps> = ({
  profileImage,
  mainScore = 84,
  nowScore = 84,
  potentialScore = 90,
  onSave,
  onShare,
}) => {
  const getProgressColor = (value: number) => {
    if (value >= 85) return "#00FF88"; // Bright green
    if (value >= 80) return "#22c55e"; // Green  
    if (value >= 70) return "#eab308"; // Yellow
    return "#f97316"; // Orange
  };

  const stats = [
    { label: "Aura", value: 67 },
    { label: "Overall", value: 85 },
    { label: "Fit", value: 83 },
    { label: "Rating", value: 87 },
    { label: "Color Coordination", value: 90 },
    { label: "Trendiness", value: 78 },
  ];

  return (
    <div className="w-[320px] mx-auto bg-black rounded-[20px] p-5 text-white">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-white text-[18px] font-semibold">Ratings</h1>
      </div>

      {/* Profile Image */}
      <div className="flex justify-center mb-5">
        <div className="w-[80px] h-[80px] rounded-full overflow-hidden">
          <CachedImage
            src={profileImage}
            blurHash={null}
            width={160}
            alt="Profile"
            fit="cover"
            variant="hero"
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Main Score */}
      <div className="text-center mb-6">
        <div className="text-[56px] font-bold leading-none mb-1" style={{ color: "#00FF88" }}>
          {mainScore}
        </div>
        <div className="flex justify-center items-center gap-6">
          <div className="text-center">
            <div className="text-[#9CA3AF] text-[12px] font-medium">Now</div>
            <div className="text-white text-[16px] font-semibold">{nowScore}</div>
          </div>
          <div className="text-center">
            <div className="text-[#9CA3AF] text-[12px] font-medium">Potential</div>
            <div className="text-white text-[16px] font-semibold">{potentialScore}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[#9CA3AF] text-[12px] font-medium">{stat.label}</span>
              <span className="text-white text-[14px] font-semibold">{stat.value}</span>
            </div>
            <div className="w-full h-[6px] bg-[#374151] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${stat.value}%`,
                  backgroundColor: getProgressColor(stat.value),
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="flex-1 flex items-center justify-center gap-2 h-[44px] bg-[#374151] rounded-[12px] text-white text-[14px] font-medium hover:bg-[#4B5563] transition-colors"
        >
          <Bookmark size={16} />
          Save
        </button>
        <button
          onClick={onShare}
          className="flex-1 flex items-center justify-center gap-2 h-[44px] bg-[#374151] rounded-[12px] text-white text-[14px] font-medium hover:bg-[#4B5563] transition-colors"
        >
          <Share2 size={16} />
          Share
        </button>
      </div>
    </div>
  );
}; 