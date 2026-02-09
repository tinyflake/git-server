module.exports = {
	apps: [
		{
			name: "verdaccio",
			script: "npx",
			args: "verdaccio --config verdaccio-config.yaml",
			cwd: "./backend",
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: "500M",
			env: {
				NODE_ENV: "production",
			},
			error_file: "./backend/logs/verdaccio-error.log",
			out_file: "./backend/logs/verdaccio-out.log",
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
		},
		{
			name: "git-server",
			script: "app.js",
			cwd: "./backend",
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: "1G",
			env: {
				NODE_ENV: "production",
			},
			error_file: "./backend/logs/git-server-error.log",
			out_file: "./backend/logs/git-server-out.log",
			log_date_format: "YYYY-MM-DD HH:mm:ss Z",
		},
	],
}
