import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CalendarDays, CheckCircle2, CircleDollarSign, Download, Power, Scissors, ShieldCheck, Users, Loader2 } from "lucide-react";
import { theme } from "@fgp/shared";
import { api } from "./api";
import "./styles.css";

function App() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("admin_token"));
  const [accepting, setAccepting] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [stats, setStats] = useState({ dailyInr: 0, completedCount: 0 });

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [token]);

  async function fetchDashboardData() {
    try {
      const [bks, svcs, earn] = await Promise.all([
        api.get("/api/admin/bookings/today"),
        api.get("/api/services"),
        api.get("/api/admin/earnings")
      ]);
      setBookings(bks.data.bookings);
      setServices(svcs.data.services);
      setStats(earn.data);
    } catch (err) {
      console.error("Failed to fetch admin data", err);
    } finally {
      setLoading(false);
    }
  }

  const completeBooking = async (id: string) => {
    try {
      await api.put(`/api/admin/bookings/${id}/complete`);
      fetchDashboardData();
    } catch (err) {
      alert("Failed to complete booking");
    }
  };

  const toggleService = async (id: string, currentlyActive: boolean) => {
    try {
      await api.put(`/api/admin/services/${id}`, { isActive: !currentlyActive });
      fetchDashboardData();
    } catch (err) {
      alert("Failed to update service");
    }
  };

  const toggleAccepting = async () => {
    try {
      const next = !accepting;
      await api.put("/api/admin/availability", { acceptingBookings: next });
      setAccepting(next);
    } catch (err) {
      alert("Failed to update salon status");
    }
  };

  // Login handler (In a real app, this would use the same Google Auth flow as mobile)
  const handleDemoLogin = () => {
    // For demo/setup purposes. Replace with real Google login flow.
    const fakeToken = "dev-admin-token"; 
    localStorage.setItem("admin_token", fakeToken);
    setToken(fakeToken);
  };

  if (loading) return <div className="loading-screen"><Loader2 className="spinner" /></div>;

  if (!token) {
    return (
      <div className="login-gate">
        <div className="login-card">
          <h1>L'ÉLITE ADMIN</h1>
          <p>Secure Management Console</p>
          <button onClick={handleDemoLogin} className="login-btn">
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <main>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">FG</div>
          <div>
            <strong>Fashion Gents</strong>
            <span>Parlour Admin</span>
          </div>
        </div>
        <nav>
          <a className="active"><CalendarDays size={18} /> Today</a>
          <a><Scissors size={18} /> Services</a>
          <a><CircleDollarSign size={18} /> Earnings</a>
          <a><Users size={18} /> Staff</a>
          <a><ShieldCheck size={18} /> Billing</a>
        </nav>
        <button onClick={() => { localStorage.removeItem("admin_token"); setToken(null); }} className="logout-btn">
          Sign Out
        </button>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <h1>Today's Schedule</h1>
            <p>Real-time booking management · Secured by Supabase</p>
          </div>
          <button className={accepting ? "toggle on" : "toggle"} onClick={toggleAccepting}>
            <Power size={18} />
            {accepting ? "Accepting bookings" : "Bookings paused"}
          </button>
        </header>

        <section className="stats">
          <article>
            <span>Today revenue</span>
            <strong>₹{stats.dailyInr}</strong>
          </article>
          <article>
            <span>Bookings</span>
            <strong>{bookings.length}</strong>
          </article>
          <article>
            <span>Completed</span>
            <strong>{stats.completedCount}</strong>
          </article>
          <article>
            <span>System Status</span>
            <strong style={{ color: "#16D89A" }}>Active</strong>
          </article>
        </section>

        <div className="grid">
          <section className="panel schedule">
            <div className="panel-head">
              <h2>Live queue</h2>
              <button><Download size={16} /> Export CSV</button>
            </div>
            {bookings.length === 0 && <p className="empty-msg">No bookings for today yet.</p>}
            {bookings.map((booking) => (
              <article key={booking.id} className={`booking ${booking.status === "in_progress" ? "next" : ""} ${booking.status === "completed" ? "done" : ""}`}>
                <div>
                  <time>{booking.start_time}</time>
                  <h3>{booking.users?.name || "Guest"}</h3>
                  <p>{booking.status} · ₹{booking.total_amount}</p>
                </div>
                <div className="booking-actions">
                  {booking.status !== "completed" && (
                    <button onClick={() => completeBooking(booking.id)}><CheckCircle2 size={16} /> Complete</button>
                  )}
                </div>
              </article>
            ))}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Services</h2>
              <span>{services.filter(s => s.is_active).length}/{services.length} active</span>
            </div>
            <div className="service-list">
              {services.map((service) => (
                <button key={service.id} className="service-row" onClick={() => toggleService(service.id, service.is_active)}>
                  <span>{service.name}</span>
                  <strong>₹{service.price_inr}</strong>
                  <em className={service.is_active ? "active" : "hidden"}>
                    {service.is_active ? "Visible" : "Hidden"}
                  </em>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
