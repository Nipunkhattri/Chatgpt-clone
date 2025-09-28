import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { File } from "@/app/lib/models";
import { storeDocumentChunks } from "@/app/lib/pinecone";
import connectDB from "@/app/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { fileId, extractedText, metadata } = await request.json();

    if (!fileId || !extractedText) {
      return NextResponse.json({ 
        error: "fileId and extractedText are required" 
      }, { status: 400 });
    }

    // Find the file record
    const fileRecord = await File.findOne({ _id: fileId, userId });
    
    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Update status to processing
    await File.findByIdAndUpdate(fileId, {
      status: 'processing',
    });

    try {
      // Store the extracted text in vector database
      const { namespace } = await storeDocumentChunks(
        extractedText,
        fileId,
        userId,
        {
          fileName: fileRecord.fileName,
          fileType: fileRecord.fileType,
          ...metadata,
        }
      );

      // Update file record with completion status
      await File.findByIdAndUpdate(fileId, {
        status: 'completed',
        extractedText: extractedText.substring(0, 5000), // Store first 5000 chars for preview
        vectorIndexId: namespace,
      });

      return NextResponse.json({
        success: true,
        message: 'Text processed and stored successfully',
        fileId,
      });

    } catch (error) {
      console.error('Error processing extracted text:', error);
      
      // Update file status to failed
      await File.findByIdAndUpdate(fileId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }

  } catch (error) {
    console.error("OCR processing error:", error);
    return NextResponse.json({ 
      error: "Failed to process extracted text" 
    }, { status: 500 });
  }
}