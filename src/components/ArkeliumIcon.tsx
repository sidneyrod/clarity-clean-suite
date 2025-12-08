import { cn } from '@/lib/utils';
import arkeliumLogo from '@/assets/arkelium-logo.png';

interface ArkeliumIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Arkelium platform icon - Golden logo used for both themes.
 * Single image eliminates delay when switching themes.
 */
const ArkeliumIcon = ({ className, size = 'md' }: ArkeliumIconProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <img
      src={arkeliumLogo}
      alt="Arkelium"
      className={cn(sizeClasses[size], 'object-contain', className)}
    />
  );
};

export default ArkeliumIcon;
