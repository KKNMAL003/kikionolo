import { supabase } from '../../lib/supabase';
import type { 
  IOrderService, 
  Order, 
  OrderItem, 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  OrderFilters 
} from '../interfaces/IOrderService';
import type { SupabaseOrder, SupabaseOrderItem, OrderWithItems, OrderStats } from './types';

export class OrderService implements IOrderService {
  private static instance: OrderService;
  
  // Singleton pattern to ensure one instance
  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }
    return OrderService.instance;
  }

  /**
   * Create a new order
   */
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    try {
      console.log('OrderService: Creating new order:', request);

      // Prepare order record for Supabase
      const orderRecord = {
        user_id: request.userId,
        customer_id: request.userId,
        customer_name: request.customerName,
        customer_email: request.customerEmail,
        delivery_address: request.deliveryAddress,
        delivery_phone: request.customerPhone,
        payment_method: request.paymentMethod === 'card_on_delivery' ? 'card' : request.paymentMethod,
        total_amount: request.totalAmount,
        status: 'pending',
        notes: request.notes || '',
        delivery_date: request.deliveryDate || new Date().toISOString().split('T')[0],
        preferred_delivery_window: request.preferredDeliveryWindow || null,
      };

      console.log('OrderService: Creating order in database:', orderRecord);

      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert(orderRecord)
        .select()
        .single();

      if (orderError || !newOrder) {
        console.error('OrderService: Order creation failed:', orderError);
        throw new Error(orderError?.message || 'Failed to create order');
      }

      // Create order items
      const orderItems = request.items.map((item) => ({
        order_id: newOrder.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      console.log('OrderService: Creating order items:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('OrderService: Order items creation failed:', itemsError);
        throw new Error(itemsError.message);
      }

      // Return formatted order
      const formattedOrder = this.formatOrder(newOrder, request.items);
      console.log('OrderService: Order created successfully:', formattedOrder.id);
      
      return formattedOrder;
    } catch (error: any) {
      console.error('OrderService: Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get all orders for a user
   */
  async getOrders(userId: string, filters?: OrderFilters): Promise<Order[]> {
    try {
      console.log('OrderService: Fetching orders for user:', userId, filters);

      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq('customer_id', userId);

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply pagination
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      const { data: ordersData, error } = await query;

      if (error) {
        console.error('OrderService: Error fetching orders:', error);
        throw new Error(error.message);
      }

      const formattedOrders = ordersData?.map((orderData: OrderWithItems) => 
        this.formatOrderWithItems(orderData)
      ) || [];

      console.log(`OrderService: Fetched ${formattedOrders.length} orders`);
      return formattedOrders;
    } catch (error: any) {
      console.error('OrderService: Error in getOrders:', error);
      throw error;
    }
  }

  /**
   * Get a specific order by ID
   */
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      console.log('OrderService: Fetching order by ID:', orderId);

      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          console.log('OrderService: Order not found:', orderId);
          return null;
        }
        console.error('OrderService: Error fetching order:', error);
        throw new Error(error.message);
      }

      if (!orderData) {
        return null;
      }

      const formattedOrder = this.formatOrderWithItems(orderData);
      console.log('OrderService: Order fetched successfully:', orderId);
      
      return formattedOrder;
    } catch (error: any) {
      console.error('OrderService: Error in getOrderById:', error);
      throw error;
    }
  }

  /**
   * Update order status or details
   */
  async updateOrder(request: UpdateOrderRequest): Promise<Order> {
    try {
      console.log('OrderService: Updating order:', request.orderId, request);

      const updates: Partial<SupabaseOrder> = {};

      if (request.status) {
        updates.status = request.status;
      }

      if (request.trackingInfo) {
        updates.tracking_notes = request.trackingInfo;
      }

      if (request.estimatedDelivery) {
        updates.estimated_delivery_start = request.estimatedDelivery;
      }

      updates.updated_at = new Date().toISOString();

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', request.orderId)
        .select()
        .single();

      if (error || !updatedOrder) {
        console.error('OrderService: Order update failed:', error);
        throw new Error(error?.message || 'Failed to update order');
      }

      // Fetch updated order with items
      const order = await this.getOrderById(request.orderId);
      if (!order) {
        throw new Error('Failed to fetch updated order');
      }

      console.log('OrderService: Order updated successfully:', request.orderId);
      return order;
    } catch (error: any) {
      console.error('OrderService: Error updating order:', error);
      throw error;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      console.log('OrderService: Cancelling order:', orderId);

      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) {
        console.error('OrderService: Order cancellation failed:', error);
        return false;
      }

      console.log('OrderService: Order cancelled successfully:', orderId);
      return true;
    } catch (error: any) {
      console.error('OrderService: Error cancelling order:', error);
      return false;
    }
  }

  /**
   * Get order statistics for user
   */
  async getOrderStats(userId: string): Promise<OrderStats> {
    try {
      console.log('OrderService: Fetching order stats for user:', userId);

      const { data: orders, error } = await supabase
        .from('orders')
        .select('status')
        .eq('customer_id', userId);

      if (error) {
        console.error('OrderService: Error fetching order stats:', error);
        throw new Error(error.message);
      }

      const stats: OrderStats = {
        total: orders?.length || 0,
        pending: orders?.filter(o => o.status === 'pending').length || 0,
        completed: orders?.filter(o => o.status === 'delivered').length || 0,
        cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
      };

      console.log('OrderService: Order stats calculated:', stats);
      return stats;
    } catch (error: any) {
      console.error('OrderService: Error in getOrderStats:', error);
      throw error;
    }
  }

  /**
   * Format Supabase order to interface format
   * @private
   */
  private formatOrder(supabaseOrder: SupabaseOrder, items: OrderItem[]): Order {
    return {
      id: supabaseOrder.id,
      customerName: supabaseOrder.customer_name,
      customerEmail: supabaseOrder.customer_email,
      deliveryAddress: supabaseOrder.delivery_address,
      paymentMethod: supabaseOrder.payment_method,
      totalAmount: supabaseOrder.total_amount,
      status: supabaseOrder.status as any,
      date: supabaseOrder.created_at,
      items,
    };
  }

  /**
   * Format Supabase order with items to interface format
   * @private
   */
  private formatOrderWithItems(orderData: OrderWithItems): Order {
    const items: OrderItem[] = orderData.order_items?.map(item => ({
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      price: item.unit_price,
    })) || [];

    return {
      id: orderData.id,
      customerName: orderData.customer_name,
      customerEmail: orderData.customer_email,
      deliveryAddress: orderData.delivery_address,
      paymentMethod: orderData.payment_method,
      totalAmount: orderData.total_amount,
      status: orderData.status as any,
      date: orderData.created_at,
      items,
    };
  }
}

// Export singleton instance
export const orderService = OrderService.getInstance();