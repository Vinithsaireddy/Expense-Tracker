import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { FaUserCircle, FaCaretDown } from "react-icons/fa";
import "./Dashboard.css";
import { jwtDecode } from "jwt-decode";
import BACKEND_URL from "../config";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"add" | "history" | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedUsername = decodeToken(token);
      setUsername(decodedUsername || "User");
    }
  }, []);

  const decodeToken = (token: string): string | null => {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.username || null;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully!", { duration: 2000 });
    setTimeout(() => navigate("/login"), 1500);
  };

  return (
    <div className="dashboard-container">
      <Toaster position="top-center" />
      <motion.div initial={{ x: -250 }} animate={{ x: 0 }} transition={{ duration: 0.5 }} className="sidebar">
        <h2 className="sidebar-title">Dashboard</h2>
        <div className="parts">
          <div className="sidebar-buttons">
            <button className="sidebar-btn" onClick={() => setActiveSection("add")}>Add</button>
            <button className="sidebar-btn" onClick={() => setActiveSection("history")}>History</button>
          </div>
          <div className="user-profile">
            <div className="user-info" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <FaUserCircle className="user-icon" />
              <span>{username || "User"}</span>
              <FaCaretDown className="dropdown-icon" />
            </div>
            {isDropdownOpen && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="dropdown-menu">
                <button className="dropdown-item" onClick={handleLogout}>Logout</button>
                <button className="dropdown-item" onClick={() => {}}>Settings</button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
      <div className="main-content">
        {activeSection === "add" && <AddSection />}
        {activeSection === "history" && <HistorySection />}
      </div>
    </div>
  );
};

const AddSection: React.FC = () => {
  const [type, setType] = useState("income");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitting form:", { type, amount, note, date });
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User not authenticated", { duration: 2000 });
        return;
      }
      const response = await fetch(`${BACKEND_URL}/add-entry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, amount, note, date }),
      });
      if (response.ok) {
        toast.success("Entry added successfully!", { duration: 2000 });
        setType("income");
        setAmount("");
        setNote("");
        setDate("");
      } else {
        const errorText = await response.text();
        toast.error(errorText || "Failed to add entry", { duration: 2000 });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error adding entry", { duration: 2000 });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="add-card">
      <h3 className="section-title">Add Entry</h3>
      <form onSubmit={handleSubmit} className="add-form">
        <select value={type} onChange={(e) => setType(e.target.value)} className="add-input">
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input type="text" placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} className="add-input" />
        <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="add-input" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="add-input" />
        <button type="submit" className="add-button">Save</button>
      </form>
    </motion.div>
  );
};

interface HistoryEntry {
  type: string;
  date: string;
  note: string;
  amount: number;
}

const HistorySection: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        const response = await fetch(`${BACKEND_URL}/history`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error(await response.text());
        const data: HistoryEntry[] = await response.json();
        setHistory(data);
      } catch (error) {
        console.error("Error fetching history:", error);
      }
    };
    fetchHistory();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="history-section">
      <h3 className="section-title">History</h3>
      <div className="history-list">
        {history.map((entry: HistoryEntry, index) => (
          <div key={index} className="history-item">
            <div className="entry-type" style={{ color: entry.type === "income" ? "#48ff91" : "#ff6b6b" }}>{entry.type}</div>
            <div className="entry-details">
              <span className="entry-date">{entry.date}</span> - 
              <span className="entry-note">{entry.note}</span>
            </div>
            <div className="entry-amount">${entry.amount}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Dashboard;
