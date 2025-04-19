'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface PurchaseClientProps {
  event: any;
  selectedTier: any;
  quantity: number;
  totalPrice: number;
  basePrice: number;
  discountCode?: string;
  discountType?: string;
  discountValue?: number | null;
  discountCodeId?: number;
  discountReservationId?: number;
  reservationId: number;
}

interface PaymentFormData {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export default function PurchaseClient({ 
  event, 
  selectedTier, 
  quantity,
  totalPrice,
  basePrice,
  discountCode,
  discountType,
  discountValue,
  discountCodeId,
  discountReservationId,
  reservationId
}: PurchaseClientProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<Partial<PaymentFormData>>({});

  useEffect(() => {
    console.log("===== Purchase Page Initialized =====");
    console.log(`Ticket reservation: ${reservationId}, Discount reservation: ${discountReservationId}`);
    console.log("=====================================");
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/session");
      const data = await res.json();
      setUser(data.user);
    };
    fetchUser();
  }, []);

  const handleCancel = async () => {
    console.log("===== Starting Cancellation =====");
    
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    setIsCancelling(true);
    try {
      // Release discount code reservation if exists
      if (discountReservationId) {
        console.log(`Releasing discount reservation: ${discountReservationId}`);
        
        try {
          const discountResponse = await fetch('/api/discount/release', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ discountReservationId })
          });
          
          if (!discountResponse.ok) {
            console.warn('Failed to release discount reservation');
          } else {
            console.log('Discount reservation released');
          }
        } catch (discountError) {
          console.error('Error releasing discount reservation');
        }
      }

      // Cancel ticket reservation
      console.log(`Cancelling ticket reservation: ${reservationId}`);
      const response = await fetch(`/api/tickets/reserve/${reservationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel reservation');
      } else {
        console.log('Ticket reservation cancelled');
      }

      router.push(`/events/${event.id}/tickets`);
    } catch (error) {
      console.error('Error during cancellation');
      alert('Failed to cancel reservation. Please try again.');
    } finally {
      setIsCancelling(false);
      console.log("===== Cancellation Completed =====");
    }
  };

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      router.push("/signin");
      return;
    }

    const form = e.currentTarget;
    const formData: PaymentFormData = {
      cardholderName: (form.elements.namedItem('cardholderName') as HTMLInputElement).value,
      cardNumber: (form.elements.namedItem('cardNumber') as HTMLInputElement).value,
      expiryDate: (form.elements.namedItem('expiryDate') as HTMLInputElement).value,
      cvv: (form.elements.namedItem('cvv') as HTMLInputElement).value,
    };

    try {
      setIsProcessing(true);
      setFormErrors({});
      
      console.log("===== Starting Payment Process =====");
      
      // Call payment validation API
      const validationResponse = await fetch('/api/payment/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const validationData = await validationResponse.json();
      
      if (!validationResponse.ok) {
        if (validationData.errors) {
          setFormErrors(validationData.errors);
          return;
        }
        throw new Error(validationData.error || 'Payment validation failed');
      }

      // Create order
      console.log("Creating order...");
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          tierId: selectedTier.id,
          quantity,
          totalAmount: totalPrice,
          reservationId,
          ...(discountCode && { discountCode }),
          ...(discountCodeId && { discountCodeId }),
          ...(discountReservationId && { discountReservationId }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      console.log(`Order created: ${data.orderId}`);
      
      // Process payment
      console.log("Processing payment...");
      const payResponse = await fetch(`/api/orders/${data.orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cardLastFour: formData.cardNumber.slice(-4)
        })
      });

      if (!payResponse.ok) {
        throw new Error('Payment failed');
      }

      console.log("Payment successful, redirecting to confirmation page");
      router.push(`/orders/${data.orderId}/confirmation`);
    } catch (error) {
      console.error('Error during payment process:', error);
      alert(error instanceof Error ? error.message : 'An error occurred during processing');
    } finally {
      setIsProcessing(false);
      console.log("===== Payment Process Completed =====");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold mb-8">Purchase Tickets</h1>
        
        <div className="space-y-4 mb-8">
          <div>
            <h2 className="text-2xl font-semibold mb-2">{event.name}</h2>
            <p className="text-lg text-gray-600">Ticket Tier: {selectedTier.name}</p>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-2xl font-semibold mb-2">Price Details</h3>
            <div className="space-y-2">
              <div className="text-lg flex justify-between">
                <span>Base Price ({quantity} tickets)</span>
                <span>${basePrice.toFixed(2)}</span>
              </div>
              
              {discountCode && discountValue && (
                <div className="text-lg flex justify-between text-green-600">
                  <span>Discount ({discountCode})</span>
                  <span>
                    -{discountType === 'PERCENTAGE' 
                      ? `${discountValue}%` 
                      : `$${discountValue}`}
                  </span>
                </div>
              )}

              <div className="text-2xl flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {!user ? (
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-4">Please sign in to purchase tickets</p>
            <Button
              onClick={() => router.push("/signin")}
              className="px-8"
            >
              Sign in to Purchase
            </Button>
          </div>
        ) : (
          <div>
            <h3 className="text-2xl font-semibold mb-4">Payment Information</h3>
            <form onSubmit={handlePayment} className="space-y-6">
              <div>
                <label className="text-lg block font-medium mb-1">Cardholder Name</label>
                <input
                  type="text"
                  name="cardholderName"
                  required
                  className={`w-full p-2 border rounded-md text-lg ${
                    formErrors.cardholderName ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter cardholder name"
                />
                {formErrors.cardholderName && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.cardholderName}</p>
                )}
              </div>

              <div>
                <label className="block text-lg font-medium mb-1">Card Number</label>
                <input
                  type="text"
                  name="cardNumber"
                  required
                  maxLength={16}
                  className={`w-full p-2 border rounded-md text-lg ${
                    formErrors.cardNumber ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter 16-digit card number"
                />
                {formErrors.cardNumber && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.cardNumber}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-lg font-medium mb-1">Expiry Date</label>
                  <input
                    type="text"
                    name="expiryDate"
                    required
                    placeholder="MM/YY"
                    className={`w-full p-2 border rounded-md text-lg ${
                      formErrors.expiryDate ? 'border-red-500' : ''
                    }`}
                  />
                  {formErrors.expiryDate && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.expiryDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-lg font-medium mb-1">CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    required
                    maxLength={4}
                    className={`w-full p-2 border rounded-md text-lg ${
                      formErrors.cvv ? 'border-red-500' : ''
                    }`}
                    placeholder="CVV"
                  />
                  {formErrors.cvv && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.cvv}</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Processing Payment...' : `Pay $${totalPrice.toFixed(2)}`}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isCancelling || isProcessing}
                  className="w-full"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Purchase'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
