export default {
	privateKey: '',
	publicKey: '',
	environment: 'debug',
	baseUrl: 'https://localhost',
	mongoConnectionString: 'mongodb://localhost:27017/tsoa-oauth2-test',
	jwtExpiry: {
		oneTimeAuthCodeExpiry: 60
	},
	errorTypes: {
		db: { statusCode: 500, name: 'Internal Server Error', message: 'database error' },
		validation: { statusCode: 400, name: 'Bad Request', message: 'validation error' },
		auth: { statusCode: 401, name: 'Unauthorized', message: 'auth error' },
		forbidden: { statusCode: 403, name: 'Forbidden', message: 'forbidden content' },
		notFound: { statusCode: 404, name: 'Not Found', message: 'content not found' },
		entity: { statusCode: 422, name: 'Unprocessable Entity', message: 'entity error' }
	},
	get errorMap() {
		return {
			ValidateError: this.errorTypes.validation,
			ValidationError: this.errorTypes.validation,
			CastError: this.errorTypes.db
		};
	}
}
