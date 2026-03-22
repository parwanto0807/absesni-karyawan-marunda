'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface UserAvatarProps {
    userId: string;
    userName: string;
    className?: string;
}

export default function UserAvatar({ userId, userName, className = '' }: UserAvatarProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className={`relative ${className}`}>
            <Image
                src={imageError ? '/no-image.png' : `/api/images/users/${userId}`}
                alt={userName}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                unoptimized
            />
        </div>
    );
}
