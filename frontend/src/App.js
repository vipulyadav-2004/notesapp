import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // We'll add some simple styling

// We define the backend API URL here
// React (port 3000) will talk to Node/Express (port 5000)
const API_URL = 'http://localhost:5000/api/notes';

function App() {
  const [notes, setNotes] = useState([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [summaries, setSummaries] = useState({}); // <-- ADD THIS STATE
  const [loadingSummary, setLoadingSummary] = useState(null);
  // --- READ ---
  // Fetch all notes from the backend when the component loads
  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(API_URL);
      setNotes(response.data); // Store notes in state
    } catch (error) {
      console.error("Error fetching notes:", error);
    }
  };

  // --- CREATE ---
  // Handle the form submission to create a new note
  const handleAddNote = async (e) => {
    e.preventDefault(); // Prevent default form submission
    if (!newNoteTitle && !newNoteContent) return; // Don't add empty notes

    try {
      const noteToCreate = { title: newNoteTitle, content: newNoteContent };
      // Send a POST request to our backend API
      const response = await axios.post(API_URL, noteToCreate);
      
      // Add the new note (from the response) to our state
      setNotes([...notes, response.data]);
      
      // Clear the input fields
      setNewNoteTitle('');
      setNewNoteContent('');
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  // --- DELETE ---
  // Handle deleting a note
  const handleDeleteNote = async (id) => {
    try {
      // Send a DELETE request to our backend API
      await axios.delete(`${API_URL}/${id}`);
      
      // Filter out the deleted note from our state
      setNotes(notes.filter((note) => note._id !== id));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };
  
   // Inside your App component, after handleDeleteNote

// --- SUMMARIZE ---
// Handle summarizing a note
  const handleSummarize = async (id, content) => {
    if (!content) return; // Don't summarize empty notes
    setLoadingSummary(id); // Set loading state for this specific note

    try {
      // Call your NEW backend route
      const response = await axios.post(`${API_URL}/summarize`, { content: content });

      // Store the summary in our state, mapping it by note ID
      setSummaries(prevSummaries => ({
        ...prevSummaries,
        [id]: response.data.summary 
      }));

    } catch (error) {
      console.error("Error generating summary:", error);
      // Optionally, store an error message in the summary state
      setSummaries(prevSummaries => ({
        ...prevSummaries,
        [id]: "Could not generate summary." 
      }));
    } finally {
      setLoadingSummary(null); // Stop loading, even if it failed
    }
  }; 
  return (
    <div className="App">
      <header>
        <h1>My Notes </h1>
      </header>
      
      {/* Form for Creating Notes */}
      <form onSubmit={handleAddNote} className="note-form">
        <input
          type="text"
          placeholder="Note title"
          value={newNoteTitle}
          onChange={(e) => setNewNoteTitle(e.target.value)}
        />
        <textarea
          placeholder="Note content..."
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
        />
        <button type="submit">Add Note</button>
      </form>

      {/* List of Existing Notes */}
     {/* Inside your return(), find the .notes-list div */}
     <h1>Your notes: </h1>
<div className="notes-list">
  {notes.length === 0 ? (
    <p>No notes yet. Add one!</p>
  ) : (
    notes.map((note) => (
      <div key={note._id} className="note-item">
        <h3>{note.title}</h3>
        <p>{note.content}</p>

        {/* --- START OF NEW CODE --- */}

        {/* Conditionally display the summary if it exists */}
        {summaries[note._id] && (
          <div className="note-summary">
            <strong>Summary:</strong>
            <p>{summaries[note._id]}</p>
          </div>
        )}

        {/* We'll wrap buttons in a div for better layout */}
        <div className="note-actions">
          <button 
            onClick={() => handleSummarize(note._id, note.content)}
            className="summarize-btn"
            disabled={loadingSummary === note._id} // Disable button while loading
          >
            {loadingSummary === note._id ? 'Summarizing...' : 'Summarize'}
          </button>

          {/* Your existing delete button */}
          <button onClick={() => handleDeleteNote(note._id)} className="delete-btn">
            Delete
          </button>
        </div>

        {/* --- END OF NEW CODE --- */}

        {/* This is your OLD delete button code, which we've moved.
          <button onClick={() => handleDeleteNote(note._id)} className="delete-btn">
            Delete
          </button> 
        */}
      </div>
    ))
  )}
</div>
    </div>
  );
}

export default App;