import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface BodyBasicsStepProps {
  onNext: (data: { age_range: string; height: string; size: string }) => void;
  onBack: () => void;
}

const AGE_OPTIONS = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55+"];
const HEIGHT_OPTIONS = [
  'Under 5\'0"',
  '5\'0"\u20135\'3"',
  '5\'4"\u20135\'7"',
  '5\'8"\u20136\'0"',
  '6\'1"+',
];
const SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "2XL+"];

const AGE_MAP: Record<string, string> = {
  "Under 18": "under_18",
  "18–24": "18-24",
  "25–34": "25-34",
  "35–44": "35-44",
  "45–54": "45-54",
  "55+": "55_plus",
};

const HEIGHT_MAP: Record<string, string> = {
  'Under 5\'0"': "under_152cm",
  '5\'0"\u20135\'3"': "152-160cm",
  '5\'4"\u20135\'7"': "163-170cm",
  '5\'8"\u20136\'0"': "173-183cm",
  '6\'1"+': "over_185cm",
};

export const BodyBasicsStep = ({ onNext, onBack }: BodyBasicsStepProps) => {
  const [age, setAge] = useState<string | null>(null);
  const [height, setHeight] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);

  const allSelected = age !== null && height !== null && size !== null;

  const handleNext = () => {
    if (!allSelected) return;
    onNext({
      age_range: AGE_MAP[age!] || age!,
      height: HEIGHT_MAP[height!] || height!,
      size: size!,
    });
  };

  const ChipRow = ({
    label,
    options,
    selected,
    onSelect,
  }: {
    label: string;
    options: string[];
    selected: string | null;
    onSelect: (value: string) => void;
  }) => (
    <div className="mb-5">
      <p className="text-sm font-semibold text-gray-500 mb-2.5">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {options.map((opt) => {
          const isActive = selected === opt;
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`flex-shrink-0 px-4 h-[42px] rounded-xl text-[15px] font-medium transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? "bg-black text-white shadow-sm"
                  : "bg-[#F7F7FB] text-black hover:bg-gray-100"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "-100%" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="screen-safe app-content bg-white flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center px-6 pt-14 pb-2">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={18} strokeWidth={2.4} />
        </motion.button>

        <div className="flex-1 flex justify-start ml-3">
          <div className="w-full max-w-[280px] h-[3px] bg-gray-200 rounded-full relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "28%" }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="absolute left-0 top-0 h-full bg-black rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Title + subtitle */}
      <div className="px-6 mt-4">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[28px] font-bold text-black"
        >
          A few quick basics
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 0.7, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-[16px] text-black opacity-70 mt-2 leading-relaxed"
        >
          This helps us get sizing and fit right.
        </motion.p>
      </div>

      {/* Chip rows */}
      <div className="flex-1 overflow-y-auto px-6 mt-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChipRow label="Age" options={AGE_OPTIONS} selected={age} onSelect={setAge} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChipRow label="Height" options={HEIGHT_OPTIONS} selected={height} onSelect={setHeight} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChipRow label="Size" options={SIZE_OPTIONS} selected={size} onSelect={setSize} />
        </motion.div>
      </div>

      {/* Next button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="px-6 pb-safe-button"
      >
        <motion.button
          disabled={!allSelected}
          whileTap={allSelected ? { scale: 0.98 } : {}}
          onClick={handleNext}
          className={`w-full h-[56px] rounded-2xl text-[17px] font-semibold transition-all duration-200 ${
            allSelected
              ? "bg-black text-white hover:bg-gray-900"
              : "bg-gray-300 text-white cursor-not-allowed"
          }`}
        >
          Next
        </motion.button>
      </motion.div>
    </motion.div>
  );
};
