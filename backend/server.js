import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import { sendOtpMail } from "./utils/sendOtpMail.js";
import User from "./models/User.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import Equipment from "./models/Equipment.js";
import Booking from "./models/Booking.js";
import multer from "multer";
import fs from "fs";

// ? LOAD ENV
dotenv.config();

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// App init
const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:8081",
    "http://192.168.137.1:5000",
    "http://192.168.112.170",
    "http://192.168.8.135:5000",
    "http://localhost:19006"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
}));
app.use(express.json());
app.use("/api", doctorRoutes);
// Right after: app.use(express.json());
// Add request logging
app.use((req, res, next) => {
  console.log(`?? ${new Date().toLocaleTimeString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/postJourneyDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/equipment";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  }
});

// Validation regex
const nameRegex = /^[A-Za-z\s]+$/;
const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

// ========== AUTH ROUTES ==========
// Register
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, userType } = req.body;

    if (!name || !email || !password || !userType)
      return res.json({ success: false, message: "All fields are required." });

    if (!nameRegex.test(name))
      return res.json({ success: false, message: "Name should contain only letters." });

    if (!emailRegex.test(email))
      return res.json({ success: false, message: "Invalid email format." });

    if (!passwordRegex.test(password))
      return res.json({
        success: false,
        message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character."
      });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.json({ success: false, message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = new User({
      name,
      email,
      password: hashedPassword,
      userType,
      isVerified: false,
      otp,
      otpExpiry,
    });

    await user.save();
    await sendOtpMail(email, otp);

    return res.json({
      success: true,
      message: "OTP sent to your email. Please verify.",
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Server error occurred." });
  }
});

// Verify OTP
app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.json({ success: false, message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.json({ success: false, message: "User not found." });

    if (user.isVerified)
      return res.json({ success: true, message: "Email already verified" });

    if (!user.otp || !user.otpExpiry)
      return res.json({ success: false, message: "OTP expired. Please resend OTP" });

    if (Date.now() > user.otpExpiry)
      return res.json({ success: false, message: "OTP expired. Please resend OTP" });

    if (user.otp !== otp)
      return res.json({ success: false, message: "Invalid OTP" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Server error" });
  }
});

// ========== GOOGLE AUTHENTICATION ==========
app.post("/auth/google", async (req, res) => {
  try {
    const { name, email, googleId, picture, userType } = req.body;

    if (!email || !googleId) {
      return res.json({ success: false, message: "Email and Google ID are required" });
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update Google ID if not set, and log them in
      if (!user.googleId) {
        user.googleId = googleId;
        user.picture = picture;
        await user.save();
      }

      // Check if user is blocked
      if (user.isBlocked) {
        return res.json({ success: false, message: "Your account has been blocked" });
      }

      console.log("✅ Google login successful for:", email);
      return res.json({
        success: true,
        message: "Login successful",
        name: user.name,
        email: user.email,
        userId: user._id,
        userType: user.userType,
        profileCompleted: user.profileCompleted,
      });
    }

    // New user - create account
    if (!userType) {
      return res.json({ success: false, message: "User type is required for new users" });
    }

    user = new User({
      name,
      email,
      googleId,
      picture,
      userType,
      isVerified: true, // Google accounts are pre-verified
      profileCompleted: false,
    });

    await user.save();
    console.log("✅ New Google user created:", email);

    return res.json({
      success: true,
      message: "Registration successful",
      name: user.name,
      email: user.email,
      userId: user._id,
      userType: user.userType,
      profileCompleted: false,
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return res.json({ success: false, message: "Server error during Google authentication" });
  }
});

// Resend OTP
app.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.json({ success: false, message: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });
    if (user.isVerified) return res.json({ success: false, message: "Email already verified" });

    // Cooldown check
    if (user.otpLastSentAt && Date.now() - user.otpLastSentAt < 40000)
      return res.json({ success: false, message: "Please wait 40 seconds before resending OTP" });

    const newOtp = crypto.randomInt(100000, 999999).toString();
    user.otp = newOtp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpLastSentAt = new Date();
    await user.save();

    await sendOtpMail(email, newOtp);
    return res.json({ success: true, message: "New OTP sent to your email" });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Server error" });
  }
});

// Login
// Login route - handle both formats
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.json({ success: false, message: "All fields are required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.json({ success: false, message: "Invalid credentials" });

    if (user.isBlocked)
      return res.json({ success: false, message: "Account is blocked. Contact admin." });

    if (!user.isVerified)
      return res.json({ success: false, message: "Please verify your email first" });

    // Normalize userType for validation
    let userType = user.userType || "";

    // Accept both formats
    if (userType === "service-provider" || userType === "service provider") {
      const verificationStatus = user.providerVerification?.status || "";

      if (verificationStatus === "rejected") {
        return res.json({
          success: false,
          message: "Your provider application has been rejected.",
        });
      }

      if (!verificationStatus || verificationStatus === "pending") {
        return res.json({
          success: false,
          message: "Provider account pending admin approval.",
        });
      }

      if (verificationStatus !== "approved") {
        return res.json({
          success: false,
          message: "Account verification required.",
        });
      }

      // Normalize to hyphenated format for response
      userType = "service-provider";
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.json({ success: false, message: "Invalid credentials" });

    console.log("? Login successful for:", user.email);

    return res.json({
      success: true,
      message: "Login successful",
      userType: userType,
      serviceType: user.serviceType || "",
      name: user.name,
      email: user.email,
      userId: user._id.toString(),
      profileCompleted: user.profileCompleted || false,
    });

  } catch (err) {
    console.error("? Login error:", err);
    return res.json({
      success: false,
      message: "Server error occurred",
    });
  }
});

// Add these routes to your server.js file

// ========== MEDICAL VIDEO ROUTES ==========

// Get all videos from database
app.get("/api/videos", async (req, res) => {
  try {
    // You need to create a Video model first
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos || []);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

// Search YouTube videos
app.get("/api/youtube/search", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    // You need to install youtube-api or googleapis package
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search`,
      {
        params: {
          part: "snippet",
          q: `${q} medical equipment demonstration`,
          key: process.env.YOUTUBE_API_KEY,
          type: "video",
          maxResults: 10,
          relevanceLanguage: "en"
        }
      }
    );

    const videos = response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url
    }));

    res.json(videos);
  } catch (err) {
    console.error(err);
    res.json([]);
  }
});

// ========== EQUIPMENT ROUTES ==========
// ✅ FIXED: Get all equipment (for patients)
app.get("/equipment/all", async (req, res) => {
  try {
    console.log("🔍 Fetching all available equipment...");
    // Only show items with stock > 0 AND listing fee paid AND isListed = true
    const equipment = await Equipment.find({
      stock: { $gt: 0 },
      listingFeePaid: true,
      isListed: true
    })
      .sort({ createdAt: -1 })
      .populate("providerId", "name email");

    console.log(`✅ Found ${equipment.length} equipment items with paid listing fee`);

    return res.json({ success: true, equipment });
  } catch (err) {
    console.error("❌ Error fetching equipment:", err);
    return res.json({ success: false, message: "Failed to fetch equipment" });
  }
});

// Get equipment by provider
app.get("/equipment/provider/:providerId", async (req, res) => {
  try {
    const equipment = await Equipment.find({ providerId: req.params.providerId })
      .sort({ createdAt: -1 });

    return res.json({ success: true, equipment });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Failed to fetch equipment" });
  }
});

