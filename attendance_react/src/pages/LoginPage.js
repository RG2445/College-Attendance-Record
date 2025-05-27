import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        if (data.role === 'student') navigate('/StudentDashboard');
        else if (data.role === 'teacher') navigate('/TeacherDashboard');
        else if (data.role === 'admin') navigate('/AdminDashboard');
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg border-0 w-100" style={{ maxWidth: '900px' }}>
        <div className="row g-0">
          {/* Left Side */}
          <div className="col-md-6 bg-primary text-white d-flex flex-column justify-content-center align-items-center p-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/en/thumb/e/e4/Guru_Gobind_Singh_Indraprastha_University_logo.png/250px-Guru_Gobind_Singh_Indraprastha_University_logo.png"
              alt="IPU Logo"
              className="img-fluid mb-3"
              style={{ width: '150px' }}
            />
            <h3 className="text-center fw-bold">Welcome to IPU Portal</h3>
            <p className="text-center">Student / Teacher Dashboard Access</p>
            <img
              src="https://cdn-icons-png.flaticon.com/512/194/194931.png"
              alt="students"
              className="img-fluid mt-4"
              style={{ width: '100px' }}
            />
          </div>

          {/* Right Side */}
          <div className="col-md-6 p-5">
            <h4 className="text-center mb-4 fw-bold text-primary">Log In</h4>

            {/* Role Toggle */}
            <div className="mb-3 d-flex justify-content-center gap-2">
              <button
                className={`btn ${role === 'student' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setRole('student')}
              >
                Student
              </button>
              <button
                className={`btn ${role === 'teacher' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setRole('teacher')}
              >
                Teacher
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3 d-flex justify-content-between align-items-center">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="rememberMe" />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Remember me
                  </label>
                </div>
                <a href="#" className="text-primary text-decoration-none">
                  Forgot password?
                </a>
              </div>

              <div className="d-grid">
                <button type="submit" className="btn btn-primary">
                  Log In
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}