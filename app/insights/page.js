"use client";

import { motion } from "framer-motion";
import CosmicCard from "@/components/CosmicCard";

export default function InsightsPage() {
  return (
    <div className="container py-8 space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold gradient-text mb-2">
          Pulse Insights
        </h1>
        <p className="text-text-muted">
          Your cognitive energy and schedule analytics.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CosmicCard>
          <div className="cosmic-card-inner">
            <h2 className="text-xl font-bold mb-4">Weekly Stress Level</h2>
            <div className="h-40 flex items-center justify-center text-text-muted border border-dashed border-gray-700 rounded-lg">
              Chart Placeholder
            </div>
          </div>
        </CosmicCard>

        <CosmicCard>
          <div className="cosmic-card-inner">
            <h2 className="text-xl font-bold mb-4">Meeting vs Focus</h2>
            <div className="h-40 flex items-center justify-center text-text-muted border border-dashed border-gray-700 rounded-lg">
              Chart Placeholder
            </div>
          </div>
        </CosmicCard>
      </div>

      <CosmicCard>
        <div className="cosmic-card-inner">
          <h2 className="text-xl font-bold mb-4 text-accent-cyan">
            AI Suggestions
          </h2>
          <div className="p-4 bg-white/5 rounded-lg border border-accent-cyan/20">
            <p className="text-sm">
              💡 You have 4 hours of continuous meetings next Tuesday. Consider
              booking a 30-min break.
            </p>
          </div>
        </div>
      </CosmicCard>
    </div>
  );
}
