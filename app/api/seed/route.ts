import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";
import OpenAI from "openai";

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate embeddings from OpenAI API
const createEmbedding = async (text: string) => {
  try {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return embedding.data[0].embedding;  // Return the embedding vector
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
};

// Database connection pool
const pool = new Pool({
  connectionString: process.env.NEON_DB_URL,  // Replace with your DB URL
});

// Insert embedding into the database
const insertEmbedding = async (text: string) => {
  console.log("Inserting embedding for:", text);

  try {
    // Get the embedding for the text
    const embedding = await createEmbedding(text);
    console.log("Generated embedding:", embedding);

    // SQL query to insert content and embedding
    const query = `
      INSERT INTO embeddings (content, embedding)
      VALUES ($1, $2::vector);
    `;

    // Convert the embedding array to a JSON string format
    // PostgreSQL vector type expects a string like "[0.1, 0.2, 0.3, ...]"
    const embeddingString = JSON.stringify(embedding);

    // Execute the query to insert the text and embedding
    await pool.query(query, [text, embeddingString]);

    console.log(`Successfully inserted: ${text}`);
  }  catch (error) {
    console.error("Error inserting embedding:", error);
  }
};

// Handle GET requests to insert data into embeddings table
export async function GET(req: NextRequest) {
  console.log("Starting embedding insertion...");

  try {
    // Insert several test embeddings
    await insertEmbedding("javascript");
    await insertEmbedding("python");
    await insertEmbedding("next.js");
    await insertEmbedding("apple");
    await insertEmbedding("mango");
    await insertEmbedding("grapes");

    // Respond with success message
    return NextResponse.json({
      message: "Embeddings inserted successfully!",
    });
  } catch (error: any) {
    console.error("Error inserting embeddings:", error);
    return NextResponse.json({ error: "Failed to insert embeddings" }, { status: 500 });
  }
}
