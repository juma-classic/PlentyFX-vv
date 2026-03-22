import React, { useState, useEffect } from 'react';
import { realDerivAPI } from '../../services/real-deriv-api-connection.service';
import './DerivAPIConfig.scss';

interface DerivAPIConfigProps {
    onConnectionChange: (isConnected: boolean) => void;
    isConnected: boolean;
}

export const DerivAPIConfig: React.FC<DerivAPIConfigProps> = ({ onConnectionChange, isConnected }) => {
    const [apiToken, setApiToken] = useState('');
    const [appId, setAppId] = useState(1089);
    const [isDemo, setIsDemo] = useState(true);

    return (
        <div className='deriv-api-config'>
            <h3>Deriv API Configuration</h3>
            <p>Configuration component for Deriv API connection</p>
        </div>
    );
};
