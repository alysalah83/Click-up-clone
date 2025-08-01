import { generateToken } from "../middlewares/auth.js";
import { User } from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.user;

    const user = await User.findOne({ _id: id }, "name email");
    if (!user) res.status(404).json({ message: "user not found" });

    return res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to get user", error: err.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Id is Required" });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to get user", error: err.message });
  }
};

export const validateToken = async (req, res) => {
  try {
    const { id } = req.user;
    if (id) return res.status(200).json(true);
    else return res.status(400).json(false);
  } catch (err) {
    res.status(500).json({ message: "something went wrong" });
  }
};
