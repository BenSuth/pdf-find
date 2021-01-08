require('dotenv').config()
const port = 3002;
const baseURL = `http://localhost:${port}`;
module.exports = {
  JWTsecret: 'mysecret',
  baseURL: baseURL,
  port: port,
  oauth2Credentials: {
    client_id: process.env.CLIENT_ID,
    project_id: process.env.PROJECT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_secret: process.env.CLIENT_SECRET,
    redirect_uris: [
      `${baseURL}/auth_callback`
    ],
    scopes: [
      'https://www.googleapis.com/auth/gmail.readonly'
    ]
  }
};