// UPDATED: Equipment creation with listing fee requirement
app.post("/equipment/add", upload.single("image"), async (req, res) => {
  try {
    console.log("🔧 Equipment add request received");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);

    const {
      equipmentName,
      description,
      pricePerDay,
      stock,
      providerId,
      providerName,
      category
    } = req.body;

    if (!equipmentName || !description || !pricePerDay || !stock || !providerId || !providerName)
      return res.json({ success: false, message: "All fields are required" });

    const provider = await User.findById(providerId);
    console.log("🔍 Provider found:", provider);

    if (!provider) {
      console.log("❌ Provider not found with ID:", providerId);
      return res.json({ success: false, message: "Provider not found" });
    }

    const isValidProvider = provider.userType === "service-provider" ||
      provider.userType === "service provider";

    if (!isValidProvider) {
      console.log("❌ Invalid user type:", provider.userType);
      return res.json({
        success: false,
        message: `User is not a service provider. User type: ${provider.userType}`
      });
    }

    const imageUrl = req.file ? `/uploads/equipment/${req.file.filename}` : "";

    // Calculate 5% listing fee
    const listingFee = parseFloat(pricePerDay) * 0.05;
    const listingFeeAmount = Math.round(listingFee * 100) / 100; // Round to 2 decimal places

    // Create equipment but NOT listed yet (waiting for fee payment)
    const equipment = new Equipment({
      equipmentName,
      description,
      pricePerDay: parseFloat(pricePerDay),
      stock: parseInt(stock),
      providerId,
      providerName: provider.name || providerName,
      category: category || "other",
      imageUrl,
      // NEW FIELDS FOR PAYMENT SYSTEM
      listingFeePaid: false,
      listingFeeAmount: listingFeeAmount,
      isListed: false, // Will be true only after fee payment
      adminApproved: false,
      isAvailable: false // Initially not available until fee paid
    });

    await equipment.save();
    console.log("✅ Equipment saved (pending listing fee):", equipment);
    console.log("💰 Required listing fee:", listingFeeAmount);

    return res.json({
      success: true,
      message: "Equipment created successfully. Please pay 5% listing fee to list it for booking.",
      requiresPayment: true,
      equipmentId: equipment._id,
      listingFee: listingFeeAmount,
      equipment: {
        _id: equipment._id,
        equipmentName: equipment.equipmentName,
        description: equipment.description,
        pricePerDay: equipment.pricePerDay,
        stock: equipment.stock,
        listingFee: listingFeeAmount,
        listingFeePaid: equipment.listingFeePaid,
        isListed: equipment.isListed
      }
    });
  } catch (err) {
    console.error("❌ Error adding equipment:", err);
    return res.json({
      success: false,
      message: "Failed to add equipment: " + err.message
    });
  }
});

// NEW: Check if equipment requires listing fee payment
app.get("/equipment/:id/check-fee", async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.json({
        success: false,
        message: "Equipment not found"
      });
    }

    const requiresPayment = !equipment.listingFeePaid;
    const listingFee = equipment.listingFeeAmount || (equipment.pricePerDay * 0.05);

    return res.json({
      success: true,
      requiresPayment,
      listingFee,
      equipment: {
        _id: equipment._id,
        equipmentName: equipment.equipmentName,
        pricePerDay: equipment.pricePerDay,
        listingFeePaid: equipment.listingFeePaid,
        isListed: equipment.isListed,
        isAvailable: equipment.isAvailable
      }
    });
  } catch (err) {
    console.error("❌ Error checking equipment fee:", err);
    return res.json({ success: false, message: "Failed to check equipment fee" });
  }
});

// NEW: Mark equipment as listed after fee payment
app.put("/equipment/:id/mark-listed", async (req, res) => {
  try {
    const { transactionId, paymentMethod } = req.body;

    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.json({
        success: false,
        message: "Equipment not found"
      });
    }

    // Mark as listed and activate
    equipment.listingFeePaid = true;
    equipment.isListed = true;
    equipment.adminApproved = true;
    equipment.isAvailable = true; // Now available for booking

    await equipment.save();

    console.log(`✅ Equipment ${equipment.equipmentName} listed successfully`);
    console.log(`💰 Transaction ID: ${transactionId}, Method: ${paymentMethod}`);

    return res.json({
      success: true,
      message: "Equipment listed successfully and now available for booking",
      equipment: {
        _id: equipment._id,
        equipmentName: equipment.equipmentName,
        listingFeePaid: equipment.listingFeePaid,
        isListed: equipment.isListed,
        isAvailable: equipment.isAvailable,
        adminApproved: equipment.adminApproved
      }
    });
  } catch (err) {
    console.error("❌ Error marking equipment as listed:", err);
    return res.json({ success: false, message: "Failed to mark equipment as listed" });
  }
});

// In your equipment update route
app.put("/equipment/update/:id", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (req.file) {
      updates.imageUrl = `/uploads/equipment/${req.file.filename}`;
    }

    // Find equipment first
    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.json({ success: false, message: "Equipment not found" });
    }

    // If updating price, recalculate listing fee (but don't charge again)
    if (updates.pricePerDay !== undefined) {
      const newPrice = parseFloat(updates.pricePerDay);
      // Only update listing fee amount if fee hasn't been paid yet
      if (!equipment.listingFeePaid) {
        updates.listingFeeAmount = newPrice * 0.05;
      }
    }

    // Update stock and automatically set isAvailable
    if (updates.stock !== undefined) {
      const stockValue = parseInt(updates.stock);
      equipment.stock = stockValue;

      // Only update isAvailable if listing fee is paid
      if (equipment.listingFeePaid && equipment.isListed) {
        equipment.isAvailable = stockValue > 0;
      } else {
        equipment.isAvailable = false; // Not available if fee not paid
      }

      // Save the equipment with proper middleware triggers
      await equipment.save();

      // Remove stock from updates object since we already updated it
      delete updates.stock;
      delete updates.isAvailable;
    }

    // Update other fields if any
    if (Object.keys(updates).length > 0) {
      await Equipment.findByIdAndUpdate(id, { $set: updates });
    }

    // Fetch updated equipment
    const updatedEquipment = await Equipment.findById(id);

    console.log("✅ Equipment updated:", {
      name: updatedEquipment.equipmentName,
      stock: updatedEquipment.stock,
      available: updatedEquipment.isAvailable,
      listingFeePaid: updatedEquipment.listingFeePaid,
      isListed: updatedEquipment.isListed
    });

    return res.json({
      success: true,
      message: "Equipment updated",
      equipment: updatedEquipment
    });
  } catch (err) {
    console.error("❌ Error updating equipment:", err);
    return res.json({ success: false, message: "Failed to update equipment" });
  }
});

app.get("/fix-equipment-availability", async (req, res) => {
  try {
    console.log("🔧 Fixing equipment availability...");

    const allEquipment = await Equipment.find({});
    let fixedCount = 0;

    for (const equipment of allEquipment) {
      let shouldBeAvailable = false;

      // Equipment should be available only if:
      // 1. Stock > 0
      // 2. Listing fee paid
      // 3. Is listed
      if (equipment.stock > 0 && equipment.listingFeePaid && equipment.isListed) {
        shouldBeAvailable = true;
      }

      if (equipment.isAvailable !== shouldBeAvailable) {
        equipment.isAvailable = shouldBeAvailable;
        await equipment.save();
        console.log(`✅ Fixed ${equipment.equipmentName}: stock=${equipment.stock}, feePaid=${equipment.listingFeePaid}, listed=${equipment.isListed}, available=${shouldBeAvailable}`);
        fixedCount++;
      }
    }

    return res.json({
      success: true,
      message: `Fixed ${fixedCount} equipment items`,
      fixedCount
    });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Failed to fix equipment" });
  }
});

app.delete("/equipment/delete/:id", async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment)
      return res.json({ success: false, message: "Equipment not found" });

    return res.json({ success: true, message: "Equipment deleted" });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Failed to delete equipment" });
  }
});

app.get("/equipment/:id", async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate("providerId", "name email phoneNumber address");

    if (!equipment)
      return res.json({ success: false, message: "Equipment not found" });

    return res.json({ success: true, equipment });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Failed to fetch equipment" });
  }
});

// ========== REVIEW ENDPOINTS ==========

// POST: Add review for a specific booking
app.post("/booking/:bookingId/review", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { userId, userName, rating, comment } = req.body;

    console.log("📝 Adding review for booking:", bookingId);

    // Validate required fields
    if (!userId || !userName || !rating) {
      return res.json({
        success: false,
        message: "Missing required fields: userId, userName, rating"
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    // Check if booking is completed
    if (booking.status !== "completed") {
      return res.json({
        success: false,
        message: "You can only review after your rental is completed"
      });
    }

    // Check if THIS booking already has a review
    if (booking.hasReview) {
      return res.json({
        success: false,
        message: "You have already reviewed this order"
      });
    }

    // Save review to booking
    booking.hasReview = true;
    booking.review = {
      rating: parseInt(rating),
      comment: comment || "",
      reviewDate: new Date()
    };
    await booking.save();

    // Also add to equipment reviews for aggregation
    const equipment = await Equipment.findById(booking.equipmentId);
    if (equipment) {
      equipment.reviews.push({
        userId,
        userName,
        rating: parseInt(rating),
        comment: comment || "",
        date: new Date(),
        bookingId: bookingId // Link to booking
      });
      await equipment.save();
    }

    console.log("✅ Review added to booking:", bookingId);

    return res.json({
      success: true,
      message: "Review submitted successfully",
      review: booking.review
    });
  } catch (err) {
    console.error("❌ Error adding review:", err);
    return res.json({ success: false, message: "Failed to add review" });
  }
});

// POST: Add review for equipment (legacy - redirects to booking)
app.post("/equipment/:equipmentId/review", async (req, res) => {
  try {
    const { equipmentId } = req.params;
    const { userId, userName, rating, comment, bookingId } = req.body;

    // If bookingId provided, use the new booking-based review
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.json({ success: false, message: "Booking not found" });
      }

      if (booking.hasReview) {
        return res.json({
          success: false,
          message: "You have already reviewed this order"
        });
      }

      // Save review to booking
      booking.hasReview = true;
      booking.review = {
        rating: parseInt(rating),
        comment: comment || "",
        reviewDate: new Date()
      };
      await booking.save();

      // Also add to equipment reviews
      const equipment = await Equipment.findById(equipmentId);
      if (equipment) {
        equipment.reviews.push({
          userId,
          userName,
          rating: parseInt(rating),
          comment: comment || "",
          date: new Date(),
          bookingId: bookingId
        });
        await equipment.save();
      }

      return res.json({
        success: true,
        message: "Review submitted successfully",
        review: booking.review,
        averageRating: equipment?.averageRating,
        totalReviews: equipment?.totalReviews
      });
    }

    return res.json({
      success: false,
      message: "Booking ID is required for reviews"
    });
  } catch (err) {
    console.error("❌ Error adding review:", err);
    return res.json({ success: false, message: "Failed to add review" });
  }
});

