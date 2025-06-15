import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json({limit: '10kb'}))
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(express.static("public"));


// Route import
import userRoute from "./routes/user.route.js"

// Route declartion
app.use("./api/v1/users", userRoute)


export { app }