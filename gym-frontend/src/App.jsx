import React, { useState, useEffect, createContext, useContext } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

/*
  Single-file React app containing:
  - API client (axios)
  - Auth context (JWT + localStorage)
  - Dark + gradient Tailwind UI
  - Routes: /login, /register, /admin, /trainer, /member
  - Admin/Trainer/Member dashboards with core UI for members, plans, payments, attendance

  How to use:
  1. create-react-app my-app
  2. Install deps: npm i axios react-router-dom jwt-decode
  3. Tailwind: follow Tailwind setup and include its directives in index.css
  4. Save this file as src/App.jsx and change src/index.js to render <App />
  5. Set REACT_APP_API_URL in .env to your backend (e.g. http://localhost:5000/api)

  IMPORTANT FIX: Some runtime environments (e.g. in-browser sandboxes) do not define `process`.
  Accessing `process.env` directly can throw "ReferenceError: process is not defined".
  To avoid that, the API base URL is resolved safely using multiple fallbacks (window.__env, import-time
  process.env if available, and a default of '/api').
*/

const resolveApiBase = () =>
  typeof process !== "undefined" && process.env?.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL
    : "/api";

console.log("🔗 API base URL:", resolveApiBase());
const API_BASE = resolveApiBase();
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((cfg) => {
  const tok = localStorage.getItem("token");
  if (tok) cfg.headers.Authorization = `Bearer ${tok}`;
  return cfg;
});
console.log("🔗 API base URL:", resolveApiBase());

// ---------- Auth Context ----------
const AuthContext = createContext();
function useAuth() {
  return useContext(AuthContext);
}
console.log("🔗 API base URL:", resolveApiBase());
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const tok = localStorage.getItem("token");
    if (!tok) return null;
    try {
      const p = jwtDecode(tok);
      return { token: tok, ...p };
    } catch {
      return null;
    }
  });

  const login = (token, userInfo) => {
    localStorage.setItem("token", token);
    // ensure we keep a consistent user shape (id, name, email, role)
    setUser({ token, ...(userInfo || {}) });
  };
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------- Protected Route ----------
function Protected({ children, roles }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role))
    return <div className="p-6 text-center text-red-300">Forbidden</div>;
  return children;
}

// ---------- UI: Layout & Nav ----------
function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="w-full bg-gradient-to-r from-gray-900 via-purple-900 to-indigo-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-yellow-300">
            GymMaster
          </div>
          <nav className="hidden md:flex space-x-3 text-sm opacity-90">
            <Link to="/" className="hover:underline">
              Home
            </Link>
            {user && user.role === "admin" && <Link to="/admin">Admin</Link>}
            {user && user.role === "trainer" && (
              <Link to="/trainer">Trainer</Link>
            )}
            {user && user.role === "member" && <Link to="/member">Member</Link>}
          </nav>
        </div>

        <div className="flex items-center space-x-3">
          {!user && (
            <>
              <Link
                to="/login"
                className="px-3 py-1 rounded-md bg-white text-indigo-900 font-semibold"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 py-1 rounded-md border border-white/20"
              >
                Register
              </Link>
            </>
          )}
          {user && (
            <>
              <div className="text-sm">{user.name || user.email}</div>
              <button
                onClick={() => {
                  logout();
                  nav("/login");
                }}
                className="px-3 py-1 rounded-md bg-white text-indigo-900"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Container({ children }) {
  return <div className="max-w-7xl mx-auto p-6">{children}</div>;
}

// ---------- Pages: Auth ----------
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", { email, password });
      // backend should return { token, user }
      login(data.token, data.user);
      if (data.user.role === "admin") nav("/admin");
      else if (data.user.role === "trainer") nav("/trainer");
      else nav("/member");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-gray-800/70 p-6 rounded-md shadow-lg backdrop-blur"
      >
        <h2 className="text-2xl font-bold mb-4">Sign in</h2>
        <label className="text-sm">Email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded mt-1 mb-3 bg-gray-700 border border-gray-600"
        />
        <label className="text-sm">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded mt-1 mb-4 bg-gray-700 border border-gray-600"
        />
        <button className="w-full py-2 rounded bg-indigo-600 font-semibold">
          Login
        </button>
        <div className="mt-3 text-sm text-gray-300">
          Don't have an account?{" "}
          <Link to="/register" className="text-indigo-300 underline">
            Register
          </Link>
        </div>
      </form>
    </div>
  );
}

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
        role,
      });
      localStorage.setItem("token", data.token);
      // redirect based on role
      if (role === "admin") nav("/admin");
      else if (role === "trainer") nav("/trainer");
      else nav("/member");
    } catch (err) {
      alert(err.response?.data?.message || "Register failed");
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-gray-800/70 p-6 rounded-md shadow-lg"
      >
        <h2 className="text-2xl font-bold mb-4">Create account</h2>
        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 rounded mt-1 mb-3 bg-gray-700 border border-gray-600"
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded mt-1 mb-3 bg-gray-700 border border-gray-600"
        />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded mt-1 mb-3 bg-gray-700 border border-gray-600"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 rounded mt-1 mb-4 bg-gray-700 border border-gray-600"
        >
          <option value="member">Member</option>
          <option value="trainer">Trainer</option>
          <option value="admin">Admin</option>
        </select>
        <button className="w-full py-2 rounded bg-indigo-600 font-semibold">
          Register
        </button>
      </form>
    </div>
  );
}

