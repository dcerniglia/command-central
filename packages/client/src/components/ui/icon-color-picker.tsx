import { useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  Layers, MapPin, Briefcase, Code, Folder, Heart, Home,
  BookOpen, Dumbbell, DollarSign, Music, Palette, Rocket,
  Shield, Target, Wrench, Zap, Coffee, Globe, Lightbulb,
  GraduationCap, Camera, Gamepad2, Plane, ShoppingCart,
  type LucideIcon,
} from 'lucide-react';

export const ICON_OPTIONS: { value: string; icon: LucideIcon }[] = [
  { value: 'layers', icon: Layers },
  { value: 'map-pin', icon: MapPin },
  { value: 'briefcase', icon: Briefcase },
  { value: 'code', icon: Code },
  { value: 'folder', icon: Folder },
  { value: 'heart', icon: Heart },
  { value: 'home', icon: Home },
  { value: 'book-open', icon: BookOpen },
  { value: 'dumbbell', icon: Dumbbell },
  { value: 'dollar-sign', icon: DollarSign },
  { value: 'music', icon: Music },
  { value: 'palette', icon: Palette },
  { value: 'rocket', icon: Rocket },
  { value: 'shield', icon: Shield },
  { value: 'target', icon: Target },
  { value: 'wrench', icon: Wrench },
  { value: 'zap', icon: Zap },
  { value: 'coffee', icon: Coffee },
  { value: 'globe', icon: Globe },
  { value: 'lightbulb', icon: Lightbulb },
  { value: 'graduation-cap', icon: GraduationCap },
  { value: 'camera', icon: Camera },
  { value: 'gamepad-2', icon: Gamepad2 },
  { value: 'plane', icon: Plane },
  { value: 'shopping-cart', icon: ShoppingCart },
];

export const COLOR_OPTIONS = [
  { value: 'zinc', tw: 'text-zinc-400', bg: 'bg-zinc-400' },
  { value: 'blue', tw: 'text-blue-400', bg: 'bg-blue-400' },
  { value: 'green', tw: 'text-green-400', bg: 'bg-green-400' },
  { value: 'purple', tw: 'text-purple-400', bg: 'bg-purple-400' },
  { value: 'amber', tw: 'text-amber-400', bg: 'bg-amber-400' },
  { value: 'rose', tw: 'text-rose-400', bg: 'bg-rose-400' },
  { value: 'cyan', tw: 'text-cyan-400', bg: 'bg-cyan-400' },
  { value: 'teal', tw: 'text-teal-400', bg: 'bg-teal-400' },
  { value: 'indigo', tw: 'text-indigo-400', bg: 'bg-indigo-400' },
  { value: 'orange', tw: 'text-orange-400', bg: 'bg-orange-400' },
];

export function getIconComponent(value: string | null | undefined): LucideIcon {
  return ICON_OPTIONS.find((i) => i.value === value)?.icon ?? Layers;
}

export function getColorClass(value: string | null | undefined): string {
  return COLOR_OPTIONS.find((c) => c.value === value)?.tw ?? 'text-muted-foreground';
}

interface IconColorPickerProps {
  icon: string | null;
  color: string | null;
  onChangeIcon: (icon: string) => void;
  onChangeColor: (color: string) => void;
  /** Size of the trigger icon */
  size?: 'sm' | 'md';
}

export default function IconColorPicker({
  icon, color, onChangeIcon, onChangeColor, size = 'sm',
}: IconColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const Icon = getIconComponent(icon);
  const colorClass = getColorClass(color);
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation();
    setAnchorRect(e.currentTarget.getBoundingClientRect());
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={cn('flex-shrink-0 rounded p-0.5 transition-colors hover:bg-surface-overlay', colorClass)}
        title="Change icon & color"
      >
        <Icon className={iconSize} />
      </button>

      {open && anchorRect && createPortal(
        <>
          <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 bg-surface-raised border border-border rounded-lg shadow-lg p-3 space-y-3 w-64"
            style={{
              top: anchorRect.bottom + 4,
              left: Math.min(anchorRect.left, window.innerWidth - 272),
            }}
          >
            {/* Colors */}
            <div>
              <span className="text-overline text-muted-foreground uppercase tracking-wider text-[10px]">Color</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => onChangeColor(c.value)}
                    className={cn(
                      'w-5 h-5 rounded-full transition-all',
                      c.bg,
                      color === c.value && 'ring-2 ring-foreground ring-offset-1 ring-offset-surface-raised',
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Icons */}
            <div>
              <span className="text-overline text-muted-foreground uppercase tracking-wider text-[10px]">Icon</span>
              <div className="grid grid-cols-8 gap-1 mt-1.5">
                {ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { onChangeIcon(opt.value); setOpen(false); }}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      icon === opt.value
                        ? 'bg-primary/15 text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-surface-overlay',
                    )}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
