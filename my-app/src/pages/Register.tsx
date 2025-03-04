import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import "./LoginRegister.css"

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${BACKEND_URL}/register`, { username, email, password });
      toast.success('Registration successful! Redirecting to login...', { duration: 2000 });
      setTimeout(() => navigate('/login'), 1500);
    } catch (error: any) {
      if (error.response) {
        toast.error(error.response.data || 'Error registering user!', { duration: 2000 });
      } else {
        toast.error('Network error! Please try again.', { duration: 2000 });
      }
    }
  };

  return (
    <div className="login-container">
      <Toaster position="top-center" />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5 }}
        className="auth-card"
      >
        <h1 className="auth-title">Register</h1>
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            className="auth-input" 
            required
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="auth-input" 
            required
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            className="auth-input" 
            required
          />
          <button type="submit" className="auth-button">
            Register
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login" className="link-text">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;