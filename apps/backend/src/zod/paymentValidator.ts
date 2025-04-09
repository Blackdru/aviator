import { z } from "zod";

export const createPaymentSchema = z.object({
    amount: z.number().min(10, {message: "Enter amount greater than 10"}),
    paymentType: z.enum(["Deposit", "Withdraw"], {message: "Enter valid payment type"})
})