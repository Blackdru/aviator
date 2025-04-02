import { User } from "./User";

class UserManager {
    private static instance: UserManager
    private readonly onlineUsers: Map<string, User>
    constructor(){
        this.onlineUsers = new Map()
    }
    static getInstance(){
        if(UserManager.instance){
            return UserManager.instance;
        }
        UserManager.instance = new UserManager();
        return UserManager.instance;
    }

    addUser(user: User) {
        this.addAviatorListener(user);
        this.onlineUsers.set(user.socket.id, user);
    }

    removeUser(socketId: string) {
        this.onlineUsers.delete(socketId)
    }

    getUserCount(){
        return this.onlineUsers.size
    }

    private addAviatorListener(user: User) {
        
    }

}


export const userManager = UserManager.getInstance();