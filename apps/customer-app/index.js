// Error handler set up FIRST — before any other require
if (!__DEV__ && global.ErrorUtils) {
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (isFatal) {
      try {
        const { Alert } = require('react-native');
        Alert.alert(
          'Fatal Error',
          (error?.message || 'Unknown') + '\n\n' + String(error?.stack || '').substring(0, 500),
          [{ text: 'OK' }],
        );
      } catch (_e) {}
    }
  });
}

const { registerRootComponent } = require('expo');

// Wrap App loading in explicit try/catch to expose the real crash module
try {
  const App = require('./src/App').default;
  if (!App) {
    throw new Error('App is undefined — module loaded but default export is missing');
  }
  registerRootComponent(App);
} catch (e) {
  // Show the REAL error that prevented the app from loading
  const { AppRegistry } = require('react-native');
  const { Text, View } = require('react-native');
  const React = require('react');

  const msg = (e?.message || 'Unknown error') + '\n\n' + String(e?.stack || '').substring(0, 800);

  function CrashScreen() {
    return React.createElement(
      View,
      { style: { flex: 1, padding: 24, paddingTop: 60, backgroundColor: '#fff' } },
      React.createElement(Text, { style: { fontSize: 18, fontWeight: 'bold', color: 'red', marginBottom: 12 } }, 'Module Load Error'),
      React.createElement(Text, { style: { fontSize: 12, color: '#333', fontFamily: 'monospace' } }, msg),
    );
  }

  AppRegistry.registerComponent('main', () => CrashScreen);
}
