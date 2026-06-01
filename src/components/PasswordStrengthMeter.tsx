import React from 'react';
import zxcvbn from 'zxcvbn';

interface PasswordStrengthMeterProps {
  password?: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password = '' }) => {
  const result = zxcvbn(password);
  const score = result.score; // 0 to 4

  const createPassLabel = () => {
    switch (score) {
      case 0:
        return 'Very Weak';
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return '';
    }
  };

  const funcProgressColor = () => {
    switch (score) {
      case 0:
        return '#ff4d4f';
      case 1:
        return '#ff4d4f';
      case 2:
        return '#faad14';
      case 3:
        return '#52c41a';
      case 4:
        return '#52c41a';
      default:
        return 'none';
    }
  };

  const changePasswordColor = () => ({
    width: password.length === 0 ? '0%' : `${(score + 1) * 20}%`,
    background: funcProgressColor(),
  });

  return (
    <div className="mt-2 mb-4 w-full">
      <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
        <div 
          className="h-full rounded-full transition-all duration-500 ease-out" 
          style={changePasswordColor()} 
        />
      </div>
      {password && (
        <div className="flex justify-end mt-1.5">
          <span 
            className="text-xs font-semibold"
            style={{ color: funcProgressColor() }}
          >
            {createPassLabel()}
          </span>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
