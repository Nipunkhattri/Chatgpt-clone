import { auth } from '@clerk/nextjs/server';
import ChatLayout from '@/app/components/chat-layout';
import WelcomeScreen from '@/app/components/welcome-screen';

interface ChatPageProps {
  params: {
    chatId: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { userId } = await auth();
  
  if (!userId) {
    return <WelcomeScreen />;
  }

  return <ChatLayout initialChatId={params.chatId} />;
}