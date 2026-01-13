import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import { prisma } from "@/lib/db";

export default async function SettingsPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== 'ADMIN' && session.role !== 'PIC') {
        redirect("/");
    }

    // Get the full user object to check username
    const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { username: true }
    });

    return <SettingsClient username={user?.username || ''} />;
}
