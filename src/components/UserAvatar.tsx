'use client';

import React, { useState } from 'react';

interface UserAvatarProps {
    userId: string;
    userName: string;
    className?: string;
}

export default function UserAvatar({ userId, userName, className = '' }: UserAvatarProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className={`relative ${className}`}>
            <img
                src={imageError ? '/no-image.png' : `/api/images/users/${userId}`}
                alt={userName}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
            />
        </div>
    );
}
