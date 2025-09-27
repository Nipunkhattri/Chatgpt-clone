import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import cloudinary from "@/app/lib/cloudinary";
import { File } from "@/app/lib/models";
import { processFileInBackground } from "@/app/lib/text-extraction";
import connectDB from "@/app/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const data = await request.formData();
    const file = data.get("file") as File;
    const chatId = data.get("chatId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { 
            folder: "chat_uploads",
            resource_type: "raw",
            type: "upload",
            access_mode:"public",
          }, 
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        )
        .end(buffer);
    });

    const fileRecord = await File.create({
      userId,
      chatId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      cloudinaryUrl: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      status: 'uploading',
    });

    processFileInBackground(
      fileRecord._id.toString(),
      uploadResult.secure_url,
      file.type,
      userId
    ).catch(error => {
      console.error('Background processing error:', error);
    });

    return NextResponse.json({ 
      success: true, 
      file: {
        id: fileRecord._id.toString(),
        fileName: fileRecord.fileName,
        fileType: fileRecord.fileType,
        fileSize: fileRecord.fileSize,
        url: fileRecord.cloudinaryUrl,
        status: 'processing',
      }
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { fileId } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: "fileId required" }, { status: 400 });
    }

    const fileRecord = await File.findOne({ _id: fileId, userId });
    
    if (!fileRecord) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await cloudinary.uploader.destroy(fileRecord.cloudinaryPublicId);

    if (fileRecord.status === 'completed') {
      const { deleteDocumentVectors } = await import("@/app/lib/pinecone");
      await deleteDocumentVectors(fileId, userId);
    }

    await File.deleteOne({ _id: fileId });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("File deletion error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const url = new URL(req.url);
    const fileId = url.searchParams.get('fileId');
    const chatId = url.searchParams.get('chatId');

    if (fileId) {
      const file = await File.findOne({ _id: fileId, userId });
      
      if (!file) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      
      return NextResponse.json({ file });
    } else if (chatId) {
      const files = await File.find({ chatId, userId }).sort({ createdAt: -1 });
      return NextResponse.json({ files });
    } else {
      const files = await File.find({ userId }).sort({ createdAt: -1 });
      return NextResponse.json({ files });
    }
  } catch (err: any) {
    console.error("File fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}