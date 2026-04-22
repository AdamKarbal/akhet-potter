import {AuthService} from "./AuthService.js";
import {API_URL} from "../../config.js";

export const RequestService = {
    async handleDecision(username, decision){
        const token = await AuthService.getValidToken();
        try{
            const response = await fetch(API_URL + "/api/managereq", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body : JSON.stringify({ fromUser : username, decision: decision})
            });
            return response.ok;
        }
        catch(error){
            console.error("Erreur lors de le gestion de demande : ", error);
            return false;
        }
    },

    async deleteFriend(username){
        const token = await AuthService.getValidToken();

        try {
            const response = await fetch(API_URL + "/api/removefriend", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body : JSON.stringify({ username: username })
            });
            return response.ok;
        }
        catch(error){
            console.log("Erreur lors de la suppression d'ami : ", error);
            return false;
        }
    }
};