'use client';

import { Card, Metric, Text, Grid, ProgressBar, AreaChart, Title, BadgeDelta, Flex, Badge } from "@tremor/react";
import { useEffect, useState } from "react";
import { getDashboardStats } from "@/app/actions/getDashboardStats";
import { AlertCircle, CheckCircle2, TrendingUp, Activity, Map } from 'lucide-react';

// Mock data incase DB is empty for demo
const mockStats = {
    criticalAnomalies: 3,
    totalEnrolments: 12450,
    mbuComplianceRate: 85.5
};

const chartdata = [
    { date: "Jan 23", "Enrolments": 167, "Updates": 145 },
    { date: "Feb 23", "Enrolments": 125, "Updates": 110 },
    { date: "Mar 23", "Enrolments": 156, "Updates": 149 },
    { date: "Apr 23", "Enrolments": 165, "Updates": 180 },
    { date: "May 23", "Enrolments": 153, "Updates": 160 },
    { date: "Jun 23", "Enrolments": 124, "Updates": 130 },
];

export default function OverviewPage() {
    const [stats, setStats] = useState(mockStats);
    // ... chart state if we decide to fetch charts dynamically here too

    const fetchData = async () => {
        const data = await getDashboardStats();
        if (data.totalEnrolments > 0) {
            setStats(data);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchData();

        // Interval fetch (10s)
        const interval = setInterval(() => {
            fetchData();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Command Center</h2>
                    <p className="text-slate-400 mt-1">Real-time monitoring of Aadhaar enrolment ecosystem</p>
                </div>
                <div className="flex gap-2">
                    <Badge color="green" icon={Activity}>System Online</Badge>
                    <Badge color="blue">Last Sync: 2 mins ago</Badge>
                </div>
            </div>

            {/* KPI Grid */}
            <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
                {/* KPI 1: Critical Anomalies */}
                <Card decoration="top" decorationColor="red" className="bg-slate-900/50 border-slate-800 ring-0 text-slate-200">
                    <Flex justifyContent="start" className="space-x-4">
                        <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20">
                            <AlertCircle className="h-6 w-6 text-red-500" />
                        </div>
                        <div>
                            <Text className="text-slate-400">Critical Anomalies (Today)</Text>
                            <Metric className="text-white mt-1">{stats.criticalAnomalies}</Metric>
                        </div>
                    </Flex>
                    <BadgeDelta deltaType="increase" className="mt-4">
                        +12% from yesterday
                    </BadgeDelta>
                </Card>

                {/* KPI 2: Total Enrolments */}
                <Card decoration="top" decorationColor="blue" className="bg-slate-900/50 border-slate-800 ring-0 text-slate-200">
                    <Flex justifyContent="start" className="space-x-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                            <TrendingUp className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <Text className="text-slate-400">Total Enrolments (Month)</Text>
                            <Metric className="text-white mt-1">{stats.totalEnrolments.toLocaleString()}</Metric>
                        </div>
                    </Flex>
                    <div className="mt-4">
                        <Text className="text-slate-500 text-xs">Target: 15,000</Text>
                        <ProgressBar value={(stats.totalEnrolments / 15000) * 100} color="blue" className="mt-2 h-2" />
                    </div>
                </Card>

                {/* KPI 3: MBU Compliance */}
                <Card decoration="top" decorationColor="emerald" className="bg-slate-900/50 border-slate-800 ring-0 text-slate-200">
                    <Flex justifyContent="start" className="space-x-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <Text className="text-slate-400">MBU Compliance Rate</Text>
                            <Metric className="text-white mt-1">{stats.mbuComplianceRate}%</Metric>
                        </div>
                    </Flex>
                    <div className="mt-4">
                        <Text className="text-slate-500 text-xs">National Avg: 82%</Text>
                        <ProgressBar value={stats.mbuComplianceRate} color="emerald" className="mt-2 h-2" />
                    </div>
                </Card>
            </Grid>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Chart 1: Trend Analysis */}
                <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800 ring-0">
                    <Title className="text-white">Enrolment & Update Trends</Title>
                    <Text className="text-slate-400">Daily processing volume over last 6 months</Text>
                    <AreaChart
                        className="h-72 mt-4"
                        data={chartdata}
                        index="date"
                        categories={["Enrolments", "Updates"]}
                        colors={["indigo", "cyan"]}
                        valueFormatter={(number) => number.toString()}
                        yAxisWidth={40}
                        showAnimation={true}
                    />
                </Card>

                {/* Chart 2: Heatmap Placeholder (Enhanced) */}
                <Card className="bg-slate-900/50 border-slate-800 ring-0 flex flex-col">
                    <Title className="text-white">Geographic Focus</Title>
                    <Text className="text-slate-400">Hotspots requiring attention</Text>

                    <div className="mt-4 flex-1 rounded-xl bg-slate-800/50 border-2 border-dashed border-slate-700 relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                            <div className="p-4 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors mb-4">
                                <Map className="h-8 w-8 text-slate-400 group-hover:text-blue-400 lg:h-12 lg:w-12" />
                            </div>
                            <h3 className="text-slate-200 font-medium">National Heatmap</h3>
                            <p className="text-sm text-slate-500 mt-2 max-w-[200px]">
                                Interactive map visualization is loading...
                            </p>
                            <button className="mt-4 px-4 py-2 bg-blue-600/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-600/30 transition-colors">
                                View Full Map
                            </button>
                        </div>
                        {/* Subtle grid background */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
