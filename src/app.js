// server.js or app.js
import express from "express"
import cors from "cors"
import userRoutes from "./routes/user.routes.js"

const app = express()

app.use(cors({
    origin: "http://localhost:5173",   // allow Vite frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true                  // only if you ever need cookies
}))

app.use(express.json())

app.use("/api/users", userRoutes)

export default app
