import useSWR from 'swr';
import {api} from '@/lib/api';
import WaitlistCard from './WaitlistCard';

export interface WaitlistEntry {
    id: number;
    status: 'WAITING' | 'NOTIFIED' | 'PURCHASED' | 'EXPIRED';
    quantity: number;
    expiresAt: string;
    reservationId?: string | null;
    event: { name: string };
    tier: { name: string };
}

const fetcher = (url: string) => api<WaitlistEntry[]>(url);

export const metadata = {title: 'My Waitlist | ECE1724'};

export default function WaitlistPage() {
    const {data: entries, isLoading} = useSWR<WaitlistEntry[]>(
        '/api/me/waitlist',
        fetcher
    );

    if (isLoading) {
        return (
            <p className="text-center py-10 text-sm text-muted-foreground">
                Loading…
            </p>
        );
    }

    if (!entries || entries.length === 0) {
        return (
            <div className="max-w-3xl mx-auto p-6">
                <h1 className="text-2xl font-bold mb-4">My Waitlist</h1>
                <p className="text-gray-500">No waitlist records.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-4">
            <h1 className="text-2xl font-bold mb-4">My Waitlist</h1>
            {entries.map((entry) => (
                <WaitlistCard key={entry.id} entry={entry}/>
            ))}
        </div>
    );
}
