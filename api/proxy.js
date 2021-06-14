const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({
    secure: false,
    changeOrigin: true,
    followRedirects: true,
});

const oldSitePrefixList = [
    '/user',
    '/orgs',
    '/sites',
    '/misc'
]

const error404Content = `
<html>
    <body>
        <style>
            body{
                font-family:sans-serif;
            }
        </style>

        <h1>404</h1>
        <h2>Not found</h2>
        <p>Sorry we couldn't find that page!</p>
        <p><a href="/">See our homepage here.</a></p>
        
    </body>
</html>
`

module.exports = async (req, res) => {


    const url = new URL(req.url, `http://${req.headers.host}`);
    // Returns true if some (any) prefix matches the old site URLs:
    const isOldSite = oldSitePrefixList.some((oldPrefix) => {
        return url.pathname.startsWith(oldPrefix)
    });


    // The proxy target is set to an S3 bucket containing the site, unless old site URLs are matched: 
    const target = isOldSite ? `https://user.kendra.io` : `http://kendraio-builder-website.s3-website.eu-west-2.amazonaws.com`;

    // Returns proxied content, unless S3 returns a 403 that should be a 404: 
    proxy.on('proxyRes', function (proxyRes, _req, res) {
        var body = [];
        proxyRes.on('data', function (chunk) {
            body.push(chunk)
        });

        proxyRes.on('end', function () {
            if (proxyRes.statusCode === 403 && isOldSite === false) {
                res.writeHead(404, {
                    'Content-Type': 'text/html'
                });
                res.end(error404Content);
            } else {
                res.end(Buffer.concat(body).toString());
            }
        });

    });

    proxy.web(req, res, {
        target: target,
        selfHandleResponse: true
    });
};
