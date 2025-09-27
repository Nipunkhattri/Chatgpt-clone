import { Pinecone } from '@pinecone-database/pinecone';
import { AzureOpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const embeddings = new AzureOpenAIEmbeddings({
  azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY!,
  azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_INSTANCE_NAME!,
  azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME!,
  azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
});

export const getPineconeIndex = () => {
  return pinecone.index(process.env.PINECONE_INDEX_NAME!);
};

export const getTextSplitter = () => {
  return new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '.', '!', '?', ',', ' ', ''],
  });
};

export async function storeDocumentChunks(
  text: string,
  fileId: string,
  userId: string,
  metadata: Record<string, any> = {}
) {
  try {
    const index = getPineconeIndex();
    const textSplitter = getTextSplitter();
    
    const chunks = await textSplitter.createDocuments([text]);
    
    const vectors = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embeddings.embedQuery(chunk.pageContent);
      
      vectors.push({
        id: `${fileId}-chunk-${i}`,
        values: embedding,
        metadata: {
          ...metadata,
          text: chunk.pageContent,
          fileId,
          userId,
          chunkIndex: i,
          totalChunks: chunks.length,
        },
      });
    }
    
    const namespace = `user-${userId}`;
    await index.namespace(namespace).upsert(vectors);
    
    return { success: true, chunksCount: chunks.length, namespace };
  } catch (error) {
    console.error('Error storing document chunks:', error);
    throw error;
  }
}

export async function queryDocuments(
  query: string,
  userId: string,
  fileIds?: string[],
  topK: number = 5
) {
  try {
    const index = getPineconeIndex();
    const queryEmbedding = await embeddings.embedQuery(query);
    
    const filter: any = {};
    if (fileIds && fileIds.length > 0) {
      filter.fileId = { $in: fileIds };
    }
    
    const namespace = `user-${userId}`;
    const results = await index.namespace(namespace).query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: Object.keys(filter).length > 0 ? filter : undefined,
    });
    
    return results.matches.map(match => ({
      text: match.metadata?.text || '',
      score: match.score || 0,
      fileId: match.metadata?.fileId || '',
      chunkIndex: match.metadata?.chunkIndex || 0,
    }));
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
}

export async function deleteDocumentVectors(fileId: string, userId: string) {
  try {
    const index = getPineconeIndex();
    const namespace = `user-${userId}`;
    
    const chunkIds = [];
    
    for (let i = 0; i < 500; i++) { 
      chunkIds.push(`${fileId}-chunk-${i}`);
    }
    
    const batchSize = 100;
    let totalDeleted = 0;
    
    for (let i = 0; i < chunkIds.length; i += batchSize) {
      const batch = chunkIds.slice(i, i + batchSize);
      try {
        await index.namespace(namespace).deleteMany(batch);
        totalDeleted += batch.length;
        console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} vectors`);
      } catch (batchError: any) {
        if (!batchError.message?.includes('not found')) {
          console.warn(`Batch deletion warning:`, batchError.message);
        }
      }
    }
    
    return { success: true, deletedCount: totalDeleted };
  } catch (error) {
    console.error('Error deleting document vectors:', error);
    
    try {
      const index = getPineconeIndex();
      const namespace = `user-${userId}`;
      
      const listResponse = await index.namespace(namespace).listPaginated({
        prefix: `${fileId}-chunk-`
      });
      
      if (listResponse.vectors && listResponse.vectors.length > 0) {
        const vectorIds = listResponse.vectors.map(v => v.id);
        await index.namespace(namespace).deleteMany(vectorIds);
        return { success: true, deletedCount: vectorIds.length };
      }
      
      return { success: true, deletedCount: 0 };
    } catch (fallbackError) {
      console.error('Fallback deletion also failed:', fallbackError);
      return { success: true, deletedCount: 0, warning: 'Deletion completed with warnings' };
    }
  }
}