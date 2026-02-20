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
    resources: ['sobre_wordmark.png', 'sobre_logo.png', 'sobre_shield_logo.png'],
    bundleIdSuffix: '.shieldconfiguration',
  },
  {
    name: 'ShieldActionExtension',
    groupPath: '../modules/expo-family-controls/ios/ShieldActionExtension',
    plist: 'Info.plist',
    sources: ['ShieldActionExtension.swift'],
    resources: [],
    bundleIdSuffix: '.shieldaction',
  },
  {
    name: 'DeviceActivityMonitorExtension',
    groupPath: '../modules/expo-family-controls/ios/DeviceActivityMonitorExtension',
    plist: 'Info.plist',
    sources: ['DeviceActivityMonitorExtension.swift'],
    resources: [],
    bundleIdSuffix: '.deviceactivitymonitor',
  },
];
const REQUIRED_FRAMEWORKS = [
  'ManagedSettings.framework',
  'FamilyControls.framework',
  'DeviceActivity.framework',
];

function ensureNamedGroup(project, mainGroupId, name, groupPath) {
  const existing = project.pbxGroupByName(name);
  if (existing) return existing;
  const group = project.addPbxGroup([], name, groupPath);
  if (group?.uuid && mainGroupId) {
    project.addToPbxGroup(group.uuid, mainGroupId);
  }
  return group;
}

function normalizeTargetName(name) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  return trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.slice(1, -1) : trimmed;
}

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
  const mainTarget = project.getFirstTarget();

  if (!mainTarget) {
    console.warn('[expo-family-controls] No main iOS target found; extensions will not be embedded.');
  }

  // The `xcode` library assumes a "Resources" PBXGroup exists when calling `addResourceFile`.
  // Expo projects don't always have it, so ensure it's present to avoid prebuild crashes.
  ensureNamedGroup(project, mainGroupId, 'Resources', 'Resources');

  EXTENSIONS.forEach((ext) => {
    const target =
      findTarget(project, ext.name) ||
      project.addTarget(ext.name, 'app_extension', ext.name, `${bundleId}${ext.bundleIdSuffix}`);

    const targetUuid = target.uuid;
    ensureBuildPhases(project, targetUuid);
    dedupeBuildPhases(project, targetUuid, ext.name);
    ensureGroup(project, mainGroupId, ext);
    addSourceFiles(project, targetUuid, ext);
    addResourceFiles(config.modRequest.projectRoot, projectName, project, targetUuid, ext);
    addFrameworks(project, targetUuid);
    dedupeBuildPhases(project, targetUuid, ext.name);
    updateBuildSettings(project, targetUuid, ext, projectName, bundleId, teamId);

    // Embed the app extension into the main app target so it is bundled on device.
    if (mainTarget) {
      embedExtensionProduct(project, mainTarget.uuid, targetUuid, ext.name);
    }
  });

  if (mainTarget) {
    cleanupHostEmbeds(project, mainTarget.uuid, EXTENSIONS);
  }

  return project;
}

