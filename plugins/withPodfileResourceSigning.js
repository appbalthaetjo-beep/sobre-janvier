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

    # 3) AutoSizingStack.swift: provide a Swift 6 compatibility shim for onGeometryChange.
    autosizing_path = File.join(expo_core_root, 'Core', 'Views', 'SwiftUI', 'AutoSizingStack.swift')
    if File.exist?(autosizing_path)
      content = File.read(autosizing_path)
      stub = <<~SWIFT_STUB

      // SOBRE_EXPO_ONGEOMETRYCHANGE_PATCH
      import SwiftUI

      extension View {
        @inlinable
        func onGeometryChange<Value>(
          for _: Value.Type,
          of _: @escaping (GeometryProxy) -> Value,
          action _: @escaping (Value) -> Void
        ) -> some View {
          // Swift 6 compatibility shim:
          // On désactive complètement la logique de "geometry change" d'Expo
          // pour éviter les problèmes de result builder / SwiftUI.
          self
        }
      }
      SWIFT_STUB

      marker = "// SOBRE_EXPO_ONGEOMETRYCHANGE_PATCH"

      if content.include?(marker)
        # If previously patched with an older implementation, replace the entire patch block.
        if content.include?("Swift 6 compatibility shim:")
          puts "SOBRE_EXPO_ONGEOMETRYCHANGE_PATCH_SKIPPED_ALREADY_PATCHED: #{autosizing_path}"
        else
          idx = content.index(marker)
          new_content = content[0...idx - 1].rstrip + stub
          File.write(autosizing_path, new_content)
          puts "SOBRE_EXPO_ONGEOMETRYCHANGE_PATCH_APPLIED: #{autosizing_path}"
        end
      else
        File.write(autosizing_path, content + stub)
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

  # Patch expo-notifications sources for Swift 6 (closure return type inference).
  begin
    ios_dir = Dir.pwd
    project_root = File.expand_path('..', ios_dir)
    pods_root = installer.sandbox.root.to_s

    roots = [
      File.join(project_root, 'node_modules', 'expo-notifications', 'ios', 'EXNotifications'),
      File.join(ios_dir, 'node_modules', 'expo-notifications', 'ios', 'EXNotifications'),
      File.join(pods_root, 'EXNotifications'),
      File.join(pods_root, 'Pods', 'EXNotifications')
    ].uniq

    patches = [
      [
        File.join('Notifications', 'Background', 'BackgroundEventTransformer.swift'),
        lambda do |content|
          needle = 'let jsonData: String? = { () -> String? in'
          if content.include?(needle)
            content
          else
            content.gsub('let jsonData: String? = {', needle)
          end
        end
      ],
      [
        File.join('Notifications', 'Categories', 'CategoriesModule.swift'),
        lambda do |content|
          needle = 'AsyncFunction("getNotificationCategoriesAsync") { () async -> [CategoryRecord] in'
          if content.include?(needle)
            content
          else
            content.gsub('AsyncFunction("getNotificationCategoriesAsync") {', needle)
          end
        end
      ],
      [
        File.join('Notifications', 'Presenting', 'PresentationModule.swift'),
        lambda do |content|
          needle = 'AsyncFunction("getPresentedNotificationsAsync") { () async -> [[String: Any]] in'
          if content.include?(needle)
            content
          else
            content.gsub('AsyncFunction("getPresentedNotificationsAsync") {', needle)
          end
        end
      ],
      [
        File.join('Notifications', 'Scheduling', 'SchedulerModule.swift'),
        lambda do |content|
          needle = 'AsyncFunction("getAllScheduledNotificationsAsync") { () async -> [[String: Any]] in'
          if content.include?(needle)
            content
          else
            content.gsub('AsyncFunction("getAllScheduledNotificationsAsync") {', needle)
          end
        end
      ]
    ]

    patches.each do |rel_path, patch_fn|
      found_any = false

      roots.each do |root|
        full_path = File.join(root, rel_path)
        next unless File.exist?(full_path)
        found_any = true

        begin
          content = File.read(full_path)
          new_content = patch_fn.call(content)

          if new_content == content
            puts "SOBRE_EXPO_NOTIFICATIONS_PATCH_NO_CHANGES: #{full_path}"
          else
            File.write(full_path, new_content)
            puts "SOBRE_EXPO_NOTIFICATIONS_PATCH_APPLIED: #{full_path}"
          end
        rescue => e
          puts "SOBRE_EXPO_NOTIFICATIONS_PATCH_ERROR: #{e.class} #{e.message}"
        end
      end

      unless found_any
        puts "SOBRE_EXPO_NOTIFICATIONS_PATCH_MISSING_FILE: #{File.join(project_root, 'node_modules', 'expo-notifications', 'ios', 'EXNotifications', rel_path)}"
      end
    end
  rescue => e
    puts "SOBRE_EXPO_NOTIFICATIONS_PATCH_ERROR: #{e.class} #{e.message}"
  end

  # Patch expo-camera sources for Swift 6 / iOS 17.2 SDK compatibility.
  begin
    ios_dir = Dir.pwd
    project_root = File.expand_path('..', ios_dir)
    pods_root = installer.sandbox.root.to_s

    camera_photo_candidates = [
      File.join(project_root, 'node_modules', 'expo-camera', 'ios', 'Current', 'CameraPhotoCapture.swift'),
      File.join(ios_dir, 'node_modules', 'expo-camera', 'ios', 'Current', 'CameraPhotoCapture.swift'),
      File.join(pods_root, 'ExpoCamera', 'ios', 'Current', 'CameraPhotoCapture.swift'),
      File.join(pods_root, 'ExpoCamera', 'Current', 'CameraPhotoCapture.swift'),
      File.join(pods_root, 'Pods', 'ExpoCamera', 'ios', 'Current', 'CameraPhotoCapture.swift'),
      File.join(pods_root, 'Pods', 'ExpoCamera', 'Current', 'CameraPhotoCapture.swift')
    ].uniq

    camera_video_candidates = [
      File.join(project_root, 'node_modules', 'expo-camera', 'ios', 'Current', 'CameraVideoRecording.swift'),
      File.join(ios_dir, 'node_modules', 'expo-camera', 'ios', 'Current', 'CameraVideoRecording.swift'),
      File.join(pods_root, 'ExpoCamera', 'ios', 'Current', 'CameraVideoRecording.swift'),
      File.join(pods_root, 'ExpoCamera', 'Current', 'CameraVideoRecording.swift'),
      File.join(pods_root, 'Pods', 'ExpoCamera', 'ios', 'Current', 'CameraVideoRecording.swift'),
      File.join(pods_root, 'Pods', 'ExpoCamera', 'Current', 'CameraVideoRecording.swift')
    ].uniq

    # 1) CameraPhotoCapture.swift: remove UIDevice.current.orientation usage.
    photo_found = false
    camera_photo_candidates.each do |path|
      next unless File.exist?(path)
      photo_found = true

      begin
        content = File.read(path)

        if content.include?('SOBRE_EXPO_CAMERA_ORIENTATION_PATCH') || !content.include?('UIDevice.current.orientation')
          puts "SOBRE_EXPO_CAMERA_PATCH_NO_CHANGES: #{path}"
          next
        end

        new_content = content.dup
        pattern = /^(\\s*)let orientation = captureDelegate\\?\\.responsiveWhenOrientationLocked == true \\?\\s*\\n\\s*captureDelegate\\?\\.physicalOrientation \\?\\? \\.unknown : UIDevice\\.current\\.orientation/
        new_content.gsub!(pattern) do
          indent = Regexp.last_match(1)
          inner = indent + '  '
          [
            "#{indent}// SOBRE_EXPO_CAMERA_ORIENTATION_PATCH",
            "#{indent}let orientation: UIDeviceOrientation",
            "",
            "#{indent}if captureDelegate?.responsiveWhenOrientationLocked == true {",
            "#{inner}orientation = captureDelegate?.physicalOrientation ?? .unknown",
            "#{indent}} else {",
            "#{inner}// Avoid UIDevice.current.orientation (MainActor in Swift 6).",
            "#{inner}// Reasonable default.",
            "#{inner}orientation = .unknown",
            "#{indent}}"
          ].join(\"\\n\")
        end

        if new_content != content
          File.write(path, new_content)
          puts "SOBRE_EXPO_CAMERA_PATCH_APPLIED: #{path}"
        else
          puts "SOBRE_EXPO_CAMERA_PATCH_NO_CHANGES: #{path}"
        end
      rescue => e
        puts "SOBRE_EXPO_CAMERA_PATCH_ERROR: #{e.class} #{e.message}"
      end
    end
    puts "SOBRE_EXPO_CAMERA_PATCH_MISSING_FILE: #{camera_photo_candidates[0]}" unless photo_found

    # 2) CameraVideoRecording.swift: remove UIDevice.current.orientation and iOS 18-only recording pause API usage.
    video_found = false
    camera_video_candidates.each do |path|
      next unless File.exist?(path)
      video_found = true

      begin
        content = File.read(path)
        new_content = content.dup
        changed = false

        if new_content.include?('UIDevice.current.orientation')
          orientation_pattern = /^(\\s*)let orientation = delegate\\?\\.responsiveWhenOrientationLocked == true \\?\\s*\\n\\s*delegate\\?\\.physicalOrientation \\?\\? \\.unknown : UIDevice\\.current\\.orientation/
          new_content.gsub!(orientation_pattern) do
            indent = Regexp.last_match(1)
            "#{indent}let orientation = delegate?.physicalOrientation ?? .unknown"
          end
          changed = true if new_content != content
        end

        if new_content.include?('isRecordingPaused') && !new_content.include?('SOBRE_EXPO_CAMERA_IOS18_TOGGLE_NOOP')
          toggle_pattern = /^(\\s*)@available\\(iOS 18\\.0, \\*\\)\\n\\1func toggleRecording\\(videoFileOutput: AVCaptureMovieFileOutput\\) \\{.*?\\n\\1\\}/m
          new_content.gsub!(toggle_pattern) do
            indent = Regexp.last_match(1)
            [
              "#{indent}@available(iOS 18.0, *)",
              "#{indent}func toggleRecording(videoFileOutput: AVCaptureMovieFileOutput) {",
              "#{indent}  // SOBRE_EXPO_CAMERA_IOS18_TOGGLE_NOOP",
              "#{indent}  // iOS 18-only APIs (isRecordingPaused / pauseRecording / resumeRecording) are not",
              "#{indent}  // available in the iOS 17.2 SDK used on EAS. Keep this as a no-op for now.",
              "#{indent}}"
            ].join(\"\\n\")
          end
          changed = true
        end

        if changed && new_content != content
          File.write(path, new_content)
          puts "SOBRE_EXPO_CAMERA_PATCH_APPLIED: #{path}"
        else
          puts "SOBRE_EXPO_CAMERA_PATCH_NO_CHANGES: #{path}"
        end
      rescue => e
        puts "SOBRE_EXPO_CAMERA_PATCH_ERROR: #{e.class} #{e.message}"
      end
    end
    puts "SOBRE_EXPO_CAMERA_PATCH_MISSING_FILE: #{camera_video_candidates[0]}" unless video_found
  rescue => e
    puts "SOBRE_EXPO_CAMERA_PATCH_ERROR: #{e.class} #{e.message}"
  end

  # Patch react-native-fbsdk-next Expo adapter to be a no-op (Meta SDK API changes).
  begin
    ios_dir = Dir.pwd
    project_root = File.expand_path('..', ios_dir)
    pods_root = installer.sandbox.root.to_s

    candidate_paths = [
      File.join(project_root, 'node_modules', 'react-native-fbsdk-next', 'ios', 'ExpoAdapterFBSDKNext', 'FacebookAppDelegate.swift'),
      File.join(ios_dir, 'node_modules', 'react-native-fbsdk-next', 'ios', 'ExpoAdapterFBSDKNext', 'FacebookAppDelegate.swift'),
      File.join(pods_root, 'ExpoAdapterFBSDKNext', 'FacebookAppDelegate.swift'),
      File.join(pods_root, 'Pods', 'ExpoAdapterFBSDKNext', 'FacebookAppDelegate.swift')
    ].uniq

    desired = <<~SWIFT_FBSDK
    import ExpoModulesCore
    import FBSDKCoreKit

    public class FacebookAppDelegate: ExpoAppDelegateSubscriber {
      public func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil
      ) -> Bool {
        // No-op: we don't rely on this adapter for FB login or deep links.
        // Meta SDK init is handled elsewhere (info.plist / auto-init).
        return false
      }

      public func application(
        _ application: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey : Any] = [:]
      ) -> Bool {
        // No-op: we don't use Facebook login URL handling in the app.
        return false
      }
    }
    SWIFT_FBSDK

    patched_any = false
    found_any = false

    candidate_paths.each do |path|
      next unless File.exist?(path)
      found_any = true

      begin
        content = File.read(path)

        if content.include?("No-op: we don't rely on this adapter") && content.include?('return false')
          puts "SOBRE_FBSDK_APPDELEGATE_PATCH_NO_CHANGES: #{path}"
          next
        end

        if content == desired
          puts "SOBRE_FBSDK_APPDELEGATE_PATCH_NO_CHANGES: #{path}"
          next
        end

        File.write(path, desired)
        patched_any = true
        puts "SOBRE_FBSDK_APPDELEGATE_PATCH_APPLIED: #{path}"
      rescue => e
        puts "SOBRE_FBSDK_APPDELEGATE_PATCH_ERROR: #{e.class} #{e.message}"
      end
    end

    unless found_any
      puts "SOBRE_FBSDK_APPDELEGATE_PATCH_MISSING_FILE: #{candidate_paths[0]}"
    end
  rescue => e
    puts "SOBRE_FBSDK_APPDELEGATE_PATCH_ERROR: #{e.class} #{e.message}"
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
  config = withPodfile(config, (config) => {
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
  return config;
};
