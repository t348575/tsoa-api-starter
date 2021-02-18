const {gmail_v1, google} = require('googleapis');
const fs = require('fs');
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const { client_secret, client_id, redirect_uris } = JSON.parse(fs.readFileSync(process.argv[2]).toString()).installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
console.log(oAuth2Client.generateAuthUrl({ access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.profile'] }));
rl.question('Enter email id: ', (email) => {
    rl.question('Enter the received code:', (val) => {
        rl.close();
        oAuth2Client.getToken(val, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFileSync('./data_store/token.json', JSON.stringify({
                token,
                email
            }));
        });
    });
});

