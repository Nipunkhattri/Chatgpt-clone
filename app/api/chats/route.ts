import { auth } from '@clerk/nextjs/server';
import { DatabaseService } from '@/app/lib/database';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chats = await DatabaseService.getUserChats(userId);
    return Response.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return Response.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title } = await request.json();
    
    const newChat = await DatabaseService.createChat(
      userId, 
      title || 'New Chat'
    );
    
    return Response.json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    return Response.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}