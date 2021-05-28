const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({
    secure: false,
    changeOrigin: true,
    followRedirects: true,
});

module.exports = async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    // console.log(url.pathname);
    const isOldSite = url.pathname.substring(0, 5) === '/user' || url.pathname.substring(0, 5) === '/orgs';
    const target = isOldSite ? `https://kendra.io` : `http://kendraio-builder-website.s3-website.eu-west-2.amazonaws.com`;
    //console.log(target);
    proxy.web(req, res, { target });
};
