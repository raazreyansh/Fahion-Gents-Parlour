import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { CalendarDays, CheckCircle2, CircleDollarSign, Download, Power, Scissors, ShieldCheck, Users } from "lucide-react";
import { serviceCatalog, theme } from "@fgp/shared";
import "./styles.css";

type BookingCard = {
  id: string;
  customer: string;
  time: string;
  services: string[];
  amount: number;
  status: "UP NEXT" | "Upcoming" | "Completed";
};

const seedBookings: BookingCard[] = [
  { id: "BK-1007", customer: "Ravi Kumar", time: "10:00", services: ["Haircut", "Beard Setting"], amount: 100, status: "UP NEXT" },
  { id: "BK-1008", customer: "Suresh Prasad", time: "11:30", services: ["Facial"], amount: 300, status: "Upcoming" },
  { id: "BK-1009", customer: "Amit Raj", time: "13:00", services: ["Hair Spa"], amount: 300, status: "Completed" }
];

function App() {
  const [accepting, setAccepting] = useState(true);
  const [bookings, setBookings] = useState(seedBookings);
  const [activeServiceIds, setActiveServiceIds] = useState(new Set(serviceCatalog.map((service) => service.id)));
  const completedRevenue = bookings.filter((booking) => booking.status === "Completed").reduce((sum, booking) => sum + booking.amount, 0);

  const popularServices = useMemo(
    () => serviceCatalog.slice(0, 5).map((service, index) => ({ name: service.name.split(" ")[0], count: 16 - index * 2 })),
    []
  );

  const completeBooking = (id: string) => {
    setBookings((current) =>
      current.map((booking) => (booking.id === id ? { ...booking, status: "Completed" as const } : booking))
    );
  };

  const toggleService = (id: string) => {
    setActiveServiceIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <h1>Today's Schedule</h1>
            <p>Single-salon v1 · Owner plus staff roles · Subscription trialing</p>
          </div>
          <button className={accepting ? "toggle on" : "toggle"} onClick={() => setAccepting((value) => !value)}>
            <Power size={18} />
            {accepting ? "Accepting bookings" : "Bookings paused"}
          </button>
        </header>

        <section className="stats">
          <article>
            <span>Today revenue</span>
            <strong>₹{completedRevenue}</strong>
          </article>
          <article>
            <span>Bookings</span>
            <strong>{bookings.length}</strong>
          </article>
          <article>
            <span>No-show rate</span>
            <strong>0%</strong>
          </article>
          <article>
            <span>Plan</span>
            <strong>₹590/mo</strong>
          </article>
        </section>

        <div className="grid">
          <section className="panel schedule">
            <div className="panel-head">
              <h2>Live queue</h2>
              <button><Download size={16} /> Export CSV</button>
            </div>
            {bookings.map((booking) => (
              <article key={booking.id} className={`booking ${booking.status === "UP NEXT" ? "next" : ""} ${booking.status === "Completed" ? "done" : ""}`}>
                <div>
                  <time>{booking.time}</time>
                  <h3>{booking.customer}</h3>
                  <p>{booking.services.join(" + ")} · ₹{booking.amount}</p>
                </div>
                <div className="booking-actions">
                  <span>{booking.status}</span>
                  {booking.status !== "Completed" && (
                    <button onClick={() => completeBooking(booking.id)}><CheckCircle2 size={16} /> Complete</button>
                  )}
                </div>
              </article>
            ))}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Services</h2>
              <span>{activeServiceIds.size}/{serviceCatalog.length} active</span>
            </div>
            <div className="service-list">
              {serviceCatalog.slice(0, 8).map((service) => (
                <button key={service.id} className="service-row" onClick={() => toggleService(service.id)}>
                  <span>{service.name}</span>
                  <strong>₹{service.priceInr}</strong>
                  <em>{activeServiceIds.has(service.id) ? "Available" : "Hidden"}</em>
                </button>
              ))}
            </div>
          </section>

          <section className="panel analytics">
            <div className="panel-head">
              <h2>Popular services</h2>
              <span>Last 30 days</span>
            </div>
            {popularServices.map((service) => (
              <div className="bar" key={service.name}>
                <span>{service.name}</span>
                <div><i style={{ width: `${service.count * 5}%`, background: theme.colors.heritageGold }} /></div>
                <b>{service.count}</b>
              </div>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
