const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const jwt = require('jsonwebtoken');
const OAuth2 = google.auth.OAuth2;
const CONFIG = require('./config');
const source = require('./gmail/source');
const LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');

router.get('/', (req, res) => {
    const oauth2Client = new OAuth2(CONFIG.oauth2Credentials.client_id, CONFIG.oauth2Credentials.client_secret, CONFIG.oauth2Credentials.redirect_uris[0]);
    
    const loginLink = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: CONFIG.oauth2Credentials.scopes
    });
    return res.render("home", { loginLink: loginLink, hasLoggedIn: (localStorage.getItem('user') != null) ? true: false });
});

router.get('/account_change', (req, res) => {
    const oauth2Client = new OAuth2(CONFIG.oauth2Credentials.client_id, CONFIG.oauth2Credentials.client_secret, CONFIG.oauth2Credentials.redirect_uris[0]);
    
    const loginLink = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: CONFIG.oauth2Credentials.scopes
    });

    localStorage.clear();
    res.redirect(loginLink);
});

router.get('/auth_callback', (req, res) => {
    const oauth2Client = new OAuth2(CONFIG.oauth2Credentials.client_id, CONFIG.oauth2Credentials.client_secret, CONFIG.oauth2Credentials.redirect_uris[0]);
    if (req.query.error) 
    {
        return res.redirect('/');
    } 
    else 
    {
        oauth2Client.getToken(req.query.code, (err, token) => {
            if (err) return res.redirect('/');

            localStorage.setItem('user', jwt.sign(token, CONFIG.JWTsecret));
            return res.redirect('/');
        });
    }
});

router.get('/reset_emails', (req, res) => {
    localStorage.removeItem('userList');    
    localStorage.removeItem('userListFilter');
    return res.redirect('/get_emails');
});

router.get('/clear_filters', (req, res) => {
    localStorage.removeItem('userListFilter');
    return res.redirect('/get_emails');
});

router.get('/get_emails', async (req, res) => {
    if (localStorage.getItem('user') == null) 
    {
        return res.redirect('/help');
    }

    if (!(localStorage.getItem('userListFilter') == null))
    {
        const attachmentNames = JSON.parse(localStorage.getItem('userListFilter'));
        return res.render('data', { size:  attachmentNames.length, files: attachmentNames, hasLoggedIn: (localStorage.getItem('user') != null) ? true: false });
    }

    if (!(localStorage.getItem('userList') == null))
    {
        const attachmentNames = JSON.parse(localStorage.getItem('userList'));
        return res.render('data', { size:  attachmentNames.length, files: attachmentNames, hasLoggedIn: (localStorage.getItem('user') != null) ? true: false });
    }

    const oauth2Client = new OAuth2(CONFIG.oauth2Credentials.client_id, CONFIG.oauth2Credentials.client_secret, CONFIG.oauth2Credentials.redirect_uris[0]);
    oauth2Client.credentials = jwt.verify(localStorage.getItem('user'), CONFIG.JWTsecret);      

    const gmail = google.gmail({version: 'v1', auth: oauth2Client});
    const messages = await source.getAttachmentMessages(gmail);

    let attachmentNames = [];
    let count = 0;
    for (const message of messages) {
        const fileNames = await source.getAttachments(gmail, message['id']);

        for (const name of fileNames) {
            if (name['filename'] != '' && name['filename'].includes('.pdf'))
            {
                attachmentNames.push({
                    name: name['filename'],
                    attachmentId: name['body']['attachmentId'],
                    messageId : message['id'],
                    order: ++count 
                });
            }
        }
    }

    const json_attachmentName = JSON.stringify(attachmentNames);
    localStorage.setItem('userList', json_attachmentName);
    return res.render('data', { size:  attachmentNames.length, files: attachmentNames, hasLoggedIn: (req.cookies.user) ? true: false });
});

router.get('/about', (req, res) => {
    return res.render("about", {hasLoggedIn: (localStorage.getItem('user') != null) ? true: false });
})

router.get('/help', (req, res) => {
    const oauth2Client = new OAuth2(CONFIG.oauth2Credentials.client_id, CONFIG.oauth2Credentials.client_secret, CONFIG.oauth2Credentials.redirect_uris[0]);

    const loginLink = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: CONFIG.oauth2Credentials.scopes
      });

    return res.render("help", {loginLink: loginLink, hasLoggedIn: (localStorage.getItem('user') != null) ? true: false });
})

router.get('/:attachmentId/pdf/:messageId/:messageName', async (req, res) => {
    if (localStorage.getItem('user') == null) 
    {
        return res.redirect('/');
    }

    const oauth2Client = new OAuth2(CONFIG.oauth2Credentials.client_id, CONFIG.oauth2Credentials.client_secret, CONFIG.oauth2Credentials.redirect_uris[0]);
    oauth2Client.credentials = jwt.verify(localStorage.getItem('user'), CONFIG.JWTsecret);      

    const gmail = google.gmail({version: 'v1', auth: oauth2Client});

    const messageId = req.params.messageId;
    const attachmentId = req.params.attachmentId;
    const base64 = await source.getPDF(gmail, messageId, attachmentId);
    const data = base64['data']['data'];
    const img = Buffer.from(data, 'base64');

    res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': img.length,
    });

    res.end(img);
});

router.get(('/filter_emails'), (req, res) => {

    const option = req.query.order; 
    const filter = req.query.filterString;

    let list = (filter.replace(/\s/g, '') == '') 
        ? JSON.parse(localStorage.getItem('userList')) 
        : JSON.parse(localStorage.getItem('userList')).filter(email => email.name.toLowerCase().includes(filter.toLowerCase()));

    switch (option)
    {
        case 'option1':
            list.sort((a,b) => (a.order > b.order) ? 1 : ((b.order > a.order) ? -1 : 0));
            break;
        case 'option2':
            list.sort((a,b) => (a.order > b.order) ? -1 : ((b.order > a.order) ? 1 : 0));
            break;    
        case 'option3':
            list.sort((a,b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? -1 : 0));
            break;
        case 'option4':
            list.sort((a,b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? -1 : ((b.name.toLowerCase() > a.name.toLowerCase()) ? 1 : 0));
            break;         
    }

    const json_list = JSON.stringify(list);
    localStorage.setItem('userListFilter', json_list);
    return res.redirect('/get_emails');

});

router.get('/logout', (req, res) => {
    localStorage.clear();
    res.redirect('/');
});

module.exports = router