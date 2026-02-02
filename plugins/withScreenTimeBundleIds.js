const { withXcodeProject } = require('@expo/config-plugins');

const HOST_BUNDLE_ID = 'com.balthazar.sobre';

function normalizeName(name) {
  if (typeof name !== 'string') return '';
  const s = name.trim();
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
  return s;
}

function getNativeTargets(project) {
  const section = project.pbxNativeTargetSection();
  return Object.entries(section)
    .filter(([key, value]) => !key.endsWith('_comment') && value && typeof value === 'object')
    .map(([id, value]) => ({ id, ...value }));
}

function getConfigListById(project, id) {
  const lists = project.pbxXCConfigurationList();
  return lists?.[id];
}

function getBuildConfigById(project, id) {
  const cfgs = project.pbxXCBuildConfigurationSection();
  return cfgs?.[id];
}

function getTargetBuildConfigs(project, target) {
  const listId = target.buildConfigurationList?.value || target.buildConfigurationList;
  if (!listId) return [];

  const list = getConfigListById(project, listId);
  const configs = list?.buildConfigurations || [];
  return configs
    .map((c) => ({
      id: c.value || c,
      name: c.comment || c.name || null,
    }))
    .map(({ id, name }) => ({ id, name, cfg: getBuildConfigById(project, id) }))
    .filter(({ cfg }) => cfg && typeof cfg === 'object');
}

module.exports = function withScreenTimeBundleIds(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const nativeTargets = getNativeTargets(project);

    const desiredByTargetName = {
      Sobre: HOST_BUNDLE_ID,
      DeviceActivityMonitorExtension: `${HOST_BUNDLE_ID}.deviceactivitymonitor`,
      ShieldActionExtension: `${HOST_BUNDLE_ID}.shieldaction`,
      ShieldConfigurationExtension: `${HOST_BUNDLE_ID}.shieldconfiguration`,
    };

    console.log(`[withScreenTimeBundleIds] HOST=${HOST_BUNDLE_ID}`);

    // We patch build settings for the known targets, for all configs (Debug/Release/etc).
    for (const target of nativeTargets) {
      const name = normalizeName(target.name);
      const desired = desiredByTargetName[name];
      if (!desired) continue;

      for (const { name: cfgName, cfg } of getTargetBuildConfigs(project, target)) {
        const buildSettings = (cfg.buildSettings = cfg.buildSettings || {});
        const current = buildSettings.PRODUCT_BUNDLE_IDENTIFIER;

        if (current !== desired) {
          buildSettings.PRODUCT_BUNDLE_IDENTIFIER = desired;
          console.log(
            `[withScreenTimeBundleIds] APPLIED target=${name} config=${cfgName} from=${current} to=${desired}`
          );
        } else {
          console.log(`[withScreenTimeBundleIds] NO_CHANGES target=${name} config=${cfgName} value=${desired}`);
        }
      }
    }

    return config;
  });
};

