import React from 'react';

const TiltCard = ({ children, className = '', ...props }) => {
    return (
        <div className={`${className} tilt-card`} {...props}>
            {children}
        </div>
    );
};

export default TiltCard;
