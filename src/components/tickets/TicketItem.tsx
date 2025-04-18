'use client';

import { TicketTier } from "@prisma/client";

// Type for component props
interface TicketItemProps {
  ticket: TicketTier;
  isSelected: boolean;
  onSelect: (ticket: TicketTier) => void;
  onJoinWaitlist: (ticket: TicketTier) => void;
}

export default function TicketItem({ ticket, isSelected, onSelect, onJoinWaitlist }: TicketItemProps) {
  const handleClick = () => {
    if (ticket.quantity > 0) {
      onSelect(ticket);
    } else {
      onJoinWaitlist(ticket);
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