import z from 'zod'

export const validateAdmin = z.object({
    name: z.string().min(4).max(20),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.string()
})
