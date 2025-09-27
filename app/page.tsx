import { auth } from '@clerk/nextjs/server';
import ChatLayout from '@/app/components/chat-layout';
import WelcomeScreen from '@/app/components/welcome-screen';

export default async function Home() {
  const { userId } = await auth();
  
  if (!userId) {
    return <WelcomeScreen />;
  }

  return <ChatLayout />;
}
