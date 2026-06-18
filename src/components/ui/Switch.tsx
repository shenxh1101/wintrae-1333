import { cn } from '@/lib/utils';
import { forwardRef, InputHTMLAttributes, ChangeEvent } from 'react';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  labelPosition?: 'left' | 'right';
  onChange?: (checked: boolean) => void;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, labelPosition = 'right', checked, onChange, disabled, ...props }, ref) => {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
    };

    return (
      <label
        className={cn(
          'inline-flex items-center gap-3 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          labelPosition === 'left' && 'flex-row-reverse',
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors duration-200',
            'bg-gray-200 peer-checked:bg-primary-600',
            'peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500/30'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm',
              'transition-transform duration-200',
              'peer-checked:translate-x-5'
            )}
          />
        </div>
        {label && <span className="text-sm text-gray-700 select-none">{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
