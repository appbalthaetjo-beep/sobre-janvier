const { withInfoPlist } = require('@expo/config-plugins');

const APP_ID = '2293641301112058';
const DISPLAY_NAME = 'Sobre';

module.exports = function withMetaFacebook(config) {
  return withInfoPlist(config, (config) => {
    const plist = config.modResults;

    plist.FacebookAppID = APP_ID;
    plist.FacebookDisplayName = DISPLAY_NAME;

    const queries = new Set(plist.LSApplicationQueriesSchemes || []);
    ['fbapi', 'fb-messenger-share-api', 'fbauth2', 'fbshareextension'].forEach((scheme) => queries.add(scheme));
    plist.LSApplicationQueriesSchemes = Array.from(queries);

    const fbScheme = `fb${APP_ID}`;
    const urlTypes = Array.isArray(plist.CFBundleURLTypes) ? plist.CFBundleURLTypes : [];
    const hasFbScheme = urlTypes.some(
      (entry) => Array.isArray(entry.CFBundleURLSchemes) && entry.CFBundleURLSchemes.includes(fbScheme),
    );

    if (!hasFbScheme) {
      urlTypes.push({
        CFBundleURLSchemes: [fbScheme],
      });
    }

    plist.CFBundleURLTypes = urlTypes;
    config.modResults = plist;
    return config;
  });
};
