'use client';

import React, { useState, useEffect } from 'react';
import OvertimeClientSide from './OvertimeClientSide';

import type { OvertimeClientProps } from './OvertimeClientSide';

export default function OvertimeWrapperClient(props: OvertimeClientProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="p-8 text-center animate-pulse">Memuat modul lembur...</div>;
    }

    return <OvertimeClientSide {...props} />;
}
