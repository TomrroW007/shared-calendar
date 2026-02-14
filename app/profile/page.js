"use client";

import { motion } from "framer-motion";
import CosmicCard from "@/components/CosmicCard";

export default function ProfilePage() {
  return (
    <div className="container py-8 space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold gradient-text">
          My Profile
        </h1>
        <p className="text-text-muted">Settings and Team Management</p>
      </header>

      <CosmicCard>
        <div className="cosmic-card-inner">
          <h2 className="text-xl font-bold mb-4">Account</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
              <span>Subscription Plan</span>
              <span className="text-accent-cyan font-bold">Free</span>
            </div>
          </div>
        </div>
      </CosmicCard>
    </div>
  );
}
