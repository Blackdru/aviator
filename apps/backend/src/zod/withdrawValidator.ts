import {z} from 'zod';

export const createWithdrawSchema = z.object({
    amount: z.number().min(10, {message: "Enter amount greater than 10"}),
    withdrawType: z.enum(["Bank", "UPI", "Crypto"], {message: "Invalid withdraw method"}),
    username: z.string({message: "Invalid username"}),
    accountNumber: z.string().optional(),
    ifsc: z.string().optional(),
    upi: z.string().optional(),
    cryptoId: z.string().optional()
});
