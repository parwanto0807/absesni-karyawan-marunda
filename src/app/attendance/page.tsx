import { getSession } from '@/lib/auth';
import AttendanceClient from './AttendanceClient';
import { redirect } from 'next/navigation';

export default async function AttendancePage() {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    return <AttendanceClient user={session} />;
}
