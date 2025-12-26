import logoImg from '@/assets/logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo = ({ size = 'md', showText = true }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <img 
        src={logoImg} 
        alt="The Urban Rewind" 
        className={`${sizeClasses[size]} object-contain`}
      />
      {showText && (
        <h1 className={`font-oswald font-bold uppercase tracking-wider gradient-text ${textSizeClasses[size]}`}>
          The Urban Rewind
        </h1>
      )}
    </div>
  );
};

export default Logo;
