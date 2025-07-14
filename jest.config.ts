import type { Config } from 'jest'

const config: Config = {
	preset: 'react-native',
	transform: {
		'^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { configFile: './babel.config.js' }],
	},
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.json',
		},
	},
	transformIgnorePatterns: [
		'/node_modules/(?!mobx-toolbox)/',
	],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	testRegex: '(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$',
}

export default config
