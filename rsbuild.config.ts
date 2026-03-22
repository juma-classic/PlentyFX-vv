import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginBasicSsl } from '@rsbuild/plugin-basic-ssl';

const path = require('path');

export default defineConfig({
    plugins: [
        pluginSass({
            sassLoaderOptions: {
                sourceMap: false, // Disable source maps in production
            },
            exclude: /node_modules/,
        }),
        pluginReact(),
        pluginBasicSsl(),
    ],
    performance: {
        chunkSplit: {
            strategy: 'split-by-experience',
            override: {
                chunks: {
                    'lib-react': ['react', 'react-dom'],
                    'lib-router': ['react-router-dom'],
                    'lib-ui': ['@deriv-com/ui', '@deriv-com/translations'],
                    'lib-deriv': ['@deriv/deriv-api', '@deriv/deriv-charts'],
                    'lib-analytics': ['@vercel/analytics', '@vercel/speed-insights', '@datadog/browser-rum'],
                    'lib-utils': ['moment', 'lodash', 'crypto-js', 'uuid'],
                    'lib-mobx': ['mobx', 'mobx-react-lite'],
                    'lib-framer': ['framer-motion'],
                },
            },
        },
        bundleAnalyze: process.env.BUNDLE_ANALYZE ? {} : undefined,
        chunkLoadTimeout: 60000, // 60 seconds timeout for chunk loading
    },
    source: {
        entry: {
            index: './src/main.tsx',
        },
        define: {
            'process.env': {
                DERIV_APP_ID: JSON.stringify(process.env.DERIV_APP_ID), // ✅ Added App ID
                TRANSLATIONS_CDN_URL: JSON.stringify(process.env.TRANSLATIONS_CDN_URL),
                R2_PROJECT_NAME: JSON.stringify(process.env.R2_PROJECT_NAME),
                CROWDIN_BRANCH_NAME: JSON.stringify(process.env.CROWDIN_BRANCH_NAME),
                TRACKJS_TOKEN: JSON.stringify(process.env.TRACKJS_TOKEN),
                APP_ENV: JSON.stringify(process.env.APP_ENV),
                REF_NAME: JSON.stringify(process.env.REF_NAME),
                REMOTE_CONFIG_URL: JSON.stringify(process.env.REMOTE_CONFIG_URL),
                GD_CLIENT_ID: JSON.stringify(process.env.GD_CLIENT_ID),
                GD_APP_ID: JSON.stringify(process.env.GD_APP_ID),
                GD_API_KEY: JSON.stringify(process.env.GD_API_KEY),
                DATADOG_SESSION_REPLAY_SAMPLE_RATE: JSON.stringify(process.env.DATADOG_SESSION_REPLAY_SAMPLE_RATE),
                DATADOG_SESSION_SAMPLE_RATE: JSON.stringify(process.env.DATADOG_SESSION_SAMPLE_RATE),
                DATADOG_APPLICATION_ID: JSON.stringify(process.env.DATADOG_APPLICATION_ID),
                DATADOG_CLIENT_TOKEN: JSON.stringify(process.env.DATADOG_CLIENT_TOKEN),
                RUDDERSTACK_KEY: JSON.stringify(process.env.RUDDERSTACK_KEY),
                GROWTHBOOK_CLIENT_KEY: JSON.stringify(process.env.GROWTHBOOK_CLIENT_KEY),
                GROWTHBOOK_DECRYPTION_KEY: JSON.stringify(process.env.GROWTHBOOK_DECRYPTION_KEY),
            },
        },
        alias: {
            react: path.resolve('./node_modules/react'),
            'react-dom': path.resolve('./node_modules/react-dom'),
            '@/external': path.resolve(__dirname, './src/external'),
            '@/components': path.resolve(__dirname, './src/components'),
            '@/hooks': path.resolve(__dirname, './src/hooks'),
            '@/utils': path.resolve(__dirname, './src/utils'),
            '@/constants': path.resolve(__dirname, './src/constants'),
            '@/stores': path.resolve(__dirname, './src/stores'),
        },
    },
    output: {
        copy: [
            {
                from: 'node_modules/@deriv/deriv-charts/dist/*',
                to: 'js/smartcharts/[name][ext]',
                globOptions: {
                    ignore: ['**/*.LICENSE.txt'],
                },
            },
            { from: 'node_modules/@deriv/deriv-charts/dist/chart/assets/*', to: 'assets/[name][ext]' },
            { from: 'node_modules/@deriv/deriv-charts/dist/chart/assets/fonts/*', to: 'assets/fonts/[name][ext]' },
            { from: 'node_modules/@deriv/deriv-charts/dist/chart/assets/shaders/*', to: 'assets/shaders/[name][ext]' },
            { 
                from: path.join(__dirname, 'public'),
                noErrorOnMissing: true,
                info: { minimized: false }, // Don't minify copied files
            },
        ],
        cleanDistPath: true,
        minify: {
            js: true,
            css: true,
            html: true,
        },
    },
    html: {
        template: './index.html',
    },
    server: {
        port: 8443,
        compress: true,
        host: '0.0.0.0',
        https: true,
    },
    dev: {
        hmr: true,
        liveReload: true,
    },
    tools: {
        rspack: {
            plugins: [],
            resolve: {
                fallback: {
                    crypto: false,
                    stream: false,
                    buffer: false,
                },
            },
            module: {
                rules: [
                    {
                        test: /\.xml$/,
                        exclude: /node_modules/,
                        use: 'raw-loader',
                    },
                    {
                        // Exclude app.binarytool.site JS files from processing
                        test: /app\.binarytool\.site.*\.js$/,
                        type: 'asset/resource',
                        generator: {
                            filename: '[path][name][ext]',
                        },
                    },
                ],
            },
            optimization: {
                splitChunks: {
                    chunks: 'all',
                    maxSize: 500000, // 500KB chunks (increased from 244KB)
                    minSize: 20000, // 20KB minimum chunk size
                    cacheGroups: {
                        vendor: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendors',
                            chunks: 'all',
                            priority: 10,
                            maxSize: 800000, // 800KB for vendor chunks
                        },
                        common: {
                            name: 'common',
                            minChunks: 2,
                            chunks: 'all',
                            priority: 5,
                            maxSize: 300000, // 300KB for common chunks
                        },
                    },
                },
            },
            experiments: {
                asyncWebAssembly: true,
            },
            devServer: {
                client: {
                    webSocketURL: 'auto://0.0.0.0:0/ws',
                },
            },
        },
    },
});
