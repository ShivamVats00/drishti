'use server'

import prisma from '@/lib/prisma'
import { unstable_noStore as noStore } from 'next/cache';

export async function getDashboardStats() {
    noStore();
    try {
        const today = new Date();


        const criticalAnomalies = await prisma.anomalyEvent.count({
            where: {
                severity: 'CRITICAL',
                status: 'OPEN'
            }
        });

        const totalEnrolments = await prisma.enrolmentLog.aggregate({
            _sum: {
                count_0_5: true,
                count_5_17: true,
                count_18_plus: true
            }
        });

        return {
            criticalAnomalies,
            totalEnrolments: (totalEnrolments._sum.count_0_5 || 0) + (totalEnrolments._sum.count_5_17 || 0) + (totalEnrolments._sum.count_18_plus || 0),
            mbuComplianceRate: 85.5
        };

    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return {
            criticalAnomalies: 0,
            totalEnrolments: 0,
            mbuComplianceRate: 0
        };
    }
}
