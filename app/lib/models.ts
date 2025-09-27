import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat extends Document {
  _id: string;
  userId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  _id: string;
  chatId: mongoose.Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

export interface IFile extends Document {
  _id: string;
  userId: string;
  chatId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  extractedText?: string;
  vectorIndexId?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  imageUrl: {
    type: String,
  },
}, {
  timestamps: true,
});

const ChatSchema = new Schema<IChat>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    default: 'New Chat',
  },
}, {
  timestamps: true,
});

const MessageSchema = new Schema<IMessage>({
  chatId: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

const FileSchema = new Schema<IFile>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  chatId: {
    type: String,
    index: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  cloudinaryUrl: {
    type: String,
    required: true,
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'completed', 'failed'],
    default: 'uploading',
  },
  extractedText: {
    type: String,
  },
  vectorIndexId: {
    type: String,
  },
  error: {
    type: String,
  },
}, {
  timestamps: true,
});

ChatSchema.index({ userId: 1, createdAt: -1 });
MessageSchema.index({ chatId: 1, createdAt: 1 });

FileSchema.index({ userId: 1, createdAt: -1 });
FileSchema.index({ chatId: 1, createdAt: -1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
export const File = mongoose.models.File || mongoose.model<IFile>('File', FileSchema);