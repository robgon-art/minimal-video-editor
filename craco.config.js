module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // Add fallbacks for Node.js core modules
            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                fs: false,
                path: require.resolve('path-browserify'),
                os: require.resolve('os-browserify/browser'),
                util: require.resolve('util/'),
                stream: require.resolve('stream-browserify'),
                buffer: require.resolve('buffer/'),
                child_process: false
            };

            return webpackConfig;
        }
    },
    jest: {
        configure: {
            coveragePathIgnorePatterns: [
                "/node_modules/",
                "/src/infrastructure/fileSystem/FileSystem.mock.ts",
                "/src/reportWebVitals.ts"
            ]
        }
    }
}; 