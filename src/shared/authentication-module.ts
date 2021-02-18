import * as express from 'express';
import * as jwt from 'jsonwebtoken';
import {ConfigModel} from '../models/config-model';
import fs from 'fs';
import path from 'path';
import constants from '../constants';
import {ApiError} from './error-handler';
const config: ConfigModel = JSON.parse(fs.readFileSync(path.join(__dirname, './../../resources/config.json')).toString());
const publicKey = fs.readFileSync(path.resolve(config.publicKey)).toString();
export function expressAuthentication(
	req: express.Request,
	securityName: string,
	scopes ?: string[]
): Promise<any> {
	switch (securityName) {
		case 'jwt': {
			const token =
				req.body.token ||
				req.query.token ||
				req.headers['x-access-token'];

			return new Promise((resolve, reject) => {
				if (!token) {
					reject(new ApiError(constants.errorTypes.auth));
				}
				jwt.verify(token, publicKey, function (err: any, decoded: any) {
					if (err) {
						reject(err);
					} else {
						// @ts-ignore
						for (const scope of scopes) {
							if (!decoded.scopes.includes(scope)) {
								reject(new Error('JWT does not contain required scope.'));
							}
						}
						resolve(decoded);
					}
				});
			});
		}
		default: {
			return Promise.reject(new ApiError(constants.errorTypes.auth));
		}
	}
}
