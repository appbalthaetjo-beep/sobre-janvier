const { withPodfile } = require('@expo/config-plugins');

const SENTINEL = 'SOBRE_RESOURCE_BUNDLE_SIGNING_PATCH';
const TEAM_ID = 'CTJ238754P';

function buildFixBlock(teamId) {
  return `
  # ${SENTINEL}
  puts "SOBRE_PODFILE_PATCH_APPLIED"
  puts "SOBRE_PATCH_TEAM=${teamId}"
  puts "SOBRE_POST_INSTALL_MARKER: running post_install"

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
           "TREAT_WARNINGS_AS_ERRORS=#{config.build_settings['SWIFT_TREAT_WARNINGS_AS_ERRORS']}"
    end
  end

  puts "SOBRE_PODS_SWIFT_VERSION_OVERRIDE_REMOVED"

  # Targeted patch for RevenueCat's EventsManager.swift (reported by the build logs).
  # We avoid changing actor isolation of RevenueCat types; instead we wrap the UIKit calls
  # in a tiny helper that hops onto the MainActor.
  begin
    if installer.pods_project.targets.any? { |t| t.name == 'RevenueCat' }
      pods_root = installer.sandbox.root.to_s
      events_manager_path = File.join(pods_root, 'RevenueCat', 'Sources', 'Events', 'EventsManager.swift')
      events_manager_path = File.join(pods_root, 'Pods', 'RevenueCat', 'Sources', 'Events', 'EventsManager.swift') unless File.exist?(events_manager_path)

      puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_START: pods_root=#{pods_root} events_manager_path=#{events_manager_path}"
      puts "SOBRE_REVENUECAT_BG_TASK_PATCH_START: pods_root=#{pods_root} events_manager_path=#{events_manager_path}"

      if File.exist?(events_manager_path)
        content = File.read(events_manager_path)

        if content.include?('SOBRE_REVENUECAT_MAINACTOR_PATCH')
          puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_SKIPPED_ALREADY_PATCHED: #{events_manager_path}"
          puts "SOBRE_REVENUECAT_BG_TASK_PATCH_SKIPPED_ALREADY_PATCHED: #{events_manager_path}"
        else
          new_content = content.dup

          new_content.gsub!(
            /application\\.beginBackgroundTask\\(\\s*withName:\\s*([^\\)]+)\\)/,
            'SobreRevenueCatBGTask.begin(application: application, taskName: \\1)'
          )
          new_content.gsub!(
            /application\\.endBackgroundTask\\(\\s*([^\\)]+?)\\s*\\)/,
            'SobreRevenueCatBGTask.end(application: application, taskID: \\1)'
          )

          if new_content == content
            puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_NO_CHANGES: #{events_manager_path}"
            puts "SOBRE_REVENUECAT_BG_TASK_PATCH_NO_CHANGES: #{events_manager_path}"
          else
            helper = <<~SWIFT_HELPER

            // SOBRE_REVENUECAT_BG_TASK_PATCH
            // SOBRE_REVENUECAT_MAINACTOR_PATCH
            private enum SobreRevenueCatBGTask {
              static func begin(
                application: UIApplication,
                taskName: String,
                expirationHandler: @escaping () -> Void
              ) -> UIBackgroundTaskIdentifier {
                if Thread.isMainThread {
                  return application.beginBackgroundTask(withName: taskName, expirationHandler: expirationHandler)
                }

                let box = Atomic<UIBackgroundTaskIdentifier>(.invalid)
                let sema = DispatchSemaphore(value: 0)
                Task { @MainActor in
                  box.value = application.beginBackgroundTask(withName: taskName, expirationHandler: expirationHandler)
                  sema.signal()
                }
                sema.wait()
                return box.value
              }

              static func end(
                application: UIApplication,
                taskID: UIBackgroundTaskIdentifier
              ) {
                Task { @MainActor in
                  application.endBackgroundTask(taskID)
                }
              }
            }
            SWIFT_HELPER

            File.write(events_manager_path, new_content + helper)
            puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_APPLIED: #{events_manager_path}"
            puts "SOBRE_REVENUECAT_BG_TASK_PATCH_APPLIED: #{events_manager_path}"
          end
        end
      else
        puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_MISSING_FILE: #{events_manager_path}"
        puts "SOBRE_REVENUECAT_BG_TASK_PATCH_MISSING_FILE: #{events_manager_path}"
      end
    end
  rescue => e
    puts "SOBRE_REVENUECAT_MAINACTOR_PATCH_ERROR: #{e.class} #{e.message}"
    puts "SOBRE_REVENUECAT_BG_TASK_PATCH_ERROR: #{e.class} #{e.message}"
  end

  # Patch expo-modules-core sources in node_modules (Swift 6 / SwiftUI compatibility).
  begin
    project_dir = Dir.pwd
    expo_core_root = File.join(project_dir, 'node_modules', 'expo-modules-core', 'ios')
    expo_core_root = File.join(File.expand_path('..', project_dir), 'node_modules', 'expo-modules-core', 'ios') unless Dir.exist?(expo_core_root)

    # 1) AnyChild.swift: move nested protocol outside the ExpoSwiftUI extension (Swift 6 forbids it).
    anychild_path = File.join(expo_core_root, 'Core', 'Views', 'SwiftUI', 'AnyChild.swift')
    if File.exist?(anychild_path)
      content = File.read(anychild_path)

      if content.include?('typealias AnyChild = ExpoSwiftUIAnyChild') || content.include?('protocol ExpoSwiftUIAnyChild')
        puts "SOBRE_EXPO_ANYCHILD_PATCH_SKIPPED_ALREADY_PATCHED: #{anychild_path}"
      else
        lines = content.lines
        ext_start = lines.find_index { |l| l.strip.start_with?('extension ExpoSwiftUI') && l.include?('{') }
        proto_start = lines.find_index { |l| l.include?('protocol AnyChild') }

        if ext_start && proto_start && proto_start > ext_start
          # Find protocol end by counting braces (Swift property requirements contain balanced braces).
          brace = 0
          proto_end = nil
          (proto_start...lines.length).each do |i|
            brace += lines[i].count('{')
            brace -= lines[i].count('}')
            if i > proto_start && brace == 0
              proto_end = i
              break
            end
          end

          # Find extension end by counting braces.
          brace = 0
          ext_end = nil
          (ext_start...lines.length).each do |i|
            brace += lines[i].count('{')
            brace -= lines[i].count('}')
            if i > ext_start && brace == 0
              ext_end = i
              break
            end
          end

          if proto_end && ext_end && ext_end >= proto_end
            body_lines = lines[(proto_start + 1)...proto_end] || []
            new_block = []
            new_block << "public protocol ExpoSwiftUIAnyChild: SwiftUI.View {\\n"
            new_block.concat(body_lines)
            new_block << "}\\n\\n"
            new_block << "extension ExpoSwiftUI {\\n"
            new_block << "  public typealias AnyChild = ExpoSwiftUIAnyChild\\n"
            new_block << "}\\n"

            new_lines = lines[0...ext_start] + new_block + lines[(ext_end + 1)..-1].to_a
            new_content = new_lines.join

            if new_content != content
              File.write(anychild_path, new_content)
              puts "SOBRE_EXPO_ANYCHILD_PATCH_APPLIED: #{anychild_path}"
            else
              puts "SOBRE_EXPO_ANYCHILD_PATCH_NO_CHANGES: #{anychild_path}"
            end
          else
            puts "SOBRE_EXPO_ANYCHILD_PATCH_NO_CHANGES: #{anychild_path}"
          end
        else
          puts "SOBRE_EXPO_ANYCHILD_PATCH_NO_CHANGES: #{anychild_path}"
        end
      end
    else
      puts "SOBRE_EXPO_ANYCHILD_PATCH_MISSING_FILE: #{anychild_path}"
    end

    # 2) SwiftUIHostingView.swift: move WithHostingView outside ExpoSwiftUI extension.
    withhosting_path = File.join(expo_core_root, 'Core', 'Views', 'SwiftUI', 'SwiftUIHostingView.swift')
    if File.exist?(withhosting_path)
      content = File.read(withhosting_path)

      if content.include?('typealias WithHostingView = ExpoSwiftUIWithHostingView') || content.include?('protocol ExpoSwiftUIWithHostingView')
        puts "SOBRE_EXPO_WITHHOSTING_PATCH_NO_CHANGES: #{withhosting_path}"
      else
        lines = content.lines
        changed = false

        # Insert global protocol near the top (after AnyExpoSwiftUIHostingView), if present.
        any_hosting_idx = lines.find_index { |l| l.strip.start_with?('internal protocol AnyExpoSwiftUIHostingView') }
        if any_hosting_idx
          brace = 0
          any_hosting_end = nil
          (any_hosting_idx...lines.length).each do |i|
            brace += lines[i].count('{')
            brace -= lines[i].count('}')
            if i > any_hosting_idx && brace == 0
              any_hosting_end = i
              break
            end
          end
          if any_hosting_end
            lines.insert(any_hosting_end + 1, "\\npublic protocol ExpoSwiftUIWithHostingView {}\\n\\n")
            changed = true
          end
        else
          # Fallback: insert after the SwiftUI import.
          import_idx = lines.find_index { |l| l.strip == 'import SwiftUI' }
          if import_idx
            lines.insert(import_idx + 1, "\\npublic protocol ExpoSwiftUIWithHostingView {}\\n\\n")
            changed = true
          end
        end

        # Replace the nested protocol block with a typealias.
        wh_start = lines.find_index { |l| l.include?('protocol WithHostingView') }
        if wh_start
          brace = 0
          wh_end = nil
          (wh_start...lines.length).each do |i|
            brace += lines[i].count('{')
            brace -= lines[i].count('}')
            if i > wh_start && brace == 0
              wh_end = i
              break
            end
          end
          if wh_end
            indent_len = lines[wh_start].length - lines[wh_start].lstrip.length
            indent = lines[wh_start][0, indent_len] || ''
            lines[wh_start..wh_end] = ["#{indent}public typealias WithHostingView = ExpoSwiftUIWithHostingView\\n"]
            changed = true
          end
        end

        new_content = lines.join
        if changed && new_content != content
          File.write(withhosting_path, new_content)
          puts "SOBRE_EXPO_WITHHOSTING_PATCH_APPLIED: #{withhosting_path}"
        else
          puts "SOBRE_EXPO_WITHHOSTING_PATCH_NO_CHANGES: #{withhosting_path}"
        end
      end
    else
      puts "SOBRE_EXPO_WITHHOSTING_PATCH_MISSING_FILE: #{withhosting_path}"
    end

    # 3) AutoSizingStack.swift: provide a polyfill for onGeometryChange.
    autosizing_path = File.join(expo_core_root, 'Core', 'Views', 'SwiftUI', 'AutoSizingStack.swift')
    if File.exist?(autosizing_path)
      content = File.read(autosizing_path)
      if content.include?('SOBRE_EXPO_ONGEOMETRYCHANGE_PATCH')
        puts "SOBRE_EXPO_ONGEOMETRYCHANGE_PATCH_SKIPPED_ALREADY_PATCHED: #{autosizing_path}"
      else
        polyfill = <<~SWIFT_POLYFILL

        // SOBRE_EXPO_ONGEOMETRYCHANGE_PATCH
        import SwiftUI

        extension View {
          func onGeometryChange<T>(
            for _: T.Type,
            of value: @escaping (GeometryProxy) -> T,
            action: @escaping (T) -> Void
          ) -> some View {
            background(
              GeometryReader { proxy in
                let v = value(proxy)
                DispatchQueue.main.async {
                  action(v)
                }
                Color.clear
              }
            )
          }
        }
        SWIFT_POLYFILL

        File.write(autosizing_path, content + polyfill)
        puts "SOBRE_EXPO_ONGEOMETRYCHANGE_PATCH_APPLIED: #{autosizing_path}"
      end
    else
      puts "SOBRE_EXPO_ONGEOMETRYCHANGE_PATCH_MISSING_FILE: #{autosizing_path}"
    end

    # 4) CoreModule.swift: add explicit return type for Constant("expoModulesCoreVersion").
    coremodule_path = File.join(expo_core_root, 'Core', 'Modules', 'CoreModule.swift')
    if File.exist?(coremodule_path)
      content = File.read(coremodule_path)
      if content.include?('Constant("expoModulesCoreVersion") { () -> String in')
        puts "SOBRE_EXPO_VERSION_CONSTANT_PATCH_NO_CHANGES: #{coremodule_path}"
      else
        lines = content.lines
        start_idx = lines.find_index { |l| l.include?('Constant("expoModulesCoreVersion")') }
        if start_idx
          brace = 0
          end_idx = nil
          (start_idx...lines.length).each do |i|
            brace += lines[i].count('{')
            brace -= lines[i].count('}')
            if i > start_idx && brace == 0
              end_idx = i
              break
            end
          end

          if end_idx
            indent_len = lines[start_idx].length - lines[start_idx].lstrip.length
            indent = lines[start_idx][0, indent_len] || ''

            replacement = []
            replacement << indent + 'Constant("expoModulesCoreVersion") { () -> String in' + "\\n"
            replacement << indent + '  let version = CoreModuleHelper.getVersion()' + "\\n"
            replacement << indent + '  let clean = version.split(separator: "-")[0]' + "\\n"
            replacement << indent + '  return String(clean)' + "\\n"
            replacement << indent + '}' + "\\n"

            lines[start_idx..end_idx] = replacement
            new_content = lines.join

            if new_content != content
              File.write(coremodule_path, new_content)
              puts "SOBRE_EXPO_VERSION_CONSTANT_PATCH_APPLIED: #{coremodule_path}"
            else
              puts "SOBRE_EXPO_VERSION_CONSTANT_PATCH_NO_CHANGES: #{coremodule_path}"
            end
          else
            puts "SOBRE_EXPO_VERSION_CONSTANT_PATCH_NO_CHANGES: #{coremodule_path}"
          end
        else
          puts "SOBRE_EXPO_VERSION_CONSTANT_PATCH_NO_CHANGES: #{coremodule_path}"
        end
      end
    else
      puts "SOBRE_EXPO_VERSION_CONSTANT_PATCH_MISSING_FILE: #{coremodule_path}"
    end
  rescue => e
    puts "SOBRE_EXPO_PATCH_ERROR: #{e.class} #{e.message}"
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
