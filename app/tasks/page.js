"use client";

import { motion } from "framer-motion";

export default function TasksPage() {
  return (
    <div className="container py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold gradient-text">Tasks</h1>
        <p className="text-text-muted">Manage your to-dos and reminders.</p>
      </header>
      <div className="flex items-center justify-center h-64 border border-dashed border-gray-700 rounded-lg text-text-muted">
        Task Manager Coming Soon
      </div>
    </div>
  );
}
