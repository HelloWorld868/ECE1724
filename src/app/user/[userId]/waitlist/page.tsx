import {auth} from "@/lib/auth";
import prisma from "@/lib/prisma";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {format} from "date-fns";
import SignOutButton from "@/components/auth/SignOutButton";

export default async function WaitlistPage({params}: { params: { userId: string }; }) {
    const session = await auth.api.getSession({headers: await headers()});
    const user = session?.user;
    const {userId} = await params;

    if (!user || user.id !== userId) {
        redirect("/signin");
    }

    const waitlistEntries = await prisma.waitlistEntry.findMany({
        where: {userId: user.id},
        include: {
            event: {select: {name: true}},
            ticketTier: {select: {id: true, price: true}},
        },
        orderBy: {createdAt: "desc"},
    });

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
            {/* Header */}
            <header className="w-screen bg-neutral-100 dark:bg-neutral-900 py-6 shadow-md">
                <div className="flex justify-between items-center px-10">
                    <h1 className="text-3xl font-bold">Hello, {user.name || "User"}</h1>
                    <div className="space-x-6">
                        <Link href={`/user/${user.id}/account`}>
                            <Button variant="outline" className="text-sm px-6 py-2">
                                Manage Account
                            </Button>
                        </Link>
                        <SignOutButton/>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="max-w-6xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-bold mb-8">My Waitlist</h1>

                {waitlistEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        You are not in any waitlist.
                    </p>
                ) : (
                    <div className="grid gap-4">
                        {waitlistEntries.map((entry) => (
                            <Card key={entry.id}>
                                <CardHeader className="text-lg font-semibold">
                                    {entry.event.name}
                                </CardHeader>
                                <CardContent className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm">
                                            Tier ID: <strong>{entry.ticketTier.id}</strong>
                                        </p>
                                        <p className="text-sm">
                                            Price: <strong>${entry.ticketTier.price}</strong>
                                        </p>
                                        <p className="text-sm">
                                            Quantity: {entry.quantity}
                                        </p>
                                        <p className="text-sm">
                                            Status:{" "}
                                            <span className="font-semibold capitalize">
                        {entry.status.toLowerCase()}
                      </span>
                                        </p>
                                        {entry.status === "NOTIFIED" && entry.expiresAt && (
                                            <p className="text-sm text-green-600">
                                                Expires: {format(entry.expiresAt, "yyyy-MM-dd HH:mm")}
                                            </p>
                                        )}
                                    </div>
                                    {entry.status === "NOTIFIED" && entry.reservationId && (
                                        <Link href={`/checkout/${entry.reservationId}`}>
                                            <Button size="sm">Checkout</Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="flex justify-center mt-12">
                    <Link href={`/user/${user.id}`}>
                        <Button variant="outline" className="text-lg px-6 py-2">
                            Back to Home Page
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
