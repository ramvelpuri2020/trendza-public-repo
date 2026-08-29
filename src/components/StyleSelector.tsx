import { Check, Shirt, Briefcase, GraduationCap, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StyleOption {
  id: string;
  label: string;
  description: string;
  icon: any;
}

interface StyleSelectorProps {
  selected: string;
  onSelect: (id: string) => void;
}

const styleOptions: StyleOption[] = [
  {
    id: "casual",
    label: "Casual",
    description: "Everyday wear",
    icon: Shirt,
  },
  {
    id: "formal",
    label: "Formal",
    description: "Business attire",
    icon: Briefcase,
  },
  {
    id: "streetwear",
    label: "Street",
    description: "Urban style",
    icon: GraduationCap,
  },
  {
    id: "athletic",
    label: "Athletic",
    description: "Sports wear",
    icon: Zap,
  },
];

export const StyleSelector = ({ selected, onSelect }: StyleSelectorProps) => {
  return (
    <div className="grid grid-cols-4 gap-3 w-full max-w-2xl mx-auto">
      {styleOptions.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={cn(
            "flex flex-col items-center p-3 rounded-xl border transition-all duration-200",
            selected === option.id
              ? "border-[#F97316] bg-[#F97316]/10 text-white"
              : "border-white/10 hover:border-white/20 text-gray-400 hover:text-white"
          )}
        >
          <option.icon className="w-6 h-6 mb-1" />
          <span className="text-sm font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );
};