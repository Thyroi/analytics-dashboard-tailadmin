import { motion } from "motion/react";

type ActivityButtonProps = {
  target: string;
};

const ActivityButton = ({ target }: ActivityButtonProps) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 0 0 0 rgba(220, 38, 38, 0.4)",
            "0 0 0 8px rgba(220, 38, 38, 0)",
            "0 0 0 0 rgba(220, 38, 38, 0)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs border border-red-300 font-medium"
      >
        ✨ Haz clic en cualquier {target}
      </motion.div>
    </div>
  );
};

export default ActivityButton;