// GET: Get reviews for equipment
app.get("/equipment/:equipmentId/reviews", async (req, res) => {
  try {
    const { equipmentId } = req.params;

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.json({ success: false, message: "Equipment not found" });
    }

    // Sort reviews by date (newest first)
    const sortedReviews = [...equipment.reviews].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    return res.json({
      success: true,
      reviews: sortedReviews,
      averageRating: equipment.averageRating || 0,
      totalReviews: equipment.totalReviews || 0
    });
  } catch (err) {
    console.error("❌ Error fetching reviews:", err);
    return res.json({ success: false, message: "Failed to fetch reviews" });
  }
});

// GET: Check if user has reviewed this equipment
app.get("/equipment/:equipmentId/review/check/:userId", async (req, res) => {
  try {
    const { equipmentId, userId } = req.params;

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.json({ success: false, message: "Equipment not found" });
    }

    const userReview = equipment.reviews.find(
      r => r.userId.toString() === userId.toString()
    );

    return res.json({
      success: true,
      hasReviewed: !!userReview,
      review: userReview || null
    });
  } catch (err) {
    console.error("❌ Error checking review:", err);
    return res.json({ success: false, message: "Failed to check review" });
  }
});

// Get patient's active equipment (equipment they have booked)
app.get("/patient/:patientId/active-equipment", async (req, res) => {
  try {
    const { patientId } = req.params;

    // Get all bookings for this patient that are not cancelled
    const bookings = await Booking.find({
      patientId,
      status: { $nin: ["cancelled", "completed"] } // Active bookings only
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "equipmentId",
        select: "equipmentName imageUrl description pricePerDay isAvailable stock listingFeePaid isListed",
        model: "Equipment"
      })
      .populate("providerId", "name phoneNumber");

    // Extract equipment from bookings
    const activeEquipment = bookings
      .filter(booking => booking.equipmentId) // Only include bookings with equipment
      .map(booking => ({
        ...booking.equipmentId.toObject(),
        bookingDetails: {
          bookingId: booking._id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          status: booking.status,
          totalAmount: booking.totalAmount
        }
      }));

    return res.json({
      success: true,
      activeEquipment,
      total: activeEquipment.length
    });
  } catch (err) {
    console.error("❌ Error fetching active equipment:", err);
    return res.json({ success: false, message: "Failed to fetch active equipment" });
  }
});

// NEW: Get equipment pending listing fee (for provider dashboard)
app.get("/equipment/provider/:providerId/pending-fee", async (req, res) => {
  try {
    const equipment = await Equipment.find({
      providerId: req.params.providerId,
      listingFeePaid: false,
      isListed: false
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      equipment,
      count: equipment.length,
      message: equipment.length > 0
        ? `Found ${equipment.length} equipment items pending listing fee`
        : "No equipment pending listing fee"
    });
  } catch (err) {
    console.error("❌ Error fetching pending fee equipment:", err);
    return res.json({ success: false, message: "Failed to fetch equipment pending fee" });
  }
});

// NEW: Get equipment with paid listing fee (for provider dashboard)
app.get("/equipment/provider/:providerId/listed", async (req, res) => {
  try {
    const equipment = await Equipment.find({
      providerId: req.params.providerId,
      listingFeePaid: true,
      isListed: true
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      equipment,
      count: equipment.length,
      message: `Found ${equipment.length} listed equipment items`
    });
  } catch (err) {
    console.error("❌ Error fetching listed equipment:", err);
    return res.json({ success: false, message: "Failed to fetch listed equipment" });
  }
});

