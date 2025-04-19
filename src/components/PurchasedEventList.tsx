import { Event, Order } from "@prisma/client";
import PurchasedEventCard from "./PurchasedEventCard";

// 更新接口定义，包含票券等级信息
interface OrderWithTicketTier extends Order {
  ticketTier?: {
    id: number;
    price: number;
    quantity: number;
    name?: string;
  };
}

interface PurchasedEventListProps {
  events: Event[];
  orders: OrderWithTicketTier[];
  userId: string;
}

export default function PurchasedEventList({ events, orders, userId }: PurchasedEventListProps) {
  // Create a map of eventId to orders for easier lookup
  const eventOrders = new Map<number, OrderWithTicketTier>();
  
  // For each order, store the most recent one per event
  orders.forEach(order => {
    const existingOrder = eventOrders.get(order.eventId);
    if (!existingOrder || new Date(order.createdAt) > new Date(existingOrder.createdAt)) {
      eventOrders.set(order.eventId, order);
    }
  });
  
  return !events || events.length === 0 ? (
    <p className="text-sm">No purchased events found</p>
  ) : (
    <ul className="space-y-4" data-testid="purchased-event-list">
      {events.map((event) => {
        const order = eventOrders.get(event.id);
        if (!order) return null; // Skip if no order found for this event
        
        // 提取票券等级名称
        const ticketTierName = order.ticketTier ? 
          `${order.ticketTier.name || `Tier #${order.ticketTierId}`} - $${order.ticketTier.price}` : 
          `Tier #${order.ticketTierId}`;
        
        return (
          <PurchasedEventCard 
            event={event} 
            order={order} 
            ticketTierName={ticketTierName}
            userId={userId}
            key={`${event.id}-${order.id}`} 
          />
        );
      })}
    </ul>
  );
} 