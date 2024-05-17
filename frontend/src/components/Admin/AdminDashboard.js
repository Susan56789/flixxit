import React, { useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    rating: '',
    year: '',
    imageUrl: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://flixxit-h9fa.onrender.com/api/movies', formData);
      setMessage('Movie added successfully!');
      // Clear form fields after successful submission
      setFormData({
        title: '',
        description: '',
        genre: '',
        rating: '',
        year: '',
        imageUrl: ''
      });
    } catch (error) {
      setMessage('Failed to add movie. Please try again.');
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Add New Movie</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="description">Description:</label>
          <textarea id="description" name="description" value={formData.description} onChange={handleChange} required></textarea>
        </div>
        <div>
          <label htmlFor="genre">Genre:</label>
          <input type="text" id="genre" name="genre" value={formData.genre} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="rating">Rating:</label>
          <input type="text" id="rating" name="rating" value={formData.rating} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="year">Year:</label>
          <input type="text" id="year" name="year" value={formData.year} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="imageUrl">Image URL:</label>
          <input type="text" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} required />
        </div>
        <button type="submit">Add Movie</button>
      </form>
    </div>
  );
};

export default AdminDashboard;
