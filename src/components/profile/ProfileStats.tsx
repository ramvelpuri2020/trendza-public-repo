import { Card, CardContent } from "@/components/ui/card";

interface ProfileStatsProps {
  stats: {
    totalScans: number;
    averageScore: number;
    bestCategory: string;
    lastScan: string;
    improvedCategories: number;
    streak: number;
  };
}

export const ProfileStats = ({ stats }: ProfileStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-white border border-gray-200 rounded-2xl">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold mb-4 text-black">Style Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Total Scans</p>
              <p className="text-base font-semibold text-black">{stats.totalScans || 0}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Average Score</p>
              <p className="text-base font-semibold text-black">{stats.averageScore || 0}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Best Category</p>
              <p className="text-base font-semibold text-black">{stats.bestCategory || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border border-gray-200 rounded-2xl">
        <CardContent className="p-5">
          <h3 className="text-base font-semibold mb-4 text-black">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Last Scan</p>
              <p className="text-base font-semibold text-black">{stats.lastScan || 'No scans yet'}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Improved Categories</p>
              <p className="text-base font-semibold text-black">{stats.improvedCategories || 0}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Style Streak</p>
              <p className="text-base font-semibold text-black">{stats.streak || 0} days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
