import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../Services/authService";
import { getAuthRedirectPath } from '../utils/authRedirect';
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

 // src/register/Login.js
const handleSubmit = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError("");
  
  try {
    const result = await login(formData.email, formData.password);
    console.log('Login result:', result); // Debug log
    
    // Wait a brief moment to ensure localStorage is updated
    setTimeout(() => {
      const userType = localStorage.getItem('userType');
      console.log('userType from storage:', userType); // Debug log
      
      if (userType) {
        const redirectPath = getAuthRedirectPath();
        console.log('Redirecting to:', redirectPath); // Debug log
        navigate(redirectPath);
      } else {
        setError('User type not found');
      }
    }, 100);
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
};
  
  return (
    <div className="container">
      <div className="centered-div">
        <h1>Log in</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your Email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your Password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>
        
        <div className="footer">
          <Link to="/forgot-password">Forgot your password?</Link>
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;