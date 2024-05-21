import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genreId: '', // Use genreId instead of genre name
    rating: '',
    year: '',
    imageUrl: '',
    videoUrl: ''
  });
  const [genres, setGenres] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formError, setFormError] = useState({});

  useEffect(() => {
    // Fetch genres when component mounts
    async function fetchGenres() {
      try {
        const response = await axios.get('https://flixxit-h9fa.onrender.com/api/genres');
        setGenres(response.data);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    }
    fetchGenres();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    for (const key in formData) {
      if (!formData[key]) {
        errors[key] = `${key.charAt(0).toUpperCase() + key.slice(1)} is required`;
      }
    }
    setFormError(errors);

    if (Object.keys(errors).length === 0) {
      try {
        const response = await axios.post('https://flixxit-h9fa.onrender.com/api/movies', formData);
        setMessage({ type: 'success', text: 'Movie added successfully!' });
        setFormData({
          title: '',
          description: '',
          genreId: '', // Reset genreId instead of genre name
          rating: '',
          year: '',
          imageUrl: '',
          videoUrl: ''
        });
        setFormError({});
      } catch (error) {
        setMessage({ type: 'error', text: 'Failed to add movie. Please try again.' });
      }
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="admin-dashboard">
            <h2 className="mb-4">Add New Movie</h2>
            {message.text && (
              <p className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                {message.text}
              </p>
            )}
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
                <label htmlFor="genreId" className="form-label">Genre:</label>
                <select id="genreId" name="genreId" value={formData.genreId} onChange={handleChange} className={`form-select ${formError.genreId && 'is-invalid'}`} required>
                  <option value="">Select Genre</option>
                  {genres.map(genre => (
                    <option key={genre._id} value={genre._id}>{genre.name}</option>
                  ))}
                </select>
                {formError.genreId && <div className="invalid-feedback">{formError.genreId}</div>}
              </div>
              {/* Add other form fields */}
              <button type="submit" className="btn btn-primary">Add Movie</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
