'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TicketTier } from "@prisma/client";
import TicketItem from "./TicketItem";
import { Button } from "@/components/ui/button";

// Type for component props
interface TicketSectionProps {
  tickets: any[];
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
    discountCodeId?: number;
    discountReservationId?: number;
    reservationExpiry?: Date;
    reservationId?: number;
    expiresAt?: Date;
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
  const validateDiscountCode = async (ticketReservationId?: number) => {
    if (!discountCode.trim()) return;
    
    setIsValidating(true);
    try {
      console.log("Validating discount code:", {
        code: discountCode,
        eventId: eventId,
        eventIdType: typeof eventId,
        ticketReservationId
      });

      const response = await fetch(`/api/discount/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: discountCode,
          eventId: parseInt(eventId)
        }),
      });

      const data = await response.json();
      console.log("Validation response:", data);
      
      if (response.ok) {
        console.log("Discount code validation successful, full response data:", data);
        
        // Check required fields
        if (!data.discountReservationId) {
          console.warn("Warning: API response is missing discountReservationId field!");
        } else {
          console.log("Found discount reservation ID:", data.discountReservationId);
        }
        
        setDiscountInfo({
          type: data.discountType,
          value: data.discountValue,
          valid: true,
          message: "Discount code is valid!",
          discountCodeId: data.discountCodeId,
          discountReservationId: data.discountReservationId,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
        });
        
        console.log("Discount info set:", {
          discountCodeId: data.discountCodeId,
          discountReservationId: data.discountReservationId
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
      console.error("Error validating discount code:", error);
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
        // if there is a discount code, validate it
        let validDiscount = true;
        let discountReservationId;
        let reservationExpiry;
        
        console.log("Purchase started, current discount info:", discountInfo);
        
        if (discountInfo?.valid && discountInfo.discountCodeId) {
          // Check if reservation ID already exists, prioritize discountReservationId
          if (discountInfo.discountReservationId) {
            console.log("Getting reservation ID from discount info:", discountInfo.discountReservationId);
            discountReservationId = discountInfo.discountReservationId;
            reservationExpiry = discountInfo.expiresAt;
          } else if (discountInfo.reservationId) {
            // Backward compatibility, in case of using old API
            console.log("Getting reservation ID from discountInfo.reservationId:", discountInfo.reservationId);
            discountReservationId = discountInfo.reservationId;
            reservationExpiry = discountInfo.expiresAt;
          }
          
          try {
            // Check if discount code reservation is still valid
            const checkResponse = await fetch(`/api/discount/check`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                discountCodeId: discountInfo.discountCodeId
              }),
            });
            
            if (!checkResponse.ok) {
              const errorData = await checkResponse.json();
              console.error("Discount code check failed:", errorData);
              alert(`Your discount code is no longer valid: ${errorData.error}`);
              setDiscountInfo(null);
              validDiscount = false;
              // ask user if they want to continue
              if (!confirm("Would you like to continue without the discount code?")) {
                return; // user chose to cancel
              }
            } else {
              const checkData = await checkResponse.json();
              discountReservationId = checkData.discountReservationId;
              reservationExpiry = checkData.reservationExpiry ? new Date(checkData.reservationExpiry) : undefined;
              console.log("Discount code check successful:", checkData);
            }
          } catch (error) {
            console.error("Error checking discount code:", error);
            if (!confirm("There was an error checking your discount code. Continue without discount?")) {
              return; // user chose to cancel
            }
            validDiscount = false;
            setDiscountInfo(null);
          }
        }

        // create ticket reservation
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
        
        // If discount code is valid, link it with the ticket reservation
        if (validDiscount && discountInfo?.valid && discountInfo.discountCodeId && discountReservationId) {
          try {
            // Link discount reservation to ticket reservation
            const linkResponse = await fetch("/api/discount/reserve", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                discountReservationId: discountReservationId,
                ticketReservationId: reservationId
              }),
            });
            
            if (!linkResponse.ok) {
              const errorData = await linkResponse.json();
              console.error("Failed to link discount with ticket reservation:", errorData);
              
              // If linking fails, continue but without discount
              alert(`Could not apply discount code: ${errorData.error}`);
              setDiscountInfo(null);
              discountReservationId = undefined;
            }
          } catch (error) {
            console.error("Error linking discount with ticket reservation:", error);
          }
        }
        
        // Build URL parameters for purchase page
        console.log("Building URL parameters, current values:", {
          discountCodeId: discountInfo?.discountCodeId,
          discountReservationId,
          validDiscount,
          discountInfoValid: discountInfo?.valid
        });
        
        // Create base parameters object
        let paramsObj: Record<string, string> = {
          tierId: selectedTicket.id.toString(),
          quantity: quantity.toString(),
          reservationId: reservationId.toString(),
        };
        
        // If there is a valid discount code, add discount-related parameters
        if (validDiscount && discountInfo?.valid) {
          paramsObj.discountCode = discountCode;
          paramsObj.discountType = discountInfo.type;
          paramsObj.discountValue = discountInfo.value.toString();
          
          if (discountInfo.discountCodeId) {
            paramsObj.discountCodeId = discountInfo.discountCodeId.toString();
          }
          
          // Prioritize discountReservationId from check API
          if (discountReservationId) {
            console.log("Using check API's discount reservation ID:", discountReservationId);
            paramsObj.discountReservationId = discountReservationId.toString();
          }
          // Otherwise use the one saved in discountInfo
          else if (discountInfo.discountReservationId) {
            console.log("Using validate API's discount reservation ID:", discountInfo.discountReservationId);
            paramsObj.discountReservationId = discountInfo.discountReservationId.toString();
          }
          else {
            console.warn("Warning: No discount reservation ID found, cannot add to URL parameters");
          }
        }
        
        const params = new URLSearchParams(paramsObj);
        
        const finalUrl = `/events/${eventId}/purchase?${params.toString()}`;
        console.log("Final URL:", finalUrl);
        console.log("URL contains discountReservationId:", finalUrl.includes("discountReservationId"));
        
        // Redirect to purchase page
        router.push(finalUrl);
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
              onClick={() => validateDiscountCode(selectedTicket?.id)}
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