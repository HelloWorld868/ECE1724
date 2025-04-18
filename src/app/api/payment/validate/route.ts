import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

interface PaymentData {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data: PaymentData = await request.json();
    const errors: Partial<Record<keyof PaymentData, string>> = {};

    // validate cardholder name
    if (!data.cardholderName?.trim()) {
      errors.cardholderName = "Cardholder name is required";
    }

    // validate card number
    const cardNumber = data.cardNumber?.replace(/\s/g, '');
    if (!/^\d{16}$/.test(cardNumber)) {
      errors.cardNumber = "Card number must be 16-digit number";
    }

    // validate expiry date
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(data.expiryDate)) {
      errors.expiryDate = "Invalid expiry date format (MM/YY)";
    } else {
      const [month, year] = data.expiryDate.split('/');
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      const expMonth = parseInt(month);
      const expYear = parseInt(year);

      if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
        errors.expiryDate = "Card has expired";
      }
    }

    // validate CVV
    if (!/^\d{3,4}$/.test(data.cvv)) {
      errors.cvv = "CVV must be 3 or 4 digits";
    }

    // if there are errors, return error information
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 