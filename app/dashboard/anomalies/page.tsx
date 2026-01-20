'use client';

import {
    Card,
    Table,
    TableHead,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Text,
    Title,
    Badge,
} from "@tremor/react";
import { useEffect, useState } from "react";
import { getAnomalies } from "@/app/actions/getAnomalies";

// Define a type for the anomaly to fix the 'any' implicit type
type Anomaly = {
    id: string;
    type: string;
    severity: string;
    status: string;
    dateOfEvent: Date; // Keep as Date, we'll format it
    district: {
        name: string;
        state: string;
    };
    zScore: number | null;
};

export default function AnomaliesPage() {
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

    useEffect(() => {
        // Need to cast or transform the server action result properly
        // For simplicity in this demo, we assume the server returns matching shape
        // but Dates might be strings over the wire.
        getAnomalies().then((data: any[]) => setAnomalies(data));
    }, []);

    const getBadgeColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'red';
            case 'HIGH': return 'orange';
            case 'MEDIUM': return 'yellow';
            default: return 'blue';
        }
    };

    return (
        <Card>
            <Title>Detected Anomalies (Unresolved)</Title>
            <Table className="mt-5">
                <TableHead>
                    <TableRow>
                        <TableHeaderCell>District</TableHeaderCell>
                        <TableHeaderCell>Type</TableHeaderCell>
                        <TableHeaderCell>Severity</TableHeaderCell>
                        <TableHeaderCell>Date</TableHeaderCell>
                        <TableHeaderCell>Metric (Z-Score)</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {anomalies.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{item.district.name}, {item.district.state}</TableCell>
                            <TableCell>
                                <Text>{item.type}</Text>
                            </TableCell>
                            <TableCell>
                                <Badge color={getBadgeColor(item.severity)}>
                                    {item.severity}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Text>{new Date(item.dateOfEvent).toLocaleDateString()}</Text>
                            </TableCell>
                            <TableCell>
                                <Text>{item.zScore?.toFixed(2) || 'N/A'}</Text>
                            </TableCell>
                            <TableCell>
                                <Badge color="zinc">{item.status}</Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Card>
    );
}
