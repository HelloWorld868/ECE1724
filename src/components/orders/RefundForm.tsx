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
              alert(`Refund successful! The amount has been refunded to the credit card ending in ${cardLastFour}.`);
            } else {
              alert('Your refund request has been processed successfully.');
            }
          } else {
            alert('Your refund request has been processed successfully.');
          }
        } catch (err) {
          alert('Your refund request has been processed successfully.');
        }
      } else {
        alert('Your refund request has been processed successfully.');
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg text-lg">
          {error}
        </div>
      )}
      <div className="flex justify-between pt-6">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => router.push(`/user/${userId}/events/${eventId}`)}
          className="text-lg py-3 px-8"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-white text-lg py-3 px-8"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Confirm Refund'}
        </Button>
      </div>
    </form>
  );
} 