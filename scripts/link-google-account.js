// Script to link an existing user to a Google account
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkGoogleAccount() {
  try {
    // Find the user you want to link (replace with your email)
    const user = await prisma.user.findUnique({
      where: { email: 'mehiskont@gmail.com' }
    });
    
    if (!user) {
      console.error('User not found with email mehiskont@gmail.com');
      return;
    }
    
    console.log('Found user:', user);
    
    // Create a new Account record for Google
    // Note: You'll need to update providerAccountId with your Google sub ID
    // This is a placeholder that will let you login once, then NextAuth will update with the correct value
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: 'placeholder-will-be-updated', // This gets updated on first login
        scope: 'email profile openid',
        token_type: 'Bearer',
        // Auth.js will update these fields automatically on successful login
        access_token: 'placeholder',
        id_token: 'placeholder',
      }
    });
    
    console.log('Created Google account link:', account);
    
    // Update user to ensure emailVerified is set
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date()
      }
    });
    
    console.log('Updated user emailVerified status');
    console.log('Account linking complete!');
    
  } catch (error) {
    console.error('Error linking account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

linkGoogleAccount();