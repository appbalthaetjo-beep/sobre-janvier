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
      # Disable strict concurrency for this pod.
      config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'none'

      # Never treat warnings as errors for this pod (Swift + C/ObjC).
      config.build_settings['SWIFT_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
      config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'

      # Remove any flag that forces warnings-as-errors.
      flags = config.build_settings['OTHER_SWIFT_FLAGS']
      if flags.is_a?(String)
        flags = flags.split(' ')
      end
      if flags.is_a?(Array)
        flags = flags.reject { |f| f.include?('warnings-as-errors') }
        config.build_settings['OTHER_SWIFT_FLAGS'] = flags
      end

      puts "SOBRE_PODS_RELAX_APPLIED: #{target.name} (#{config.name}) " \
           "STRICT_CONCURRENCY=#{config.build_settings['SWIFT_STRICT_CONCURRENCY']} " \
           "TREAT_WARNINGS_AS_ERRORS=#{config.build_settings['SWIFT_TREAT_WARNINGS_AS_ERRORS']}"
    end
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
