const argon2 = require('argon2');
(async() => {
    console.log(await argon2.hash(process.argv[2]));
})();
