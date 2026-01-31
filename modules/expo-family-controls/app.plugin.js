const fs = require('fs');
const path = require('path');
const { withDangerousMod, withEntitlementsPlist, withPodfile, withXcodeProject } = require('@expo/config-plugins');

const APP_GROUP = 'group.com.balthazar.sobre';
const EXTENSIONS = [
  {
    name: 'ShieldConfigurationExtension',
    groupPath: '../modules/expo-family-controls/ios/ShieldConfigurationExtension',
    plist: 'Info.plist',
    sources: ['ShieldConfigurationExtension.swift'],
    bundleIdSuffix: '.shieldconfiguration',
  },
  {
    name: 'ShieldActionExtension',
    groupPath: '../modules/expo-family-controls/ios/ShieldActionExtension',
    plist: 'Info.plist',
    sources: ['ShieldActionExtension.swift'],
    bundleIdSuffix: '.shieldaction',
  },
  {
    name: 'DeviceActivityMonitorExtension',
    groupPath: '../modules/expo-family-controls/ios/DeviceActivityMonitorExtension',
    plist: 'Info.plist',
    sources: ['DeviceActivityMonitorExtension.swift'],
    bundleIdSuffix: '.deviceactivitymonitor',
  },
];
const REQUIRED_FRAMEWORKS = [
  'ManagedSettings.framework',
  'FamilyControls.framework',
  'DeviceActivity.framework',
];

function ensureExtensionEntitlements(projectRoot, projectName) {
  const targetDir = path.join(projectRoot, 'ios', projectName);
  EXTENSIONS.forEach((ext) => {
    const entitlementsPath = path.join(targetDir, `${ext.name}.entitlements`);
    if (!fs.existsSync(entitlementsPath)) {
      const contents = `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n` +
        `<plist version="1.0">\n` +
        `  <dict>\n` +
        `    <key>com.apple.security.application-groups</key>\n` +
        `    <array>\n` +
        `      <string>${APP_GROUP}</string>\n` +
        `    </array>\n` +
        `  </dict>\n` +
        `</plist>\n`;
      fs.writeFileSync(entitlementsPath, contents);
    }
  });
}

function addExtensionTargets(config, project) {
  const projectName = config.modRequest.projectName;
  const bundleId = config.ios?.bundleIdentifier;
  const teamId = config.ios?.appleTeamId;
  if (!projectName || !bundleId) {
    return project;
  }

  const mainGroupId = project.getFirstProject().firstProject.mainGroup;

  EXTENSIONS.forEach((ext) => {
    const target = findTarget(project, ext.name) || project.addTarget(
      ext.name,
      'app_extension',
      ext.name,
      `${bundleId}${ext.bundleIdSuffix}`
    );

    const targetUuid = target.uuid;
    ensureBuildPhases(project, targetUuid);
    dedupeBuildPhases(project, targetUuid, ext.name);
    ensureGroup(project, mainGroupId, ext);
    addSourceFiles(project, targetUuid, ext);
    addFrameworks(project, targetUuid);
    dedupeBuildPhases(project, targetUuid, ext.name);
    updateBuildSettings(project, targetUuid, ext, projectName, bundleId, teamId);
  });

  return project;
}

function findTarget(project, name) {
  const targets = project.pbxNativeTargetSection();
  for (const key in targets) {
    const target = targets[key];
    if (target.name === `"${name}"`) {
      return { uuid: key, pbxNativeTarget: target };
    }
  }
  return null;
}

function ensureBuildPhases(project, targetUuid) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  if (!target || !target.buildPhases) return;
  const existing = new Set(target.buildPhases.map((phase) => phase.comment));
  if (!existing.has('Sources')) {
    project.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', targetUuid);
  }
  if (!existing.has('Frameworks')) {
    project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', targetUuid);
  }
}

function ensureGroup(project, mainGroupId, ext) {
  const existing = project.pbxGroupByName(ext.name);
  if (existing) return;
  const group = project.addPbxGroup([], ext.name, ext.groupPath);
  project.addToPbxGroup(group.uuid, mainGroupId);
}

function addSourceFiles(project, targetUuid, ext) {
  const groupKey = getGroupKeyByName(project, ext.name);
  if (!groupKey) return;

  ext.sources.forEach((sourcePath) => {
    if (!hasSourceFile(project, targetUuid, sourcePath)) {
      project.addSourceFile(sourcePath, { target: targetUuid }, groupKey);
    }
  });

  project.addFile(ext.plist, groupKey);
}

function addFrameworks(project, targetUuid) {
  REQUIRED_FRAMEWORKS.forEach((framework) => {
    if (!hasFramework(project, targetUuid, framework)) {
      project.addFramework(framework, { target: targetUuid });
    }
  });
}

