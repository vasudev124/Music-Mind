import React, { useEffect, useState } from 'react';
import './GoogleEyes.css';

const GoogleEyes = () => {
    const [pupilPos, setPupilPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;

            // Calculate position relative to center (range -1 to 1)
            const x = (clientX - innerWidth / 2) / (innerWidth / 2);
            const y = (clientY - innerHeight / 2) / (innerHeight / 2);

            setPupilPos({ x, y });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Limit pupil movement radius
    const limitX = pupilPos.x * 15; // 15px max movement
    const limitY = pupilPos.y * 15;

    return (
        <div className="eyes-container">
            <div className="eye">
                <div
                    className="pupil"
                    style={{ transform: `translate(${limitX}px, ${limitY}px)` }}
                />
            </div>
            <div className="eye">
                <div
                    className="pupil"
                    style={{ transform: `translate(${limitX}px, ${limitY}px)` }}
                />
            </div>
        </div>
    );
};

export default GoogleEyes;
