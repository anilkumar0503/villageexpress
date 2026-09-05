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

// Block root-level packages that conflict with app-local versions.
// The monorepo root has react@19 and react-native@0.87 installed for the web
// workspace, but the customer-app needs react@18 and react-native@0.73.
// Without these blocks, Metro resolves both copies when processing
// @ve/mobile-shared, causing:
//   • "Cannot read property 'useState' of null"  (two React instances)
//   • "Tried to register two views with the same name RNCSafeAreaProvider"
const escapeForRegex = (p) => p.replace(/\\/g, '\\\\').replace(/\./g, '\\.');

const rootBlockedPaths = [
  'react',
  'react-native',
  'react-native-safe-area-context',
].map(pkg => path.join(monorepoRoot, 'node_modules', pkg) + path.sep);

config.resolver.blockList = new RegExp(
  '^(' + rootBlockedPaths.map(escapeForRegex).join('|') + ').*'
);

// Explicitly redirect singleton packages to the app-local copies so that
// any context (including @ve/mobile-shared) always gets the same instance.
const localRNIndex = path.join(localRNRoot, 'index.js');
const localReactIndex = path.join(appNodeModules, 'react', 'index.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native') {
    return { filePath: localRNIndex, type: 'sourceFile' };
  }
  if (moduleName === 'react') {
    return { filePath: localReactIndex, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
