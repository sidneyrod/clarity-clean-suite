import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import arkeliumLogoDark from '@/assets/arkelium-logo-dark.png';
import arkeliumLogoLight from '@/assets/arkelium-logo-light.png';

interface ArkeliumIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Arkelium platform icon - Theme-adaptive logo.
 * Uses green logo for dark theme and white logo for light theme.
 */
const ArkeliumIcon = ({ className, size = 'md' }: ArkeliumIconProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <img
      src={isDark ? arkeliumLogoDark : arkeliumLogoLight}
      alt="Arkelium"
      className={cn(sizeClasses[size], 'object-contain', className)}
    />
  );
};

export default ArkeliumIcon;
