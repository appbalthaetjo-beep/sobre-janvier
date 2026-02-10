const { withAppDelegate, withInfoPlist } = require('@expo/config-plugins');

const SHORTCUT_TYPE_TRY_FREE = 'com.balthazar.sobre.tryfree';
const TRY_FREE_URL = 'sobre://paywall?source=quick-action';

const SHORTCUT_TYPE_FEEDBACK = 'com.balthazar.sobre.feedback';
const FEEDBACK_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfU6XQ2MvpqOEGXTuIMuCfq9JNa2WaOvO4wMVFMSP25jAaBNg/viewform';

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
}

function addShortcutItems(infoPlist) {
  const existing = ensureArray(infoPlist.UIApplicationShortcutItems);

  // Keep any existing non-Sobre shortcut items, then append ours (stable order).
  const withoutSobre = existing.filter(
    (item) =>
      item?.UIApplicationShortcutItemType !== SHORTCUT_TYPE_TRY_FREE &&
      item?.UIApplicationShortcutItemType !== SHORTCUT_TYPE_FEEDBACK,
  );

  infoPlist.UIApplicationShortcutItems = [
    ...withoutSobre,
    {
      UIApplicationShortcutItemType: SHORTCUT_TYPE_TRY_FREE,
      UIApplicationShortcutItemTitle: '✨ ESSAYER GRATUITEMENT',
      UIApplicationShortcutItemSubtitle: "Obtiens l’accès complet à l’app SOBRE",
      // iOS 13+ SF Symbol on Home Screen quick actions.
      UIApplicationShortcutItemIconSymbolName: 'exclamationmark.triangle.fill',
    },
    {
      UIApplicationShortcutItemType: SHORTCUT_TYPE_FEEDBACK,
      UIApplicationShortcutItemTitle: '😢 Ne me supprime pas',
      UIApplicationShortcutItemSubtitle: 'Dis-nous pourquoi tu veux quitter SOBRE',
      UIApplicationShortcutItemIconSymbolName: 'exclamationmark.bubble.fill',
    },
  ];

  return infoPlist;
}

function insertAfter(contents, anchor, insertion) {
  if (contents.includes(insertion.trim())) return contents;
  const idx = contents.indexOf(anchor);
  if (idx === -1) return contents;
  return contents.slice(0, idx + anchor.length) + insertion + contents.slice(idx + anchor.length);
}

