
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Camera, ArrowRight, Briefcase, Zap, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const QuickStartSection = () => {
  const navigate = useNavigate();

  return (
    <Card className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 text-lg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gray-600" />
            Quick Start
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[
            {
              title: "Work Style",
              description: "Professional looks that make an impact",
              icon: Briefcase
            },
            {
              title: "Casual Vibes",
              description: "Effortless everyday outfits",
              icon: Zap
            },
            {
              title: "Evening Out",
              description: "Make a statement after dark",
              icon: Moon
            }
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
              onClick={() => navigate('/scan')}
            >
              <Card className="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center group-hover:bg-gray-50 transition-colors">
                        <card.icon className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-medium group-hover:text-gray-700 transition-colors">
                          {card.title}
                        </p>
                        <p className="text-gray-600 text-xs">{card.description}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
