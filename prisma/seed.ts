
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting optimized seed...');

    // --- 1. Load Data ---
    const csvPath = path.join(process.cwd(), 'analytics', 'db_ready_data.csv');
    if (!fs.existsSync(csvPath)) {
        console.error(`CSV file not found at ${csvPath}`);
        return;
    }

    console.log('Reading CSV file...');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const [headerLine, ...lines] = fileContent.split('\n');
    const headers = headerLine.trim().split(',');

    // Filter empty lines
    const validLines = lines.filter(l => l.trim().length > 0);
    console.log(`Found ${validLines.length} rows to process.`);

    // --- 2. Process Districts (Batch) ---
    console.log('Extracting districts...');
    const uniqueDistricts = new Map<string, { name: string, state: string, pincode: string }>();

    const BATCH_SIZE = 2000;

    // First pass: Identify all unique districts
    validLines.forEach(line => {
        const vals = line.split(',');
        const row: any = {};
        headers.forEach((h, i) => row[h.trim()] = vals[i]?.trim());

        if (row.pincode && row.district && row.state) {
            // We assume Pincode is unique for a district in this model
            uniqueDistricts.set(row.pincode, {
                name: row.district,
                state: row.state,
                pincode: row.pincode
            });
        }
    });

    console.log(`Found ${uniqueDistricts.size} unique districts. Upserting...`);

    // Bulk create districts
    // Postgres supports skipDuplicates.
    await prisma.district.createMany({
        data: Array.from(uniqueDistricts.values()),
        skipDuplicates: true
    });

    // Fetch back to get IDs
    const allDistricts = await prisma.district.findMany();
    const districtCache = new Map<string, string>(); // pincode -> id
    allDistricts.forEach(d => districtCache.set(d.pincode, d.id));

    // Create Name-State cache for Anomalies lookup
    const nameStateCache = new Map<string, string>(); // "State-District" -> id
    allDistricts.forEach(d => nameStateCache.set(`${d.state}-${d.name}`, d.id));

    // --- 3. Process Logs (Batch) ---
    console.log('Preparing enrolment logs for batch insert...');
    const logsToInsert: any[] = [];

    let processedCount = 0;

    for (const line of validLines) {
        const vals = line.split(',');
        const row: any = {};
        headers.forEach((h, i) => row[h.trim()] = vals[i]?.trim());

        if (!row.district || !row.state || !row.date) continue;

        const districtId = districtCache.get(row.pincode);
        if (!districtId) continue;

        const date = new Date(row.date);
        if (isNaN(date.getTime())) continue;

        logsToInsert.push({
            districtId: districtId,
            date: date,
            count_0_5: parseInt(row.age_0_5) || 0,
            count_5_17: parseInt(row.age_5_17) || 0,
            count_18_plus: parseInt(row.age_18_greater) || 0,
            bio_update_child: parseInt(row.bio_age_5_17) || 0,
            bio_update_adult: parseInt(row.bio_age_17_) || 0,
        });

        // Batch Insert if limit reached
        if (logsToInsert.length >= BATCH_SIZE) {
            await prisma.enrolmentLog.createMany({
                data: logsToInsert,
                skipDuplicates: true
            });
            processedCount += logsToInsert.length;
            logsToInsert.length = 0; // Clear array
            process.stdout.write(`\rInserted ${processedCount} records...`);
        }
    }

    // Insert remaining
    if (logsToInsert.length > 0) {
        await prisma.enrolmentLog.createMany({
            data: logsToInsert,
            skipDuplicates: true
        });
        processedCount += logsToInsert.length;
    }
    console.log(`\nEnrolment logs import complete. Total: ${processedCount}`);

    // --- 4. Process Anomalies ---
    const anomalyPath = path.join(process.cwd(), 'analytics', 'anomalies_import.csv');
    if (fs.existsSync(anomalyPath)) {
        console.log('Processing Anomalies...');
        const aContent = fs.readFileSync(anomalyPath, 'utf-8');
        const [aHeaderLine, ...aLines] = aContent.split('\n');
        const aHeaders = aHeaderLine.trim().split(',');
        const anomaliesToInsert: any[] = [];

        for (const line of aLines) {
            if (!line.trim()) continue;
            const vals = line.split(',');
            const row: any = {};
            aHeaders.forEach((h, i) => row[h.trim()] = vals[i]?.trim());

            // Use Name-State keys since anomalies might lack pincode
            const districtKey = `${row.state}-${row.district}`;
            const districtId = nameStateCache.get(districtKey);

            if (districtId) {
                const date = new Date(row.date);
                if (!isNaN(date.getTime())) {
                    anomaliesToInsert.push({
                        dateOfEvent: date,
                        districtId: districtId,
                        type: row.type || 'UNKNOWN',
                        severity: row.severity || 'MEDIUM',
                        status: 'OPEN',
                        zScore: parseFloat(row.z_score) || 0
                    });
                }
            }
        }

        if (anomaliesToInsert.length > 0) {
            await prisma.anomalyEvent.createMany({
                data: anomaliesToInsert,
                skipDuplicates: true
            });
            console.log(`Imported ${anomaliesToInsert.length} anomalies.`);
        }
    }

    console.log('Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
