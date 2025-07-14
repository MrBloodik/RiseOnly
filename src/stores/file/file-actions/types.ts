
export interface UploadFileResponse {
	urls: string[]
}

export interface UploadSingleFileResponse {
	"url": string
	"file_name": string
	"file_size": number
	"compressed_size": number
}