// ========== BOOKING ROUTES ==========
// Create booking
// In your booking creation route in server.js
app.post("/booking/create", async (req, res) => {
  try {
    console.log("📝 ========== BOOKING CREATE REQUEST ==========");
    console.log("📥 Full request body:", JSON.stringify(req.body, null, 2));

    // Extract all variables
    let {
      patientId,
      patientName,
      equipmentId,
      equipmentName,
      providerId,
      providerName,
      startDate,
      endDate,
      pricePerDay,
      quantity = 1,
      deliveryAddress,
      contactPhone,
      notes,
      paymentMethod = "pending", // Default to pending - user will select payment method on PaymentScreen
      paymentMethodDetails = {}
    } = req.body;

    console.log("🔍 Quantity requested:", quantity);
    console.log("🔍 Payment Method:", paymentMethod);

    // Normalize payment method
    paymentMethod = String(paymentMethod).toLowerCase().trim();
    console.log("✅ Normalized payment method:", paymentMethod);

    // Check if providerId is an object
    if (providerId && typeof providerId === 'object') {
      if (providerId._id) {
        providerId = providerId._id;
        console.log("✅ Extracted providerId:", providerId);
      }
    }

    // Validate required fields
    const requiredFields = [
      patientId, equipmentId, startDate, endDate,
      deliveryAddress, contactPhone, pricePerDay
    ];

    const missingFields = requiredFields.filter(field => !field);
    if (missingFields.length > 0) {
      console.log("❌ Missing required fields:", missingFields);
      return res.json({
        success: false,
        message: "Missing required fields: " + missingFields.join(", ")
      });
    }

    // Validate quantity
    if (!quantity || quantity < 1) {
      quantity = 1;
    }
    quantity = parseInt(quantity);

    // Check if patient exists
    console.log("🔍 Checking if patient exists...");
    let patient;
    try {
      if (mongoose.Types.ObjectId.isValid(patientId)) {
        patient = await User.findById(patientId);
        console.log("✅ Patient found:", patient ? `${patient.name} (${patient.email})` : "NOT FOUND");
      } else {
        console.log("❌ Invalid patient ID format:", patientId);
        return res.json({ success: false, message: "Invalid patient ID format" });
      }
    } catch (error) {
      console.error("❌ Error finding patient:", error);
      return res.json({ success: false, message: "Error finding patient" });
    }

    if (!patient) {
      console.log("❌ Patient not found");
      return res.json({ success: false, message: "Patient not found" });
    }

    // Check equipment availability with fresh data
    console.log("🔍 Checking equipment availability...");
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      console.log("❌ Equipment not found");
      return res.json({ success: false, message: "Equipment not found" });
    }

    console.log("📊 Equipment stock:", equipment.stock, "Requested:", quantity);

    // Check stock
    if (equipment.stock < quantity) {
      console.log("❌ Not enough stock available");
      return res.json({
        success: false,
        message: `Insufficient stock. Only ${equipment.stock} unit(s) available now.`
      });
    }

    // ========== 🔥 CRITICAL STOCK REDUCTION FIX ==========
    console.log("=== STOCK REDUCTION LOGIC ===");
    console.log("📊 Equipment stock BEFORE:", equipment.stock);
    console.log("💰 Payment method:", paymentMethod);

    let stockReduced = false;
    let newStock = equipment.stock;

    // 🔥 FIX 1: Reduce stock ONLY for COD (immediately)
    if (paymentMethod === "cod") {
      console.log("✅ COD DETECTED - Reducing stock now...");

      // Calculate new stock
      newStock = equipment.stock - quantity;
      console.log(`📦 Stock calculation: ${equipment.stock} - ${quantity} = ${newStock}`);

      // Update equipment directly
      try {
        await Equipment.findByIdAndUpdate(
          equipmentId,
          {
            $inc: { stock: -quantity },
            $set: {
              isAvailable: newStock > 0,
              updatedAt: new Date()
            }
          }
        );

        stockReduced = true;
        console.log(`✅ COD stock reduced by ${quantity}. New stock: ${newStock}`);
      } catch (error) {
        console.error("❌ Failed to reduce COD stock:", error);
      }
    } else {
      console.log("⏳ Non-COD - Stock will be reduced AFTER successful payment");
      console.log(`📊 Stock remains: ${equipment.stock}`);
    }
    console.log("=== END STOCK LOGIC ===");

    // Check if provider exists
    console.log("🔍 Checking provider...");
    const provider = await User.findById(providerId);
    if (!provider) {
      console.log("❌ Provider not found with ID:", providerId);
      return res.json({ success: false, message: "Provider not found" });
    }
    console.log("✅ Provider found:", provider.name);

    // Parse dates
    console.log("📅 Parsing dates...");
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    console.log("Start:", parsedStartDate.toISOString());
    console.log("End:", parsedEndDate.toISOString());

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      console.log("❌ Invalid date format");
      return res.json({ success: false, message: "Invalid date format" });
    }

    if (parsedEndDate <= parsedStartDate) {
      console.log("❌ End date must be after start date");
      return res.json({ success: false, message: "End date must be after start date" });
    }

    // Calculate total days
    const timeDiff = Math.abs(parsedEndDate - parsedStartDate);
    const totalDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    const totalAmount = totalDays * parseFloat(pricePerDay) * quantity;

    console.log("📊 Calculations:");
    console.log("- Total days:", totalDays);
    console.log("- Price per day:", pricePerDay);
    console.log("- Quantity:", quantity);
    console.log("- Total amount:", totalAmount);

    // Create booking
    console.log("📝 Creating booking...");

    // Determine payment status
    let paymentStatus = "pending";
    let bookingStatus = "confirmed";

    if (paymentMethod === "cod") {
      paymentStatus = "pending";
      bookingStatus = "confirmed";
    } else {
      paymentStatus = "pending";
      bookingStatus = "pending"; // Non-COD bookings should be pending until payment
    }

    const booking = new Booking({
      patientId: patient._id,
      patientName: patientName || patient.name,
      equipmentId: equipment._id,
      equipmentName: equipmentName || equipment.equipmentName,
      providerId: provider._id,
      providerName: providerName || provider.name,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      totalDays,
      pricePerDay: parseFloat(pricePerDay),
      quantity: quantity,
      totalAmount,
      deliveryAddress,
      contactPhone,
      notes: notes || "",
      status: bookingStatus,
      paymentStatus: paymentStatus,
      paymentMethod: paymentMethod
    });

    console.log("📋 Booking document created:", {
      patient: booking.patientName,
      equipment: booking.equipmentName,
      provider: booking.providerName,
      quantity: booking.quantity,
      amount: booking.totalAmount,
      days: booking.totalDays,
      paymentStatus: booking.paymentStatus,
      paymentMethod: booking.paymentMethod,
      status: booking.status
    });

    // Save booking
    await booking.save();

    // Create a pending transaction
    const Transaction = (await import("./models/Transaction.js")).default;

    const transaction = new Transaction({
      referenceId: booking._id.toString(),
      referenceType: "booking",
      fromUser: patient._id,
      toUser: provider._id,
      amount: totalAmount,
      paymentMethod: paymentMethod,
      paymentMethodDetails: paymentMethodDetails,
      status: "pending",
      notes: `Booking for ${quantity} unit(s) of ${equipment.equipmentName}`,
      metadata: {
        quantity: quantity,
        equipmentId: equipment._id,
        days: totalDays,
        pricePerDay: pricePerDay,
        stockReduced: stockReduced // Track if stock was already reduced
      }
    });

    await transaction.save();

    console.log("✅ Booking created!");
    console.log("💳 Transaction ID:", transaction._id);

    // Determine if we need to send to payment screen
    let requiresPayment = true;
    let message = `Booking created. Please complete payment for ${quantity} unit(s)`;

    if (paymentMethod === "cod") {
      requiresPayment = false;
      message = `COD booking confirmed successfully for ${quantity} unit(s). Equipment reserved.`;
      console.log("✅ COD booking created - stock already reduced:", stockReduced);
    }

    // Return response
    return res.json({
      success: true,
      message: message,
      requiresPayment: requiresPayment,
      bookingId: booking._id,
      transactionId: transaction._id,
      amount: totalAmount,
      payment: {
        status: "pending",
        method: paymentMethod,
        transactionId: transaction._id
      },
      booking: {
        _id: booking._id,
        patientName: booking.patientName,
        equipmentName: booking.equipmentName,
        providerName: booking.providerName,
        quantity: booking.quantity,
        totalAmount: booking.totalAmount,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        startDate: booking.startDate,
        endDate: booking.endDate
      },
      stockInfo: {
        reduced: stockReduced,
        message: stockReduced ? `Stock reduced by ${quantity}` : "Stock will be reduced after payment"
      }
    });
  } catch (err) {
    console.error("❌ CRITICAL ERROR:", err);
    console.error("❌ Error stack:", err.stack);
    return res.json({
      success: false,
      message: "Server error: " + err.message
    });
  }
});
// Get patient bookings
// Get single booking by ID
app.get("/booking/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    console.log("🔍 Fetching single booking:", bookingId);

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "equipmentId",
        select: "equipmentName imageUrl isAvailable stock",
        model: "Equipment"
      })
      .populate("providerId", "name agencyName");

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    console.log("✅ Found booking:", booking._id);
    return res.json({ success: true, booking });
  } catch (err) {
    console.error("❌ Error fetching booking:", err);
    return res.json({ success: false, message: "Failed to fetch booking" });
  }
});

// Get patient bookings - DON'T filter by equipment availability
app.get("/booking/patient/:patientId", async (req, res) => {
  try {
    console.log("🔍 Fetching bookings for patient:", req.params.patientId);

    const bookings = await Booking.find({ patientId: req.params.patientId })
      .sort({ createdAt: -1 })
      .populate({
        path: "equipmentId",
        select: "equipmentName imageUrl isAvailable stock", // Include isAvailable and stock
        model: "Equipment"
      })
      .populate("providerId", "name agencyName");

    console.log(`✅ Found ${bookings.length} bookings for patient`);

    // Log equipment status for debugging
    bookings.forEach(booking => {
      if (booking.equipmentId) {
        console.log(`📦 Booking ${booking._id}: ${booking.equipmentId.equipmentName} - Available: ${booking.equipmentId.isAvailable}, Stock: ${booking.equipmentId.stock}`);
      }
    });

    return res.json({ success: true, bookings });
  } catch (err) {
    console.error("❌ Error fetching patient bookings:", err);
    return res.json({ success: false, message: "Failed to fetch bookings" });
  }
});

// Get provider bookings
app.get("/booking/provider/:providerId", async (req, res) => {
  try {
    const bookings = await Booking.find({ providerId: req.params.providerId })
      .sort({ createdAt: -1 })
      .populate("equipmentId", "equipmentName imageUrl")
      .populate("patientId", "name email");

    return res.json({ success: true, bookings });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Failed to fetch bookings" });
  }
});

// Update booking status
app.put("/booking/update-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "in-progress", "completed", "cancelled"].includes(status))
      return res.json({ success: false, message: "Invalid status" });

    const booking = await Booking.findById(id);
    if (!booking) return res.json({ success: false, message: "Booking not found" });

    // If cancelling, return equipment to stock
    if (status === "cancelled" && booking.status !== "cancelled") {
      const equipment = await Equipment.findById(booking.equipmentId);
      if (equipment) {
        equipment.stock += 1;
        if (!equipment.isAvailable) equipment.isAvailable = true;
        await equipment.save();
      }
    }

    booking.status = status;
    await booking.save();

    return res.json({ success: true, message: "Booking status updated", booking });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Failed to update booking" });
  }
});

