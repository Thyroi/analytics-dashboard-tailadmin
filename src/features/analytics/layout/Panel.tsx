"use client";

import { motion } from "motion/react";
import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function Panel({ children, className = "" }: Props) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div
        className={`bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6 space-y-6 border-l-4 border-red-600 mt-8 ${className}`}
      >
        {children}
      </div>
    </motion.div>
  );
}
