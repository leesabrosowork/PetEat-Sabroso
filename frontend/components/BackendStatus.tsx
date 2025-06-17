'use client';

import { useEffect } from 'react';

export default function BackendStatus() {
    useEffect(() => {
        const checkBackendStatus = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/status', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                if (response.ok) {
                    const data = await response.json();
                    alert('Backend is running! ' + data.message);
                } else {
                    alert('Backend is not responding. Please check if the server is running.');
                }
            } catch (error) {
                alert('Backend connection failed. Could not connect to the backend server.');
            }
        };

        checkBackendStatus();
    }, []);

    return null;
} 