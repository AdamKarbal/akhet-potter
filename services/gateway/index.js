// The http module contains methods to handle http queries.
const http = require('http');
const httpProxy = require('http-proxy');

// We will need a proxy to send requests to the other services.
const proxy = httpProxy.createProxyServer();

/* The http module contains a createServer function, which takes one argument, which is the function that
** will be called whenever a new request arrives to the server.
 */
http.createServer(function (request, response) {
    // First, let's check the URL to see if it's a REST request or a file request.
    // We will remove all cases of "../" in the url for security purposes.
    let filePath = request.url.split("/").filter(function(elem) {
        return elem !== "..";
    });

    try {
        // If the URL starts by /api, then it's a REST request (you can change that if you want).
        if (filePath[1] === "api") {
            const route = filePath[2];
            if (route === "login" || route === "signup") {
                request.url = request.url.replace('/api', '');
                console.log(`[API] Redirection vers AuthService : ${route}`);
                proxy.web(request, response, { target: "http://auth:8002" });
            }
            if (route === "login" || route === "signup" || route === "refresh") {
                console.log(`[API] Redirection vers AuthService : ${route}`);
                request.url = request.url.replace('/api', '');
                proxy.web(request, response, { target: "http://auth:8002" });
            }
            else {
                response.statusCode = 404;
                response.end("API Endpoint introuvable");
            }
        } else {
            console.log("Request for a file received, transferring to the file service")
            const targetUrl = process.env.FILES_URL || "http://127.0.0.1:8001";
            proxy.web(request, response, { target: targetUrl });        }
    } catch(error) {
        console.log(`error while processing ${request.url}: ${error}`)
        response.statusCode = 400;
        response.end(`Something in your request (${request.url}) is strange...`);
    }
// For the server to be listening to request, it needs a port, which is set thanks to the listen function.
}).listen(8000, () => {
    console.log(`Gateway server demarré (port 8001)`);
});