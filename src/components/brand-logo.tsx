import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ className, priority }: BrandLogoProps) {
  return (
    <Image
      src="/zoko-momo-logo.png"
      alt="Zoko Momo"
      width={512}
      height={512}
      priority={priority}
      className={cn(
        'rounded-full object-cover shadow-lg shadow-black/50 ring-1 ring-white/10',
        className
      )}
    />
  );
}
