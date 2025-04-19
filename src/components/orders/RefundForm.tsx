'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

interface RefundFormProps {
  orderId: number;
  userId: string;
  eventId: number;
}

export default function RefundForm({ orderId, userId, eventId }: RefundFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'Customer requested refund' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process refund');
      }

      // Get response data
      const data = await response.json();
      
      // Show success message
      if (data.refundTransactionId) {
        // Get transaction details to find credit card last four digits
        try {
          const transactionResponse = await fetch(`/api/transactions/${data.refundTransactionId}`);
          if (transactionResponse.ok) {
            const transactionData = await transactionResponse.json();
            const cardLastFour = transactionData.transaction?.cardLastFour;
            
            if (cardLastFour) {
              alert(`Refund successful! The amount has been refunded to the credit card ending in ${cardLastFour}. Please allow 3-5 business days for the refund to process.`);
            } else {
              alert('Your refund request has been processed successfully. Please allow 3-5 business days for the refund to process.');
            }
          } else {
            alert('Your refund request has been processed successfully. Please allow 3-5 business days for the refund to process.');
          }
        } catch (err) {
          alert('Your refund request has been processed successfully. Please allow 3-5 business days for the refund to process.');
        }
      } else {
        alert('Your refund request has been processed successfully. Please allow 3-5 business days for the refund to process.');
      }

      // Redirect back to tickets page after success
      router.push(`/user/${userId}/events/${eventId}`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while processing your request');
      setIsSubmitting(false);
      alert('Refund failed: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
          {error}
        </div>
      )}
      <div className="flex justify-between pt-4">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.push(`/user/${userId}/events/${eventId}`)}
        >
          Return to My Tickets
        </Button>
        <Button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Confirm Refund'}
        </Button>
      </div>
    </form>
  );
} 