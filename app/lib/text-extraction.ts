import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { CSVLoader } from '@langchain/community/document_loaders/fs/csv';

export interface ExtractedContent {
  text: string;
  pageCount?: number;
  metadata?: Record<string, any>;
}

export async function extractTextFromFile(
  fileUrl: string,
  fileType: string
): Promise<ExtractedContent> {
  try {
   
    const response = await fetch(fileUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    const buffer = await response.arrayBuffer();
    
   
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('File buffer is empty or invalid');
    }
    
    console.log(`File fetched successfully: ${buffer.byteLength} bytes`);
    
    const mimeType = fileType.toLowerCase();
    
   
    if (mimeType.includes('pdf')) {
      return await extractFromPDF(buffer);
    } else if (mimeType.includes('docx') || mimeType.includes('word')) {
      return await extractFromDocx(buffer);
    } else if (mimeType.includes('text') || mimeType.includes('txt')) {
      return await extractFromText(buffer);
    } else if (mimeType.includes('csv')) {
      return await extractFromCSV(buffer);
    } else if (mimeType.includes('image')) {
      throw new Error('Image OCR processing should be done on the client side');
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error('Error extracting text from file:', error);
    throw error;
  }
}

async function extractFromPDF(buffer: ArrayBuffer): Promise<ExtractedContent> {
  try {
   
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('PDF buffer is empty');
    }
    
    console.log(`Processing PDF buffer of size: ${buffer.byteLength} bytes`);
    
   
    const blob = new Blob([buffer], { type: 'application/pdf' });
    
   
    if (blob.size === 0) {
      throw new Error('PDF blob is empty');
    }
    
    const loader = new PDFLoader(blob);
    const docs = await loader.load();
    
    if (!docs || docs.length === 0) {
      throw new Error('No content could be extracted from PDF');
    }
    
    const text = docs.map(doc => doc.pageContent).join('\n\n');
    
    if (!text || text.trim().length === 0) {
      console.warn('PDF extracted but contains no readable text');
      return {
        text: '',
        pageCount: docs.length,
        metadata: {
          type: 'pdf',
          pages: docs.length,
          warning: 'PDF contains no readable text content',
        },
      };
    }
    
    console.log(`Successfully extracted ${text.length} characters from ${docs.length} pages`);
    
    return {
      text,
      pageCount: docs.length,
      metadata: {
        type: 'pdf',
        pages: docs.length,
      },
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractFromDocx(buffer: ArrayBuffer): Promise<ExtractedContent> {
  try {
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('DOCX buffer is empty');
    }
    
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const loader = new DocxLoader(blob);
    const docs = await loader.load();
    
    const text = docs.map(doc => doc.pageContent).join('\n\n');
    
    return {
      text,
      metadata: {
        type: 'docx',
      },
    };
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractFromText(buffer: ArrayBuffer): Promise<ExtractedContent> {
  try {
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('Text buffer is empty');
    }
    
    const text = new TextDecoder('utf-8').decode(buffer);
    
    return {
      text,
      metadata: {
        type: 'text',
      },
    };
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractFromCSV(buffer: ArrayBuffer): Promise<ExtractedContent> {
  try {
    if (!buffer || buffer.byteLength === 0) {
      throw new Error('CSV buffer is empty');
    }
    
    const blob = new Blob([buffer], { type: 'text/csv' });
    const loader = new CSVLoader(blob);
    const docs = await loader.load();
    
    const text = docs.map(doc => doc.pageContent).join('\n\n');
    
    return {
      text,
      metadata: {
        type: 'csv',
        rows: docs.length,
      },
    };
  } catch (error) {
    console.error('CSV extraction error:', error);
    throw new Error(`Failed to extract text from CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}




export async function processFileInBackground(
  fileId: string,
  fileUrl: string,
  fileType: string,
  userId: string
) {
  const { File } = await import('./models');
  const { storeDocumentChunks } = await import('./pinecone');
  
  try {
   
    await File.findByIdAndUpdate(fileId, {
      status: 'processing',
    });
    
   
    if (!fileUrl || !fileId || !userId) {
      throw new Error('Missing required parameters for file processing');
    }
    
    console.log(`Starting file processing for ${fileId}: ${fileUrl}`);
    
   
    const extractedContent = await extractTextFromFile(fileUrl, fileType);
    
   
    const { namespace } = await storeDocumentChunks(
      extractedContent.text,
      fileId,
      userId,
      {
        fileName: (await File.findById(fileId))?.fileName,
        fileType,
        ...extractedContent.metadata,
      }
    );
    
      
    await File.findByIdAndUpdate(fileId, {
      status: 'completed',
      extractedText: extractedContent.text.substring(0, 5000),
      vectorIndexId: namespace,
    });
    
    return { success: true, extractedContent };
  } catch (error) {
    console.error('Background processing error:', error);
    console.error('File details:', { fileId, fileUrl, fileType, userId });
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    try {
      await File.findByIdAndUpdate(fileId, {
        status: 'failed',
        error: errorMessage,
      });
    } catch (dbError) {
      console.error('Failed to update file status in database:', dbError);
    }
    
    throw error;
  }
}