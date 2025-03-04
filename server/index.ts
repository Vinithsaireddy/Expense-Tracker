import express, { Request, RequestHandler, Response } from "express";
import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET as string;
const MONGO_URI = process.env.MONGO_URI as string;

if (!JWT_SECRET) {
  throw new Error("❌ JWT_SECRET is not defined in environment variables");
}

if (!MONGO_URI) {
  throw new Error("❌ MONGO_URI is not defined in environment variables");
}

// Middleware
app.use(
  cors({
    origin: "https://expense-tracker-k4br.vercel.app", // Allow frontend access
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Define User Schema & Model
interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model<IUser>("User", userSchema);

// Register Route
const registerHandler: RequestHandler = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({
        error: existingUser.email === email ? "Email already in use" : "Username already taken",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "✅ User registered successfully" });
  } catch (error) {
    console.error("❌ Error registering user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

app.post("/register", registerHandler);

// Login Route
const loginHandler: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = jwt.sign({ userId: user._id.toString() }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    console.error("❌ Error logging in:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

app.post("/login", loginHandler);

// Define Entry Schema & Model
interface IEntry extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  amount: number;
  note?: string;
  date: string;
}

const entrySchema = new Schema<IEntry>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  note: { type: String },
  date: { type: String, required: true },
});

const Entry = mongoose.model<IEntry>("Entry", entrySchema);

// Middleware for Auth Verification
const authenticate: RequestHandler = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Add Entry Route
const addEntryHandler: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { type, amount, note, date } = req.body;

    if (!type || !amount || !date) {
      res.status(400).json({ error: "Type, amount, and date are required" });
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      res.status(400).json({ error: "Invalid amount" });
      return;
    }

    const newEntry = new Entry({ userId, type, amount, note, date });
    await newEntry.save();

    res.status(201).json({ message: "✅ Entry added successfully" });
  } catch (error) {
    console.error("❌ Error adding entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

app.post("/add-entry", authenticate, addEntryHandler);

// Get History Route
const getHistoryHandler: RequestHandler = async (req, res) => {
  try {
    const userId = (req as any).userId;
    const history = await Entry.find({ userId });

    res.json(history);
  } catch (error) {
    console.error("❌ Error retrieving history:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

app.get("/history", authenticate, getHistoryHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
