import jwt from "jsonwebtoken";
import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET!;
const payload = { user: "admin" };
const expiresIn = "1h";

const token = jwt.sign(payload, JWT_SECRET, { expiresIn });

console.log("🔐 Token JWT gerado:");
console.log(token);
