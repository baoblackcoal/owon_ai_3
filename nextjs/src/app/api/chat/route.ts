import { NextResponse } from 'next/server';
import path from 'path';
import dotenv from 'dotenv';

// --- Configuration ---

// Immediately load environment variables.
dotenv.config({ path: path.resolve(__dirname, '../../../../.env.development.local') });

/**
 * Configuration object for the DashScope API.
 * It's good practice to centralize configuration and provide clear error messages
 * if essential variables are missing.
 */
const dashScopeConfig = {
    apiKey: process.env.DASHSCOPE_API_KEY,
    appId: process.env.DASHSCOPE_APP_ID,
    apiUrl: `https://dashscope.aliyuncs.com/api/v1/apps/${process.env.DASHSCOPE_APP_ID}/completion`,
    pipelineIds: ['he9rcpebc3', 'utmhvnxgey']
};

// --- Type Definitions ---

/**
 * Defines the structure for the DashScope API request body.
 * Using interfaces improves type safety and code readability.
 */
interface DashScopeRequest {
    input: {
        prompt: string;
        session_id?: string;
    };
    parameters: {
        incremental_output?: string;
        has_thoughts?: string;
        rag_options?: {
            pipeline_ids: string[];
        };
    };
    debug: Record<string, unknown>;
}

/**
 * Defines the expected structure of the incoming request body from the client.
 */
interface ClientRequestBody {
    message: string;
    sessionId?: string;
}

// --- API Interaction Logic ---

/**
 * Creates the request body for the DashScope API call.
 * This function encapsulates the logic for building the request payload.
 * @param message The user's prompt.
 * @param sessionId Optional session ID for conversational context.
 * @returns A fully formed DashScopeRequest object.
 */
function createApiRequestBody(message: string, sessionId?: string): DashScopeRequest {
    return {
        input: {
            prompt: message,
            ...(sessionId && { session_id: sessionId })
        },
        parameters: {
            incremental_output: 'true',
            has_thoughts: 'true',
            rag_options: {
                pipeline_ids: dashScopeConfig.pipelineIds
            }
        },
        debug: {}
    };
}

/**
 * Initiates a streaming API call to DashScope.
 * This function is responsible for the fetch request and returns the response body.
 * @param requestBody The data to be sent to the API.
 * @returns The readable stream from the API response.
 * @throws An error if the API key is missing or the request fails.
 */
async function fetchDashScopeStream(requestBody: DashScopeRequest): Promise<ReadableStream<Uint8Array>> {
    if (!dashScopeConfig.apiKey) {
        throw new Error("DASHSCOPE_API_KEY is not configured.");
    }

    const response = await fetch(dashScopeConfig.apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${dashScopeConfig.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'X-DashScope-SSE': 'enable'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
        throw new Error('Response body is null');
    }

    return response.body;
}

// --- Stream Processing Logic ---

/**
 * Processes the Server-Sent Events (SSE) stream from the DashScope API.
 * This function handles parsing the event stream and extracting relevant data.
 * @param responseBody The readable stream from the fetch response.
 * @returns A new ReadableStream that outputs processed text and session ID.
 */
function processSseStream(responseBody: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
    const reader = responseBody.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = '';
    let newSessionId = '';

    return new ReadableStream({
        async start(controller) {
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        // When the stream is finished, append the session ID if available.
                        if (newSessionId) {
                            controller.enqueue(encoder.encode(`\n<session_id>${newSessionId}</session_id>`));
                        }
                        controller.close();
                        break;
                    }

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');

                    // Keep the last line in the buffer in case it's an incomplete chunk.
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (!line.startsWith('data:')) continue;

                        try {
                            const jsonStr = line.slice(5).trim();
                            // Ensure the JSON string is complete before parsing.
                            if (jsonStr && jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
                                const jsonData = JSON.parse(jsonStr);
                                if (jsonData.output?.text) {
                                    controller.enqueue(encoder.encode(jsonData.output.text));
                                }
                                if (jsonData.output?.session_id) {
                                    newSessionId = jsonData.output.session_id;
                                }
                            }
                        } catch (e) {
                            console.error('JSON parsing error:', e);
                            // Skip corrupted lines without breaking the stream.
                        }
                    }
                }
            } catch (error) {
                console.error('Stream processing error:', error);
                controller.error(error);
            }
        }
    });
}

// --- Main Request Handler ---

/**
 * The main Next.js API route handler for the POST request.
 * It orchestrates the process: configuration check, request handling, API call, and streaming response.
 * @param request The incoming Next.js request object.
 * @returns A streaming response or a JSON error response.
 */
export async function POST(request: Request) {
    // 1. Configuration Validation
    if (!dashScopeConfig.apiKey || !dashScopeConfig.appId) {
        return NextResponse.json(
            { error: 'Server not configured: DASHSCOPE_API_KEY or DASHSCOPE_APP_ID is missing.' },
            { status: 500 }
        );
    }

    try {
        // 2. Parse Incoming Request
        const { message, sessionId } = await request.json() as ClientRequestBody;

        // 3. Prepare and Log API Request
        const apiRequestBody = createApiRequestBody(message, sessionId);
        console.log('Sending request to DashScope:', {
            url: dashScopeConfig.apiUrl,
            appId: dashScopeConfig.appId,
            message,
            sessionId
        });

        // 4. Fetch and Process Stream
        const apiStream = await fetchDashScopeStream(apiRequestBody);
        const processedStream = processSseStream(apiStream);

        // 5. Return Processed Stream to Client
        return new Response(processedStream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error) {
        console.error('API call failed:', error instanceof Error ? error.message : error);
        return NextResponse.json(
            { error: 'An error occurred while processing the request.' },
            { status: 500 }
        );
    }
}