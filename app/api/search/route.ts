import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import OpenAI from "openai";

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Database connection pool
const pool = new Pool({
  connectionString: process.env.NEON_DB_URL,
});

// Function to generate embeddings from OpenAI API
const createEmbedding = async (text: string) => {
  try {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return embedding.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
};

// Search for similar embeddings using cosine similarity
const searchSimilar = async (queryText: string, limit: number = 5) => {
  try {
    // Generate embedding for the search query
    const queryEmbedding = await createEmbedding(queryText);
    const embeddingString = JSON.stringify(queryEmbedding);

    // Use cosine similarity to find similar embeddings
    // The <=> operator calculates cosine distance (lower is more similar)
    const query = `
      SELECT 
        id,
        content,
        1 - (embedding <=> $1::vector) as similarity
      FROM embeddings
      ORDER BY embedding <=> $1::vector
      LIMIT $2;
    `;

    const result = await pool.query(query, [embeddingString, limit]);
    
    return result.rows;
  } catch (error) {
    console.error("Error searching embeddings:", error);
    throw error;
  }
};

// Handle GET requests to search for similar embeddings
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("query") || searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "5");

    // Validate query parameter
    if (!query) {
      return NextResponse.json(
        { error: "Missing 'query' or 'q' parameter" },
        { status: 400 }
      );
    }

    console.log(`Searching for: ${query}`);

    // Search for similar embeddings
    const results = await searchSimilar(query, limit);

    // Return results
    return NextResponse.json({
      query: query,
      results: results,
      count: results.length,
    });
  } catch (error: any) {
    console.error("Error processing search:", error);
    return NextResponse.json(
      { error: "Failed to process search", details: error.message },
      { status: 500 }
    );
  }
}