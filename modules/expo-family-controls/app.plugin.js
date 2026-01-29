const { withEntitlementsPlist } = require('@expo/config-plugins');

const APP_GROUP = 'group.com.balthazar.sobre';

module.exports = function withFamilyControls(config) {
  return withEntitlementsPlist(config, (config) => {
    const entitlements = config.modResults;
    entitlements['com.apple.developer.family-controls'] = true;

    const groups = new Set(entitlements['com.apple.security.application-groups'] || []);
    groups.add(APP_GROUP);
    entitlements['com.apple.security.application-groups'] = Array.from(groups);

    config.modResults = entitlements;
    return config;
  });
};
