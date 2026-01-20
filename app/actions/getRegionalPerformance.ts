'use server'

import prisma from '@/lib/prisma'
import { unstable_noStore as noStore } from 'next/cache';

export async function getRegionalPerformance() {
    noStore();
    try {


        const topDistricts = await prisma.enrolmentLog.groupBy({
            by: ['districtId'],
            _sum: {
                count_0_5: true,
                count_5_17: true,
            },
            take: 10,
            orderBy: {
                _sum: {
                    count_5_17: 'desc'
                }
            }
        });


        const enriched = await Promise.all(topDistricts.map(async (item) => {
            const district = await prisma.district.findUnique({
                where: { id: item.districtId }
            });
            return {
                district: district?.name || 'Unknown',
                state: district?.state || 'Unknown',
                "Child Enrolment": item._sum.count_0_5 || 0,
                "MBU Eligible": item._sum.count_5_17 || 0
            };
        }));

        return enriched;

    } catch (error) {
        console.error("Failed to fetch regional performance:", error);
        return [];
    }
}
