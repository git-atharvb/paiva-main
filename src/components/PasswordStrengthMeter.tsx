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
    height: '4px',
    borderRadius: '2px',
    transition: 'all 0.3s ease-in-out'
  });

  return (
    <div className="password-strength-container" style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
      <div className="progress-bg" style={{ background: 'rgba(255, 255, 255, 0.1)', height: '4px', borderRadius: '2px', width: '100%' }}>
        <div className="progress-bar" style={changePasswordColor()} />
      </div>
      {password && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <span style={{ fontSize: '0.75rem', color: funcProgressColor(), fontWeight: 600 }}>
            {createPassLabel()}
          </span>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
