import { Chat, Message, User, IChat, IMessage, IUser } from './models';
import connectDB from './mongodb';
import { currentUser } from '@clerk/nextjs/server';

export class DatabaseService {
  static async ensureConnection() {
    try {
      await connectDB();
    } catch (error) {
      console.error('Database connection failed:', error);
      throw new Error('Failed to connect to database');
    }
  }

  
  static async createOrUpdateUser(clerkUser: any): Promise<IUser> {
    await this.ensureConnection();
    
    const userData = {
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    };

    const user = await User.findOneAndUpdate(
      { clerkId: clerkUser.id },
      userData,
      { upsert: true, new: true }
    );

    return user;
  }

  static async getCurrentUser(): Promise<IUser | null> {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    await this.ensureConnection();
    let user = await User.findOne({ clerkId: clerkUser.id });
    
    if (!user) {
      user = await this.createOrUpdateUser(clerkUser);
    }

    return user;
  }

  
  static async createChat(userId: string, title: string = 'New Chat'): Promise<IChat> {
    await this.ensureConnection();
    
    const chat = new Chat({
      userId,
      title,
    });

    return await chat.save();
  }

  static async getUserChats(userId: string): Promise<IChat[]> {
    await this.ensureConnection();
    
    return await Chat.find({ userId })
      .sort({ updatedAt: -1 });
  }

  static async getChatById(chatId: string, userId: string): Promise<IChat | null> {
    await this.ensureConnection();
    
    return await Chat.findOne({ _id: chatId, userId });
  }

  static async deleteChat(chatId: string, userId: string): Promise<boolean> {
    await this.ensureConnection();
    
    
    await Message.deleteMany({ chatId });
    
    
    const result = await Chat.deleteOne({ _id: chatId, userId });
    return result.deletedCount > 0;
  }

  static async updateChatTitle(chatId: string, userId: string, title: string): Promise<IChat | null> {
    await this.ensureConnection();
    
    return await Chat.findOneAndUpdate(
      { _id: chatId, userId },
      { title, updatedAt: new Date() },
      { new: true }
    );
  }

  
  static async addMessage(chatId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<IMessage> {
    await this.ensureConnection();
    
    const message = new Message({
      chatId,
      role,
      content,
    });

        
    await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });

    return await message.save();
  }

  static async getChatMessages(chatId: string): Promise<IMessage[]> {
    await this.ensureConnection();
    
    return await Message.find({ chatId })
      .sort({ createdAt: 1 });
  }

  static async getRecentMessages(chatId: string, limit: number = 10): Promise<IMessage[]> {
    await this.ensureConnection();
    
    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(limit);
    
    return messages.reverse();
  }
}