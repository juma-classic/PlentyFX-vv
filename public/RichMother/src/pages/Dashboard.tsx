import { motion } from 'framer-motion';
import { Activity, Wifi, WifiOff, Home, TrendingUp, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const Dashboard = () => {
  const navigate = useNavigate();

  const signalTypes = [
    {
      title: 'Even/Odd Signals',
      description: 'Predict whether the last digit will be even or odd based on pattern analysis',
      icon: Activity,
      route: '/signals/even-odd',
      gradient: 'from-even to-odd',
      bgGlow: 'bg-even/10'
    },
    {
      title: 'Over/Under Signals',
      description: 'Predict high (5-9) or low (0-4) digits with recommended entry runs',
      icon: TrendingUp,
      route: '/signals/over-under',
      gradient: 'from-over to-under',
      bgGlow: 'bg-over/10'
    },
    {
      title: 'Digit Match Signals',
      description: 'Identify the most frequently occurring digit for match predictions',
      icon: Hash,
      route: '/signals/digit-match',
      gradient: 'from-match to-primary',
      bgGlow: 'bg-match/10'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 glass border-b border-border"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Digit Hacker</h1>
                <p className="text-xs text-muted-foreground">Choose Your Signal Type</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-foreground mb-3">Select Signal Type</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Choose the prediction type you want to analyze. Each page shows real-time signals 
            for all 5 volatility indices with a 30s scan and 20s signal window.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {signalTypes.map((signal, index) => (
            <motion.div
              key={signal.route}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              onClick={() => navigate(signal.route)}
              className="glass rounded-2xl p-6 cursor-pointer hover:scale-105 transition-transform duration-300 group"
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${signal.gradient} flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform`}>
                <signal.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 text-center">
                {signal.title}
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                {signal.description}
              </p>
              <div className="mt-4 flex justify-center">
                <span className="text-xs text-primary font-medium group-hover:underline">
                  View Signals →
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 glass rounded-2xl p-6 text-center max-w-2xl mx-auto"
        >
          <h3 className="text-lg font-semibold text-foreground mb-2">
            How It Works
          </h3>
          <p className="text-sm text-muted-foreground">
            Each signal type scans the market for <strong>30 seconds</strong> to collect tick data, 
            then displays a signal for <strong>20 seconds</strong> before scanning again. 
            This cycle ensures you get fresh, accurate predictions based on the latest 30 ticks.
          </p>
        </motion.div>
      </main>
    </div>
  );
};
