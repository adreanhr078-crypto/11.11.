/**
 * ShopOverlay.tsx — طبقة متجر مخصصة لا تعتمد على Dialog
 * تظهر كOverlay فوق المحتوى عند فتح المتجر من الشريط الجانبي
 */

import React from 'react';
import { useGameStore, type GameState } from '../../stores/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../ui/Icon';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';

interface ShopOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShopItem {
  id: string;
  icon: string;
  label: string;
  description: string;
  price: number;
  currency: 'coins' | 'crystals';
  action: 'buyHint' | 'skipPuzzle' | 'rerollPuzzle';
  canBuy: (state: GameState) => boolean;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'hint',
    icon: '💡',
    label: 'تلميح قوي',
    description: 'التلميح الثالث للغز الحالي',
    price: 50,
    currency: 'coins',
    action: 'buyHint',
    canBuy: (state) => !!state.puzzles.some(p => p.status === 'active') && state.echo.coins >= 50,
  },
  {
    id: 'skip',
    icon: '⏭️',
    label: 'تخطي',
    description: 'تخطي اللغز الحالي',
    price: 100,
    currency: 'coins',
    action: 'skipPuzzle',
    canBuy: (state) => !!state.puzzles.some(p => p.status === 'active') && state.echo.coins >= 100,
  },
  {
    id: 'reroll',
    icon: '🔄',
    label: 'تبديل لغز',
    description: 'استبدال بلغز أسهل',
    price: 150,
    currency: 'coins',
    action: 'rerollPuzzle',
    canBuy: (state) => !!state.puzzles.some(p => p.status === 'active') && state.echo.coins >= 150,
  },
];

export const ShopOverlay: React.FC<ShopOverlayProps> = ({ isOpen, onClose }) => {
  const state = useGameStore.getState();
  const { echo, puzzles, actions, shopPrices } = useGameStore();
  const activePuzzle = puzzles.find(p => p.status === 'active');

  const flash = (msg: string) => {
    // handled inline via store actions returning messages
  };

  const handleBuy = (action: ShopItem['action']) => {
    if (!activePuzzle) return;
    const currentState = useGameStore.getState();
    const item = SHOP_ITEMS.find(s => s.action === action);
    if (!item) return;
    if (!item.canBuy(currentState)) return;

    let result: { success: boolean; message: string } | null = null;
    switch (action) {
      case 'buyHint':
        result = actions.buyHint(activePuzzle.id);
        break;
      case 'skipPuzzle':
        result = actions.skipPuzzle(activePuzzle.id);
        break;
      case 'rerollPuzzle':
        result = actions.rerollPuzzle(activePuzzle.id);
        break;
    }
    if (result && !result.success) {
      // feedback could be shown via toast if needed
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="shop-overlay-root">
          <motion.div
            className="shop-overlay-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="shop-overlay-panel"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            <div className="shop-overlay-header">
              <div>
                <h2 className="shop-overlay-title">🏪 المتجر</h2>
                <p className="shop-overlay-desc">استخدم العملات لشراء مساعدات الألغاز</p>
              </div>
              <button className="shop-overlay-close" onClick={onClose}>✕</button>
            </div>

            <Separator />

            <div className="shop-balance">
              <div className="shop-balance-item">
                <Icon name="coin" className="h-4 w-4 text-amber-500" />
                <span className="font-bold">{echo.coins}</span>
                <span className="text-muted-foreground text-sm">عملات</span>
              </div>
              <div className="shop-balance-item">
                <Icon name="diamond" className="h-4 w-4 text-cyan-400" />
                <span className="font-bold">{echo.crystals}</span>
                <span className="text-muted-foreground text-sm">كريستال</span>
              </div>
            </div>

            <Separator />

            <div className="shop-items">
              {SHOP_ITEMS.map(item => {
                const currentState = useGameStore.getState();
                const canBuy = item.canBuy(currentState);
                return (
                  <div
                    key={item.id}
                    className={`shop-card ${!canBuy ? 'opacity-50' : ''}`}
                  >
                    <div className="shop-card-info">
                      <span className="shop-card-icon">{item.icon}</span>
                      <div>
                        <h4 className="shop-card-title">{item.label}</h4>
                        <p className="shop-card-desc">{item.description}</p>
                      </div>
                    </div>
                    <div className="shop-card-action">
                      <span className="shop-card-price">
                        <Icon name="coin" className="h-3.5 w-3.5 text-amber-500" />
                        {item.price} 🪙
                      </span>
                      <Button
                        size="sm"
                        variant={canBuy ? 'default' : 'outline'}
                        disabled={!canBuy}
                        onClick={() => handleBuy(item.action)}
                      >
                        {canBuy ? 'شراء' : 'غير متاح'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {!activePuzzle && (
              <div className="shop-empty">
                <Icon name="info" className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">لا يوجد لغز نشط حالياً</p>
              </div>
            )}

            <Separator />
            <div className="shop-footer">
              <span>الأسعار من المتجر</span>
              <span>{echo.coins} 🪙 • {echo.crystals} 💎</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ShopOverlay;