function embedExtensionProduct(project, hostTargetUuid, extTargetUuid, extName) {
  const extTarget = project.pbxNativeTargetSection()[extTargetUuid];
  if (!extTarget) return;

  const productRefId = extTarget.productReference;
  if (!productRefId) return;

  const fileRefs = project.hash.project.objects['PBXFileReference'] || {};
  const productFile = fileRefs[productRefId];
  const productPath = (productFile && productFile.path) ? String(productFile.path).replace(/"/g, '') : `${extName}.appex`;

  const buildFiles = project.hash.project.objects['PBXBuildFile'] || (project.hash.project.objects['PBXBuildFile'] = {});
  const copyPhases = project.hash.project.objects['PBXCopyFilesBuildPhase'] || (project.hash.project.objects['PBXCopyFilesBuildPhase'] = {});

  // Find or create the Embed App Extensions phase.
  let phaseId = null;
  for (const key in copyPhases) {
    const phase = copyPhases[key];
    if (phase && phase.name === '"Embed App Extensions"') {
      phaseId = key;
      break;
    }
  }

  if (!phaseId) {
    phaseId = project.addBuildPhase([], 'PBXCopyFilesBuildPhase', 'Embed App Extensions', hostTargetUuid, {
      dstSubfolderSpec: '13', // PlugIns
      name: '"Embed App Extensions"',
    });
  }
  if (!phaseId) return;

  // refresh after possible creation
  const phase = project.hash.project.objects['PBXCopyFilesBuildPhase'][phaseId];
  if (!phase) return;
  phase.files = phase.files || [];

  // Check if already present
  const already = phase.files.some((f) => {
    const bf = buildFiles[f.value];
    return bf && bf.fileRef === productRefId;
  });
  if (already) return;

  // Create a PBXBuildFile entry for the appex product.
  const buildFileUuid = project.generateUuid();
  buildFiles[buildFileUuid] = {
    isa: 'PBXBuildFile',
    fileRef: productRefId,
    settings: { ATTRIBUTES: ['RemoveHeadersOnCopy', 'CodeSignOnCopy'] },
  };
  buildFiles[`${buildFileUuid}_comment`] = `${extName}.appex in Embed App Extensions`;

  // Attach to the copy phase.
  phase.files.push({ value: buildFileUuid, comment: `${extName}.appex in Embed App Extensions` });
}

function findTarget(project, name) {
  const targets = project.pbxNativeTargetSection();
  const desired = normalizeTargetName(name);
  for (const key in targets) {
    const target = targets[key];
    const targetName = normalizeTargetName(target.name);
    if (targetName === desired) {
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
  if (!existing.has('Resources')) {
    project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', targetUuid);
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

function addResourceFiles(projectRoot, projectName, project, targetUuid, ext) {
  const groupKey = getGroupKeyByName(project, ext.name);
  if (!groupKey) {
    console.warn(`[expo-family-controls] Skip resources: missing Xcode group for ${ext.name}`);
    return;
  }
  if (!ext.resources || ext.resources.length === 0) return;

  ext.resources.forEach((resourcePath) => {
    if (!resourcePath) {
      console.warn('[expo-family-controls] Skip missing resource: <undefined>');
      return;
    }

    // Don't assume a fixed filesystem layout here: in prebuild/build environments
    // `ios/` may be generated and the extension group path can be outside the iOS directory.
    // We'll attempt a few common candidate locations for a gentle existence check, but never
    // fail the prebuild if we can't find the file.
    const candidates = [
      path.resolve(projectRoot, 'ios', projectName, ext.groupPath, resourcePath),
      path.resolve(projectRoot, 'ios', ext.groupPath, resourcePath),
      path.resolve(projectRoot, ext.groupPath, resourcePath),
      path.resolve(projectRoot, ext.groupPath.replace(/^\.\.[\\/]/, ''), resourcePath),
    ];
    const existsSomewhere = candidates.some((p) => {
      try {
        return fs.existsSync(p);
      } catch {
        return false;
      }
    });
    if (!existsSomewhere) {
      console.warn('[expo-family-controls] Skip missing resource:', resourcePath);
      // Still try to add it to the Xcode project (some builds can resolve it relative to groupPath).
    }

    if (hasResourceFile(project, targetUuid, resourcePath)) return;

    try {
      project.addResourceFile(resourcePath, { target: targetUuid }, groupKey);
    } catch (e) {
      console.warn('[expo-family-controls] Failed to add resource, skipping:', resourcePath, e?.message || e);
    }
  });
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

function hasResourceFile(project, targetUuid, resourcePath) {
  const resources = project.pbxResourcesBuildPhaseObj(targetUuid);
  if (!resources || !resources.files) return false;
  const buildFiles = project.hash.project.objects['PBXBuildFile'] || {};
  const fileRefs = project.hash.project.objects['PBXFileReference'] || {};
  return resources.files.some((entry) => {
    const buildFile = buildFiles[entry.value];
    if (!buildFile || !buildFile.fileRef) return false;
    const ref = fileRefs[buildFile.fileRef];
    if (!ref || !ref.path) return false;
    const refPath = String(ref.path).replace(/"/g, '');
    return refPath === resourcePath;
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

function cleanupHostEmbeds(project, hostTargetUuid, extensions) {
  const target = project.pbxNativeTargetSection()[hostTargetUuid];
  if (!target || !target.buildPhases) return;

  const copyPhases = project.hash.project.objects['PBXCopyFilesBuildPhase'] || {};
  const buildFiles = project.hash.project.objects['PBXBuildFile'] || {};
  const fileRefs = project.hash.project.objects['PBXFileReference'] || {};

  const extFileRefs = new Set();
  const extNamesByFileRef = new Map();
  const extProductRefs = new Map();

  extensions.forEach((ext) => {
    const existing = findTarget(project, ext.name);
    if (!existing) return;
    const productRefId = existing.pbxNativeTarget.productReference;
    if (!productRefId) return;
    const product = fileRefs[productRefId];
    if (!product) return;
    extFileRefs.add(productRefId);
    extNamesByFileRef.set(productRefId, ext.name);
    extProductRefs.set(ext.name, productRefId);
  });

  if (extFileRefs.size === 0) return;

  const seenInEmbedPhase = new Set();

  target.buildPhases.forEach((phaseRef) => {
    const phaseId = phaseRef.value;
    const phase = copyPhases[phaseId];
    if (!phase) return;

    const isEmbedPhase = phase.name === '"Embed App Extensions"' || phase.dstSubfolderSpec === '13';
    if (isEmbedPhase) {
      phase.dstSubfolderSpec = '13';
      phase.name = '"Embed App Extensions"';
    }

    const nextFiles = [];
    (phase.files || []).forEach((entry) => {
      const bf = buildFiles[entry.value];
      const ref = bf?.fileRef;
      const isExt = ref && extFileRefs.has(ref);
      if (!isExt) {
        nextFiles.push(entry);
        return;
      }

      const extName = extNamesByFileRef.get(ref);
      if (!isEmbedPhase) {
        // remove copies to wrong destinations (e.g., PrivateHeaders)
        delete buildFiles[entry.value];
        delete buildFiles[`${entry.value}_comment`];
        return;
      }

      if (seenInEmbedPhase.has(ref)) {
        // duplicate within embed phase
        delete buildFiles[entry.value];
        delete buildFiles[`${entry.value}_comment`];
        return;
      }

      // ensure attributes copy to PlugIns only
      bf.settings = { ATTRIBUTES: ['RemoveHeadersOnCopy', 'CodeSignOnCopy'] };
      nextFiles.push(entry);
      seenInEmbedPhase.add(ref);
    });

    phase.files = nextFiles;
  });

  // If an extension product was not present in any embed phase (because we deleted wrong copies),
  // re-embed it correctly.
  extensions.forEach((ext) => {
    const productRefId = extProductRefs.get(ext.name);
    if (!productRefId || seenInEmbedPhase.has(productRefId)) return;
    const existing = findTarget(project, ext.name);
    if (existing) {
      embedExtensionProduct(project, hostTargetUuid, existing.uuid, ext.name);
    }
  });
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
