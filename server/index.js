const { createProxyMiddleware } = require('http-proxy-middleware');
var cors = require('cors')
const express = require('express');
const dotenv = require('dotenv');
var morgan = require('morgan');
// const { addOreidExpressMiddleware } = require('oreid-js/dist/expressMiddleware');


const PORT = 8081 // if you change this port, you should update "proxy" in package.json to match - "proxy" is used by React app during development only
dotenv.config();
const app = express();

app.use(morgan('short')) // This logs requests to the proxy
app.use(cors())

// Disable caching so I can see the full request every time
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store') 
    next()
})

function addOreidApiKeysMiddleware(options) {
    return (req, _res, next) => {
      // inject api-key to header of request
      req.headers['api-key'] = options.apiKey // This just injects the apiKey into the header
      next()
    }
}

function onProxyReq(proxyReq, req, res) {
    proxyReq.setHeader('host', process.env.REACT_APP_OREID_HOST); // This is only really used when you're using a debug proxy
}

const proxyUrl = process.env.REACT_APP_PROXY_URL
console.log('proxyUrl: ' + proxyUrl)
const host = process.env.REACT_APP_OREID_HOST
console.log('host: ' + host)
const target = proxyUrl ? proxyUrl : process.env.REACT_APP_OREID_PROTOCOL+'://'+process.env.REACT_APP_OREID_HOST

console.log('target: ' + target)

const addHeadersMiddleware = addOreidApiKeysMiddleware({ apiKey: process.env.SECRET_OREID_API_KEY })
const frontendProxyRoute = createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { 
        '^/oreid': '' // Requests arrive /oreid/api/account/user?account=xx so we need to remove the /oreid
    },
    onProxyReq
  })
app.use('/oreid', addHeadersMiddleware, frontendProxyRoute)

const listener = app.listen(PORT, () => {
  console.log(`Express proxy server is running on port:${listener.address().port}`);
});