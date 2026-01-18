import { prisma } from './src/lib/db';
import { getStartOfDayJakarta, getEndOfDayJakarta } from './src/lib/date-utils';

async function debug() {
    const todayStart = getStartOfDayJakarta();
    const todayEnd = getEndOfDayJakarta();

    console.log(`TIME_RANGE: ${todayStart.toISOString()} TO ${todayEnd.toISOString()}`);

    const schedules = await prisma.schedule.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        include: { user: { select: { name: true, role: true } } }
    });

    console.log(`SCHEDULES_COUNT: ${schedules.length}`);
    for (const s of schedules) {
        console.log(`SCH: ${s.user.name} | ${s.shiftCode} | ${s.date.toISOString()}`);
    }

    const permits = await prisma.permit.findMany({
        where: {
            startDate: { lte: todayEnd },
            endDate: { gte: todayStart }
        },
        include: { user: { select: { name: true, role: true } } }
    });

    console.log(`PERMITS_COUNT: ${permits.length}`);
    for (const p of permits) {
        console.log(`PRM: ${p.user.name} | ${p.type} | ${p.finalStatus} | ${p.startDate.toISOString()} - ${p.endDate.toISOString()}`);
    }

    const attendance = await prisma.attendance.findMany({
        where: { clockIn: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        include: { user: { select: { name: true } } }
    });
    console.log(`ATTENDANCE_COUNT: ${attendance.length}`);
    for (const a of attendance) {
        console.log(`ATT: ${a.user.name} | ${a.clockIn.toISOString()} | ${a.clockOut ? 'OUT' : 'IN'}`);
    }
}

debug().catch(console.error);
