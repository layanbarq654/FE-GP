// Login.js - Ensure this is EXACTLY as below
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../Services/authService";
import { getAuthRedirectPath } from '../utils/authRedirect';
import "./Login.css"; // Make sure this import path is correct

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);
      console.log('Login result:', result);

      setTimeout(() => {
        const userType = localStorage.getItem('userType');
        console.log('userType from storage:', userType);

        if (userType) {
          const redirectPath = getAuthRedirectPath();
          console.log('Redirecting to:', redirectPath);
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
    <div className="split-container">
      <div className="left-half">
        <div className="login-form-container">
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

            <p>
              Don't have an account? <Link to="/signup">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
      <div className="right-half">
      <div className="right-half-content">
  <h1>Nadeem</h1> {/* Website name */}
  <h2>Plan. Book. Celebrate.</h2>
  <p>Your Event From A to Z</p>
</div>
      </div>
    </div>
  );
};

export default Login;