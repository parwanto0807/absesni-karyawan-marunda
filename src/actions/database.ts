'use server';

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { prisma } from '@/lib/db';

const execPromise = promisify(exec);

// Function to remove Prisma-specific query parameters like ?schema=public
// which are invalid for standard postgres tools like pg_dump and psql
function getCleanDbUrl(url: string) {
    try {
        const parsed = new URL(url);
        parsed.search = ''; // Remove all query parameters for safety
        return parsed.toString();
    } catch (e) {
        return url; // Fallback if URL parsing fails
    }
}

export async function backupDatabase() {
    try {
        let dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) throw new Error('DATABASE_URL is not defined');

        dbUrl = getCleanDbUrl(dbUrl);

        // We use pg_dump to generate the SQL
        // Since it might be a large file, we'll write to a temp file first then read it
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup-${timestamp}.sql`;
        const filePath = path.join(os.tmpdir(), fileName);

        // Command: pg_dump --clean --if-exists "url" > file
        // On windows, we might need quotes around the path
        await execPromise(`pg_dump --clean --if-exists "${dbUrl}" > "${filePath}"`);

        const content = fs.readFileSync(filePath, 'utf-8');

        // Clean up temp file
        fs.unlinkSync(filePath);

        return {
            success: true,
            content,
            fileName
        };
    } catch (error: any) {
        console.error('Backup Error:', error);
        return {
            success: false,
            message: error.message || 'Failed to backup database'
        };
    }
}

export async function restoreDatabase(sqlContent: string) {
    try {
        // Warning: This is extremely dangerous. It will execute raw SQL.
        // Prisma's $executeRawUnsafe can only execute one statement at a time 
        // usually, but we can try to split or use psql if available.

        // Better approach: write to temp file and use psql
        let dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) throw new Error('DATABASE_URL is not defined');

        dbUrl = getCleanDbUrl(dbUrl);

        const filePath = path.join(os.tmpdir(), 'temp_restore.sql');
        fs.writeFileSync(filePath, sqlContent);

        // Command: psql "url" < file
        // Note: This replaces/overwrites based on what's in the SQL.
        // Usually pg_dump includes DROP/CREATE if --clean is used, 
        // but default pg_dump just has CREATE.
        await execPromise(`psql "${dbUrl}" < "${filePath}"`);

        fs.unlinkSync(filePath);

        return {
            success: true,
            message: 'Database restored successfully'
        };
    } catch (error: any) {
        console.error('Restore Error:', error);
        return {
            success: false,
            message: error.message || 'Failed to restore database'
        };
    }
}
