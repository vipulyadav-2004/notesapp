// --- Imports ---
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose'); // <-- ADDED MONGOOSE

// --- Initial Setup ---
dotenv.config(); // Load environment variables
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors()); // Allow requests from your React app
app.use(express.json()); // Allow server to read JSON from request bodies

// --- MONGODB SETUP ---

// 1. Define the Schema (the structure of your notes)
// This must match what your App.js frontend is sending
const noteSchema = new mongoose.Schema({
  title: String,
  content: String,
}, { timestamps: true }); // timestamps adds createdAt/updatedAt

// 2. Create the Model (the object you use to interact with the DB)
const Note = mongoose.model('Note', noteSchema);

// 3. Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully!");

    // --- Start the server *only after* the DB is connected ---
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("MongoDB connection FAILED:", error.message);
    process.exit(1); // Exit process with failure
  }
};

// ==========================================================
// --- YOUR MONGODB/NOTES ROUTES ---
// ==========================================================

// --- READ (GET all notes) ---
// This route matches: axios.get(API_URL) from App.js
app.get('/api/notes', async (req, res) => {
  console.log("GET /api/notes - Fetching all notes");
  try {
    const notes = await Note.find().sort({ createdAt: -1 }); // Get newest first
    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// --- CREATE (POST a new note) ---
// This route matches: axios.post(API_URL, noteToCreate) from App.js
app.post('/api/notes', async (req, res) => {
  console.log("POST /api/notes - Creating new note");
  try {
    const { title, content } = req.body;
    if (!title && !content) {
      return res.status(400).json({ error: "Note cannot be empty" });
    }
    
    const newNote = new Note({
      title: title,
      content: content
    });

    const savedNote = await newNote.save();
    res.status(201).json(savedNote); // Send the new note back to React
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// --- DELETE (DELETE a note by ID) ---
// This route matches: axios.delete(`${API_URL}/${id}`) from App.js
app.delete('/api/notes/:id', async (req, res) => {
  console.log(`DELETE /api/notes/${req.params.id} - Deleting note`);
  try {
    const { id } = req.params;
    const deletedNote = await Note.findByIdAndDelete(id);

    if (!deletedNote) {
      return res.status(404).json({ error: "Note not found" });
    }
    
    res.json({ message: "Note deleted successfully" }); // React just needs a 200 OK
  
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete note" });
  }
});


// ==========================================================
// --- YOUR AI SUMMARIZE ROUTE ---
// ==========================================================

// This route listens for POST requests at http://localhost:5000/api/notes/summarize
app.post('/api/notes/summarize', async (req, res) => {
  
  console.log("--- RECEIVED REQUEST AT /api/notes/summarize ---"); 
  const { content } = req.body;

  const AI_API_KEY = process.env.YOUR_AI_API_KEY;

  if (!AI_API_KEY) {
    console.error("!!! AI API KEY IS MISSING from .env file !!!");
    return res.status(500).json({ error: "AI API key is not configured." });
  }

  const AI_API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${AI_API_KEY}`;
  
  const postData = {
    "contents": [
      { "parts": [
          { "text": `Summarize the following note content in one or two sentences: "${content}"` }
        ]
      }
    ]
  };

  try {
    console.log("--- Sending request to Google AI ---");

    const aiResponse = await axios.post(
      AI_API_ENDPOINT,
      postData,
      { headers: { 'Content-Type': 'application/json' } }
    );

    console.log("--- Received response from Google AI ---");
    const summary = aiResponse.data.candidates[0].content.parts[0].text.trim();
    res.json({ summary: summary });

  } catch (error) {
    console.error("!!! AI SUMMARY FAILED !!!");
    if (error.response) {
      console.error("Error Data:", error.response.data);
      console.error("Error Status:", error.response.status);
    } else {
      console.error("Error Message:", error.message);
    }
    res.status(500).json({ error: "Failed to generate summary." });
  }
});


// --- Start the connection and the server ---
// This line must be at the end. It runs the connectDB function we defined above.
connectDB();
