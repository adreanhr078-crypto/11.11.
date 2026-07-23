/**
 * ShopPanel.tsx — واجهة المتجر لشراء التلميحات وتخطي الألغاز
 * يستخدم أنظمة العملات الموجودة في gameStore
 */

import React from 'react';
import { useGameStore, type GameState } from '../../stores/gameStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import Icon from '../ui/Icon';

interface ShopPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShopItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  price: number;
  currency: 'coins' | 'crystals';
  action: 'buyHint' | 'skipPuzzle' | 'rerollPuzzle';
  getDisabled: (state: GameState) => boolean;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'hint',
    icon: '💡',
    title: 'تلميح',
    description: 'احصل على التلميح الثالث للغز الحالي',
    price: 50,
    currency: 'coins',
    action: 'buyHint',
    getDisabled: (state) => !state.puzzles.some(p => p.status === 'active'),
  },
  {
    id: 'extra-hint',
    icon: '📝',
    title: 'تلميح إضافي',
    description: 'احصل على تلميح إضافي للغز الحالي',
    price: 30,
    currency: 'coins',
    action: 'buyHint',
    getDisabled: (state) => !state.puzzles.some(p => p.status === 'active'),
  },
  {
    id: 'skip',
    icon: '⏭️',
    title: 'تخطي اللغز',
    description: 'تخطي اللغز الحالي والانتقال للذي يليه',
    price: 100,
    currency: 'coins',
    action: 'skipPuzzle',
    getDisabled: (state) => !state.puzzles.some(p => p.status === 'active'),
  },
  {
    id: 'reroll',
    icon: '🔄',
    title: 'تبديل اللغز',
    description: 'استبدال اللغز الحالي بلغز أسهل',
    price: 150,
    currency: 'coins',
    action: 'rerollPuzzle',
    getDisabled: (state) => !state.puzzles.some(p => p.status === 'active'),
  },
];

export const ShopPanel: React.FC<ShopPanelProps> = ({ isOpen, onClose }) => {
  const state = useGameStore.getState();
  const { echo, puzzles, actions } = useGameStore();
  const { coins, crystals } = echo;
  const { buyHint, skipPuzzle, rerollPuzzle } = actions;

  const activePuzzle = puzzles.find(p => p.status === 'active');
  const hasActivePuzzle = !!activePuzzle;

  const handleBuy = (action: string) => {
    if (!activePuzzle) return;
    switch (action) {
      case 'buyHint':
        buyHint(activePuzzle.id);
        break;
      case 'skipPuzzle':
        skipPuzzle(activePuzzle.id);
        break;
      case 'rerollPuzzle':
        rerollPuzzle(activePuzzle.id);
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="shop-panel max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🏪</span>
            المتجر
          </DialogTitle>
          <DialogDescription>
            استخدم العملات والكريستالات لشراء التلميحات وتخطي الألغاز
          </DialogDescription>
        </DialogHeader>

        <div className="shop-balance flex items-center justify-between p-4 bg-muted/50 rounded-lg mb-4">
          <div className="flex items-center gap-2">
            <Icon name="coin" className="h-5 w-5 text-amber-500" />
            <span className="font-bold text-lg">{coins}</span>
            <span className="text-muted-foreground text-sm">عملات</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="diamond" className="h-5 w-5 text-cyan-400" />
            <span className="font-bold text-lg">{crystals}</span>
            <span className="text-muted-foreground text-sm">كريستال</span>
          </div>
        </div>

        <Separator className="mb-4" />

        <div className="shop-items space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {SHOP_ITEMS.map(item => {
            const itemState = useGameStore.getState();
            const isDisabled = item.getDisabled(itemState);
            const canAfford = item.currency === 'coins'
              ? itemState.echo.coins >= item.price
              : itemState.echo.crystals >= item.price;
            const disabled = isDisabled || !canAfford;

            return (
              <div
                key={item.id}
                className={`shop-item flex items-center justify-between p-4 bg-card border border-border rounded-lg transition-all ${disabled ? 'opacity-50' : 'hover:border-primary/50'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="shop-item-icon w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm">
                    {item.currency === 'coins' ? (
                      <>
                        <Icon name="coin" className="h-4 w-4 text-amber-500" />
                        <span className="font-semibold text-amber-500">{item.price}</span>
                      </>
                    ) : (
                      <>
                        <Icon name="diamond" className="h-4 w-4 text-cyan-400" />
                        <span className="font-semibold text-cyan-400">{item.price}</span>
                      </>
                    )}
                  </div>

                  <Button
                    variant={disabled ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => !disabled && handleBuy(item.action)}
                    disabled={disabled}
                    className="whitespace-nowrap"
                  >
                    {disabled && !canAfford ? 'غير كافٍ' : disabled ? 'غير متاح' : 'شراء'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {!hasActivePuzzle && (
          <div className="mt-4 p-4 bg-muted/50 border border-border rounded-lg text-center text-muted-foreground">
            <Icon name="info" className="mx-auto h-5 w-5 mb-2" />
            <p className="text-sm">لا يوجد لغز نشط حالياً. ابدأ بحل لغز لاستخدام المتجر.</p>
          </div>
        )}

        <Separator className="my-4" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>الأسعار قابلة للتغيير</span>
          <span>الرصيد: {coins} 🪙 • {crystals} 💎</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShopPanel;
