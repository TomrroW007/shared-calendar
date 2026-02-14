"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

export default function PulseSummary() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-bg-secondary/50 backdrop-blur-lg border border-accent-cyan/20 rounded-2xl cosmic-card-shine"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-cyan/10 flex items-center justify-center border border-accent-cyan/30 text-accent-cyan">
            <Sparkles size={16} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-white">Quantum Pulse</h3>
            <p className="text-xs text-text-muted font-tech tracking-wider">
              AI ANALYSIS
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="text-text-muted" />
        ) : (
          <ChevronDown size={16} className="text-text-muted" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-sm text-text-secondary leading-relaxed">
                <span className="text-accent-cyan font-bold">
                  Weekly Insight:
                </span>{" "}
                Your schedule is heavily loaded (75% occupancy).{" "}
                <span className="text-accent-primary">Wednesday</span> appears
                to be the high-pressure point. Suggest keeping Thursday evening
                open for recovery.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
