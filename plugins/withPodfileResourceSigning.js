const { withPodfile } = require('@expo/config-plugins');

const SENTINEL = 'SOBRE_RESOURCE_BUNDLE_SIGNING_PATCH';
const TEAM_ID = 'CTJ238754P';

function buildFixBlock(teamId) {
  return `
  # ${SENTINEL}
  [
    installer.pods_project,
    *installer.generated_projects
  ].compact.each do |project|
    project.targets.each do |target|
      if target.respond_to?(:product_type) && target.product_type == "com.apple.product-type.bundle"
        target.build_configurations.each do |config|
          config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
          config.build_settings['CODE_SIGNING_REQUIRED'] = 'NO'
          config.build_settings['CODE_SIGNING_IDENTITY'] = ''
          config.build_settings['DEVELOPMENT_TEAM'] = '${teamId}'
        end
        puts "SOBRE_BUNDLE_TEAM_APPLIED: #{target.name}"
      end
    end
  end
`;
}

module.exports = function withPodfileResourceSigning(config) {
  return withPodfile(config, (config) => {
    const contents = config.modResults.contents;
    if (contents.includes(SENTINEL)) {
      return config;
    }

    const FIX_BLOCK = buildFixBlock(TEAM_ID);

    const postInstallRegex = /post_install do\\s*\\|installer\\|/m;
    if (postInstallRegex.test(contents)) {
      config.modResults.contents = contents.replace(postInstallRegex, (match) => `${match}\n${FIX_BLOCK}\n`);
      return config;
    }
    return config;
  });
};
