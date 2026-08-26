import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "../../../theme";

export interface VirtualCard {
  id: string;
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  type: "DEBIT" | "CREDIT";
  balance: string;
  gradient: string;
  brand: "mastercard" | "visa";
}

const DEFAULT_CARDS: VirtualCard[] = [
  {
    id: "card-1",
    cardNumber: "1478 2255 4595 9874",
    cardHolder: "Eler Minton",
    expiry: "12/24",
    type: "DEBIT",
    balance: "₹3,851.59",
    gradient: "from-purple-600 via-indigo-600 to-purple-800",
    brand: "mastercard",
  },
  {
    id: "card-2",
    cardNumber: "4532 9988 1234 5678",
    cardHolder: "Rajesh Kumar",
    expiry: "09/27",
    type: "CREDIT",
    balance: "₹12,450.00",
    gradient: "from-amber-600 via-yellow-600 to-amber-800",
    brand: "mastercard",
  },
  {
    id: "card-3",
    cardNumber: "5412 7700 8899 3322",
    cardHolder: "RoomBae Pass",
    expiry: "01/29",
    type: "DEBIT",
    balance: "₹8,500.00",
    gradient: "from-emerald-600 via-teal-600 to-emerald-800",
    brand: "visa",
  },
];

interface FintechCardCarouselProps {
  onPayClick?: () => void;
  onSelectCardAmount?: (amt: number) => void;
}

export const FintechCardCarousel: React.FC<FintechCardCarouselProps> = ({
  onPayClick,
  onSelectCardAmount: _onSelectCardAmount,
}) => {
  const { darkMode } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeType, setActiveType] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [showFullNumber, setShowFullNumber] = useState(false);

  const currentCard = DEFAULT_CARDS[activeIndex];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % DEFAULT_CARDS.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + DEFAULT_CARDS.length) % DEFAULT_CARDS.length);
  };

  const cardBg = darkMode ? "bg-[#252525] border-[#2e2e2e]" : "bg-[#ffffff] border-[#dddddd]";
  const textPrimary = darkMode ? "text-[#f7f7f7]" : "text-[#222222]";
  const textMuted = darkMode ? "text-[#a1a1aa]" : "text-[#6a6a6a]";

  return (
    <div className={`p-6 rounded-3xl border shadow-xl backdrop-blur-xl ${cardBg}`}>
      {/* Top Header & Total Balance */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className={`text-xs font-semibold uppercase tracking-wider ${textMuted}`}>
            Total Balance
          </span>
          <h2 className={`text-3xl font-black mt-0.5 tracking-tight ${textPrimary}`}>
            {currentCard.balance}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFullNumber(!showFullNumber)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              darkMode ? "bg-[#1e1e1e] border-[#2e2e2e] text-[#a1a1aa] hover:text-white" : "bg-[#f7f7f7] border-[#dddddd] text-[#6a6a6a] hover:text-black"
            }`}
            title="Toggle Card Number Visibility"
          >
            {showFullNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Animated Card Display Stack */}
      <div className="relative my-4 h-52 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.id}
            initial={{ opacity: 0, scale: 0.9, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`w-full max-w-sm h-48 rounded-2xl p-6 bg-gradient-to-tr ${currentCard.gradient} text-white shadow-2xl relative flex flex-col justify-between overflow-hidden border border-white/20 select-none`}
          >
            <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="flex justify-between items-start z-10">
              <span className="text-[11px] font-bold tracking-widest uppercase opacity-80">
                {currentCard.type} CARD
              </span>
              <span className="text-xs font-mono font-semibold tracking-wider bg-white/15 px-2 py-0.5 rounded-full border border-white/20">
                {currentCard.expiry}
              </span>
            </div>

            <div className="my-2 z-10">
              <p className="font-mono text-lg tracking-[0.2em] font-semibold drop-shadow-md">
                {showFullNumber
                  ? currentCard.cardNumber
                  : `•••• •••• •••• ${currentCard.cardNumber.slice(-4)}`}
              </p>
            </div>

            <div className="flex justify-between items-end z-10">
              <div>
                <span className="text-[9px] uppercase tracking-wider opacity-70 block">
                  Card Holder
                </span>
                <p className="font-bold text-sm tracking-wide">{currentCard.cardHolder}</p>
              </div>

              <div className="flex items-center gap-1">
                {currentCard.brand === "mastercard" ? (
                  <div className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-red-500/90 shadow-sm" />
                    <div className="w-6 h-6 rounded-full bg-amber-400/90 -ml-3 shadow-sm" />
                  </div>
                ) : (
                  <span className="font-extrabold italic text-lg tracking-wider">VISA</span>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          onClick={handlePrev}
          className="absolute left-0 p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 cursor-pointer z-20"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="absolute right-0 p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 cursor-pointer z-20"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 mt-4">
        <div className={`flex items-center p-1 rounded-2xl border ${darkMode ? "bg-[#1e1e1e] border-[#2e2e2e]" : "bg-[#f7f7f7] border-[#dddddd]"}`}>
          <button
            type="button"
            onClick={() => setActiveType("DEBIT")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeType === "DEBIT"
                ? "bg-purple-600 text-white shadow-md"
                : textMuted
            }`}
          >
            Debit
          </button>
          <button
            type="button"
            onClick={() => setActiveType("CREDIT")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeType === "CREDIT"
                ? "bg-purple-600 text-white shadow-md"
                : textMuted
            }`}
          >
            Credit
          </button>
        </div>

        {onPayClick && (
          <button
            type="button"
            onClick={onPayClick}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition-all cursor-pointer"
          >
            Pay Rent Now ⚡
          </button>
        )}
      </div>
    </div>
  );
};
