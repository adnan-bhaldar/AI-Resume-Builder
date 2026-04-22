import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import userRouter from "./routes/userRoutes.js";
import resumeRouter from "./routes/resumeRoutes.js";
import aiRouter from "./routes/aiRoutes.js";
import atsRouter from "./routes/atsRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Database Connection
await connectDB()

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>AI Resume Builder • Backend</title>

    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">

    

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: 'Poppins', sans-serif;
      }

      body {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(to right, #ABFF7E, #FDFEFF);
        color: #1f2937;
      }

      .card {
        background: rgba(255,255,255,0.7);
        backdrop-filter: blur(14px);
        border-radius: 20px;
        padding: 50px 40px;
        max-width: 420px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      }

      .status {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #16a34a;
        font-weight: 600;
        margin-bottom: 16px;
      }

      .dot {
        width: 10px;
        height: 10px;
        background: #22c55e;
        border-radius: 50%;
        animation: pulse 1.4s infinite;
      }

      @keyframes pulse {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.6); opacity: 0.5; }
        100% { transform: scale(1); opacity: 1; }
      }

      h1 {
        font-size: 26px;
        margin-bottom: 10px;
      }

      p {
        font-size: 14px;
        color: #4b5563;
      }

      .footer {
        margin-top: 20px;
        font-size: 12px;
        color: #6b7280;
      }
    </style>
  </head>

  <body>
    <div class="card">

      <div class="status">
        <span class="dot"></span>
        Backend Live
      </div>

      <h1>AI Resume Builder</h1>

      <p>
        Your backend server is running and ready to power AI resume generation.
      </p>

      <div class="footer">
        © ${new Date().getFullYear()} • AI Resume Builder
      </div>

    </div>
  </body>
  </html>
  `);
});
app.use('/api/users', userRouter)
app.use('/api/resumes', resumeRouter)
app.use('/api/ai', aiRouter)
app.use('/api/ats', atsRouter)  

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

});