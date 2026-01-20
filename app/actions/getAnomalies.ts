'use server'

import prisma from '@/lib/prisma'
import { unstable_noStore as noStore } from 'next/cache';

export async function getAnomalies() {
    noStore();
    try {
        const anomalies = await prisma.anomalyEvent.findMany({
            where: { status: 'OPEN' },
            orderBy: { severity: 'desc' },
            include: {
                district: true
            }
        });

        return anomalies;
    } catch (error) {
        console.error("Failed to fetch anomalies:", error);
        return [];
    }
}
