import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { transactionId: string } }
) {
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
    
    const { transactionId } = await Promise.resolve(params);
    const transactionIdNum = parseInt(transactionId);

    if (isNaN(transactionIdNum)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID' },
        { status: 400 }
      );
    }

    // Fetch transaction with order information to verify ownership
    const transaction = await prisma.transaction.findUnique({
      where: {
        id: transactionIdNum,
      },
      include: {
        order: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Verify the user is authorized to view this transaction
    if (transaction.order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to view this transaction' },
        { status: 403 }
      );
    }

    // Return transaction data with sensitive information omitted
    return NextResponse.json({
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        createdAt: transaction.createdAt,
        cardLastFour: transaction.cardLastFour
      }
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction details' },
      { status: 500 }
    );
  }
} 