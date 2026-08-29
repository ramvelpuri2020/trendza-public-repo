import { motion } from "framer-motion";
import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const DashboardHeader = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center justify-between px-4 pt-3 pb-2 bg-white border-b border-gray-200"
    >
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-black tracking-tight">
          trendza
        </h1>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full text-gray-600 hover:bg-gray-100 hover:text-black"
        onClick={() => navigate('/profile')}
      >
        <User className="h-6 w-6" />
      </Button>
    </motion.div>
  );
};
