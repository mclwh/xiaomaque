// PM2 生产环境进程配置：启动编译后的后端 API 服务
module.exports = {
    apps: [
        {
            name: "xiaomaque-api",
            cwd: "./packages/serve",
            script: "dist/index.js",
            env: {
                NODE_ENV: "production",
            },
            instances: 1,
            exec_mode: "fork",
            autorestart: true,
            watch: false,
            max_memory_restart: "1024M",
        },
    ],
};
