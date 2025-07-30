import { useState } from "react";
import { useNavigate} from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }), // include role in request
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        if (data.role === "student") navigate("/StudentDashboard");
        else if (data.role === "teacher") navigate("/TeacherDashboard");
        else if (data.role === "admin") navigate("/AdminDashboard");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg border-0 w-100" style={{ maxWidth: "900px" }}>
        <div className="row g-0">
          {/* Left Side */}
          <div className="col-md-6 bg-primary text-white d-flex flex-column justify-content-center align-items-center p-4">
            <img
              src="https://th.bing.com/th/id/OIP.y8tG55TjpAKvHsvoazKfWwHaGh?cb=iwp2&rs=1&pid=ImgDetMain"
              alt="IPU Logo"
              className="img-fluid mb-3"
              style={{ width: "150px", objectFit: "cover", borderRadius: "0%" }}
            />
            <h3 className="text-center fw-bold">Welcome to IPU Portal</h3>
            <p className="text-center">Student / Teacher / Admin Access</p>
            <img
              src="https://cdn-icons-png.flaticon.com/512/194/194931.png"
              alt="students"
              className="img-fluid mt-4"
              style={{ width: "100px" }}
            />
          </div>

          {/* Right Side */}
          <div className="col-md-6 p-5">
            <h4 className="text-center mb-4 fw-bold text-primary">Log In</h4>

            {/* Role Toggle with 3 options */}
            <div style={{ width: "320px", margin: "20px auto" }}>
              <div
                style={{
                  display: "flex",
                  borderRadius: "25px",
                  border: "2px solid #0d6efd",
                  position: "relative",
                  backgroundColor: "#f0f4ff",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    bottom: 2,
                    left:
                      role === "student"
                        ? 2
                        : role === "teacher"
                        ? "calc(33.33% + 2px)"
                        : "calc(66.66% + 2px)",
                    width: "calc(33.33% - 4px)",
                    backgroundColor: "#0d6efd",
                    borderRadius: "25px",
                    transition: "left 0.4s ease",
                    zIndex: 1,
                  }}
                ></div>

                {["student", "teacher", "admin"].map((r) => (
                  <div
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      flex: 1,
                      padding: "10px 0",
                      textAlign: "center",
                      color: role === r ? "white" : "#0d6efd",
                      fontWeight: role === r ? "600" : "500",
                      zIndex: 2,
                      cursor: "pointer",
                    }}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </div>
                ))}
              </div>
              <p className="text-center mt-2">Selected Role: <strong>{role}</strong></p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">E-mail</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

              <div className="d-grid">
                <button type="submit" className="btn btn-primary">Log In</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
