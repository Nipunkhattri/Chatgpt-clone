import MemoryClient from 'mem0ai'

const memoryClient = new MemoryClient({
    apiKey: process.env.MEM0_API_KEY || '',
})

const userId = process.env.MEM0_USER_ID

export async function addMemory(messages: { role: "user" | "assistant"; content: string }[]): Promise<void> {
    try {
        await memoryClient.add(messages, { user_id: userId });
    } catch (error) {
        console.error('Failed to add memory:', error);
        throw error;
    }
}

export async function getRelevantMemory(query: string): Promise<any[]> {
    try {
        const memories = await memoryClient.search(query, { user_id: userId });
        return memories;
    } catch (error) {
        console.error('Failed to get relevant memory:', error);
        throw error;
    }
}