import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./SignUp.css";

const LOCATION_OPTIONS = [
  { name: "Nablus", value: 1 },
  { name: "Ramallah", value: 2 },
  { name: "Jenin", value: 3 }
];

const SignUp = () => {
  const [formData, setFormData] = useState({
    fname: "",
    mname: "",
    lname: "",
    email: "",
    password: "",
    city_id: 1, // Changed from location_id to city_id
    type: 1
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "city_id" ? Number(value) : value // Changed from location_id to city_id
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          type: 1
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login', {
          state: { message: 'Registration successful! Please login.' }
        });
      }, 1500);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="sign-centered-div">
        <h1>Sign up</h1>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">Signed up successfully!</div>}

        <form onSubmit={handleSubmit}>
          {/* First Name */}
          <div className="field sign-field">
            <label>First Name</label>
            <input
              type="text"
              name="fname"
              value={formData.fname}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Middle Name */}
          <div className="field sign-field">
            <label>Middle Name</label>
            <input
              type="text"
              name="mname"
              value={formData.mname}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          {/* Last Name */}
          <div className="field sign-field">
            <label>Last Name</label>
            <input
              type="text"
              name="lname"
              value={formData.lname}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Email */}
          <div className="field sign-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="field sign-field">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>

          {/* Location Dropdown */}
          <div className="field sign-field">
            <label>City</label> {/* Changed label from Location to City */}
            <select
              name="city_id" // Changed from location_id to city_id
              value={formData.city_id} // Changed from location_id to city_id
              onChange={handleChange}
              required
              disabled={isLoading}
            >
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUp;