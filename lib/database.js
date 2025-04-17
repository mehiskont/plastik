import { prisma, isPrismaConnected } from './prisma';
import supabase from './supabase';

// Cache the connection status to avoid checking repeatedly
let isPrismaConnectedCache = null;

// Initialize the connection check
async function checkConnection() {
  if (isPrismaConnectedCache === null) {
    isPrismaConnectedCache = await isPrismaConnected().catch(() => false);
  }
  return isPrismaConnectedCache;
}

/**
 * Database interface that tries to use Prisma first, then falls back to Supabase
 */
export const db = {
  /**
   * Get a user by ID
   */
  async getUser(id) {
    try {
      if (await checkConnection()) {
        return await prisma.user.findUnique({ where: { id } });
      } else {
        const { data } = await supabase.from('users').select('*').eq('id', id).single();
        return data;
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  /**
   * Get a user by email
   */
  async getUserByEmail(email) {
    try {
      if (await checkConnection()) {
        return await prisma.user.findUnique({ where: { email } });
      } else {
        const { data } = await supabase.from('users').select('*').eq('email', email).single();
        return data;
      }
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },

  /**
   * Get all users
   */
  async getUsers() {
    try {
      if (await checkConnection()) {
        return await prisma.user.findMany();
      } else {
        const { data } = await supabase.from('users').select('*');
        return data;
      }
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  /**
   * Create a new user
   */
  async createUser(userData) {
    try {
      if (await checkConnection()) {
        return await prisma.user.create({ data: userData });
      } else {
        const { data } = await supabase.from('users').insert([userData]).select().single();
        return data;
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  /**
   * Get orders
   */
  async getOrders() {
    try {
      if (await checkConnection()) {
        return await prisma.order.findMany({ include: { items: true } });
      } else {
        const { data } = await supabase.from('orders').select('*, items:order_items(*)');
        return data;
      }
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  },

  /**
   * Get order by ID
   */
  async getOrder(id) {
    try {
      if (await checkConnection()) {
        return await prisma.order.findUnique({ 
          where: { id },
          include: { items: true } 
        });
      } else {
        const { data } = await supabase
          .from('orders')
          .select('*, items:order_items(*)')
          .eq('id', id)
          .single();
        return data;
      }
    } catch (error) {
      console.error('Error getting order:', error);
      return null;
    }
  },

  /**
   * Create a new order
   */
  async createOrder(orderData, items = []) {
    try {
      if (await checkConnection()) {
        return await prisma.order.create({
          data: {
            ...orderData,
            items: {
              create: items
            }
          },
          include: { items: true }
        });
      } else {
        // Create order first
        const { data: order, error } = await supabase
          .from('orders')
          .insert([orderData])
          .select()
          .single();
          
        if (error) throw error;
        
        // Then add items
        if (items.length > 0) {
          const orderItems = items.map(item => ({
            ...item,
            order_id: order.id
          }));
          
          await supabase.from('order_items').insert(orderItems);
        }
        
        // Return the order with items
        return await db.getOrder(order.id);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }
};

export default db; 