// Confirm COD booking - sets status to confirmed with pending payment
app.put("/booking/confirm-cod/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📦 Confirming COD booking:", id);

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    // Update booking for COD
    booking.paymentMethod = "cod";
    booking.status = "confirmed";
    booking.paymentStatus = "pending"; // Payment pending until delivery
    await booking.save();

    // Reduce stock for COD booking if not already reduced
    const equipment = await Equipment.findById(booking.equipmentId);
    if (equipment) {
      // Check if stock was already reduced
      const Transaction = (await import("./models/Transaction.js")).default;
      const existingTransaction = await Transaction.findOne({
        referenceId: booking._id.toString(),
        referenceType: "booking"
      });

      if (!existingTransaction?.metadata?.stockReduced) {
        console.log(`📊 Reducing stock for COD: ${equipment.stock} - ${booking.quantity}`);
        equipment.stock -= booking.quantity;
        equipment.isAvailable = equipment.stock > 0;
        await equipment.save();
        console.log(`✅ Stock reduced. New stock: ${equipment.stock}`);

        // Update or create transaction with stockReduced flag
        if (existingTransaction) {
          existingTransaction.metadata = {
            ...existingTransaction.metadata,
            stockReduced: true
          };
          existingTransaction.paymentMethod = "cod";
          await existingTransaction.save();
        }
      }
    }

    console.log("✅ COD booking confirmed:", id);
    return res.json({
      success: true,
      message: "COD booking confirmed successfully",
      booking: {
        _id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod
      }
    });
  } catch (err) {
    console.error("❌ Error confirming COD booking:", err);
    return res.json({ success: false, message: "Failed to confirm COD booking" });
  }
});

// Update payment status - for provider to mark COD as paid after delivery
app.put("/booking/update-payment-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    console.log("💳 Updating payment status:", id, "to", paymentStatus);

    if (!["pending", "paid", "refunded"].includes(paymentStatus)) {
      return res.json({ success: false, message: "Invalid payment status" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    // Update payment status
    booking.paymentStatus = paymentStatus;
    await booking.save();

    // Update related transaction
    const Transaction = (await import("./models/Transaction.js")).default;
    await Transaction.updateOne(
      { referenceId: booking._id.toString(), referenceType: "booking" },
      { $set: { status: paymentStatus === "paid" ? "completed" : paymentStatus } }
    );

    console.log("✅ Payment status updated:", paymentStatus);
    return res.json({
      success: true,
      message: `Payment marked as ${paymentStatus}`,
      booking: {
        _id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod
      }
    });
  } catch (err) {
    console.error("❌ Error updating payment status:", err);
    return res.json({ success: false, message: "Failed to update payment status" });
  }
});

// Update booking cancellation with refund logic
app.put("/booking/cancel/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, cancelledBy } = req.body;

    const Booking = (await import("./models/Booking.js")).default;
    const Equipment = (await import("./models/Equipment.js")).default;
    const Transaction = (await import("./models/Transaction.js")).default;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    // Find transaction for refund
    const transaction = await Transaction.findOne({
      referenceId: booking._id.toString(),
      referenceType: "booking",
      status: "completed"
    });

    // Update booking
    booking.status = "cancelled";
    booking.cancelledBy = cancelledBy || "";
    booking.cancellationReason = reason || "";

    // If payment was made, update payment status
    if (booking.paymentStatus === "paid") {
      booking.paymentStatus = "refunded";

      // Create refund transaction if original payment exists
      if (transaction) {
        const refundTransaction = new Transaction({
          referenceId: booking._id.toString(),
          referenceType: "booking",
          fromUser: booking.providerId, // Provider refunds to patient
          toUser: booking.patientId,
          amount: booking.totalAmount,
          paymentMethod: "refund",
          status: "completed",
          notes: `Refund for cancelled booking: ${reason || "No reason provided"}`,
          metadata: {
            originalTransactionId: transaction._id,
            bookingId: booking._id,
            cancellationReason: reason
          }
        });
        await refundTransaction.save();
        console.log("💰 Refund transaction created:", refundTransaction._id);
      }
    }

    await booking.save();

    // Return equipment to stock
    const equipment = await Equipment.findById(booking.equipmentId);
    if (equipment) {
      equipment.stock += booking.quantity;
      equipment.isAvailable = equipment.stock > 0;
      await equipment.save();
      console.log(`📦 Stock returned: +${booking.quantity}. New stock: ${equipment.stock}`);
    }

    return res.json({
      success: true,
      message: "Booking cancelled successfully",
      booking: booking,
      refundIssued: transaction ? true : false
    });
  } catch (err) {
    console.error("❌ Error cancelling booking:", err);
    return res.json({ success: false, message: "Failed to cancel booking" });
  }
});


// ========== FIXED PAYMENT ROUTES ==========

