import * as path from 'path';
import fs from 'fs';
import https from 'https';
import child_process from 'child_process';
import { app } from './app';
import {ConfigModel} from './models/config-model';
import constants from './constants';
const config: ConfigModel = JSON.parse(fs.readFileSync(path.join(__dirname, './../resources/config.json')).toString());
const port = config.port || 8080;
try {
	child_process.execSync('yarn build:swagger', { cwd: path.join(__dirname, '/../') })
} catch (e) {}
constants.privateKey = fs.readFileSync(path.resolve(config.privateKey)).toString();
constants.publicKey = fs.readFileSync(path.resolve(config.publicKey)).toString();
const server = https.createServer({
	// @ts-ignore
	key: constants.privateKey,
	// @ts-ignore
	cert: constants.publicKey,
}, app);
server.listen(port, () =>
	console.log(`Example app listening at ${config.serverAddress}:${port}`)
);
