import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";

interface StyleBreakdown {
  category: string;
  score: number;
  emoji: string;
}

interface DetailsModalProps {
  breakdown: StyleBreakdown[];
  feedback: string;
}

export const DetailsModal = ({ breakdown, feedback }: DetailsModalProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          <Info className="w-4 h-4 mr-2" />
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-black/90 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Style Analysis Details</DialogTitle>
          <DialogDescription className="text-white/60">
            Detailed breakdown of your style analysis
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid gap-4">
            {breakdown.map((item, index) => (
              <motion.div
                key={item.category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="font-medium">{item.category}</span>
                  </div>
                  <span className="text-lg font-bold">{item.score}</span>
                </div>
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-6 space-y-2">
            <h4 className="font-medium">Feedback</h4>
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
              {feedback}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};