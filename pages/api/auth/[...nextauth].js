import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';

// Hardcoded test users for development
const TEST_USER = {
  id: 'test-user-123',
  username: '123',
  // Plain text password is '123'
  password: '123'
};

// Hardcoded second test user
const TEST_USER_2 = {
  id: 'test-user-222',
  username: '222',
  // Plain text password is '222'
  password: '222'
};

export default NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Check for test users first (no DB connection needed)
        if (credentials.username === TEST_USER.username && credentials.password === TEST_USER.password) {
          return {
            id: TEST_USER.id,
            username: TEST_USER.username
          };
        } else if (credentials.username === TEST_USER_2.username && credentials.password === TEST_USER_2.password) {
          return {
            id: TEST_USER_2.id,
            username: TEST_USER_2.username
          };
        }
        
        // If not test user, try database (this will only work if MongoDB is running)
        try {
          await dbConnect();
          
          // Find user by username
          const user = await User.findOne({ username: credentials.username }).select('+password');
          
          if (!user) {
            throw new Error('No user found with this username');
          }
          
          // Check if password matches
          const isMatch = await user.comparePassword(credentials.password);
          
          if (!isMatch) {
            throw new Error('Password is incorrect');
          }
          
          // Return user object without password
          return {
            id: user._id.toString(),
            username: user.username,
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw new Error('Authentication failed');
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-for-development',
});