// UPDATED: Process payment with proper transaction handling
app.post("/payment/process", async (req, res) => {
  try {
    console.log("💳 ========== PAYMENT PROCESS REQUEST ==========");
    const {
      bookingId,
      bookingIds,      // NEW: Array of all booking IDs for multi-item orders
      paymentMethod,
      simulate = "success",
      paymentDetails = {}
    } = req.body;

    // FIX: Use bookingIds array if provided, otherwise use single bookingId
    const allBookingIds = bookingIds && bookingIds.length > 0
      ? bookingIds
      : [bookingId];

    console.log("Payment details:", {
      bookingId,
      bookingIds: allBookingIds,
      totalBookings: allBookingIds.length,
      paymentMethod,
      simulate,
      paymentDetails
    });

    console.log("🔥🔥🔥 MULTI-ITEM FIX ACTIVE 🔥🔥🔥");
    console.log("🔥🔥🔥 Received bookingIds from frontend:", bookingIds);
    console.log("🔥🔥🔥 allBookingIds to process:", allBookingIds);
    console.log("🔥🔥🔥 Total bookings to update:", allBookingIds.length);

    // Import models
    const Transaction = (await import("./models/Transaction.js")).default;
    const Booking = (await import("./models/Booking.js")).default;
    const Equipment = (await import("./models/Equipment.js")).default;


    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log("❌ Booking not found:", bookingId);
      return res.json({
        success: false,
        message: "Booking not found"
      });
    }

    console.log("🔍 Booking found:", {
      bookingId: booking._id,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      quantity: booking.quantity
    });

    // If it's already COD, just confirm
    if (booking.paymentMethod === 'cod') {
      console.log("💰 COD booking detected - stock already reduced");

      let transaction = await Transaction.findOne({
        referenceId: bookingId,
        referenceType: "booking"
      });

      if (!transaction) {
        transaction = new Transaction({
          referenceId: bookingId,
          referenceType: "booking",
          fromUser: booking.patientId,
          toUser: booking.providerId,
          amount: booking.totalAmount,
          paymentMethod: 'cod',
          status: "completed",
          notes: `COD payment for booking ${bookingId}`,
          metadata: {
            equipmentId: booking.equipmentId,
            quantity: booking.quantity,
            days: booking.totalDays
          }
        });
        await transaction.save();
      }

      return res.json({
        success: true,
        message: "COD booking confirmed - payment will be collected on delivery",
        isCOD: true,
        transaction: {
          _id: transaction._id,
          id: transaction._id,
          referenceId: transaction.referenceId,
          referenceType: transaction.referenceType,
          status: "completed",
          transactionId: transaction.transactionId,
          amount: transaction.amount,
          paymentMethod: 'cod',
          createdAt: transaction.createdAt
        },
        booking: {
          id: booking._id,
          paymentStatus: booking.paymentStatus,
          status: booking.status,
          paymentMethod: 'cod'
        }
      });
    }

    // Find or create transaction
    let transaction = await Transaction.findOne({
      referenceId: bookingId,
      referenceType: "booking",
      fromUser: booking.patientId,
      toUser: booking.providerId
    });

    if (!transaction) {
      transaction = new Transaction({
        referenceId: bookingId,
        referenceType: "booking",
        fromUser: booking.patientId,
        toUser: booking.providerId,
        amount: booking.totalAmount,
        paymentMethod: paymentMethod,
        paymentMethodDetails: paymentDetails,
        status: "pending",
        notes: `Payment for booking ${bookingId}`,
        metadata: {
          equipmentId: booking.equipmentId,
          quantity: booking.quantity,
          days: booking.totalDays,
          stockReduced: false // Track if stock was reduced
        }
      });
      console.log("✅ Created new transaction");
    }

    // Mock payment simulation
    let paymentResult;
    const mockTransactionId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    switch (simulate.toLowerCase()) {
      case "success":
        paymentResult = {
          success: true,
          transactionId: mockTransactionId,
          message: "Payment successful",
          status: "completed"
        };
        break;
      case "failed":
        paymentResult = {
          success: false,
          transactionId: "",
          message: "Payment failed. Insufficient funds.",
          status: "failed"
        };
        break;
      case "pending":
        paymentResult = {
          success: true,
          transactionId: mockTransactionId,
          message: "Payment initiated. Status pending.",
          status: "pending"
        };
        break;
      default:
        paymentResult = {
          success: true,
          transactionId: mockTransactionId,
          message: "Payment successful",
          status: "completed"
        };
    }

    console.log(`🔄 Payment simulation: ${paymentResult.status}`);

    // Update transaction
    transaction.status = paymentResult.status;
    transaction.transactionId = paymentResult.transactionId;
    transaction.paymentMethod = paymentMethod;
    transaction.paymentMethodDetails = paymentDetails;

    // 🔥 CRITICAL FIX 1: Only reduce stock if payment is COMPLETED
    // 🔥 CRITICAL FIX 2: Only reduce ONCE (check metadata)
    if (paymentResult.success && paymentResult.status === "completed") {
      console.log("✅ Payment successful - updating booking and reducing stock");

      // Update the primary booking
      booking.paymentStatus = "paid";
      booking.paymentMethod = paymentMethod;
      booking.status = "confirmed";
      await booking.save();

      // 🔥 FIX FOR MULTI-ITEM ORDERS: Update ALL other bookings in the same order
      if (allBookingIds.length > 1) {
        console.log(`📦 Updating ${allBookingIds.length - 1} additional bookings for multi-item order...`);

        for (const otherBookingId of allBookingIds) {
          // Skip the primary booking (already updated above)
          if (otherBookingId.toString() === bookingId.toString()) continue;

          try {
            const otherBooking = await Booking.findById(otherBookingId);
            if (otherBooking) {
              console.log(`📝 Updating booking ${otherBookingId} for item: ${otherBooking.equipmentName}`);

              otherBooking.paymentStatus = "paid";
              otherBooking.paymentMethod = paymentMethod;
              otherBooking.status = "confirmed";
              await otherBooking.save();

              // Reduce stock for this booking's equipment too
              const otherEquipment = await Equipment.findById(otherBooking.equipmentId);
              if (otherEquipment) {
                console.log(`📊 Reducing stock for ${otherEquipment.equipmentName}: ${otherEquipment.stock} - ${otherBooking.quantity}`);
                otherEquipment.stock -= otherBooking.quantity;
                otherEquipment.isAvailable = otherEquipment.stock > 0;
                await otherEquipment.save();
                console.log(`✅ Stock updated for ${otherEquipment.equipmentName}. New stock: ${otherEquipment.stock}`);
              }

              // Create transaction for this booking if doesn't exist
              const existingTransaction = await Transaction.findOne({
                referenceId: otherBookingId.toString(),
                referenceType: "booking"
              });

              if (!existingTransaction) {
                const newTransaction = new Transaction({
                  referenceId: otherBookingId.toString(),
                  referenceType: "booking",
                  fromUser: otherBooking.patientId,
                  toUser: otherBooking.providerId,
                  amount: otherBooking.totalAmount,
                  paymentMethod: paymentMethod,
                  status: "completed",
                  transactionId: `${paymentResult.transactionId}_${otherBookingId}`,
                  notes: `Payment for booking ${otherBookingId} (part of multi-item order)`,
                  metadata: {
                    equipmentId: otherBooking.equipmentId,
                    quantity: otherBooking.quantity,
                    stockReduced: true,
                    parentBookingId: bookingId
                  }
                });
                await newTransaction.save();
                console.log(`✅ Transaction created for booking ${otherBookingId}`);
              } else {
                // Update existing transaction
                existingTransaction.status = "completed";
                existingTransaction.transactionId = `${paymentResult.transactionId}_${otherBookingId}`;
                existingTransaction.metadata = {
                  ...existingTransaction.metadata,
                  stockReduced: true
                };
                await existingTransaction.save();
                console.log(`✅ Transaction updated for booking ${otherBookingId}`);
              }
            }
          } catch (otherBookingError) {
            console.error(`❌ Error updating booking ${otherBookingId}:`, otherBookingError);
            // Continue with other bookings even if one fails
          }
        }
        console.log(`✅ All ${allBookingIds.length} bookings updated successfully!`);
      }

      // Check if stock was already reduced for PRIMARY booking (shouldn't be for non-COD)
      const stockAlreadyReduced = transaction.metadata?.stockReduced === true;

      if (!stockAlreadyReduced) {
        // Reduce equipment stock for PRIMARY booking
        const equipment = await Equipment.findById(booking.equipmentId);
        if (equipment) {
          console.log(`📦 Reducing stock for primary booking ${bookingId}`);
          console.log(`📊 Current stock: ${equipment.stock}, Reducing: ${booking.quantity}`);

          // 🔥 FIX 3: Use booking.quantity (not quantity variable which might be undefined)
          equipment.stock -= booking.quantity;
          equipment.isAvailable = equipment.stock > 0;
          await equipment.save();

          // Update transaction metadata
          transaction.metadata.stockReduced = true;

          console.log(`✅ Stock reduced by ${booking.quantity}. New stock: ${equipment.stock}`);
        }
      } else {
        console.log("⚠️ Stock was already reduced for this transaction");
      }
    }
    // 🔥 CRITICAL FIX 3: If payment failed, DO NOT reduce stock
    else if (paymentResult.status === "failed") {
      console.log("❌ Payment failed - NOT reducing stock");
      booking.paymentStatus = "failed";
      await booking.save();

      // Optionally, you might want to cancel the booking if payment fails
      // booking.status = "cancelled";
      // await booking.save();
    }
    // If payment is pending, just update status
    else if (paymentResult.status === "pending") {
      console.log("⏳ Payment pending - stock not reduced yet");
      booking.paymentStatus = "pending";
      await booking.save();
    }

    // Save transaction
    await transaction.save();

    console.log(`✅ Payment processed. Status: ${transaction.status}`);

    return res.json({
      success: paymentResult.success,
      message: paymentResult.message,
      transaction: {
        _id: transaction._id,
        id: transaction._id,
        referenceId: transaction.referenceId,
        referenceType: transaction.referenceType,
        status: transaction.status,
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt
      },
      booking: {
        id: booking._id,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        quantity: booking.quantity
      },
      stockInfo: {
        reduced: transaction.metadata?.stockReduced || false,
        quantity: booking.quantity
      }
    });

  } catch (err) {
    console.error("❌ Payment processing error:", err);
    return res.json({
      success: false,
      message: "Payment processing failed: " + err.message
    });
  }
});

