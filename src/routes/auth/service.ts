import {inject} from 'inversify';
import * as argon2 from 'argon2';
import {IUserModel, UserRepository} from '../../models/mongo/user-repository';
import express, {Request as ExRequest, Response as ExResponse} from 'express';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {IAuthTokenRequest} from '../../models/basic/auth';
import {BaseService} from '../../models/shared/base-service';
import {OAuthError} from '../../shared/error-handler';
import {decipherJWT, getJWT, getSHA256} from '../../util/general-util';
import constants from '../../constants';
import {RedisConnector} from '../../shared/redis-connector';
import {jwtData, tokenResponse} from '../../models/types';
import * as qs from 'querystring';
@ProvideSingleton(AuthService)
export class AuthService extends BaseService <IAuthTokenRequest> {

	constructor(
		@inject(UserRepository) protected repository: UserRepository,
		@inject(RedisConnector) protected redis: RedisConnector
	) {
		super();
	}
	authorize(username: string, password: string, code_challenge: string, state: string, redirectUri: string, response: ExResponse): Promise<null> {
		return new Promise<null>((resolve, reject) => {
			this.repository.findOne({ username: username })
			.then(user => {
				argon2.verify(user.password, password)
				.then(passwordState => {
					try {
						if (passwordState) {
							getJWT(user, state.slice(0, 8), constants.jwtExpiry.oneTimeAuthCodeExpiry, 'oneTimeAuthCode')
							.then(jwt => {
								this.redis.setex(`oneTimeAuthCode::${user.id}::${state.slice(0, 8)}`, jwt.expiry, `${jwt.jwt}::${code_challenge}::${redirectUri}`)
								.then(status => {
									if (status) {
										response.redirect(redirectUri + '?' + qs.stringify({code: jwt.jwt}));
										resolve(null);
									}
									else {
										return reject(new OAuthError({ name: 'access_denied', error_description: 'User does not exist' }));
									}
								})
								.catch(err => reject(new OAuthError({ name: 'server_error', error_description: err?.message })));
							})
							.catch(err => {
								return reject(new OAuthError({ name: 'server_error', error_description: err?.message }));
							});
						}
						else {
							return reject(new OAuthError({ name: 'access_denied', error_description: 'User does not exist' }));
						}
					} catch (err) {
						reject(new OAuthError({ name: 'server_error', error_description: err?.message }));
					}
				})
				.catch(err => {
					return reject(new OAuthError({ name: 'access_denied', error_description: 'User does not exist' }));
				});
			})
			.catch(err => {
				if (err.statusCode === 404) {
					return reject(new OAuthError({ name: 'access_denied', error_description: 'User does not exist' }));
				}
				reject(new OAuthError({ name: 'server_error', error_description: err?.message }));
			});
		});
	}

	getToken(code: string, codeVerifier: string): Promise<tokenResponse> {
		return new Promise<tokenResponse>((resolve, reject) => {
			decipherJWT(code, 'oneTimeAuthCode')
			.then((jwtObject: jwtData) => {
				this.redis.db.get(`oneTimeAuthCode::${jwtObject.id}::${jwtObject.stateSlice}`, (err, reply) => {
					try {
						if (err) {
							reject(new OAuthError({ name: 'server_error', error_description: err?.message }));
						}
						else if (reply) {
							const [storedCode, codeChallenge] = reply.split('::');
							if (code === storedCode && getSHA256(codeVerifier) === codeChallenge) {
								this.generateTokens(jwtObject.id, jwtObject.stateSlice)
									.then(tokens => {
										resolve({ ...tokens });
									})
									.catch(err => reject(new OAuthError({ name: 'server_error', error_description: err?.message })));
							}
							else {
								reject(new OAuthError({ name: 'access_denied', error_description: 'Code challenge or code could not be verified' }));
							}
						}
						else {
							reject(new OAuthError({ name: 'server_error', error_description: 'An unknown error' }));
						}
					} catch (err) {
						reject(new OAuthError({ name: 'server_error', error_description: err?.message }));
					}
				});
			})
			.catch(err => reject(new OAuthError({ name: 'access_denied', error_description: err?.message })));
		});
	}

	private generateTokens(id: string, state: string): Promise<tokenResponse> {
		return new Promise<tokenResponse>((resolve, reject) => {
			this.repository.getById(id)
			.then(async (user) => {
				try {
					const idToken = await getJWT(user, state, 86400, 'idToken');
					const accessToken = await getJWT(user, state, 900, 'accessToken');
					const refreshToken = await getJWT(user, state, 960, 'refreshToken');
					await this.redis.setex(`idToken::${id}::${idToken.expiry}`, idToken.expiry, idToken.jwt);
					await this.redis.setex(`accessToken::${id}::${accessToken.expiry}`, accessToken.expiry, accessToken.jwt);
					await this.redis.setex(`refreshToken::${id}::${refreshToken.expiry}`, refreshToken.expiry, refreshToken.jwt);
					resolve({ id_token: idToken.jwt, access_token: accessToken.jwt, refresh_token: refreshToken.jwt });
				} catch(err) {
					reject(err);
				}
			})
			.catch(err => reject(err));
		});
	}
}
