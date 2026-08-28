// craco.config.js
const path = require("path");
const { pathToFileURL } = require("url");
require("dotenv").config();

const isDevServer = process.env.NODE_ENV !== "production";

const config = {
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
};

let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

let webpackConfig = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/build/**',
          '**/dist/**',
          '**/coverage/**',
          '**/public/**',
        ],
      };

      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }
      return webpackConfig;
    },
  },
};

const getLocalApiHandler = async (relativePath) => {
  const moduleUrl = pathToFileURL(path.resolve(__dirname, relativePath)).href;
  const withBust = `${moduleUrl}?v=${Date.now()}`;
  const mod = await import(withBust);
  return mod.default;
};

webpackConfig.devServer = (devServerConfig) => {
  // ── /api/* isteklerini local API server'a (port 3001) proxy'le ──────────
  devServerConfig.proxy = [
    {
      context: (pathname) => pathname.startsWith('/api')
        && pathname !== '/api/euronews-feed'
        && pathname !== '/api/euronews-article'
        && pathname !== '/api/account-delete',
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
    },
  ];

  const originalSetupMiddlewares = devServerConfig.setupMiddlewares;
  devServerConfig.setupMiddlewares = (middlewares, devServer) => {
    if (originalSetupMiddlewares) {
      middlewares = originalSetupMiddlewares(middlewares, devServer);
    }

    if (devServer?.app) {
      devServer.app.get('/api/euronews-feed', async (req, res) => {
        try {
          const handler = await getLocalApiHandler('api/euronews-feed.js');
          return handler(req, res);
        } catch (error) {
          return res.status(500).json({
            error: error?.message || 'Lokaler Euronews-Feed konnte nicht geladen werden.',
          });
        }
      });

      devServer.app.get('/api/euronews-article', async (req, res) => {
        try {
          const handler = await getLocalApiHandler('api/euronews-article.js');
          return handler(req, res);
        } catch (error) {
          return res.status(500).json({
            error: error?.message || 'Lokaler Euronews-Artikel konnte nicht geladen werden.',
          });
        }
      });

      devServer.app.get('/api/account-delete', async (req, res) => {
        try {
          const handler = await getLocalApiHandler('api/account-delete.js');
          return handler(req, res);
        } catch (error) {
          return res.status(500).json({
            error: error?.message || 'Lokaler Konto-Löschen-Endpunkt konnte nicht geladen werden.',
          });
        }
      });

      devServer.app.post('/api/account-delete', async (req, res) => {
        try {
          const handler = await getLocalApiHandler('api/account-delete.js');
          return handler(req, res);
        } catch (error) {
          return res.status(500).json({
            error: error?.message || 'Lokaler Konto-Löschen-Endpunkt konnte nicht geladen werden.',
          });
        }
      });
    }

    if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
      setupHealthEndpoints(devServer, healthPluginInstance);
    }
    return middlewares;
  };

  return devServerConfig;
};

if (isDevServer) {
  try {
    const { withVisualEdits } = require("@emergentbase/visual-edits/craco");
    webpackConfig = withVisualEdits(webpackConfig);
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND' && err.message.includes('@emergentbase/visual-edits/craco')) {
      console.warn(
        "[visual-edits] @emergentbase/visual-edits not installed — visual editing disabled."
      );
    } else {
      throw err;
    }
  }
}

module.exports = webpackConfig;