import { showNotify } from '@shared/config/const';

export const checker = (condition: boolean, message: string) => {
	if (!condition) {
		showNotify("error", { message });
		throw new Error(message);
	}
};

const colors = {
	error: "\x1b[31m", // red
	warning: "\x1b[33m", // yellow
	info: "\x1b[32m", // green
	system: "\x1b[34m", // blue
	success: "\x1b[32m", // green
	debug: "\x1b[35m", // black
	component: "\x1b[36m", // cyan
	page: "\x1b[33m", // orange
	ui: "\x1b[35m" // purple
};

export const logger = {
	info: (name: string = "Logger", message: string) => {
		console.log(`${colors.info}[${name}]: ${message}\x1b[0m`);
	},
	error: (name: string = "Logger", message: string) => {
		console.log(`${colors.error}[${name}]: ${message}\x1b[0m`);
	},
	warning: (name: string = "Logger", message: string) => {
		console.log(`${colors.warning}[${name}]: ${message}\x1b[0m`);
	},
	system: (name: string = "Logger", message: string) => {
		console.log(`${colors.system}[${name}]: ${message}\x1b[0m`);
	},
	success: (name: string = "Logger", message: string) => {
		console.log(`${colors.success}[${name}]: ${message}\x1b[0m`);
	},
	debug: (name: string = "Logger", message: string) => {
		console.log(`${colors.debug}[${name}]: ${message}\x1b[0m`);
	},
	component: (name: string = "Logger", message: string) => {
		console.log(`${colors.component}[${name}]: ${message}\x1b[0m`);
	},
	page: (name: string = "Logger", message: string) => {
		console.log(`${colors.page}[${name}]: ${message}\x1b[0m`);
	},
	ui: (name: string = "Logger", message: string) => {
		console.log(`${colors.ui}[${name}]: ${message}\x1b[0m`);
	}
};