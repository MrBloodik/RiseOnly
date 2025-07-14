import { GenderT } from '@config/types'

export interface AuthRegisterBody {
	"code": string,
	"gender": GenderT,
	"name": string,
	"number": string,
	"password": string
}

export interface AuthLoginBody {
	"number": string,
	"password": string
}

export interface SendCodeBody {
	"number": string
}

export interface SendCodeResponse {
	message: string
	statusCode: number
	error: string
}

// LOGOUT

export interface LogoutResponse {

}