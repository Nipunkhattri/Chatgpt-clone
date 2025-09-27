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

    return Response.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return Response.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;
    const { title } = await request.json();
    
    if (!title || title.trim() === '') {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    const updatedChat = await DatabaseService.updateChatTitle(
      chatId, 
      userId, 
      title.trim()
    );
    
    if (!updatedChat) {
      return Response.json({ error: 'Chat not found' }, { status: 404 });
    }

    return Response.json(updatedChat);
  } catch (error) {
    console.error('Error updating chat:', error);
    return Response.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = await params;
    const success = await DatabaseService.deleteChat(chatId, userId);
    
    if (!success) {
      return Response.json({ error: 'Chat not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return Response.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}