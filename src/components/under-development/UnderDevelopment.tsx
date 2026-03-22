import React, { useState } from 'react';
import './UnderDevelopment.scss';

interface UnderDevelopmentProps {
    featureName: string;
    onNavigateBack?: () => void;
}

export const UnderDevelopment: React.FC<UnderDevelopmentProps> = ({ featureName, onNavigateBack }) => {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);

    const handleNotifyMe = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            // Store email in localStorage for now
            const subscribers = JSON.parse(localStorage.getItem('feature_subscribers') || '[]');
            subscribers.push({ email, feature: featureName, date: new Date().toISOString() });
            localStorage.setItem('feature_subscribers', JSON.stringify(subscribers));
            setSubscribed(true);
            setEmail('');
        }
    };

    const handleContactClick = (type: 'whatsapp' | 'telegram' | 'call') => {
        const phone = '254745536264'; // Kenya format
        switch (type) {
            case 'whatsapp':
                window.open(`https://wa.me/${phone}?text=Hi Elvis, I'm interested in ${featureName}`, '_blank');
                break;
            case 'telegram':
                window.open('https://t.me/ElvisTrades', '_blank');
                break;
            case 'call':
                window.location.href = `tel:+${phone}`;
                break;
        }
    };

    const handleNavigateBack = () => {
        if (onNavigateBack) {
            onNavigateBack();
        } else {
            // Default: go to Dashboard (tab 0)
            window.dispatchEvent(new CustomEvent('switch.tab', { detail: { tabIndex: 0 } }));
        }
    };

    return (
        <div className='under-development'>
            <button className='back-button' onClick={handleNavigateBack} title='Go Back'>
                <svg viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z' />
                </svg>
                Back to Dashboard
            </button>
            <div className='under-development__content'>
                <div className='under-development__icon-wrapper'>
                    <div className='under-development__icon'>🚧</div>
                    <div className='under-development__icon-glow'></div>
                </div>

                <h2 className='under-development__title'>Under Development</h2>

                <div className='under-development__badge'>
                    <span className='under-development__badge-text'>Coming Soon</span>
                </div>

                <p className='under-development__message'>
                    The <strong>{featureName}</strong> feature is currently under development and will be available
                    soon.
                </p>

                <div className='under-development__features'>
                    <h3>What to Expect:</h3>
                    <ul>
                        <li>
                            <span className='feature-icon'>⚡</span>
                            <span>Advanced trading algorithms</span>
                        </li>
                        <li>
                            <span className='feature-icon'>📊</span>
                            <span>Real-time market analysis</span>
                        </li>
                        <li>
                            <span className='feature-icon'>🎯</span>
                            <span>High-accuracy predictions</span>
                        </li>
                        <li>
                            <span className='feature-icon'>🤖</span>
                            <span>Automated trading strategies</span>
                        </li>
                    </ul>
                </div>

                {!subscribed ? (
                    <form className='under-development__notify' onSubmit={handleNotifyMe}>
                        <h3>Get Notified When It&apos;s Ready</h3>
                        <div className='notify-input-group'>
                            <input
                                type='email'
                                placeholder='Enter your email'
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                            <button type='submit'>Notify Me</button>
                        </div>
                    </form>
                ) : (
                    <div className='under-development__success'>
                        <span className='success-icon'>✅</span>
                        <p>Thanks! We&apos;ll notify you when {featureName} is ready.</p>
                    </div>
                )}

                <div className='under-development__contact-buttons'>
                    <button
                        className='contact-btn whatsapp'
                        onClick={() => handleContactClick('whatsapp')}
                        title='Chat on WhatsApp'
                    >
                        <svg viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z' />
                        </svg>
                        WhatsApp
                    </button>
                    <button
                        className='contact-btn telegram'
                        onClick={() => handleContactClick('telegram')}
                        title='Join Telegram'
                    >
                        <svg viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' />
                        </svg>
                        Telegram
                    </button>
                    <button className='contact-btn call' onClick={() => handleContactClick('call')} title='Call Now'>
                        <svg viewBox='0 0 24 24' fill='currentColor'>
                            <path d='M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z' />
                        </svg>
                        Call
                    </button>
                </div>

                <div className='under-development__footer'>
                    <p className='under-development__tagline'>Continue Killing the Market! 🚀</p>
                    <p className='under-development__contact'>
                        <strong>PlentyFX</strong> - 0745536264
                    </p>
                </div>
            </div>
        </div>
    );
};