// UPDATED: Equipment listing fee payment
app.post("/payment/listing-fee", async (req, res) => {
  try {
    console.log("💰 ========== LISTING FEE PAYMENT ==========");
    const {
      equipmentId,
      providerId,
      paymentMethod,
      simulate = "success",
      paymentDetails = {}
    } = req.body;

    console.log("Listing fee payment:", {
      equipmentId,
      providerId,
      paymentMethod,
      simulate
    });

    // Import models
    const Equipment = (await import("./models/Equipment.js")).default;
    const User = (await import("./models/User.js")).default;
    const Transaction = (await import("./models/Transaction.js")).default;

    // Find equipment
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.json({
        success: false,
        message: "Equipment not found"
      });
    }

    // Check if listing fee already paid
    if (equipment.listingFeePaid) {
      return res.json({
        success: false,
        message: "Listing fee already paid"
      });
    }

    // Calculate 5% listing fee
    const listingFee = equipment.pricePerDay * 0.05;

    // Find admin user
    const admin = await User.findOne({ userType: "admin" });
    if (!admin) {
      // Fallback to any admin email
      const admin = await User.findOne({ email: "admin@gmail.com" }) ||
        await User.findOne({ userType: "admin" });
    }

    // Create transaction
    const transaction = new Transaction({
      referenceId: equipment._id.toString(),
      referenceType: "listing_fee",
      fromUser: providerId,
      toUser: admin ? admin._id : providerId, // Fallback if no admin
      amount: listingFee,
      paymentMethod: paymentMethod,
      paymentMethodDetails: paymentDetails,
      status: "pending",
      notes: `5% listing fee for ${equipment.equipmentName}`,
      metadata: {
        equipmentId: equipment._id,
        equipmentName: equipment.equipmentName,
        pricePerDay: equipment.pricePerDay,
        feePercentage: 5
      }
    });

    await transaction.save();

    // Mock payment simulation
    let paymentResult;
    const mockTransactionId = `mock_listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    switch (simulate.toLowerCase()) {
      case "success":
        paymentResult = {
          success: true,
          transactionId: mockTransactionId,
          message: "Listing fee payment successful",
          status: "completed"
        };
        break;
      case "failed":
        paymentResult = {
          success: false,
          transactionId: "",
          message: "Payment failed. Please try again.",
          status: "failed"
        };
        break;
      case "pending":
        paymentResult = {
          success: true,
          transactionId: mockTransactionId,
          message: "Payment initiated. Please wait for confirmation.",
          status: "pending"
        };
        break;
      default:
        paymentResult = {
          success: true,
          transactionId: mockTransactionId,
          message: "Listing fee payment successful",
          status: "completed"
        };
    }

    // Update transaction
    transaction.status = paymentResult.status;
    transaction.transactionId = paymentResult.transactionId;
    await transaction.save();

    // If payment successful, update equipment
    if (paymentResult.success && paymentResult.status === "completed") {
      equipment.listingFeePaid = true;
      equipment.listingFeeAmount = listingFee;
      equipment.isListed = true;
      equipment.adminApproved = true;
      equipment.isAvailable = equipment.stock > 0; // Make available if stock > 0
      await equipment.save();

      console.log(`✅ Equipment ${equipment.equipmentName} listed successfully`);
    }

    return res.json({
      success: paymentResult.success,
      message: paymentResult.message,
      transaction: {
        _id: transaction._id,
        id: transaction._id,
        status: transaction.status,
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        paymentMethod: transaction.paymentMethod,
        createdAt: transaction.createdAt
      },
      equipment: {
        id: equipment._id,
        name: equipment.equipmentName,
        listingFeePaid: equipment.listingFeePaid,
        isListed: equipment.isListed
      }
    });

  } catch (err) {
    console.error("❌ Listing fee payment error:", err);
    return res.json({
      success: false,
      message: "Listing fee payment failed: " + err.message
    });
  }
});


// ========== PROFILE ROUTES ==========
// Complete patient profile
app.post("/api/patient/complete-profile", async (req, res) => {
  try {
    const { email, fullName, age, gender, phoneNumber, city, primaryCondition } = req.body;

    if (!email || !fullName || !age || !phoneNumber || !city || !primaryCondition)
      return res.json({ success: false, message: "All fields are required" });

    const user = await User.findOneAndUpdate(
      { email },
      {
        name: fullName,
        phoneNumber,
        city,
        age: parseInt(age),
        gender,
        profileCompleted: true
      },
      { new: true }
    );

    if (!user) return res.json({ success: false, message: "User not found" });

    return res.json({ success: true, message: "Profile completed successfully" });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Server error" });
  }
});

// Complete service provider profile
app.post("/api/service-provider/complete-profile", async (req, res) => {
  try {
    const { email, agencyName, serviceType, phoneNumber, city, licenseNumber } = req.body;

    if (!email || !agencyName || !phoneNumber || !city)
      return res.json({ success: false, message: "All fields are required" });

    const user = await User.findOneAndUpdate(
      { email },
      {
        agencyName,
        serviceType,
        phoneNumber,
        city,
        licenseNumber,
        profileCompleted: true,
        providerVerification: {
          status: "pending",
          verifiedBy: null,
          verifiedAt: null,
          rejectionReason: ""
        }
      },
      { new: true }
    );

    if (!user) return res.json({ success: false, message: "User not found" });

    return res.json({ success: true, message: "Profile submitted for admin approval" });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Server error" });
  }
});

// Get patient profile
app.get("/api/patient/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password -otp -otpExpiry");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.userType !== "patient") {
      return res.json({ success: false, message: "User is not a patient" });
    }

    return res.json({
      success: true,
      profile: {
        name: user.name || "",
        email: user.email || "",
        age: user.age || "",
        gender: user.gender || "",
        phoneNumber: user.phoneNumber || "",
        city: user.city || "",
        primaryCondition: user.primaryCondition || "",
        profileCompleted: user.profileCompleted || false,
      }
    });
  } catch (err) {
    console.error("Error fetching patient profile:", err);
    return res.json({ success: false, message: "Server error" });
  }
});

// Update patient profile
app.put("/api/patient/update-profile", async (req, res) => {
  try {
    const { userId, fullName, age, gender, phoneNumber, city, primaryCondition } = req.body;

    if (!userId) {
      return res.json({ success: false, message: "User ID is required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (user.userType !== "patient") {
      return res.json({ success: false, message: "User is not a patient" });
    }

    // Update fields
    if (fullName) user.name = fullName;
    if (age) user.age = parseInt(age);
    if (gender) user.gender = gender;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (city) user.city = city;
    if (primaryCondition) user.primaryCondition = primaryCondition;

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        phoneNumber: user.phoneNumber,
        city: user.city,
        primaryCondition: user.primaryCondition,
      }
    });
  } catch (err) {
    console.error("Error updating patient profile:", err);
    return res.json({ success: false, message: "Server error" });
  }
});

// ========== ADMIN ROUTES ==========
app.post("/admin/login", async (req, res) => {
  const { secretKey, email, password } = req.body;

  if (secretKey !== "POSTJOURNEY2024")
    return res.json({ success: false, message: "Invalid Secret Key" });

  const admin = await User.findOne({ email, userType: "admin" });
  if (!admin) return res.json({ success: false, message: "Admin not found" });

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return res.json({ success: false, message: "Wrong password" });

  res.json({ success: true, message: "Admin Login Successful" });
});

// Get all users for admin
app.get("/admin/users", async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch {
    res.json({ success: false, message: "Failed to fetch users" });
  }
});

// Get all patients for admin
app.get("/admin/patients", async (req, res) => {
  try {
    const users = await User.find({ userType: "patient" }, { password: 0 }).sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error("Error fetching patients:", err);
    res.json({ success: false, message: "Failed to fetch patients" });
  }
});

// Get all service providers for admin
app.get("/admin/providers", async (req, res) => {
  try {
    const users = await User.find({ userType: "service-provider" }, { password: 0 }).sort({ createdAt: -1 });
    // Also check for "service provider" with space for backwards compatibility
    const usersWithSpace = await User.find({ userType: "service provider" }, { password: 0 }).sort({ createdAt: -1 });
    const allProviders = [...users, ...usersWithSpace];
    res.json({ success: true, users: allProviders });
  } catch (err) {
    console.error("Error fetching providers:", err);
    res.json({ success: false, message: "Failed to fetch providers" });
  }
});

// Verify/Reject provider (PATCH endpoint for mobile app)
app.patch("/admin/providers/:id/verify", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, deleteAccount } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.json({ success: false, message: "Invalid status" });
    }

    // If deleteAccount is true and status is rejected, delete the user
    if (deleteAccount && status === "rejected") {
      await User.findByIdAndDelete(id);
      return res.json({ success: true, message: "Provider rejected and account deleted" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.json({ success: false, message: "Provider not found" });
    }

    user.providerVerification = {
      status: status,
      verifiedAt: new Date(),
      rejectionReason: rejectionReason || "",
    };

    await user.save();

    res.json({
      success: true,
      message: status === "approved" ? "Provider approved successfully" : "Provider rejected",
      user
    });
  } catch (err) {
    console.error("Error updating provider status:", err);
    res.json({ success: false, message: "Failed to update provider status" });
  }
});

// Block/Unblock user
app.patch("/admin/users/:id/block", async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { isBlocked: isBlocked },
      { new: true }
    );

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: isBlocked ? "User blocked successfully" : "User unblocked successfully",
      user
    });
  } catch (err) {
    console.error("Error updating user block status:", err);
    res.json({ success: false, message: "Failed to update user status" });
  }
});

// Delete user (for admin)
app.delete("/admin/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully"
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.json({ success: false, message: "Failed to delete user" });
  }
});

// Get user details with related data (for admin)
app.get("/admin/users/:id/details", async (req, res) => {
  try {
    const { id } = req.params;

    // Get user profile
    const user = await User.findById(id).select("-password -otp -otpExpiry");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    let relatedData = {};

    if (user.userType === "patient") {
      // For patients: Get their booking/purchase history
      const bookings = await Booking.find({ patientId: id })
        .sort({ createdAt: -1 });

      relatedData = {
        bookings: bookings,
        totalBookings: bookings.length,
        totalSpent: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      };
    } else if (user.userType === "service-provider" || user.userType === "service provider") {
      // For providers: Get their equipment and sales
      const equipment = await Equipment.find({ providerId: id })
        .sort({ createdAt: -1 });

      const bookings = await Booking.find({ providerId: id })
        .sort({ createdAt: -1 });

      relatedData = {
        equipment: equipment,
        totalEquipment: equipment.length,
        sales: bookings,
        totalSales: bookings.length,
        totalEarnings: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
      };
    }

    res.json({
      success: true,
      user: user,
      relatedData: relatedData
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.json({ success: false, message: "Failed to fetch user details" });
  }
});

// Update user verification status
app.put("/admin/verify-provider/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(status))
      return res.json({ success: false, message: "Invalid status" });

    const user = await User.findById(userId);
    if (!user || user.userType !== "service provider")
      return res.json({ success: false, message: "Service provider not found" });

    user.providerVerification = {
      status,
      verifiedBy: req.body.adminId,
      verifiedAt: new Date(),
      rejectionReason: status === "rejected" ? rejectionReason : ""
    };

    await user.save();
    return res.json({ success: true, message: `Provider ${status} successfully` });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Failed to update verification" });
  }
});

// Block/Unblock user
app.put("/admin/block/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.json({ success: false, message: "User not found" });

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({ success: true, isBlocked: user.isBlocked });
  } catch {
    res.json({ success: false, message: "Failed to update user" });
  }
});

// Get all bookings for admin
app.get("/admin/bookings", async (req, res) => {
  try {
    const bookings = await Booking.find()
      .sort({ createdAt: -1 })
      .populate("patientId", "name email")
      .populate("providerId", "name agencyName")
      .populate("equipmentId", "equipmentName");

    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
});

// ========== TEST ROUTE ==========
app.get("/", (req, res) => {
  res.json({
    message: "Medical Equipment Marketplace API",
    status: "Running",
    endpoints: {
      auth: ["POST /register", "POST /verify-otp", "POST /login"],
      equipment: ["GET /equipment/all", "GET /equipment/provider/:id", "POST /equipment/add"],
      booking: ["POST /booking/create", "GET /booking/patient/:id", "GET /booking/provider/:id"],
      admin: ["POST /admin/login", "GET /admin/users", "PUT /admin/verify-provider/:id"]
    }
  });
});

// ========== REVIEW ROUTES ==========

// Get reviews for equipment
app.get("/equipment/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Fetching reviews for equipment ID:", id);

    const equipment = await Equipment.findById(id).select("reviews averageRating totalReviews");

    if (!equipment) {
      console.log("❌ Equipment not found for ID:", id);
      return res.json({ success: false, message: "Equipment not found" });
    }

    console.log("✅ Found equipment:", equipment.equipmentName);
    console.log("📝 Number of reviews:", equipment.reviews?.length || 0);

    return res.json({
      success: true,
      reviews: equipment.reviews || [],
      averageRating: equipment.averageRating || 0,
      totalReviews: equipment.totalReviews || 0
    });

  } catch (err) {
    console.error("❌ Fetch reviews error:", err);
    return res.json({ success: false, message: "Failed to fetch reviews" });
  }
});

// Submit a review
app.post("/equipment/:id/review", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, rating, comment } = req.body;

    console.log("📝 New review submission for equipment:", id);
    console.log("👤 User:", userName, "Rating:", rating);

    if (!userId || !userName || !rating) {
      return res.json({
        success: false,
        message: "User ID, name, and rating are required"
      });
    }

    if (rating < 1 || rating > 5) {
      return res.json({
        success: false,
        message: "Rating must be between 1 and 5"
      });
    }

    // Check if user has booked this equipment before
    const hasBooked = await Booking.findOne({
      patientId: userId,
      equipmentId: id,
      status: "completed"
    });

    if (!hasBooked) {
      console.log("❌ User hasn't completed a booking for this equipment");
      return res.json({
        success: false,
        message: "You must complete a booking before reviewing"
      });
    }

    // Check if user already reviewed
    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.json({ success: false, message: "Equipment not found" });
    }

    const existingReview = equipment.reviews.find(review =>
      review.userId.toString() === userId
    );

    if (existingReview) {
      console.log("❌ User already reviewed this equipment");
      return res.json({
        success: false,
        message: "You have already reviewed this equipment"
      });
    }

    // Add new review
    const newReview = {
      userId,
      userName,
      rating: parseInt(rating),
      comment: comment || "",
      date: new Date()
    };

    equipment.reviews.push(newReview);
    await equipment.save();

    console.log("✅ Review submitted successfully");
    console.log("📊 New average rating:", equipment.averageRating);
    console.log("🔢 Total reviews:", equipment.totalReviews);

    return res.json({
      success: true,
      message: "Review submitted successfully",
      averageRating: equipment.averageRating,
      totalReviews: equipment.totalReviews
    });

  } catch (err) {
    console.error("❌ Review submission error:", err);
    return res.json({ success: false, message: "Failed to submit review" });
  }
});


// Check if user can review
app.get("/equipment/:id/can-review/:userId", async (req, res) => {
  try {
    const { id, userId } = req.params;
    console.log("🔍 Checking review eligibility for user:", userId, "equipment:", id);

    // Check if user has completed a booking
    const hasBooked = await Booking.findOne({
      patientId: userId,
      equipmentId: id,
      status: "completed"
    });

    console.log("📋 Has booked:", !!hasBooked);

    // Check if user already reviewed
    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.json({ success: false, message: "Equipment not found" });
    }

    const hasReviewed = equipment.reviews?.some(review =>
      review.userId.toString() === userId
    ) || false;

    console.log("📝 Has reviewed:", hasReviewed);
    console.log("✅ Can review:", !!hasBooked && !hasReviewed);

    return res.json({
      success: true,
      canReview: !!hasBooked && !hasReviewed,
      hasBooked: !!hasBooked,
      hasReviewed
    });

  } catch (err) {
    console.error("❌ Check review eligibility error:", err);
    return res.json({ success: false, message: "Failed to check review eligibility" });
  }
});

// Add this right after your review routes (around line 700)
app.get("/test-reviews", (req, res) => {
  console.log("✅ Test reviews route hit!");
  res.json({ success: true, message: "Test route works!", timestamp: new Date() });
});

// ========== CAREGIVER ROUTES ==========

// Submit a review for a caregiver
app.post("/api/caregiver/:id/review", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, rating, comment } = req.body;

    if (!userId || !userName || !rating) {
      return res.json({ success: false, message: "User ID, name, and rating are required" });
    }
    if (rating < 1 || rating > 5) {
      return res.json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const caregiver = await User.findById(id);
    if (!caregiver) {
      return res.json({ success: false, message: "Caregiver not found" });
    }

    // Initialize reviews array if not present
    if (!caregiver.caregiverReviews) {
      caregiver.caregiverReviews = [];
    }

    // Check if user already reviewed
    const existing = caregiver.caregiverReviews.find(
      (r) => r.userId.toString() === userId
    );
    if (existing) {
      return res.json({ success: false, message: "You have already rated this caregiver" });
    }

    caregiver.caregiverReviews.push({
      userId,
      userName,
      rating: parseInt(rating),
      comment: comment || "",
      date: new Date(),
    });

    await caregiver.save();

    // Calculate average
    const reviews = caregiver.caregiverReviews;
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return res.json({
      success: true,
      message: "Review submitted successfully",
      averageRating: parseFloat(avg.toFixed(1)),
      totalReviews: reviews.length,
    });
  } catch (err) {
    console.error("Caregiver review error:", err);
    return res.json({ success: false, message: "Failed to submit review" });
  }
});

// Get reviews for a caregiver
app.get("/api/caregiver/:id/reviews", async (req, res) => {
  try {
    const { id } = req.params;
    const caregiver = await User.findById(id).select("caregiverReviews");
    if (!caregiver) {
      return res.json({ success: false, message: "Caregiver not found" });
    }

    const reviews = caregiver.caregiverReviews || [];
    const avg = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return res.json({
      success: true,
      reviews,
      averageRating: parseFloat(avg.toFixed(1)),
      totalReviews: reviews.length,
    });
  } catch (err) {
    console.error("Fetch caregiver reviews error:", err);
    return res.json({ success: false, message: "Failed to fetch reviews" });
  }
});

// Get all caregiver service providers
app.get("/api/caregivers", async (req, res) => {
  try {
    // Query for both userType formats used in the DB
    const caregivers = await User.find(
      {
        userType: { $in: ["service provider", "service-provider"] },
        serviceType: "caregiver",
        isBlocked: { $ne: true },
        profileCompleted: true,
      },
      { password: 0, otp: 0, otpExpiry: 0 }
    ).sort({ createdAt: -1 });

    return res.json({ success: true, caregivers });
  } catch (err) {
    console.error("Error fetching caregivers:", err);
    return res.json({ success: false, message: "Failed to fetch caregivers" });
  }
});

// ========== ERROR HANDLING ==========
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: "File upload error: " + err.message });
  }
  res.status(500).json({ success: false, message: "Internal server error" });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});
// Test provider endpoint
app.get("/test-provider/:id", async (req, res) => {
  try {
    const provider = await User.findById(req.params.id);
    if (!provider) {
      return res.json({ success: false, message: "Provider not found" });
    }

    res.json({
      success: true,
      provider: {
        id: provider._id,
        name: provider.name,
        email: provider.email,
        userType: provider.userType,
        providerVerification: provider.providerVerification
      }
    });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT} (LAN enabled)`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, "uploads")}`);
});