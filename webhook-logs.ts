import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function queryWebhookLogs() {
  try {
    const logs = await prisma.webhookLog.findMany({
      orderBy: {
        timestamp: 'desc'
      },
      take: 10
    });
    
    console.log('Recent webhook logs:');
    console.log(JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Error querying webhook logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

queryWebhookLogs();