import React, { useState } from 'react';
import { API_CONFIG, SERVER_OPTIONS } from '@/config/api-config';

type ServerSelectorProps = {
    onServerChange?: (endpoint: string) => void;
};

export const ServerSelector: React.FC<ServerSelectorProps> = ({ onServerChange }) => {
    const [selectedServer, setSelectedServer] = useState<string>(
        localStorage.getItem('deriv_server_endpoint') || API_CONFIG.DEFAULT_ENDPOINT
    );

    const handleServerChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newServer = event.target.value;
        setSelectedServer(newServer);
        localStorage.setItem('deriv_server_endpoint', newServer);
        
        if (onServerChange) {
            onServerChange(newServer);
        }

        // Notify user that they need to refresh
        alert('Server endpoint changed. Please refresh the page for changes to take effect.');
    };

    return (
        <div className="server-selector">
            <label htmlFor="server-select">
                <strong>WebSocket Server:</strong>
            </label>
            <select
                id="server-select"
                value={selectedServer}
                onChange={handleServerChange}
                className="server-select-dropdown"
            >
                {SERVER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <div className="server-info">
                <small>Current: {SERVER_OPTIONS.find(s => s.value === selectedServer)?.url}</small>
            </div>
        </div>
    );
};
