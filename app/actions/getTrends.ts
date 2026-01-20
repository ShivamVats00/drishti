'use server'

import prisma from '@/lib/prisma'
import { unstable_noStore as noStore } from 'next/cache';

export async function getTrends(districtId?: string) {
    noStore();

    try {
        const logs = await prisma.enrolmentLog.findMany({
            where: districtId ? { districtId } : {},
            orderBy: { date: 'asc' },
            take: 30,
            include: {
                district: true
            }
        });


        return logs.map((log: any) => ({
            date: log.date.toISOString().split('T')[0],
            mbu_demand: log.count_5_17,
            mbu_actual: log.bio_update_child,
            district: log.district.name
        }));
    } catch (error) {
        console.error("Failed to fetch trends:", error);
        return [];
    }
}
