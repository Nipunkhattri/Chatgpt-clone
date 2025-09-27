import { auth } from '@clerk/nextjs/server';
import { DatabaseService } from '@/app/lib/database';

interface RouteParams {
  params: Promise<{ chatId: string }>;
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;
    
    const chat = await DatabaseService.getChatById(chatId, userId);
    if (!chat) {
      return Response.json({ error: 'Chat not found' }, { status: 404 });
    }

    const messages = await DatabaseService.getChatMessages(chatId);
    return Response.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return Response.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}