import express, { Request, RequestHandler, Response } from 'express';
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const MONGO_URI = process.env.MONGO_URI || "" ;

app.use(cors({
  origin: 'http://localhost:5173', // Allow only your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true // Allow cookies if needed
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define User Interface
interface IUser extends Document {
  username: string;  // Added username field
  email: string;
  password: string;
}

// Define Schema and Model
const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },  // Added username
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model<IUser>('User', userSchema);

// Define request body types
interface AuthRequestBody {
  username?: string;  // Added username
  email: string;
  password: string;
}

// Register Route
const registerHandler: RequestHandler<{}, any, AuthRequestBody & { username: string }> = async (req, res): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Check if the username or email already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      if (existingUser.email === email) {
        res.status(400).send('Email already in use');
      } else {
        res.status(400).send('Username already taken');
      }
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    
    res.status(201).send('User registered');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send((error as Error).message || 'Error registering user');
  }
};


app.post('/register', registerHandler);

// Login Route
const loginHandler: RequestHandler<{}, any, AuthRequestBody> = async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).send('Invalid credentials');
      return;
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send((error as Error).message || 'Error logging in');
  }
};

app.post('/login', loginHandler);

const entrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Add userId field
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  note: { type: String, required: true },
  date: { type: String, required: true },
});

const Entry = mongoose.model("Entry", entrySchema);

// Add Entry API
// Add Entry API
const addEntryHandler: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract the token
    if (!token) {
      res.status(401).send("Unauthorized"); 
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { type, amount, note, date } = req.body;

    const newEntry = new Entry({ userId: decoded.userId, type, amount, note, date });
    await newEntry.save();
    
    res.status(201).send("Entry added successfully");
  } catch (error) {
    console.error("Error adding entry:", error);
    res.status(500).send((error as Error).message || "Error adding entry");
  }
};

app.post("/add-entry", addEntryHandler);

// Get History API
const getHistoryHandler: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Extract the token
    if (!token) {
      res.status(401).send("Unauthorized");
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const history = await Entry.find({ userId: decoded.userId }); // Filter by userId
    res.json(history);
  } catch (error) {
    console.error("Error retrieving history:", error);
    res.status(500).send((error as Error).message || "Error retrieving history");
  }
};

app.get("/history", getHistoryHandler);


app.get("/history", getHistoryHandler);

// Start the Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
