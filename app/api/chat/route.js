import { NextResponse } from 'next/server'
import { Pinecone } from '@pinecone-database/pinecone'
import { OpenAI } from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"

const systemPrompt = `
You are a rate my professor agent to help students find classes, that takes in user questions and answers them.
For every user question, the top 3 professors that match the user question are returned.
Use them to answer the question if needed.
`

export async function POST(req) {
    const data = await req.json()
        
    const pc = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    })
    const index = pc.Index("rag").namespace("ns1")
    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
    })

    const text = data[data.length - 1].content
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" })
    const Result = await model.embedContent(text)
    const embeddings = Result.embedding
    const results = await index.query({
        topK: 5,
        vector: embeddings['values'],
        includeMetadata: true,
    })

    let resultString = ''
    results.matches.forEach((match) => {
        resultString += `
        Returned Results:
        Professor: ${match.id}
        Review: ${match.metadata.stars}
        Subject: ${match.metadata.subject}
        Stars: ${match.metadata.stars}
        \n\n`
    })

    const lastMessage = data[data.length - 1]
    const lastMessageContent = lastMessage.content + resultString
    const lastDataWithoutLastMessage = data.slice(0, data.length - 1)
    
    const completion = await openai.chat.completions.create({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
            { role: "user", content: systemPrompt },
            ...lastDataWithoutLastMessage,
            { role: "user", content: lastMessageContent },
        ],
        stream: true,
    })
    
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()
            try {
                for await (const chunk of completion) {
                    const content = chunk.choices[0]?.delta?.content
                    if (content) {
                        const text = encoder.encode(content)
                        controller.enqueue(text)
                    }
                }
            } catch (err) {
                controller.error(err)
            } finally {
                controller.close()
            }
        },
    })
    return new NextResponse(stream)
}


