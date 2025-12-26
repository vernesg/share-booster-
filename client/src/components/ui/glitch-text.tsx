import { motion } from "framer-motion";

interface GlitchTextProps {
  text: string;
  className?: string;
}

export function GlitchText({ text, className = "" }: GlitchTextProps) {
  return (
    <div className={`relative inline-block group ${className}`}>
      <span className="relative z-10">{text}</span>
      <motion.span
        className="absolute top-0 left-0 -z-10 text-primary opacity-0 group-hover:opacity-70"
        animate={{
          x: [0, -2, 2, -1, 0],
          y: [0, 1, -1, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 0.2,
          repeatType: "mirror",
        }}
      >
        {text}
      </motion.span>
      <motion.span
        className="absolute top-0 left-0 -z-10 text-accent opacity-0 group-hover:opacity-70"
        animate={{
          x: [0, 2, -2, 1, 0],
          y: [0, -1, 1, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 0.3,
          repeatType: "mirror",
        }}
      >
        {text}
      </motion.span>
    </div>
  );
}
