const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const appNodeModules = path.resolve(projectRoot, 'node_modules');
const localRNRoot = path.join(appNodeModules, 'react-native');

const config = getDefaultConfig(projectRoot);

// Watch monorepo root so shared packages are visible
config.watchFolders = [monorepoRoot];

// Prioritise the app's own node_modules
config.resolver.nodeModulesPaths = [
  appNodeModules,
  path.resolve(monorepoRoot, 'node_modules'),
];

// Block root-level react-native (0.87.x) and react-native-safe-area-context (5.x)
// from Metro's file map — the app has its own compatible versions locally.
// Without this, Metro resolves both copies (one for the app, one for @ve/mobile-shared)
// which causes "Tried to register two views with the same name RNCSafeAreaProvider".
const escapeForRegex = (p) => p.replace(/\\/g, '\\\\').replace(/\./g, '\\.');

const rootRNPath = path.join(monorepoRoot, 'node_modules', 'react-native') + path.sep;
const rootSafeAreaPath = path.join(monorepoRoot, 'node_modules', 'react-native-safe-area-context') + path.sep;

config.resolver.blockList = new RegExp(
  '^(' + escapeForRegex(rootRNPath) + '|' + escapeForRegex(rootSafeAreaPath) + ').*'
);

// Also redirect the top-level 'react-native' import explicitly.
const localRNIndex = path.join(localRNRoot, 'index.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native') {
    return { filePath: localRNIndex, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
