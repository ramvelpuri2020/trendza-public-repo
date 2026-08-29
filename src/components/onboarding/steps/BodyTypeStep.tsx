import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { User, Zap, Heart, Users } from "lucide-react";

interface BodyTypeStepProps {
  onSelect: (bodyType: string) => void;
}

const bodyTypeOptions = [
  { id: 'slim', label: 'Slim', icon: User },
  { id: 'athletic', label: 'Athletic', icon: Zap },
  { id: 'curvy', label: 'Curvy', icon: Heart },
  { id: 'other', label: 'Other', icon: Users }
];

export const BodyTypeStep = ({ onSelect }: BodyTypeStepProps) => (
  <motion.div key="body-type" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.6, ease: "easeOut" }} className="h-full flex flex-col">
    <div className="flex-1 flex flex-col justify-center items-center px-8 py-12">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }} className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-8">
        <User className="w-10 h-10 text-gray-600" />
      </motion.div>
      <div className="space-y-4 text-center">
        <h2 className="text-4xl font-bold text-gray-900">Which body type best describes you?</h2>
        <p className="text-gray-600 text-xl">Help us find the perfect fit</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4 px-8 pb-8">
      {bodyTypeOptions.map((option, index) => (
        <motion.div key={option.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.4 }}>
          <Button onClick={() => onSelect(option.id)} className="w-full h-16 text-lg font-bold bg-white border-2 border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-gray-300 hover:scale-105 transition-all duration-300 rounded-2xl flex items-center justify-center gap-3">
            <option.icon className="w-6 h-6" />
            {option.label}
          </Button>
        </motion.div>
      ))}
    </div>
  </motion.div>
); 