import React, { useEffect,useState } from 'react';
import { isAllowedFakeRealAccount } from '@/config/fake-real-allowlist';
import './FakeRealAccountToggle.scss';

export const FakeRealAccountToggle: React.FC = () => {
    const [isFakeRealMode, setIsFakeRealMode] = useState(() => {
        return localStorage.getItem('demo_icon_us_flag') === 'true';
    });
    const [clickCount, setClickCount] = useState(0);
    const [showClickHint, setShowClickHint] = useState(false);

    // Reset click count after 3 seconds of inactivity
    useEffect(() => {
        if (clickCount > 0 && clickCount < 6) {
            const timer = setTimeout(() => {
                setClickCount(0);
                setShowClickHint(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [clickCount]);

    const handleFlagClick = () => {
        // Silently ignore if not on the allowlist
        if (!isAllowedFakeRealAccount()) return;
        const newCount = clickCount + 1;
        setClickCount(newCount);
        setShowClickHint(true);

        if (newCount === 6) {
            // Enable fake real mode after 6 clicks
            const confirmed = window.confirm(
                '🇺🇸 Fake Real Account Mode Unlocked!\n\n' +
                    'This will:\n' +
                    '• Display your USD real account as demo (10,000.00)\n' +
                    '• Display your demo account as real with US flag\n' +
                    '• Add fake BTC and USDT accounts\n\n' +
                    'Your actual balances are NOT affected.\n' +
                    'This is for testing/screenshots only.\n\n' +
                    'Continue?'
            );

            if (confirmed) {
                setIsFakeRealMode(true);
                localStorage.setItem('demo_icon_us_flag', 'true');
                localStorage.setItem('fake_real_mode_acknowledged', 'true');

                // Reload to apply changes
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                setClickCount(0);
                setShowClickHint(false);
            }
        }
    };

    const handleDisable = () => {
        setIsFakeRealMode(false);
        localStorage.setItem('demo_icon_us_flag', 'false');

        // Reload to apply changes
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    return (
        <div className='fake-real-account-toggle'>
            <div className='toggle-header'>
                <button
                    className='toggle-flag-button'
                    onClick={handleFlagClick}
                    disabled={isFakeRealMode}
                    title={
                        isFakeRealMode
                            ? 'Mode is active'
                            : clickCount > 0
                              ? `Click ${6 - clickCount} more time${6 - clickCount !== 1 ? 's' : ''}`
                              : 'Click 6 times to unlock'
                    }
                >
                    <svg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'>
                        <path
                            fill='#fff'
                            d='M.03 15a16.3 16.3 0 0 0 .094 3h31.752a16 16 0 0 0 .093-3zM16 9v3h15.496a16 16 0 0 0-1.104-3zM16 6h12.49a16 16 0 0 0-3.16-3H16zM.797 21a16 16 0 0 0 1.343 3h27.72c.545-.943.997-1.948 1.343-3zM4.381 27a16 16 0 0 0 3.867 3h15.504a16 16 0 0 0 3.867-3z'
                        />
                        <path
                            fill='#F44336'
                            d='M16 0v3h9.33A15.93 15.93 0 0 0 16 0M16 15h15.97a16 16 0 0 0-.474-3H16zM16 9h14.392a16 16 0 0 0-1.901-3H16zM31.876 18a16 16 0 0 1-.673 3H.797a16 16 0 0 1-.673-3zM2.14 24a16 16 0 0 0 2.241 3h23.238a16 16 0 0 0 2.24-3zM16 32c2.813 0 5.455-.726 7.752-2H8.248c2.297 1.274 4.94 2 7.752 2'
                        />
                        <path
                            fill='#283991'
                            fillRule='evenodd'
                            d='M16 15H.03a16 16 0 0 1 .176-1.575l-.01.069a.078.078 0 0 0 .057-.102l-.027-.085q.06-.355.136-.705l-.004.016.194-.143a.08.08 0 0 0-.048-.142H.422a16 16 0 0 1 1.232-3.425l.264-.19.48.344a.08.08 0 0 0 .121-.03.08.08 0 0 0 .002-.056l-.18-.563.48-.354a.08.08 0 0 0-.048-.142h-.584A16.1 16.1 0 0 1 6.655 3.01l.28.202a.08.08 0 0 0 .085.009l.006-.003.004-.003a.08.08 0 0 0 .03-.09L6.953 2.8A15.93 15.93 0 0 1 16 0zM13.515.637l-.143-.422-.24.041-.129.384h-.59a.1.1 0 0 0-.03.007l-.01.005-.003.002a.08.08 0 0 0-.005.128l.48.354-.197.56a.08.08 0 0 0 .123.086l.48-.344.48.344a.08.08 0 0 0 .094.003.08.08 0 0 0 .03-.089l-.181-.563.48-.354a.1.1 0 0 0 .022-.028l.003-.007a.1.1 0 0 0 .005-.025.08.08 0 0 0-.053-.077.1.1 0 0 0-.025-.005zM9.287 1.785a.08.08 0 0 0 .03-.089l-.067-.207-.167.08-.112.054.222.16a.08.08 0 0 0 .094.002m3.716 10.551.19-.563a.067.067 0 0 1 .132-.003l.19.563h.59a.08.08 0 0 1 .074.054.08.08 0 0 1-.025.088l-.48.354.18.563a.079.079 0 0 1-.123.086l-.48-.344-.48.344-.013.008-.006.002-.008.003a.08.08 0 0 1-.076-.022l-.01-.012-.002-.005-.003-.003-.002-.007a.1.1 0 0 1-.003-.05l.197-.56-.48-.354a.08.08 0 0 1 .005-.129l.007-.004.005-.002.004-.002.009-.002.018-.003zm-4.216-.566a.067.067 0 0 0-.131.003l-.19.563h-.59a.08.08 0 0 0-.049.142l.48.354-.197.56a.08.08 0 0 0 .01.063l.004.006.004.006.014.011a.08.08 0 0 0 .092 0l.48-.344.48.344q.015.013.035.016l.007.001h.005a.1.1 0 0 0 .046-.014.08.08 0 0 0 .03-.089l-.181-.563.48-.354.016-.016.004-.008.009-.024v-.025l-.001-.007-.002-.008a.08.08 0 0 0-.074-.054h-.59zm-4.526 0 .19.563h.59a.08.08 0 0 1 .049.142l-.48.354.18.563.003.012.001.008v.008a.08.08 0 0 1-.033.061.08.08 0 0 1-.094-.003l-.48-.344-.48.344a.08.08 0 0 1-.125-.078l.002-.008.197-.56-.48-.354a.08.08 0 0 1-.03-.06q-.001-.013.004-.028a.08.08 0 0 1 .074-.054h.592l.19-.563c.002-.08.107-.08.13-.003m6.795-1.488a.074.074 0 1 0-.147 0l-.19.563h-.591a.08.08 0 0 0-.048.142l.48.354-.18.563a.08.08 0 0 0 .123.086l.48-.344.48.344a.078.078 0 0 0 .123-.086l-.181-.563.48-.354a.08.08 0 0 0-.048-.142h-.59zm-4.526 0 .19.563h.59a.08.08 0 0 1 .048.142l-.48.354.181.563a.078.078 0 0 1-.123.086l-.48-.344-.48.344a.08.08 0 0 1-.123-.086l.18-.563-.48-.354a.08.08 0 0 1 .049-.142h.59l.19-.563c.02-.077.125-.077.148 0m-4.348.563-.19-.563c-.023-.077-.128-.077-.13 0l-.19.563h-.608a.1.1 0 0 0-.04.012.08.08 0 0 0-.008.13l.48.354-.18.563a.08.08 0 0 0 .122.086l.48-.344.48.344a.078.078 0 0 0 .123-.086l-.18-.563.48-.354a.08.08 0 0 0-.048-.142zM13.325 8.84l.19.563h.59a.08.08 0 0 1 .049.143l-.48.353.18.563a.08.08 0 0 1-.014.076.08.08 0 0 1-.109.01l-.48-.343-.48.344a.08.08 0 0 1-.123-.087l.18-.563-.48-.353a.08.08 0 0 1 .049-.143h.59l.19-.563c.03-.066.135-.066.148 0m-4.347.563-.19-.563c-.014-.066-.12-.066-.148 0l-.19.563h-.59a.08.08 0 0 0-.049.143l.48.353-.18.563a.08.08 0 0 0 .123.087l.48-.344.48.344a.079.079 0 0 0 .123-.087L9.136 9.9l.48-.353a.08.08 0 0 0-.048-.143zM4.26 8.84l.19.563h.59a.08.08 0 0 1 .049.143l-.48.353.18.563a.078.078 0 0 1-.123.087l-.48-.344-.48.344a.08.08 0 0 1-.123-.087l.18-.563-.48-.353a.08.08 0 0 1 .049-.143h.608l.19-.563c.002-.066.107-.066.13 0m6.795-1.486a.074.074 0 0 0-.113-.063l-.002.002-.006.004-.005.004-.005.006a.1.1 0 0 0-.016.038v.009l-.19.563h-.591a.08.08 0 0 0-.048.142l.48.354-.18.563a.08.08 0 0 0 .017.075l.006.006.007.005a.08.08 0 0 0 .092 0l.48-.344.48.344a.1.1 0 0 0 .046.018.078.078 0 0 0 .078-.104l-.181-.563.48-.354a.08.08 0 0 0 .026-.088.08.08 0 0 0-.074-.054h-.59zm-4.526 0 .19.563h.59a.08.08 0 0 1 .048.142l-.48.354.181.563.003.014a.078.078 0 0 1-.126.072l-.48-.344-.48.344a.08.08 0 0 1-.124-.047l-.002-.009v-.01l.003-.02.18-.563-.48-.354a.08.08 0 0 1 .049-.142h.59l.19-.563c.02-.077.125-.077.148 0m6.985-.87-.19-.562a.067.067 0 0 0-.131.003l-.19.563h-.591a.08.08 0 0 0-.077.091.08.08 0 0 0 .029.051l.48.354-.197.56a.08.08 0 0 0 .123.086l.48-.344.48.344a.078.078 0 0 0 .123-.086l-.18-.563.48-.354a.08.08 0 0 0-.048-.142zm-4.802-.636a.073.073 0 0 1 .074.074l.19.563h.591a.08.08 0 0 1 .048.142l-.48.354.18.563a.08.08 0 0 1-.01.07l-.004.006-.004.004-.01.01a.08.08 0 0 1-.095-.004l-.48-.344-.48.344a.08.08 0 0 1-.123-.086l.181-.563-.48-.354a.08.08 0 0 1 .048-.142h.59l.19-.563c0-.041.034-.074.075-.074m-4.262.637-.19-.563c-.023-.077-.128-.077-.13 0l-.19.563h-.608a.08.08 0 0 0-.048.142l.48.354-.181.563a.08.08 0 0 0 .123.086l.48-.344.48.344a.078.078 0 0 0 .123-.086l-.18-.563.48-.354a.08.08 0 0 0-.048-.142zM6.53 4.422l.19.564h.59a.08.08 0 0 1 .048.142l-.48.354.181.563a.078.078 0 0 1-.123.086l-.48-.344-.48.344a.08.08 0 0 1-.123-.086l.18-.563-.48-.354a.08.08 0 0 1 .049-.142h.59l.19-.564c.02-.065.125-.065.148 0m4.716.564-.19-.564c-.013-.065-.118-.065-.147 0l-.19.564h-.591a.08.08 0 0 0-.048.142l.48.354-.18.563a.08.08 0 0 0 .122.086l.48-.344.48.344a.078.078 0 0 0 .124-.086l-.181-.563.48-.354a.08.08 0 0 0-.048-.142zM8.787 2.992l.19.563h.591a.1.1 0 0 1 .04.012.08.08 0 0 1 .008.13l-.48.354.18.563a.078.078 0 0 1-.123.087l-.48-.344-.48.344a.08.08 0 0 1-.124-.078l.001-.009.181-.563-.48-.353a.08.08 0 0 1 .048-.143h.59l.19-.563c.03-.066.135-.066.148 0m4.728.563-.19-.563c-.013-.066-.119-.066-.147 0l-.19.563h-.591a.08.08 0 0 0-.048.143l.48.353-.181.563-.003.026.004.02a.1.1 0 0 0 .03.04.08.08 0 0 0 .092 0l.48-.343.48.344a.078.078 0 0 0 .123-.087l-.18-.563.48-.353a.08.08 0 0 0-.048-.143zm-2.472-2.093a.1.1 0 0 1 .013.042l.19.563h.59a.08.08 0 0 1 .075.055.08.08 0 0 1-.026.088l-.48.353.18.563a.08.08 0 0 1-.029.09.08.08 0 0 1-.094-.003l-.48-.344-.48.344a.08.08 0 0 1-.092 0 .08.08 0 0 1-.03-.087l.18-.563-.48-.353a.08.08 0 0 1 .048-.143h.59l.19-.563a.073.073 0 0 1 .135-.042'
                        />
                    </svg>
                    {showClickHint && clickCount < 6 && <span className='click-counter'>{clickCount}/6</span>}
                </button>
                <div className='toggle-info'>
                    <h4>Fake Real Account Mode</h4>
                    <p className='toggle-description'>
                        {isFakeRealMode
                            ? 'Mode is active. Click disable to return to normal.'
                            : 'Click the US flag 6 times to unlock this mode.'}
                    </p>
                </div>
            </div>

            {isFakeRealMode && (
                <>
                    <div className='toggle-warning'>
                        ⚠️ <strong>Active:</strong> Your real USD account appears as demo. Actual balances are not
                        affected.
                    </div>
                    <button className='disable-btn' onClick={handleDisable}>
                        Disable Fake Real Mode
                    </button>
                </>
            )}

            {!isFakeRealMode && (
                <div className='toggle-details'>
                    <details>
                        <summary>What changes when enabled?</summary>
                        <ul>
                            <li>✓ USD Real Account → Shows as &quot;Demo&quot; with 10,000.00 balance</li>
                            <li>✓ VRT Demo Account → Shows as &quot;Real&quot; with US flag icon</li>
                            <li>✓ Fake BTC and USDT accounts appear (non-functional)</li>
                            <li>✓ Account tabs are swapped (Real ↔ Demo)</li>
                            <li>✗ Your actual account balances remain unchanged</li>
                            <li>✗ Trading functionality is not affected</li>
                        </ul>
                    </details>
                </div>
            )}
        </div>
    );
};
