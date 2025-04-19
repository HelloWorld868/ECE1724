'use client';

import React from "react";
import { TicketTier } from "@prisma/client";
import { Button } from "@/components/ui/button";

interface TicketItemProps {
  ticket: TicketTier & { quantity: number; description?: string };
  selected: boolean;
  onSelect: (ticket: TicketTier) => void;
  soldOut: boolean;
  onJoinWaitlist?: (ticket: TicketTier) => void;
}

export default function TicketItem({ 
  ticket, 
  selected, 
  onSelect, 
  soldOut, 
  onJoinWaitlist 
}: TicketItemProps) {
  return (
    <div
      className={`relative bg-gray-900 text-white rounded-lg shadow-md overflow-hidden min-h-[8rem] sm:min-h-[10rem] md:min-h-[14rem] cursor-pointer transition-all ${
        selected ? "ring-2 sm:ring-4 ring-blue-500 scale-[1.02]" : "hover:shadow-lg"
      }`}
      onClick={() => !soldOut && onSelect(ticket)}
    >
      {/* Overlay with gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />

      {/* Content */}
      <div className="relative z-10 p-3 sm:p-4 md:p-5 flex flex-col h-full">
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold">{ticket.name}</h3>
            <span className="text-lg sm:text-xl md:text-2xl font-bold">${ticket.price.toFixed(2)}</span>
          </div>
          
          <div className="mt-2 sm:mt-3">
            <p className="text-sm sm:text-base md:text-lg">
              <span className="text-gray-300">Available:</span>{" "}
              <span className={`font-medium ${ticket.quantity <= 5 ? "text-yellow-300" : "text-white"}`}>
                {soldOut ? "Sold Out" : ticket.quantity}
              </span>
            </p>
          </div>
        </div>

        {/* Status indicator */}
        {soldOut ? (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 sm:px-4 sm:py-1 rounded-full text-base sm:text-lg font-bold mb-3 sm:mb-4">
              SOLD OUT
            </span>
            {onJoinWaitlist && (
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onJoinWaitlist(ticket);
                }}
                className="bg-blue-600 hover:bg-blue-700 mt-1 sm:mt-2 text-sm sm:text-base md:text-lg px-3 py-1 sm:px-4 sm:py-2"
              >
                Join Waitlist
              </Button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
