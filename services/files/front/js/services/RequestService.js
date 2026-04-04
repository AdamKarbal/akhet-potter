export const RequestService = {

    async deleteFriend(username){
        const token = localStorage.getItem('token');

        try {
            const response = await fetch("/api/removefriend", {
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