import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createUser() {
  const username = 'gabor';
  const password = 'password123'; // You should change this!

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      console.log(`User '${username}' already exists.`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword
      }
    });

    console.log(`User '${username}' created successfully with ID: ${user.id}`);
    console.log(`Default password: ${password}`);
    console.log('Please change the password after first login!');
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();