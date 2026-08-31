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

// Block the stale root-level react-native 0.87.0 from Metro's file map
// so it never ends up in the bundle — the app has its own 0.73.0 locally.
const rootRNPath = path.join(monorepoRoot, 'node_modules', 'react-native') + path.sep;
const escapedPath = rootRNPath.replace(/\\/g, '\\\\').replace(/\./g, '\\.');
config.resolver.blockList = new RegExp('^' + escapedPath + '.*');

// Also redirect the top-level 'react-native' import explicitly.
const localRNIndex = path.join(localRNRoot, 'index.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native') {
    return { filePath: localRNIndex, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
