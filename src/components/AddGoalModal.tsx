import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrency } from '@/hooks/useCurrency';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (goal: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    icon: string;
    color: string;
  }) => void;
}

const GOAL_ICONS = ['🏠', '🚗', '✈️', '📱', '💻', '🎓', '💍', '🏖️', '🎮', '👗', '💪', '🎯'];

export function AddGoalModal({ isOpen, onClose, onAdd }: AddGoalModalProps) {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');

  const handleSubmit = () => {
    if (!name || !targetAmount) return;

    onAdd({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: 0,
      icon: selectedIcon,
      color: 'hsl(38 92% 50%)',
    });

    setName('');
    setTargetAmount('');
    setSelectedIcon('🎯');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl z-50 p-6 pb-8 max-h-[85vh] overflow-y-auto"
          >
            <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-bold">{t('goals.new')}</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Icon Selection */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  {t('goals.icon')}
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {GOAL_ICONS.map((icon) => (
                    <motion.button
                      key={icon}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedIcon(icon)}
                      className={`flex items-center justify-center p-3 rounded-xl transition-all text-2xl ${
                        selectedIcon === icon
                          ? 'bg-primary shadow-glow'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {icon}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('goals.name')}
                </label>
                <Input
                  placeholder={t('goals.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl h-12"
                />
              </div>

              {/* Target Amount Input */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  {t('goals.targetAmount')}
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="100000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="text-2xl font-bold h-14 text-center border-2 rounded-xl"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!name || !targetAmount}
                className="w-full h-14 text-lg font-semibold rounded-xl gradient-savings text-white hover:opacity-90 transition-opacity"
              >
                {t('goals.create')}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
