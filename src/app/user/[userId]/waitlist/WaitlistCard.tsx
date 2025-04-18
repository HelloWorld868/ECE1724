"use client";

import {useState} from "react";
import Link from "next/link";
import Countdown from "react-countdown";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {Button} from "@/components/ui/button";

export default function WaitlistCard({entry}: { entry: any }) {
    const [status, setStatus] = useState(entry.status);

    const renderer = ({minutes, seconds}: any) => (
        <span>
      {minutes}:{seconds.toString().padStart(2, "0")}
    </span>
    );

    return (
        <Card>
            <CardHeader>
                <div className="font-semibold">{entry.event.name}</div>
                <div className="text-sm text-muted-foreground">
                    {entry.tier.name} × {entry.quantity}
                </div>
            </CardHeader>

            <CardContent className="flex items-center justify-between">
                {status === "NOTIFIED" ? (
                    <>
                        <div className="text-green-600 flex gap-1 items-center">
                            Available
                            <Countdown
                                date={new Date(entry.expiresAt)}
                                renderer={renderer}
                                onComplete={() => setStatus("EXPIRED")}
                            />
                        </div>
                        <Button asChild>
                            <Link href={`/checkout/${entry.reservationId}`}>Purchase</Link>
                        </Button>
                    </>
                ) : status === "WAITING" ? (
                    <span className="text-gray-500">Waiting…</span>
                ) : status === "PURCHASED" ? (
                    <span className="text-blue-600">Purchased</span>
                ) : (
                    <span className="text-red-500">Expired</span>
                )}
            </CardContent>
        </Card>
    );
}
