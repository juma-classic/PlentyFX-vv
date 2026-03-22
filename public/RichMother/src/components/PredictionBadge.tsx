import { motion } from 'framer-motion';

interface PredictionBadgeProps {
  type: 'even' | 'odd' | 'over' | 'under' | 'match';
  label: string;
  confidence: number;
  sublabel?: string;
  isPulsing?: boolean;
}

const colorMap = {
  even: {
    bg: 'bg-even/20',
    border: 'border-even/40',
    text: 'text-even',
    glow: 'shadow-even/30'
  },
  odd: {
    bg: 'bg-odd/20',
    border: 'border-odd/40',
    text: 'text-odd',
    glow: 'shadow-odd/30'
  },
  over: {
    bg: 'bg-over/20',
    border: 'border-over/40',
    text: 'text-over',
    glow: 'shadow-over/30'
  },
  under: {
    bg: 'bg-under/20',
    border: 'border-under/40',
    text: 'text-under',
    glow: 'shadow-under/30'
  },
  match: {
    bg: 'bg-match/20',
    border: 'border-match/40',
    text: 'text-match',
    glow: 'shadow-match/30'
  }
};

export const PredictionBadge = ({ 
  type, 
  label, 
  confidence, 
  sublabel,
  isPulsing = false 
}: PredictionBadgeProps) => {
  const colors = colorMap[type];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        ${colors.bg} ${colors.border} border rounded-xl p-3
        ${isPulsing ? 'shadow-lg ' + colors.glow : ''}
      `}
    >
      <motion.div
        animate={isPulsing ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex items-center justify-between"
      >
        <div>
          <div className={`text-lg font-bold ${colors.text}`}>
            {label}
          </div>
          {sublabel && (
            <div className="text-xs text-muted-foreground">{sublabel}</div>
          )}
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold font-mono ${colors.text}`}>
            {confidence}%
          </div>
          <div className="text-xs text-muted-foreground">confidence</div>
        </div>
      </motion.div>
    </motion.div>
  );
};
