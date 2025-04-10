import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import userRouter from './routes/user'
import paymentRouter from './routes/payments'
import withdrawRouter from './routes/withdrawls'

dotenv.config()



const app = express()
app.use(cors())

app.use(express.json());

app.get("/",(_, res)=>{
    res.send("Hello user");
})

app.use('/api/user',userRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/withdrawls', withdrawRouter);

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});