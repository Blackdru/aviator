
import Razorpay from 'razorpay'
import { Router } from 'express';
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/client';
import crypto from 'crypto'
import { createPaymentSchema } from '../zod/paymentValidator';

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZR_KEY!,
    key_secret: process.env.RAZR_SECRET!,
});

const router = Router()


router.post('/create',  async(req, res) => {
    try {
        const token = req.headers['authorization'];
        if (!token) {
            return res.status(401).send('Unauthorized token'); // Unauthorized
        }
  
        const data = jwt.verify(token, process.env.JWT_SECRET || "secret");
        const { userId }: any = data;
  
        const user = await prisma.user.findUnique({
            where: {
                userId
            }
        });
  
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const isValidPaymentCreation = createPaymentSchema.safeParse(req.body);
        if (!isValidPaymentCreation.success) {
            return res.status(400).json({ message: isValidPaymentCreation.error.message });
        }

        const {amount, paymentType} = isValidPaymentCreation.data
  
        // Razorpay order options
        const options = {
            amount: Math.round(amount * 100), // Convert to paise and ensure it's an integer
            currency: 'INR',
            receipt: `receipt_order_${new Date().getTime()}`, // Dynamic receipt
            payment_capture: 1, // Auto-capture
        };
  
        const order = await razorpayInstance.orders.create(options);
        await prisma.payments.create({
            data: {
                paymentId: order.id,
                userId,
                amount: Number(order.amount),
                currency: order.currency,
                paymentType
            },
        });
  
        return res.status(200).json({ message: 'Payment created', orderId: order.id, amount: order.amount });
    } catch (error) {
        console.error("Razorpay Error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
  });


  router.post('/updateRazr', async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, status } = req.body;
    razorpay_order_id
  
    // If status is failed, no need to verify signature, directly update status
    if (status === 'failed') {
      try {
        const updatedTransaction = await prisma.payments.update({
          where: { paymentId: razorpay_order_id },
          data: {
            paymentStatus: "Failed", // Mark transaction as failed
          },
        });
        return res.status(200).json({ message: 'Transaction marked as failed', transaction: updatedTransaction });
      } catch (error) {
        console.error('Error updating transaction:', error);
        return res.status(500).json({ message: 'Error updating transaction', error });
      }
    }
  
    // Otherwise, verify the successful payment
    const secret = process.env.RAZORPAY_SECRET || 'your_key_secret';
    const generatedSignature = crypto.createHmac('sha256', secret).update(razorpay_order_id + '|' + razorpay_payment_id).digest('hex');
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature. Payment verification failed' });
    }
  
    try {
      const updatedTransaction = await prisma.payments.update({
        where: { paymentId: razorpay_order_id },
        data: {
          paymentStatus: "Success",
        },
      });
  
      res.status(200).json({ message: 'Transaction updated successfully', transaction: updatedTransaction });
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ message: 'Error updating transaction', error });
    }
  });