function patchObjcAppDelegate(contents) {
  // Ensure import for RCTLinkingManager exists.
  if (!contents.includes('RCTLinkingManager')) {
    contents = insertAfter(contents, '#import "AppDelegate.h"\n', '#import <React/RCTLinkingManager.h>\n');
  }

  const helper =
    '\n' +
    'static BOOL SOBREHandleShortcutItem(UIApplicationShortcutItem *shortcutItem) {\n' +
    '  NSURL *url = nil;\n' +
    `  if ([shortcutItem.type isEqualToString:@\"${SHORTCUT_TYPE_TRY_FREE}\"]) {\n` +
    `    url = [NSURL URLWithString:@\"${TRY_FREE_URL}\"];\n` +
    `  } else if ([shortcutItem.type isEqualToString:@\"${SHORTCUT_TYPE_FEEDBACK}\"]) {\n` +
    `    url = [NSURL URLWithString:@\"${FEEDBACK_URL}\"];\n` +
    '  } else {\n' +
    '    return NO;\n' +
    '  }\n' +
    '  if (!url) {\n' +
    '    return NO;\n' +
    '  }\n' +
    '  // Delay slightly so the JS bridge is ready to receive the URL event.\n' +
    '  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.35 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{\n' +
    '    [RCTLinkingManager application:[UIApplication sharedApplication] openURL:url options:@{}];\n' +
    '  });\n' +
    '  return YES;\n' +
    '}\n';

  if (!contents.includes('SOBREHandleShortcutItem')) {
    // Place helper near the top (after imports).
    const firstImplIdx = contents.indexOf('@implementation');
    if (firstImplIdx !== -1) {
      contents = contents.slice(0, firstImplIdx) + helper + contents.slice(firstImplIdx);
    } else {
      contents += helper;
    }
  }

  // Patch didFinishLaunchingWithOptions to handle cold start.
  if (contents.includes('didFinishLaunchingWithOptions') && !contents.includes('UIApplicationLaunchOptionsShortcutItemKey')) {
    contents = contents.replace(
      /didFinishLaunchingWithOptions:\(NSDictionary \*\)launchOptions\s*\{([\s\S]*?)\n\s*return /m,
      (match, body) => {
        const injection =
          '\n  UIApplicationShortcutItem *shortcutItem = launchOptions[UIApplicationLaunchOptionsShortcutItemKey];\n' +
          '  if (shortcutItem) {\n' +
          '    SOBREHandleShortcutItem(shortcutItem);\n' +
          '  }\n\n';
        return `didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {${body}${injection}\n  return `;
      },
    );
  }

  // Add performActionForShortcutItem for warm start.
  if (!contents.includes('performActionForShortcutItem')) {
    const implIdx = contents.indexOf('@implementation');
    if (implIdx !== -1) {
      const method =
        '\n- (void)application:(UIApplication *)application performActionForShortcutItem:(UIApplicationShortcutItem *)shortcutItem completionHandler:(void (^)(BOOL succeeded))completionHandler\n' +
        '{\n' +
        '  BOOL handled = SOBREHandleShortcutItem(shortcutItem);\n' +
        '  completionHandler(handled);\n' +
        '}\n';
      const endIdx = contents.lastIndexOf('@end');
      if (endIdx !== -1) {
        contents = contents.slice(0, endIdx) + method + '\n' + contents.slice(endIdx);
      }
    }
  }

  return contents;
}

function patchSwiftAppDelegate(contents) {
  const coldStartBlock =
    '    if let shortcutItem = launchOptions?[UIApplication.LaunchOptionsKey.shortcutItem] as? UIApplicationShortcutItem {\n' +
    `      if shortcutItem.type == "${SHORTCUT_TYPE_TRY_FREE}",\n` +
    `         let url = URL(string: "${TRY_FREE_URL}") {\n` +
    '        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {\n' +
    '          UIApplication.shared.open(url, options: [:], completionHandler: nil)\n' +
    '        }\n' +
    `      } else if shortcutItem.type == "${SHORTCUT_TYPE_FEEDBACK}",\n` +
    `                let url = URL(string: "${FEEDBACK_URL}") {\n` +
    '        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {\n' +
    '          UIApplication.shared.open(url, options: [:], completionHandler: nil)\n' +
    '        }\n' +
    '      }\n' +
    '    }\n';

  const performActionMethod =
    '\n' +
    '  func application(\n' +
    '    _ application: UIApplication,\n' +
    '    performActionFor shortcutItem: UIApplicationShortcutItem,\n' +
    '    completionHandler: @escaping (Bool) -> Void\n' +
    '  ) {\n' +
    `    if shortcutItem.type == "${SHORTCUT_TYPE_TRY_FREE}",\n` +
    `       let url = URL(string: "${TRY_FREE_URL}") {\n` +
    '      UIApplication.shared.open(url, options: [:], completionHandler: nil)\n' +
    '      completionHandler(true)\n' +
    `    } else if shortcutItem.type == "${SHORTCUT_TYPE_FEEDBACK}",\n` +
    `              let url = URL(string: "${FEEDBACK_URL}") {\n` +
    '      UIApplication.shared.open(url, options: [:], completionHandler: nil)\n' +
    '      completionHandler(true)\n' +
    '    } else {\n' +
    '      completionHandler(false)\n' +
    '    }\n' +
    '  }\n';

  // Remove any previously injected helper method and any calls to it.
  if (contents.includes('handleSobreShortcutItem')) {
    contents = contents.replace(
      /\s*@discardableResult\s*\r?\n\s*private func handleSobreShortcutItem[\s\S]*?\r?\n\s*\}\r?\n/gm,
      '\n',
    );
    contents = contents.replace(/\bhandleSobreShortcutItem\([^)]+\)/g, 'false');
  }

  // Remove any declarations of the previous constants (class scope or local scope).
  contents = contents.replace(/^\s*private let SOBREShortcutTypeTryFree\s*=\s*".*"\s*\r?\n/gm, '');
  contents = contents.replace(/^\s*private let SOBRETryFreeURLString\s*=\s*".*"\s*\r?\n/gm, '');
  contents = contents.replace(/\bSOBREShortcutTypeTryFree\b/g, `"${SHORTCUT_TYPE_TRY_FREE}"`);
  contents = contents.replace(/\bSOBRETryFreeURLString\b/g, `"${TRY_FREE_URL}"`);

  // Cold start: handle in didFinishLaunchingWithOptions (only inject the if-block, never constants).
  if (contents.includes('didFinishLaunchingWithOptions') && !contents.includes('UIApplication.LaunchOptionsKey.shortcutItem')) {
    contents = contents.replace(/didFinishLaunchingWithOptions[\s\S]*?\{\r?\n/m, (m) => m + coldStartBlock);
  }

  // Warm start: performActionForShortcutItem.
  if (!contents.includes('performActionFor shortcutItem')) {
    const endIdx = contents.lastIndexOf('\n}');
    if (endIdx !== -1) {
      contents = contents.slice(0, endIdx) + performActionMethod + contents.slice(endIdx);
    }
  } else {
    // If it exists, ensure it's inline (no helper reference).
    contents = contents.replace(
      /func application\([\s\S]*?performActionFor shortcutItem: UIApplicationShortcutItem[\s\S]*?\)\s*\{\s*[\s\S]*?\}/m,
      (match) => {
        if (
          match.includes('handleSobreShortcutItem') ||
          match.includes('SOBREShortcutTypeTryFree') ||
          match.includes('SOBRETryFreeURLString')
        ) {
          return performActionMethod.trim();
        }
        return match;
      },
    );
  }

  return contents;
}

module.exports = function withHomeScreenQuickActions(config) {
  config = withInfoPlist(config, (config) => {
    config.modResults = addShortcutItems(config.modResults);
    return config;
  });

  config = withAppDelegate(config, (config) => {
    const { language, contents } = config.modResults;
    if (typeof contents !== 'string') return config;

    if (language === 'objc') {
      config.modResults.contents = patchObjcAppDelegate(contents);
      return config;
    }

    if (language === 'swift') {
      config.modResults.contents = patchSwiftAppDelegate(contents);
      return config;
    }

    return config;
  });

  return config;
};

