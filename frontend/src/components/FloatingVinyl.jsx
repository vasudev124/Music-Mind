import React from 'react';
import './FloatingVinyl.css';
import vinylBg from '../assets/vinyl-bg.png';

const FloatingVinyl = () => {
    return (
        <div className="vinyl-container">
            <img src={vinylBg} alt="Vinyl Background" className="vinyl-image" />
        </div>
    );
};

export default FloatingVinyl;
