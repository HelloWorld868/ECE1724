'use client';

import {useEffect, useState} from "react";
import {TicketTier} from '@prisma/client';
import {api} from '@/lib/api';
import {toast} from 'sonner';

interface TicketWithName extends Omit<TicketTier, 'name'> {
  name?: string;
}

// Props for the ticket card
interface TicketItemProps {
  ticket: TicketWithName;
  isSelected: boolean;
  onSelect: (ticket: TicketWithName) => void;
  onJoinWaitlist: (ticket: TicketWithName) => void;
}

export default function TicketItem({
                                       ticket,
                                       isSelected,
                                       onSelect,
                                   }: TicketItemProps) {
    const [loading, setLoading] = useState(false);
    const [joined, setJoined] = useState(false);

    const isSoldOut = ticket.quantity === 0;

    // On mount, check if user already joined waitlist
    useEffect(() => {
        if (isSoldOut) {
            fetch(`/api/waitlist/check?tierId=${ticket.id}`)
                .then((res) => res.json())
                .then((data) => setJoined(data.joined))
                .catch(() => setJoined(false));
        }
    }, [ticket.id, isSoldOut]);

    const handleClick = async () => {
        if (loading || joined) return;

        if (!isSoldOut) {
            onSelect?.(ticket);
            return;
        }

        // Sold out → Try join waitlist
        setLoading(true);
        try {
            await api('/api/waitlist/join', 'POST', {
                tierId: ticket.id,
                quantity: 1,
            });

            toast.success("Successfully joined the waitlist. Please check your email.");
            setJoined(true);
        } catch (err: any) {
            toast.error(err.message ?? 'Failed to join the waitlist.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`cursor-pointer flex items-center justify-between p-4 border rounded-lg transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
            } ${joined ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
            <div>
                <h3 className="text-2xl font-medium">{ticket.name || `Tier ${ticket.id}`}</h3>
                <p className="text-2xl text-gray-600">
                    {isSoldOut ? (
                        <span className="text-red-500">Sold Out</span>
                    ) : (
                        `Available: ${ticket.quantity}`
                    )}
                </p>
            </div>

            <div className="text-right">
                <p className="text-lg font-bold">${ticket.price}</p>
                {isSoldOut && (
                    <p className="text-sm text-blue-600">
                        {joined
                            ? "Already on waitlist"
                            : loading
                                ? "Joining..."
                                : "Click to join waitlist"}
                    </p>
                )}
            </div>
        </div>
    );
}
