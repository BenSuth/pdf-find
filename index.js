const express = require('express');
const CONFIG = require('./config');
const app = express();
const router = require('./routes');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', __dirname + '\\public\\static');

app.use(express.static(__dirname + '/public/static/stylesheets'));

app.get('/', router);

app.get('/account_change', router);

app.get('/auth_callback', router);

app.get('/reset_emails', router);

app.get('/get_emails', router);

app.get('/clear_filters', router);

app.get('/about', router);

app.get('/help', router);

app.get('/filter_emails', router);
app.get('/logout', router); 
app.get('/:attachmentId/pdf/:messageId/:messageName', router);
app.listen(CONFIG.port, function () {
  console.log(`Listening on port ${CONFIG.port}`);
});