const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidCleartextTraffic(config) {
  return withAndroidManifest(config, (androidConfig) => {
    const application = androidConfig.modResults.manifest.application?.[0];

    if (!application) {
      throw new Error('Elemen application tidak ditemukan di AndroidManifest.xml');
    }

    application.$ = application.$ || {};
    application.$['android:usesCleartextTraffic'] = 'true';

    return androidConfig;
  });
};
