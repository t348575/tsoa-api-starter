/**
 * Id
 * @example "601e34401e2f8d10d060af1e"
 * @minLength 12
 * @maxLength 24
 */
export type id = string;

export type scopes = 'a' | 'b';

export type OAuthErrorTypes = 'invalid_request' | 'unauthorized_client' | 'access_denied' | 'unsupported_response_type' | 'invalid_scope' | 'server_error' | 'temporarily_unavailable';

export type tokenResponse = { id_token: string, access_token: string, refresh_token: string };

export type jwtData = { id: string, stateSlice: string };

export type jwtSubjects = 'oneTimeAuthCode' | 'idToken' | 'refreshToken' | 'accessToken';

export type tokenBodyType = { code: string, code_verifier: string };

export type refreshTokenType = { refresh_token: string };
