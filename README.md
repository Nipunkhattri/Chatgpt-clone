# ChatGPT Clone

A full-featured ChatGPT clone built with Next.js 15, featuring AI-powered conversations, document upload and processing, memory management, and vector search capabilities.

## 🚀 Features

### Core Functionality
- **AI Chat Interface**: Powered by Groq's Llama 3.3 70B model for intelligent conversations
- **User Authentication**: Secure authentication using Clerk
- **Chat Management**: Create, save, and manage multiple chat conversations
- **Real-time Messaging**: Interactive chat interface with streaming responses

### Document Processing
- **Multi-format Support**: Upload and process PDFs, Word docs, text files, images, and more
- **Text Extraction**: Automatic text extraction from various file formats using:
  - PDF parsing with `pdf-parse`
  - Word document processing with `mammoth`
  - Image OCR with `tesseract.js`
  - CSV parsing capabilities
- **Vector Search**: Document content is vectorized and stored in Pinecone for semantic search
- **Context-Aware Responses**: AI responses include relevant information from uploaded documents

### Advanced Features
- **Memory Management**: Persistent memory system using Mem0AI for context retention
- **File Management**: Upload, process, and delete files with real-time status updates
- **Responsive Design**: Modern, mobile-friendly interface with dark theme
- **Drag & Drop**: Easy file upload with drag-and-drop functionality

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **Lucide React** icons

### Backend & AI
- **Groq AI SDK** for LLM integration
- **LangChain** for document processing
- **Azure OpenAI** for embeddings
- **Pinecone** for vector database
- **Mem0AI** for memory management

### Database & Storage
- **MongoDB** with Mongoose ODM
- **Cloudinary** for file storage
- **Clerk** for authentication

### File Processing
- **Sharp** for image processing
- **Formidable** for file uploads
- **Tesseract.js** for OCR
- **Mammoth** for Word documents
- **PDF-parse** for PDF processing

## 📋 Prerequisites

Before running this project, ensure you have:

- Node.js 18+ installed
- MongoDB database
- Cloudinary account
- Pinecone account
- Clerk account
- Groq API key
- Azure OpenAI account (for embeddings)

## 🔧 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI Services
GROQ_API_KEY=your_groq_api_key

# Azure OpenAI (for embeddings)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_INSTANCE_NAME=your_azure_openai_instance_name
AZURE_OPENAI_DEPLOYMENT_NAME=your_azure_openai_deployment_name
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Vector Database
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_pinecone_index_name

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Memory Management
MEM0_API_KEY=your_mem0_api_key
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatgpt-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy the environment variables template above
   - Fill in your actual API keys and credentials

4. **Set up your services**
   - Create a MongoDB database
   - Set up a Pinecone index
   - Configure Cloudinary for file storage
   - Set up Clerk for authentication
   - Get API keys for Groq and Azure OpenAI

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
chatgpt-clone/
├── app/
│   ├── api/                    # API routes
│   │   ├── chat/              # Chat API endpoints
│   │   ├── chats/             # Chat management
│   │   └── upload/            # File upload handling
│   ├── components/            # React components
│   │   ├── chat-interface.tsx # Main chat UI
│   │   ├── chat-layout.tsx    # Chat layout wrapper
│   │   ├── message.tsx        # Message component
│   │   ├── sidebar.tsx        # Chat sidebar
│   │   └── ...
│   ├── lib/                   # Utility libraries
│   │   ├── database.ts        # Database operations
│   │   ├── models.ts          # Mongoose models
│   │   ├── pinecone.ts        # Vector database operations
│   │   ├── memory.ts          # Memory management
│   │   └── ...
│   ├── sign-in/               # Authentication pages
│   ├── sign-up/
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Home page
├── middleware.ts              # Clerk middleware
├── package.json
└── README.md
```

## 🔄 How It Works

### Chat Flow
1. User sends a message through the chat interface
2. Message is processed by the `/api/chat` endpoint
3. Relevant memories are retrieved using Mem0AI
4. If files are attached, relevant document chunks are found using Pinecone
5. All context is combined and sent to Groq's Llama model
6. Response is generated and stored in MongoDB
7. UI updates with the AI response

### File Processing Flow
1. User uploads a file via drag-and-drop or file picker
2. File is uploaded to Cloudinary for storage
3. File metadata is stored in MongoDB
4. Background processing extracts text content
5. Text is chunked and vectorized using Azure OpenAI embeddings
6. Vectors are stored in Pinecone for semantic search
7. File status is updated to "completed"

## 🎨 UI Features

- **Dark Theme**: Modern dark interface similar to ChatGPT
- **Responsive Design**: Works on desktop and mobile devices
- **File Upload**: Drag-and-drop file upload with progress indicators
- **Chat History**: Sidebar with chat history and management
- **Real-time Status**: File processing status and upload progress
- **Message Actions**: Copy, regenerate, and manage messages

## 🔒 Security

- **Authentication**: Secure user authentication with Clerk
- **Authorization**: Protected API routes and user-specific data access
- **File Validation**: Secure file upload with type and size validation
- **Data Isolation**: User-specific data separation in database and vector store

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms
The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Groq](https://groq.com/) for the fast AI inference
- [Clerk](https://clerk.com/) for authentication
- [Pinecone](https://www.pinecone.io/) for vector search
- [Cloudinary](https://cloudinary.com/) for file storage
- [LangChain](https://langchain.com/) for document processing
- [Mem0AI](https://mem0.ai/) for memory management

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Contact the maintainers

---

**Note**: This is a clone project for educational purposes. Make sure to comply with the terms of service of all third-party services used.
