'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TicketTier } from "@prisma/client";
import TicketItem from "./TicketItem";
import { Button } from "@/components/ui/button";

// Type for component props
interface TicketSectionProps {
  tickets: TicketTier[];
  eventId: string;
}

// Client component that wraps the ticket items
export default function TicketSection({ tickets, eventId }: TicketSectionProps) {
  const router = useRouter();
  const [selectedTicket, setSelectedTicket] = useState<TicketTier | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [discountCode, setDiscountCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{
    type: string;
    value: number;
    valid: boolean;
    message: string;
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Handle quantity changes with validation
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (selectedTicket && value >= 1 && value <= selectedTicket.quantity) {
      setQuantity(value);
    }
  };

  // Handle discount code validation
  const validateDiscountCode = async () => {
    if (!discountCode.trim()) return;
    
    setIsValidating(true);
    try {
      console.log("Validating discount code:", {
        code: discountCode,
        eventId: eventId,
        eventIdType: typeof eventId
      });

      const response = await fetch(`/api/discount/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: discountCode,
          eventId: parseInt(eventId),
        }),
      });

      const data = await response.json();
      console.log("Validation response:", data);
      
      if (response.ok) {
        setDiscountInfo({
          type: data.discountType,
          value: data.discountValue,
          valid: true,
          message: "Discount code is valid!",
        });
      } else {
        setDiscountInfo({
          type: "",
          value: 0,
          valid: false,
          message: data.error || "Invalid discount code",
        });
      }
    } catch (error) {
      setDiscountInfo({
        type: "",
        value: 0,
        valid: false,
        message: "Error validating discount code",
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Calculate total price with discount
  const calculateTotal = () => {
    if (!selectedTicket) return 0;
    
    const baseTotal = selectedTicket.price * quantity;
    
    if (!discountInfo?.valid) return baseTotal;
    
    if (discountInfo.type === "PERCENTAGE") {
      return baseTotal * (1 - discountInfo.value / 100);
    } else {
      return Math.max(0, baseTotal - discountInfo.value);
    }
  };

  // Handle purchase
  const handlePurchase = async () => {
    if (selectedTicket) {
      try {
        // Create ticket reservation first
        const reservationResponse = await fetch("/api/tickets/reserve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tierId: selectedTicket.id,
            quantity,
          }),
        });

        if (!reservationResponse.ok) {
          throw new Error('Failed to reserve tickets');
        }

        const { reservationId } = await reservationResponse.json();
        
        // Add reservationId to URL params
        const params = new URLSearchParams({
          tierId: selectedTicket.id.toString(),
          quantity: quantity.toString(),
          reservationId: reservationId.toString(),
          ...(discountInfo?.valid && { 
            discountCode,
            discountType: discountInfo.type,
            discountValue: discountInfo.value.toString()
          }),
        });
        
        router.push(`/events/${eventId}/purchase?${params.toString()}`);
      } catch (error) {
        console.error('Error reserving tickets:', error);
        alert('Failed to reserve tickets. Please try again.');
      }
    }
  };

  // Handle join waitlist
  const handleJoinWaitlist = (ticket: TicketTier) => {
    // TODO: implement join wl function here
    alert('TODO: add join waitlist function');
  };

  return (
    <div className="relative">
      <div className="bg-white rounded-lg shadow-md p-6 mb-24">
        <h2 className="text-3xl font-semibold mb-4">Select Tickets</h2>
        <div className="space-y-6">
          {tickets.map((ticket) => (
            <TicketItem
              key={ticket.id}
              ticket={ticket}
              isSelected={selectedTicket?.id === ticket.id}
              onSelect={(ticket) => {
                setSelectedTicket(ticket);
                setQuantity(1);
              }}
              onJoinWaitlist={handleJoinWaitlist}
            />
          ))}
        </div>

        {/* Discount Code Section */}
        <div className="mt-6 border-t pt-6">
          <label className="block text-lg font-medium mb-2">Discount Code</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Enter discount code"
              className="text-lg flex-1 p-2 border rounded-md"
            />
            <Button
              onClick={validateDiscountCode}
              disabled={!discountCode.trim() || isValidating}
            >
              {isValidating ? "Validating..." : "Validate"}
            </Button>
          </div>
          {discountInfo && (
            <p className={`mt-2 text-sm ${discountInfo.valid ? "text-green-600" : "text-red-600"}`}>
              {discountInfo.message}
            </p>
          )}
        </div>
      </div>

      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-600">Quantity:</span>
              <input
                type="number"
                min="1"
                max={selectedTicket?.quantity || 1}
                value={quantity}
                onChange={handleQuantityChange}
                disabled={!selectedTicket}
                className="w-20 px-3 py-1 text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">
                Total: ${calculateTotal().toFixed(2)}
              </p>
              {discountInfo?.valid && (
                <p className="text-sm text-green-600">
                  Discount Applied: {discountInfo.type === "PERCENTAGE" ? `${discountInfo.value}%` : `$${discountInfo.value}`}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={handlePurchase}
            disabled={!selectedTicket}
            size="lg"
          >
            Purchase Tickets
          </Button>
        </div>
      </div>
    </div>
  );
}