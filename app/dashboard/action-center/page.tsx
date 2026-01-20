'use client';
import { Card, Text, Title, Button } from "@tremor/react";

export default function ActionCenterPage() {
    return (
        <div className="space-y-6">
            <Card>
                <Title>Pending Work Orders</Title>
                <Text className="mt-2 text-gray-500">No active work orders. System is monitoring...</Text>
            </Card>

            <Card decoration="left" decorationColor="indigo">
                <Title>Generate New Camp Order</Title>
                <Text className="mt-2">Dispatch mobile enrolment units to high-deficit areas.</Text>
                <Button className="mt-4">Create Order</Button>
            </Card>
        </div>
    );
}
