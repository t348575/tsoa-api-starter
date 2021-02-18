import {Body, Controller, Get, Post, Query, Route, Tags, Response, Request} from 'tsoa';
import express, {Request as ExRequest, Response as ExResponse} from 'express';
import {ProvideSingleton} from '../../shared/provide-singleton';
import {inject} from 'inversify';
import {AuthService} from './service';
import {AuthTokenRequestFormatter, IAuthTokenRequest} from '../../models/basic/auth';
import * as fs from 'fs';
import * as path from 'path';
import {refreshTokenType, scopes, tokenBodyType} from '../../models/types';
import {OAuthError} from '../../shared/error-handler';
import * as qs from 'querystring';

type acceptedChallengeMethods = 'S256';
type clientIds = 'api' | 'site';
type responseTypes = 'code'

@Tags('oauth')
@Route('oauth')
@ProvideSingleton(AuthController)
export class AuthController extends Controller {
	constructor(
		@inject(AuthService) private service: AuthService
	) {
		super();
	}

	@Get('authorize')
	public async auth(
		@Query('response_type') responseType: responseTypes,
		@Query('client_id') clientId: clientIds,
		@Query('redirect_uri') redirectUri: string,
		@Query('scope') scope: string,
		@Query('state') state: string,
		@Request() request: ExRequest,
		@Query() username: string,
		@Query() password: string,
		@Query('code_challenge') codeChallenge: string,
		@Query('code_challenge_method') codeChallengeMethod: acceptedChallengeMethods
	) {
		if (username && password && codeChallenge) {
			return this.service.authorize(username, password, codeChallenge, state, redirectUri, (<any>request).res as ExResponse);
		}
		else {
			throw new OAuthError({ name: 'invalid_request', error_description: 'Invalid parameters' });
		}
	}

	@Get('login')
	public async login(
		@Request() request: ExRequest
	) {
		const response = (<any>request).res as ExResponse;
		return new Promise<null>((resolve, reject) => {
			fs.readFile(path.resolve(__dirname, './../../../resources/public/login.html'), (err, data) => {
				if (err) {
					this.setStatus(500);
					response.end();
					reject();
				}
				else {
					this.setStatus(200);
					response.contentType('text/html');
					response.send(data.toString());
					resolve(null);
				}
			});
		});
	}

	@Post('token')
	public async token(
		@Body() body: tokenBodyType,
		@Request() request: ExRequest
	) {
		return this.service.getToken(body.code, body.code_verifier);
	}

	@Post('refresh')
	public async refresh(
		@Body() body: refreshTokenType,
		@Request() request: ExRequest
	) {
	}
}
