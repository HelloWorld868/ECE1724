'use client';

import { TicketTier } from '@prisma/client';
import { api } from '@/lib/api';
import { toast } from 'sonner';

// Props for the ticket card
interface TicketItemProps {
    ticket: TicketTier;
    isSelected: boolean;
    onSelect?: (ticket: TicketTier) => void;  // optional now
}

export default function TicketItem({
                                       ticket,
                                       isSelected,
                                       onSelect
                                   }: TicketItemProps) {
    const handleClick = async () => {
        // Ticket still available → proceed with normal purchase flow
        if (ticket.quantity > 0) {
            onSelect?.(ticket);
            return;
        }

        // Sold‑out tier → join the waitlist
        try {
            await api('/api/waitlist/join', 'POST', {
                tierId: ticket.id,
                quantity: 1
            });
            toast.success(
                'Successfully joined the waitlist. Please check your email for updates.'
            );
        } catch (err: any) {
            toast.error(err.message ?? 'Failed to join the waitlist.');
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`cursor-pointer flex items-center justify-between p-4 border rounded-lg transition-colors ${
                isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'
            }`}
        >
            <div>
                <h3 className="text-2xl font-medium">Tier {ticket.id}</h3>
                <p className="text-2xl text-gray-600">
                    {ticket.quantity > 0 ? (
                        `Available: ${ticket.quantity}`
                    ) : (
                        <span className="text-red-500">Sold Out</span>
                    )}
                </p>
            </div>

            <div className="text-right">
                <p className="text-lg font-bold">${ticket.price}</p>
                {ticket.quantity === 0 && (
                    <p className="text-sm text-blue-600">Click to join waitlist</p>
                )}
            </div>
        </div>
    );
}