function getGroupKeyByName(project, name) {
  const groups = project.hash.project.objects['PBXGroup'];
  for (const key in groups) {
    if (!/_comment$/.test(key)) continue;
    if (groups[key] === name) {
      return key.split('_comment')[0];
    }
  }
  return null;
}

function hasSourceFile(project, targetUuid, sourcePath) {
  const sources = project.pbxSourcesBuildPhaseObj(targetUuid);
  if (!sources || !sources.files) return false;
  const buildFiles = project.hash.project.objects['PBXBuildFile'] || {};
  const fileRefs = project.hash.project.objects['PBXFileReference'] || {};
  return sources.files.some((entry) => {
    const buildFile = buildFiles[entry.value];
    if (!buildFile || !buildFile.fileRef) return false;
    const ref = fileRefs[buildFile.fileRef];
    if (!ref || !ref.path) return false;
    const refPath = String(ref.path).replace(/"/g, '');
    return refPath === sourcePath;
  });
}

function hasFramework(project, targetUuid, frameworkName) {
  const frameworks = project.pbxFrameworksBuildPhaseObj(targetUuid);
  if (!frameworks || !frameworks.files) return false;
  const buildFiles = project.hash.project.objects['PBXBuildFile'] || {};
  const fileRefs = project.hash.project.objects['PBXFileReference'] || {};
  return frameworks.files.some((entry) => {
    const buildFile = buildFiles[entry.value];
    if (!buildFile || !buildFile.fileRef) return false;
    const ref = fileRefs[buildFile.fileRef];
    if (!ref || !ref.path) return false;
    const refPath = String(ref.path).replace(/"/g, '');
    return refPath.endsWith(frameworkName);
  });
}

function dedupeBuildPhases(project, targetUuid, targetName) {
  const target = project.pbxNativeTargetSection()[targetUuid];
  if (!target || !target.buildPhases) return;
  const phaseTypes = [
    'PBXFrameworksBuildPhase',
    'PBXSourcesBuildPhase',
    'PBXResourcesBuildPhase',
    'PBXCopyFilesBuildPhase',
  ];
  const removed = [];

  const keepByType = new Map();
  target.buildPhases = target.buildPhases.filter((phaseRef) => {
    const phaseId = phaseRef.value;
    const type = phaseTypes.find((t) => project.hash.project.objects[t] && project.hash.project.objects[t][phaseId]);
    if (!type) return true;
    if (!keepByType.has(type)) {
      keepByType.set(type, phaseId);
      return true;
    }
    removed.push({ type, id: phaseId });
    return false;
  });

  removed.forEach(({ type, id }) => {
    delete project.hash.project.objects[type][id];
    delete project.hash.project.objects[type][`${id}_comment`];
  });

  if (removed.length > 0) {
    console.log(`SOBRE_EXT_PHASE_DEDUP: removed ${removed.length} duplicate phases for ${targetName}`);
  }
}

function updateBuildSettings(project, targetUuid, ext, projectName, bundleId, teamId) {
  const configs = project.pbxXCBuildConfigurationSection();
  for (const key in configs) {
    const config = configs[key];
    if (!config.buildSettings || config.buildSettings.PRODUCT_NAME !== `"${ext.name}"`) {
      continue;
    }
    const plistPath = path.join(ext.groupPath, ext.plist);
    config.buildSettings.INFOPLIST_FILE = `"${plistPath}"`;
    config.buildSettings.PRODUCT_BUNDLE_IDENTIFIER = `"${bundleId}${ext.bundleIdSuffix}"`;
    config.buildSettings.CODE_SIGN_ENTITLEMENTS = `"${projectName}/${ext.name}.entitlements"`;
    config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '16.0';
    config.buildSettings.SWIFT_VERSION = '5.4';
    if (arguments.length >= 6 && arguments[5]) {
      config.buildSettings.DEVELOPMENT_TEAM = `"${arguments[5]}"`;
      config.buildSettings.CODE_SIGN_STYLE = 'Automatic';
      config.buildSettings.PROVISIONING_PROFILE_SPECIFIER = '""';
      config.buildSettings.PROVISIONING_PROFILE = '""';
    }
  }
}

module.exports = function withFamilyControls(config) {
  config = withEntitlementsPlist(config, (config) => {
    const entitlements = config.modResults;
    entitlements['com.apple.developer.family-controls'] = true;

    const groups = new Set(entitlements['com.apple.security.application-groups'] || []);
    groups.add(APP_GROUP);
    entitlements['com.apple.security.application-groups'] = Array.from(groups);

    config.modResults = entitlements;
    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const projectName = config.modRequest.projectName;
      if (projectName) {
        ensureExtensionEntitlements(config.modRequest.projectRoot, projectName);
      }
      return config;
    },
  ]);

  return withXcodeProject(config, (config) => {
    config.modResults = addExtensionTargets(config, config.modResults);
    return config;
  });
};
