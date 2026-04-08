// The http module contains methods to handle http queries.
const http = require('http');
const httpProxy = require('http-proxy');

// We will need a proxy to send requests to the other services.
const proxy = httpProxy.createProxyServer();
proxy.on('error', function (err, req, res) {
    console.log('[PROXY ERROR]', err.message);
    if (res && res.writeHead) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Erreur de proxy');
    }
});


/* The http module contains a createServer function, which takes one argument, which is the function that
** will be called whenever a new request arrives to the server.
 */
const server = http.createServer(function (request, response) {
    // First, let's check the URL to see if it's a REST request or a file request.
    // We will remove all cases of "../" in the url for security purposes.
    let filePath = request.url.split("/").filter(function(elem) {
        return elem !== "..";
    });

    try {
        // If the URL starts by /api, then it's a REST request (you can change that if you want).
        if (filePath[1] === "api") {
            const route = filePath[2] ? filePath[2].split('?')[0] : "";
            if (route === "login" || route === "signup" || route === "refresh" || route === "users"
                || route === "requests" || route === "sendreq" || route === "friends"
                || route === "managereq"  || route === "logout" || route === "removefriend" || route === "update-elo"
                || route === "security-question" || route === "reset-password" ) {
                console.log(`[API] Redirection vers AuthService : ${route}`);
                request.url = request.url.replace('/api', '');
                proxy.web(request, response, {target: "http://auth:8002"});
            }
            else if(route === "game"){
                console.log(`[API] Redirection vers GameService : ${route}`);
                request.url = request.url.replace('/api/game', '');
                proxy.web(request, response, { target: "http://game:8003" });
            }
            else if(route === "achievements"){
                console.log(`[API] Redirection vers SuccesService : ${route}`);
                request.url = request.url.replace('/api', '');
                proxy.web(request, response, { target: "http://succes:8005" });
            }
            else {
                response.statusCode = 404;
                response.end("API Endpoint introuvable");
            }
        } else {
            console.log("Request for a file/socket received, transferring to the file service");
            proxy.web(request, response, {target: "http://files:8001"});
        }

    } catch(error) {
        console.log(`error while processing ${request.url}: ${error}`)
        response.statusCode = 400;
        response.end(`Something in your request (${request.url}) is strange...`);
    }
// For the server to be listening to request, it needs a port, which is set thanks to the listen function.
})


server.on('upgrade', function (request, socket, head) {
    const url = request.url || "";
    if(url.includes('social.io')) {
        console.log("[WS] Redirection vers SocialService");
        proxy.ws(request, socket, head, {target: "http://social:8004" });
    }
    else if(url.includes('socket.io') || url.includes('game')){
        console.log("[WS] Redirection vers GameService");
        proxy.ws(request, socket, head, {target: "http://game:8003" });
    }
    else{
        proxy.ws(request, socket, head, {target: "http://files:8001"});
    }
})

server.listen(8000, () => {
    console.log(`Gateway server demarré (port 8000)`);
});