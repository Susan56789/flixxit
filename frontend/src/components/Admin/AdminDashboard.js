import React, { useState } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    rating: '',
    year: '',
    imageUrl: '',
    videoUrl: '' // Add videoUrl to state
  });
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState({}); // State to track form errors

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if any field is empty
    const errors = {};
    for (const key in formData) {
      if (!formData[key]) {
        errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
      }
    }
    setFormError(errors);

    // If there are no errors, proceed with form submission
    if (Object.keys(errors).length === 0) {
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
          imageUrl: '',
          videoUrl: '' // Clear videoUrl as well
        });
      } catch (error) {
        setMessage('Failed to add movie. Please try again.');
      }
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="admin-dashboard">
            <h2 className="mb-4">Add New Movie</h2>
            {message && <p className="alert alert-success">{message}</p>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="title" className="form-label">Title:</label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className={`form-control ${formError.title && 'is-invalid'}`} required />
                {formError.title && <div className="invalid-feedback">{formError.title}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description:</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} className={`form-control ${formError.description && 'is-invalid'}`} required></textarea>
                {formError.description && <div className="invalid-feedback">{formError.description}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="genre" className="form-label">Genre:</label>
                <input type="text" id="genre" name="genre" value={formData.genre} onChange={handleChange} className={`form-control ${formError.genre && 'is-invalid'}`} required />
                {formError.genre && <div className="invalid-feedback">{formError.genre}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="rating" className="form-label">Rating:</label>
                <input type="text" id="rating" name="rating" value={formData.rating} onChange={handleChange} className={`form-control ${formError.rating && 'is-invalid'}`} required />
                {formError.rating && <div className="invalid-feedback">{formError.rating}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="year" className="form-label">Year:</label>
                <input type="text" id="year" name="year" value={formData.year} onChange={handleChange} className={`form-control ${formError.year && 'is-invalid'}`} required />
                {formError.year && <div className="invalid-feedback">{formError.year}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="imageUrl" className="form-label">Image URL:</label>
                <input type="text" id="imageUrl" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className={`form-control ${formError.imageUrl && 'is-invalid'}`} required />
                {formError.imageUrl && <div className="invalid-feedback">{formError.imageUrl}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="videoUrl" className="form-label">Video URL:</label>
                <input type="text" id="videoUrl" name="videoUrl" value={formData.videoUrl} onChange={handleChange} className={`form-control ${formError.videoUrl && 'is-invalid'}`} required />
                {formError.videoUrl && <div className="invalid-feedback">{formError.videoUrl}</div>}
              </div>
              <button type="submit" className="btn btn-primary">Add Movie</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
