import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import { FaUserCircle, FaCaretDown } from "react-icons/fa"; // For account icon and dropdown
import "./Dashboard.css";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"add" | "history" | null>(null);
  const [username, setUsername] = useState<string | null>(null); // State for username
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown state

  // Fetch username from token or API
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decodedUsername = decodeToken(token); // Use actual token decoding
      setUsername(decodedUsername || "User"); // Use actual username or fallback
    }
  }, []);

  // Function to decode JWT token and extract username (replace with actual implementation)
  const decodeToken = (token: string): string | null => {
    try {
      // Simulate decoding (in real app, use jwt-decode or similar library)
      // Example: Assuming the token payload has a "username" field
      const base64Url = token.split('.')[1]; // Get the payload part of the JWT
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.username || null; // Extract username from token payload
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
      {/* Sidebar - Fixed position */}
      <motion.div
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.5 }}
        className="sidebar"
      >
        <h2 className="sidebar-title">Dashboard</h2>
        <div className="parts">
          <div className="sidebar-buttons">
            <button className="sidebar-btn" onClick={() => setActiveSection("add")}>
              Add
            </button>
            <button className="sidebar-btn" onClick={() => setActiveSection("history")}>
              History
            </button>
          </div>

          {/* User Profile at Bottom */}
          <div className="user-profile">
            <div className="user-info" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <FaUserCircle className="user-icon" />
              <span>{username || "User"}</span>
              <FaCaretDown className="dropdown-icon" />
            </div>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="dropdown-menu"
              >
                <button className="dropdown-item" onClick={handleLogout}>
                  Logout
                </button>
                <button className="dropdown-item" onClick={() => {}}>
                  Settings
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="main-content">
        {activeSection === "add" && <AddSection />}
        {activeSection === "history" && <HistorySection />}
      </div>
    </div>
  );
};

// Add Section with Background Animation
const AddSection: React.FC = () => {
  const [type, setType] = useState("income");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("User not authenticated", { duration: 2000 });
        return;
      }

      const response = await fetch("http://localhost:5000/add-entry", {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="add-card"
      style={{ position: "relative" }} // Ensure positioning for animation background
    >
      <motion.div
        className="background-animation"
        initial={{ backgroundPosition: "0% 50%" }}
        animate={{ backgroundPosition: "100% 50%" }}
        transition={{
          repeat: Infinity,
          repeatType: "reverse",
          duration: 15, // Slower, more subtle animation
          ease: "linear",
        }}
        onAnimationStart={() => console.log("Add Section Background Animation Started")}
      />
      <h3 className="section-title">Add Entry</h3>
      <form onSubmit={handleSubmit} className="add-form">
        <select value={type} onChange={(e) => setType(e.target.value)} className="add-input">
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input
          type="text"
          placeholder="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="add-input"
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="add-input"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="add-input"
        />
        <button type="submit" className="add-button">
          Save
        </button>
      </form>
    </motion.div>
  );
};

// History Section with Background Animation
const HistorySection: React.FC = () => {
  const [history, setHistory] = useState<{ type: string; amount: number; note: string; date: string }[]>([]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");

      const response = await fetch("http://localhost:5000/history", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Error fetching history:", error instanceof Error ? error.message : error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="history-section"
      style={{ position: "relative" }} // Ensure positioning for animation background
    >
      <motion.div
        className="background-animation"
        initial={{ opacity: 0.1 }}
        animate={{ opacity: [0.1, 0.15, 0.1] }} // Subtler pulse
        transition={{
          repeat: Infinity,
          duration: 10, // Slower, more subtle pulse
          ease: "easeInOut",
        }}
        onAnimationStart={() => console.log("History Section Background Animation Started")}
      />
      <h3 className="section-title">History</h3>
      <div className="history-list">
        {history.map((entry, index) => (
          <div key={index} className="history-item">
            <div
              className="entry-type"
              style={{ color: entry.type === "income" ? "#48ff91" : "#ff6b6b" }}
            >
              {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
            </div>
            <div className="entry-details">
              <span className="entry-date">{entry.date}</span> - <span className="entry-note">{entry.note}</span>
            </div>
            <div className="entry-amount">${entry.amount}</div>
            {index < history.length - 1 && <hr className="entry-divider" />}
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Dashboard;