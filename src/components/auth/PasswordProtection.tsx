import React, { useState } from 'react';
import './PasswordProtection.scss';

interface PasswordProtectionProps {
    onAuthenticate: (password: string) => boolean;
    title?: string;
    subtitle?: string;
    placeholder?: string;
    errorMessage?: string;
}

export const PasswordProtection: React.FC<PasswordProtectionProps> = ({
    onAuthenticate,
    title = '🔐 Protected Access',
    subtitle = 'Enter password to access this section',
    placeholder = 'Enter password...',
    errorMessage = 'Incorrect password. Please try again.',
}) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password.trim()) {
            setError('Password is required');
            return;
        }

        setIsLoading(true);
        setError('');

        // Small delay for better UX
        setTimeout(() => {
            const isValid = onAuthenticate(password);

            if (!isValid) {
                setError(errorMessage);
                setPassword('');
            }

            setIsLoading(false);
        }, 500);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (error) setError(''); // Clear error when user starts typing
    };

    return (
        <div className='password-protection'>
            <div className='password-protection__container'>
                <div className='password-protection__header'>
                    <h2 className='password-protection__title'>{title}</h2>
                    <p className='password-protection__subtitle'>{subtitle}</p>
                </div>

                <form className='password-protection__form' onSubmit={handleSubmit}>
                    <div className='password-protection__input-group'>
                        <input
                            type='password'
                            value={password}
                            onChange={handlePasswordChange}
                            placeholder={placeholder}
                            className={`password-protection__input ${error ? 'password-protection__input--error' : ''}`}
                            disabled={isLoading}
                            autoFocus
                        />
                        {error && <div className='password-protection__error'>❌ {error}</div>}
                    </div>

                    <button
                        type='submit'
                        className='password-protection__submit'
                        disabled={isLoading || !password.trim()}
                    >
                        {isLoading ? (
                            <>
                                <span className='password-protection__spinner'></span>
                                Verifying...
                            </>
                        ) : (
                            <>🔓 Access</>
                        )}
                    </button>
                </form>

                <div className='password-protection__footer'>
                    <p className='password-protection__hint'>
                        💡{' '}
                        {subtitle.includes('premium')
                            ? 'Contact Elvis Trades for premium access'
                            : 'Contact Elvis Trades for access credentials'}
                    </p>
                </div>
            </div>
        </div>
    );
};
