import React, { useState, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import "./LoginRegister.css"

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', { email, password });
      const token = response.data.token;
      localStorage.setItem('token', token);
      setUser(token);
      toast.success('Login successful! Redirecting...', { duration: 2000 });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      toast.error('Invalid credentials! Please try again.', { duration: 2000 });
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
        <h1 className="auth-title">Login</h1>
        <form onSubmit={handleSubmit} className="auth-form">
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
            Login
          </button>
        </form>
        <p className="auth-link">
          Don't have an account? <Link to="/register" className="link-text">Register</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;