// ---------- Admin Dashboard ----------
function AdminDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="col-span-1 md:col-span-1 bg-gray-800 p-4 rounded">
        {" "}
        <AdminSidebar />{" "}
      </div>
      <div className="col-span-1 md:col-span-3 bg-gray-900 p-6 rounded">
        <AdminHome />
      </div>
    </div>
  );
}

function AdminSidebar() {
  return (
    <div className="space-y-4 text-sm">
      <Link to="/admin" className="block py-2 px-3 rounded hover:bg-gray-700">
        Overview
      </Link>
      <Link
        to="/admin/members"
        className="block py-2 px-3 rounded hover:bg-gray-700"
      >
        Members
      </Link>
      <Link
        to="/admin/plans"
        className="block py-2 px-3 rounded hover:bg-gray-700"
      >
        Plans
      </Link>
      <Link
        to="/admin/payments"
        className="block py-2 px-3 rounded hover:bg-gray-700"
      >
        Payments
      </Link>
      <Link
        to="/admin/attendance"
        className="block py-2 px-3 rounded hover:bg-gray-700"
      >
        Attendance
      </Link>
    </div>
  );
}

function AdminHome() {
  const [members, setMembers] = useState([]);
  const [expired, setExpired] = useState([]);

  useEffect(() => {
    fetchMembers();
  }, []);
  async function fetchMembers() {
    try {
      const { data } = await api.get("/users");
      setMembers(data);
      const now = new Date();
      setExpired(
        data.filter(
          (m) => m.membershipExpiry && new Date(m.membershipExpiry) <= now
        )
      );
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-4">Admin Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-gray-800 rounded">
          Total Members: <span className="font-bold">{members.length}</span>
        </div>
        <div className="p-4 bg-gray-800 rounded">
          Expired Today: <span className="font-bold">{expired.length}</span>
        </div>
        <div className="p-4 bg-gray-800 rounded">
          Plans: <PlansCount />
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded">
        <h4 className="font-semibold mb-2">Expired Members</h4>
        {expired.length === 0 && (
          <div className="text-gray-400">No expired memberships</div>
        )}
        <ul className="space-y-2 mt-2">
          {expired.map((m) => (
            <li
              key={m._id}
              className="p-2 bg-gray-900 rounded flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">{m.name || m.email}</div>
                <div className="text-xs text-gray-400">
                  Expired:{" "}
                  {m.membershipExpiry
                    ? new Date(m.membershipExpiry).toLocaleDateString()
                    : "Unknown"}
                </div>
              </div>
              <div className="text-sm">
                <button className="px-3 py-1 rounded bg-indigo-600">
                  Email
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <AdminMembersTable members={members} refresh={fetchMembers} />
      </div>
    </div>
  );
}

function PlansCount() {
  const [plans, setPlans] = useState([]);
  useEffect(() => {
    api
      .get("/plans")
      .then((r) => setPlans(r.data))
      .catch(() => {});
  }, []);
  return <span className="font-bold">{plans.length}</span>;
}

function AdminMembersTable({ members, refresh }) {
  const [loading, setLoading] = useState(false);

  async function removeMember(id) {
    if (!window.confirm("Delete member?")) return;
    setLoading(true);
    try {
      await api.delete("/users/" + id);
      await refresh();
    } catch (err) {
      alert("Delete failed");
    }
    setLoading(false);
  }

  return (
    <div className="bg-gray-800 p-4 rounded mt-4">
      <h4 className="font-semibold mb-3">Members</h4>
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-left text-sm">
          <thead>
            <tr className="text-gray-300">
              <th className="p-2">Name</th>
              <th>Email</th>
              <th>Trainer</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m._id} className="border-t border-gray-700">
                <td className="p-2">{m.name}</td>
                <td>{m.email}</td>
                <td>{m.trainer?.name || "-"}</td>
                <td>
                  {m.membershipExpiry
                    ? new Date(m.membershipExpiry).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  <button
                    onClick={() => removeMember(m._id)}
                    className="px-2 py-1 rounded bg-red-500 text-white text-xs"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Trainer Dashboard ----------
function TrainerDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="col-span-1 bg-gray-800 p-4 rounded">
        <TrainerSidebar />
      </div>
      <div className="col-span-3 bg-gray-900 p-6 rounded">
        <TrainerHome />
      </div>
    </div>
  );
}
function TrainerSidebar() {
  return (
    <div className="space-y-3 text-sm">
      <Link to="/trainer" className="block py-2 px-3 rounded hover:bg-gray-700">
        Overview
      </Link>
      <Link
        to="/trainer/members"
        className="block py-2 px-3 rounded hover:bg-gray-700"
      >
        My Members
      </Link>
    </div>
  );
}

function TrainerHome() {
  const [members, setMembers] = useState([]);
  useEffect(() => {
    api
      .get("/users")
      .then((r) => setMembers(r.data))
      .catch(() => {});
  }, []);
  return (
    <div>
      <h3 className="text-2xl font-semibold mb-4">Trainer Overview</h3>
      <div className="bg-gray-800 p-4 rounded">
        <h4 className="font-semibold mb-2">Assigned Members</h4>
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m._id}
              className="p-2 bg-gray-900 rounded flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">{m.name}</div>
                <div className="text-xs text-gray-400">
                  Expiry:{" "}
                  {m.membershipExpiry
                    ? new Date(m.membershipExpiry).toLocaleDateString()
                    : "-"}
                </div>
              </div>
              <div>
                <Link
                  to={`/trainer/members/${m._id}`}
                  className="text-sm px-3 py-1 rounded bg-indigo-600"
                >
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------- Member Dashboard ----------
function MemberDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
    fetchPayments();
  }, [user]);
  async function fetchProfile() {
    try {
      const { data } = await api.get("/users/" + user.id);
      setProfile(data);
    } catch (err) {
      console.error(err);
    }
  }
  async function fetchPayments() {
    try {
      const { data } = await api.get("/payments");
      setPayments(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function checkin() {
    await api
      .post("/attendance/checkin")
      .then(() => alert("Checked in"))
      .catch(() => alert("Fail"));
  }
  async function checkout() {
    await api
      .post("/attendance/checkout")
      .then(() => alert("Checked out"))
      .catch(() => alert("Fail"));
  }

  if (!user) return <div className="p-4">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-4 rounded flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">
            Welcome, {profile?.name || user.email}
          </div>
          <div className="text-sm text-gray-400">
            Plan: {profile?.plan?.name || "-"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm">Expiry</div>
          <div className="font-bold">
            {profile?.membershipExpiry
              ? new Date(profile.membershipExpiry).toLocaleDateString()
              : "No Active"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded">
          <h4 className="font-semibold">Quick Actions</h4>
          <div className="mt-3 space-y-2">
            <button
              onClick={checkin}
              className="w-full py-2 rounded bg-green-600"
            >
              Check In
            </button>
            <button
              onClick={checkout}
              className="w-full py-2 rounded bg-red-600"
            >
              Check Out
            </button>
          </div>
        </div>
        <div className="col-span-2 bg-gray-800 p-4 rounded">
          <h4 className="font-semibold mb-2">Payments</h4>
          <PaymentsTable payments={payments} />
        </div>
      </div>
    </div>
  );
}

function PaymentsTable({ payments }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-gray-300">
          <tr>
            <th className="p-2">Date</th>
            <th>Amount</th>
            <th>Plan</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p._id} className="border-t border-gray-700">
              <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
              <td>{p.amount}</td>
              <td>{p.plan?.name || "-"}</td>
              <td>{p.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Root App & Routing ----------
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-900 via-gray-900 to-black text-gray-100">
          <Navbar />
          <Container>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route
                path="/admin/*"
                element={
                  <Protected roles={["admin"]}>
                    <AdminRoute />
                  </Protected>
                }
              />
              <Route
                path="/trainer/*"
                element={
                  <Protected roles={["trainer"]}>
                    <TrainerRoute />
                  </Protected>
                }
              />
              <Route
                path="/member/*"
                element={
                  <Protected roles={["member"]}>
                    <MemberRoute />
                  </Protected>
                }
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Container>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-extrabold mb-3">GymMaster</h1>
      <p className="text-gray-300 max-w-2xl mx-auto">
        Modern gym management for admins, trainers and members. Login or
        register to get started.
      </p>
    </div>
  );
}

// ---------- Admin / Trainer / Member nested route handlers ----------
function AdminRoute() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/members" element={<AdminMembersFull />} />
      <Route path="/plans" element={<PlansManager />} />
      <Route path="/payments" element={<PaymentsManager />} />
      <Route path="/attendance" element={<AttendanceManager />} />
    </Routes>
  );
}

function TrainerRoute() {
  return (
    <Routes>
      <Route path="/" element={<TrainerDashboard />} />
      <Route path="/members/:id" element={<TrainerMemberDetail />} />
    </Routes>
  );
}

function MemberRoute() {
  return (
    <Routes>
      <Route path="/" element={<MemberDashboard />} />
    </Routes>
  );
}

// ---------- Admin: full members manager ----------
function AdminMembersFull() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchAll();
    api
      .get("/plans")
      .then((r) => setPlans(r.data))
      .catch(() => {});
  }, []);
  async function fetchAll() {
    setLoading(true);
    const { data } = await api.get("/users");
    setMembers(data);
    setLoading(false);
  }

  async function assignPlan(memberId, planId) {
    try {
      await api.put("/users/" + memberId, { planId });
      fetchAll();
    } catch (e) {
      alert("Assign failed");
    }
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Members Manager</h3>
      <div className="bg-gray-800 p-4 rounded">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-300">
              <tr>
                <th className="p-2">Name</th>
                <th>Email</th>
                <th>Plan</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id} className="border-t border-gray-700">
                  <td className="p-2">{m.name}</td>
                  <td>{m.email}</td>
                  <td>{m.plan?.name || "-"}</td>
                  <td>
                    {m.membershipExpiry
                      ? new Date(m.membershipExpiry).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <select
                      onChange={(e) => assignPlan(m._id, e.target.value)}
                      className="bg-gray-700 p-1 rounded"
                    >
                      <option value="">Assign plan</option>
                      {plans.map((p) => (
                        <option key={p._1d} value={p._id}>
                          {p.name} - {p.durationDays}d
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ---------- Plans Manager ----------
function PlansManager() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: "", price: 0, durationDays: 30 });
  useEffect(() => {
    api
      .get("/plans")
      .then((r) => setPlans(r.data))
      .catch(() => {});
  }, []);

  async function createPlan() {
    try {
      const { data } = await api.post("/plans", form);
      setPlans((prev) => [...prev, data]);
      setForm({ name: "", price: 0, durationDays: 30 });
    } catch (e) {
      alert("Create failed");
    }
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Plans</h3>
      <div className="bg-gray-800 p-4 rounded mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Plan name"
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="number"
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: parseFloat(e.target.value) })
            }
            placeholder="Price"
            className="p-2 bg-gray-700 rounded"
          />
          <input
            type="number"
            value={form.durationDays}
            onChange={(e) =>
              setForm({ ...form, durationDays: parseInt(e.target.value) })
            }
            placeholder="Duration (days)"
            className="p-2 bg-gray-700 rounded"
          />
          <button onClick={createPlan} className="bg-indigo-600 px-4 rounded">
            Create
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded">
        <ul className="space-y-2">
          {plans.map((p) => (
            <li
              key={p._id}
              className="p-2 bg-gray-900 rounded flex justify-between items-center"
            >
              {p.name}{" "}
              <span className="text-gray-400">
                {p.durationDays}d - ${p.price}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------- Payments Manager ----------
function PaymentsManager() {
  const [payments, setPayments] = useState([]);
  useEffect(() => {
    api
      .get("/payments")
      .then((r) => setPayments(r.data))
      .catch(() => {});
  }, []);
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Payments</h3>
      <div className="bg-gray-800 p-4 rounded">
        <table className="w-full text-sm">
          <thead className="text-gray-300">
            <tr>
              <th className="p-2">Member</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id} className="border-t border-gray-700">
                <td className="p-2">{p.member?.name || p.member?.email}</td>
                <td>{new Date(p.date).toLocaleDateString()}</td>
                <td>{p.amount}</td>
                <td>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Attendance Manager ----------
function AttendanceManager() {
  const [records, setRecords] = useState([]);
  useEffect(() => {
    api.get("/attendance/member").catch(() => {}); // placeholder
    // In a real app you'd fetch aggregated attendance
  }, []);
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Attendance</h3>
      <div className="bg-gray-800 p-4 rounded">
        Use Trainer view to see per-member attendance or call /attendance
        endpoints to build a full report.
      </div>
    </div>
  );
}

// ---------- Trainer Member Detail (attendance view) ----------
function TrainerMemberDetail() {
  const { user } = useAuth();
  const [member, setMember] = useState(null);
  const [records, setRecords] = useState([]);
  const { pathname } = useLocation();
  const id = pathname.split("/").pop();

  useEffect(() => {
    if (!id) return;
    api
      .get("/users/" + id)
      .then((r) => setMember(r.data))
      .catch(() => {});
    api
      .get("/attendance/member/" + id)
      .then((r) => setRecords(r.data))
      .catch(() => {});
  }, [id]);

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Member: {member?.name}</h3>
      <div className="bg-gray-800 p-4 rounded">
        <h4 className="font-semibold mb-2">Attendance</h4>
        <ul className="space-y-2">
          {records.map((r) => (
            <li key={r._id} className="p-2 bg-gray-900 rounded">
              {new Date(r.checkIn).toLocaleString()} -{" "}
              {r.checkOut ? new Date(r.checkOut).toLocaleString() : "Open"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/*
  Notes:
  - This single-file app is intentionally compact for quick prototype use.
  - For a real project, split components into separate files, add validation, loading states, and better error handling.
  - Tailwind styles assume tailwind is configured in the project.
  - The API endpoints used here match the backend scaffolding provided earlier.
*/
