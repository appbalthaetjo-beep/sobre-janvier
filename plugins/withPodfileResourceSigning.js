const { withPodfile } = require('@expo/config-plugins');

const SENTINEL = 'SOBRE_RESOURCE_BUNDLE_SIGNING_PATCH';
const TEAM_ID = 'CTJ238754P';

function buildFixBlock(teamId) {
  return `
  # ${SENTINEL}
  puts "SOBRE_PODFILE_PATCH_APPLIED"
  puts "SOBRE_PATCH_TEAM=${teamId}"

  apply_signing_patch = lambda do |config|
    config.build_settings['DEVELOPMENT_TEAM'] = '${teamId}'
    config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
    config.build_settings['CODE_SIGNING_REQUIRED'] = 'NO'
    config.build_settings['CODE_SIGNING_IDENTITY'] = ''
    config.build_settings['EXPANDED_CODE_SIGN_IDENTITY'] = ''
    config.build_settings['PROVISIONING_PROFILE_SPECIFIER'] = ''
    config.build_settings['PROVISIONING_PROFILE'] = ''
  end

  apply_project_patch = lambda do |project|
    project.build_configurations.each do |config|
      apply_signing_patch.call(config)
    end
  end

  apply_target_patch = lambda do |target|
    target.build_configurations.each do |config|
      apply_signing_patch.call(config)
    end
  end

  # Relax Swift concurrency checks + ensure "warnings as errors" doesn't break builds for RevenueCat.
  installer.pods_project.targets.each do |target|
    # Only touch the RevenueCat pod target.
    next unless target.name == 'RevenueCat'

    target.build_configurations.each do |config|
      # Keep concurrency checks permissive, but use a value supported by Swift/Xcode.
      # (Swift does not accept "-strict-concurrency=none".)
      config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'

      # Force Swift 5 language mode for this pod. In Swift 6 language mode,
      # main-actor isolation violations are treated as errors regardless of strict concurrency setting.
      config.build_settings['SWIFT_VERSION'] = '5.0'

      # Never treat warnings as errors for this pod (Swift + C/ObjC).
      config.build_settings['SWIFT_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
      config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'

      # Remove any flag that forces warnings-as-errors, and any invalid strict-concurrency flag.
      flags = config.build_settings['OTHER_SWIFT_FLAGS']
      if flags.is_a?(String)
        flags = flags.split(' ')
      end
      if flags.is_a?(Array)
        cleaned = []
        i = 0
        while i < flags.length
          f = flags[i]

          # Driver-level flags (may appear without -Xfrontend).
          if f.include?('warnings-as-errors') || f.include?('strict-concurrency=none')
            i += 1
            next
          end

          # Frontend flags (paired as: -Xfrontend <flag>).
          if f == '-Xfrontend' && (i + 1) < flags.length
            next_flag = flags[i + 1]
            if next_flag.include?('warnings-as-errors') || next_flag.include?('strict-concurrency=none')
              i += 2
              next
            end
          end

          cleaned << f
          i += 1
        end

        config.build_settings['OTHER_SWIFT_FLAGS'] = cleaned
      end

      puts "SOBRE_PODS_RELAX_APPLIED: #{target.name} (#{config.name}) " \
           "STRICT_CONCURRENCY=#{config.build_settings['SWIFT_STRICT_CONCURRENCY']} " \
           "SWIFT_VERSION=#{config.build_settings['SWIFT_VERSION']} " \
           "TREAT_WARNINGS_AS_ERRORS=#{config.build_settings['SWIFT_TREAT_WARNINGS_AS_ERRORS']}"
    end
  end

  # Patch RevenueCat sources in Pods to avoid Swift main-actor isolation compile errors on Xcode 17+.
  # This is intentionally idempotent and only touches files that reference begin/endBackgroundTask.
  if installer.pods_project.targets.any? { |t| t.name == 'RevenueCat' }
    pods_root = installer.sandbox.root.to_s
    revenuecat_sources_dir = File.join(pods_root, 'RevenueCat', 'Sources')
    revenuecat_sources_dir = File.join(pods_root, 'Pods', 'RevenueCat', 'Sources') unless Dir.exist?(revenuecat_sources_dir)

    if Dir.exist?(revenuecat_sources_dir)
      Dir.glob(File.join(revenuecat_sources_dir, '**', '*.swift')).each do |path|
        content = File.read(path)

        next unless content.include?('beginBackgroundTask(') || content.include?('endBackgroundTask(')
        next if content.include?('@MainActor')

        # Insert @MainActor before the first class declaration in the file.
        new_content = content.sub(/(^|\\n)(\\s*)((?:(?:public|open|internal|private|fileprivate)\\s+)?(?:(?:final)\\s+)?class\\s+)/) do
          prefix = Regexp.last_match(1)
          indent = Regexp.last_match(2)
          decl = Regexp.last_match(3)
          "#{prefix}#{indent}@MainActor\\n#{indent}#{decl}"
        end

        next if new_content == content

        File.write(path, new_content)
        puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_APPLIED: #{path}"
      end
    else
      puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_MISSING_DIR: #{revenuecat_sources_dir}"
    end
  end

  # Targeted patch for RevenueCat's EventsManager.swift (the file reported by the build logs).
  # Uses installer.sandbox.root to avoid path issues in EAS environments.
  begin
    if installer.pods_project.targets.any? { |t| t.name == 'RevenueCat' }
      pods_root = installer.sandbox.root.to_s
      events_manager_path = File.join(pods_root, 'RevenueCat', 'Sources', 'Events', 'EventsManager.swift')
      events_manager_path = File.join(pods_root, 'Pods', 'RevenueCat', 'Sources', 'Events', 'EventsManager.swift') unless File.exist?(events_manager_path)

      if File.exist?(events_manager_path)
        content = File.read(events_manager_path)

        unless content.include?('@MainActor')
          new_content = content.sub(
            /(^|\\n)(\\s*)((?:(?:public|open|internal|private|fileprivate)\\s+)?(?:(?:final)\\s+)?class\\s+EventsManager\\b)/
          ) do
            prefix = Regexp.last_match(1)
            indent = Regexp.last_match(2)
            decl = Regexp.last_match(3)
            "#{prefix}#{indent}@MainActor\\n#{indent}#{decl}"
          end

          if new_content != content
            File.write(events_manager_path, new_content)
            puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_APPLIED: #{events_manager_path}"
          else
            puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_SKIPPED_NO_MATCH: #{events_manager_path}"
          end
        else
          puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_SKIPPED_ALREADY_ANNOTATED: #{events_manager_path}"
        end
      else
        puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_MISSING_FILE: #{events_manager_path}"
      end
    end
  rescue => e
    puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_ERROR: #{e}"
  end

  [installer.pods_project, *installer.generated_projects].compact.each do |project|
    apply_project_patch.call(project)
    project.targets.each do |target|
      apply_target_patch.call(target)
      if target.respond_to?(:product_type) && target.product_type == "com.apple.product-type.bundle"
        puts "SOBRE_BUNDLE_TEAM_APPLIED: #{target.name}"
      end
    end
  end
`;
}

module.exports = function withPodfileResourceSigning(config) {
  console.log('[withPodfileResourceSigning] applying Podfile signing patch');
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;
    if (contents.includes(SENTINEL)) {
      return config;
    }

    const FIX_BLOCK = buildFixBlock(TEAM_ID);
    const postInstallRegex = /post_install do\s*\|installer\|/m;

    if (postInstallRegex.test(contents)) {
      config.modResults.contents = contents.replace(postInstallRegex, (match) => `${match}\n${FIX_BLOCK}\n`);
    }

    return config;
  });
};
