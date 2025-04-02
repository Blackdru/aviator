import { createId } from "@paralleldrive/cuid2";
import { AviatorGame } from "./AviatorGame";
import { User } from "../users/User";
import { prisma } from "../../lib/client";

export interface Bid{
    userId: string,
    investedAmount: number,
    cashedOut: boolean,
    rate?: number
}

class AviatorManager{
    private static instance: AviatorManager;
    
    private game: AviatorGame;
    constructor(){
        const roomId = createId();
        this.game = new AviatorGame(roomId)
    }
    static getInstance(): AviatorManager{
            if(AviatorManager.instance){
                return AviatorManager.instance;
            }
            AviatorManager.instance = new AviatorManager();
            return AviatorManager.instance;
    }

    public addPlayer(user: User){
        const userId = user.userId;
        this.game.players.set(user.userId, user)
        if(this.game.isRunning){
            const data = this.game.getCurrentData();
            user.socket.emit("AVIATOR_RUNNING_GAME", data);
        }
        else{
            const data = this.game.getRemainingWaitingTime().toString()
            user.socket.emit("AVIATOR_WAITING", data);
        }
    }

    public removePlayer(userId: string){
        this.game.players.delete(userId);
    }


    public addBid(user: User, amount: number){
        const userId = user.userId;
        if(this.game.isRunning) return;
        prisma.$transaction(async(tx) => {
            const wallet = await tx.wallet.findUnique({
                where: {
                    userId
                },
                select: {
                   balance: true,
                   walletId: true
                }
            })
            if(!wallet) return
            if(wallet.balance < amount) return
            await tx.wallet.update({
                where: {
                    walletId: wallet.walletId
                },
                data: {
                    balance: {
                        decrement: amount
                    }
                }
            }).then(() => {
                const bid: Bid = {userId, investedAmount: amount, cashedOut: false}
                this.game.biddings.set(userId, bid)
                user.socket.emit("AVIATOR_BID_SUCCESS")
            })

        })
    }


    public cashOutBid(user: User){
        if(!this.game.isRunning) return;
        const rate = this.game.getCurrentRate();
        const bid = this.game.biddings.get(user.userId);
        if(!bid) return;
        bid.cashedOut = true;
        bid.rate = rate
        this.game.biddings.set(user.userId, bid);
    }
}

export const aviatorManager = AviatorManager.getInstance();