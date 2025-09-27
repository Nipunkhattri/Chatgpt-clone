import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { auth } from '@clerk/nextjs/server';
import { DatabaseService } from '@/app/lib/database';
import { addMemory, getRelevantMemory } from '@/app/lib/memory';
import { queryDocuments } from '@/app/lib/pinecone';
import { File } from '@/app/lib/models';
import connectDB from '@/app/lib/mongodb';
import { generateChatTitle } from '@/app/lib/chat-utils';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    await connectDB();

    const { messages, chatId, fileIds } = await request.json();

    console.log('Received messages:', messages);
    console.log('File IDs:', fileIds);

    const user = await DatabaseService.getCurrentUser();
    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    let currentChatId = chatId;

    if (!currentChatId) {
      const newChat = await DatabaseService.createChat(userId, 'New Chat');
      currentChatId = newChat._id.toString();
    }

    const chat = await DatabaseService.getChatById(currentChatId, userId);
    if (!chat) {
      return new Response('Chat not found', { status: 404 });
    }

    const lastUserMessage = messages[messages.length - 1].content;

    const relevantMemory = await getRelevantMemory(lastUserMessage);
    console.log('Relevant memory:', relevantMemory);
    const memoryText = relevantMemory.map((m: any) => m.memory).join('\n');

    let documentContext = '';
    let filesContext = '';

    if (fileIds && fileIds.length > 0) {
      const files = await File.find({ 
        _id: { $in: fileIds },
        userId 
      });

      const processingFiles = files.filter(f => f.status === 'processing');
      
      if (processingFiles.length > 0) {
        return Response.json({
          message: {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: `Please wait, the following files are still being processed: ${processingFiles.map(f => f.fileName).join(', ')}. Please try again in a moment.`,
            createdAt: new Date().toISOString(),
          },
          chatId: currentChatId,
          filesProcessing: true,
        });
      }

      const relevantChunks = await queryDocuments(
        lastUserMessage,
        userId,
        fileIds,
        5
      );

      if (relevantChunks.length > 0) {
        documentContext = '\n\nRelevant document context:\n' + 
          relevantChunks.map((chunk, idx) => 
            `[Document ${idx + 1}]: ${chunk.text}`
          ).join('\n\n');
      }

      filesContext = '\n\nFiles available in this conversation: ' + 
        files.map(f => f.fileName).join(', ');
    } else {
      const chatFiles = await File.find({ chatId: currentChatId, userId });
      
      if (chatFiles.length > 0) {
        const completedFiles = chatFiles.filter(f => f.status === 'completed');
        
        if (completedFiles.length > 0) {
          const relevantChunks = await queryDocuments(
            lastUserMessage,
            userId,
            completedFiles.map(f => f._id.toString()),
            5
          );

          if (relevantChunks.length > 0) {
            documentContext = '\n\nRelevant document context:\n' + 
              relevantChunks.map((chunk, idx) => 
                `[Document ${idx + 1}]: ${chunk.text}`
              ).join('\n\n');
          }
        }

        filesContext = '\n\nFiles in this conversation: ' + 
          chatFiles.map(f => `${f.fileName} (${f.status})`).join(', ');
      }
    }

    const augmentedPrompt = `
      ${memoryText ? `Relevant past memories:\n${memoryText}\n` : ''}
      ${documentContext}
      ${filesContext}

      User query: ${lastUserMessage}

      Instructions:
      - Use the provided document context to answer the user's query when relevant
      - Reference specific information from the documents when applicable
      - If the query is about the uploaded files, use the extracted content to provide accurate answers
      - Maintain context from previous memories when relevant
      - Be helpful and conversational while staying accurate to the provided information
    `.trim();

    console.log('Augmented prompt:', augmentedPrompt);

    const result = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: augmentedPrompt,
      temperature: 0.7,
      maxRetries: 2,
    });

    const messagesToStore = [
      { role: 'user' as const, content: lastUserMessage },
      { role: 'assistant' as const, content: result.text }
    ];
    
    await addMemory(messagesToStore);

    await DatabaseService.addMessage(currentChatId, 'user', lastUserMessage);
    await DatabaseService.addMessage(currentChatId, 'assistant', result.text);

    if (messages.length === 1) {
      const title = generateChatTitle(lastUserMessage);
      await DatabaseService.updateChatTitle(currentChatId, userId, title);
    }

    return Response.json({
      message: {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: result.text,
        createdAt: new Date().toISOString(),
      },
      chatId: currentChatId,
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
