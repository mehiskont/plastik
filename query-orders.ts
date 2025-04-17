import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function queryRecentOrders() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        items: true
      },
      take: 5
    });
    
    console.log('Recent orders:');
    console.log(JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error querying orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryRecentOrders();