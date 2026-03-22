import React, { useEffect, useState } from 'react';
import ModernLoader from './ModernLoader';

export default function LandingWithIntro({ onFinish }) {
    const [showLoader, setShowLoader] = useState(true);

    useEffect(() => {
        if (!showLoader) {
            onFinish();
        }
    }, [showLoader, onFinish]);

    return showLoader ? <ModernLoader onFinish={() => setShowLoader(false)} /> : null;
}
