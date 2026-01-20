'use client';

import { Card, Title, AreaChart, Text, TabGroup, TabList, Tab, TabPanels, TabPanel, BarChart } from "@tremor/react";
import { useEffect, useState } from "react";
import { getTrends } from "@/app/actions/getTrends";
import { getRegionalPerformance } from "@/app/actions/getRegionalPerformance"; // Import the new action
import { InfoIcon } from 'lucide-react';

type TrendData = {
    date: string;
    mbu_demand: number;
    mbu_actual: number;
    district: string;
};

type RegionalData = {
    district: string;
    state: string;
    "Child Enrolment": number;
    "MBU Eligible": number;
};

// Mock data for initial visual if DB is empty
const mockTrendData = [
    { date: "Jan 01", mbu_demand: 2400, mbu_actual: 1800, district: "National" },
    { date: "Jan 08", mbu_demand: 2500, mbu_actual: 1950, district: "National" },
    { date: "Jan 15", mbu_demand: 2600, mbu_actual: 2100, district: "National" },
    { date: "Jan 22", mbu_demand: 2550, mbu_actual: 1900, district: "National" },
    { date: "Jan 29", mbu_demand: 2700, mbu_actual: 2200, district: "National" },
];

export default function TrendsPage() {

    // ...
    const [data, setData] = useState<TrendData[]>([]);
    const [regionalData, setRegionalData] = useState<RegionalData[]>([]);

    const fetchTrends = async () => {
        const res = await getTrends();
        if (res && res.length > 0) {
            // Fix overlapping dates by formatting nicely
            // data comes as "YYYY-MM-DD". We want "MMM DD"
            const formatted = res.map((item: any) => ({
                ...item,
                date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            }));
            setData(formatted);
        } else {
            // Keep mock data if empty, but maybe format it too if needed?
            // Mock data is already "Jan 23", so it's fine.
            if (data.length === 0) setData(mockTrendData);
        }
    };

    const fetchRegional = async () => {
        const reg = await getRegionalPerformance();
        setRegionalData(reg);
    };

    useEffect(() => {
        // Initial
        fetchTrends();
        fetchRegional();

        // Interval 10s
        const interval = setInterval(() => {
            fetchTrends();
            fetchRegional();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // ...


    const dataFormatter = (number: number) => {
        return Intl.NumberFormat("us").format(number).toString();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Trends & Analytics</h2>
                    <p className="text-slate-400 mt-1">Deep dive into MBU compliance and enrolment patterns</p>
                </div>
            </div>

            <TabGroup className="mt-6">
                <TabList variant="solid" color="slate" className="bg-slate-900/50 border border-slate-800">
                    <Tab>Compliance Gap</Tab>
                    <Tab>Regional Performance</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <Card className="mt-6 bg-slate-900/50 border-slate-800 ring-0 h-[500px]">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <Title className="text-white">MBU Compliance Gap (Target vs Actual)</Title>
                                    <Text className="text-slate-400">Comparing demand (children turning 5/15) vs actual updates</Text>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400">
                                    <InfoIcon className="h-4 w-4" />
                                    <span>Gap indicates missed targets</span>
                                </div>
                            </div>

                            <AreaChart
                                className="h-80 mt-4"
                                data={data}
                                index="date"
                                categories={["mbu_demand", "mbu_actual"]}
                                colors={["indigo", "cyan"]}
                                valueFormatter={dataFormatter}
                                yAxisWidth={60}
                                showAnimation={true}
                                showGradient={true}
                            />

                            <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                <h4 className="text-sm font-semibold text-slate-200 mb-1">Analyst Note</h4>
                                <p className="text-sm text-slate-400">
                                    The widening gap in late January suggests a need for targeted camps in high-load districts.
                                    Monitor the 'Action Center' for specific intervention sites.
                                </p>
                            </div>
                        </Card>
                    </TabPanel>
                    <TabPanel>
                        <Card className="mt-6 bg-slate-900/50 border-slate-800 ring-0 h-[500px]">
                            <Title className="text-white">Top Districts by Volume</Title>
                            <Text className="text-slate-400">Districts with highest child enrolment loads</Text>

                            <BarChart
                                className="mt-6 h-80"
                                data={regionalData}
                                index="district"
                                categories={["Child Enrolment", "MBU Eligible"]}
                                colors={["blue", "teal"]}
                                yAxisWidth={48}
                                showAnimation={true}
                            />
                        </Card>
                    </TabPanel>
                </TabPanels>
            </TabGroup>
        </div>
    );
}
