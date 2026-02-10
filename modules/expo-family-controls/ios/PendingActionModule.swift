import ExpoModulesCore

public final class PendingActionModule: Module {
  private let appGroupSuiteName = "group.com.balthazar.sobre"
  private let pendingActionKey = "pendingAction"
  private let pendingActionRequestedAtKey = "pendingActionRequestedAt"
  private let dailyResetDeviceKeyKey = "dailyResetDeviceKey"
  private let dailyResetBackendUrlKey = "dailyResetBackendUrl"

  public func definition() -> ModuleDefinition {
    Name("PendingAction")

    Function("consume") { (expected: String) -> Bool in
      // Defensive: clear both App Group + standard defaults to avoid repeated consumption
      // if entitlements differ between targets/environments.
      let appGroupDefaults = UserDefaults(suiteName: appGroupSuiteName)
      let standardDefaults = UserDefaults.standard

      let currentAppGroup = appGroupDefaults?.string(forKey: pendingActionKey)
      let currentStandard = standardDefaults.string(forKey: pendingActionKey)

      let matches = (currentAppGroup == expected) || (currentStandard == expected)
      guard matches else {
        return false
      }

      appGroupDefaults?.removeObject(forKey: pendingActionKey)
      appGroupDefaults?.removeObject(forKey: pendingActionRequestedAtKey)
      standardDefaults.removeObject(forKey: pendingActionKey)
      standardDefaults.removeObject(forKey: pendingActionRequestedAtKey)
      return true
    }

    Function("consumeIfRecent") { (expected: String, maxAgeSeconds: Double) -> Bool in
      let now = Date().timeIntervalSince1970
      let maxAge = max(0, maxAgeSeconds)

      let appGroupDefaults = UserDefaults(suiteName: appGroupSuiteName)
      let standardDefaults = UserDefaults.standard

      let currentAppGroup = appGroupDefaults?.string(forKey: pendingActionKey)
      let currentStandard = standardDefaults.string(forKey: pendingActionKey)
      let requestedAtAppGroup = appGroupDefaults?.double(forKey: pendingActionRequestedAtKey) ?? 0
      let requestedAtStandard = standardDefaults.double(forKey: pendingActionRequestedAtKey)
      // Important: only trust the timestamp that comes from the same defaults store
      // as the pendingAction value. Mixing stores (App Group vs standard) can cause
      // false positives and hijack normal launches.
      let requestedAt: Double
      if currentAppGroup == expected {
        requestedAt = requestedAtAppGroup
      } else if currentStandard == expected {
        requestedAt = requestedAtStandard
      } else {
        return false
      }

      // Always clear to avoid hijacking future launches.
      appGroupDefaults?.removeObject(forKey: pendingActionKey)
      appGroupDefaults?.removeObject(forKey: pendingActionRequestedAtKey)
      standardDefaults.removeObject(forKey: pendingActionKey)
      standardDefaults.removeObject(forKey: pendingActionRequestedAtKey)

      // If no timestamp was recorded, treat it as stale.
      guard requestedAt > 0 else {
        return false
      }

      return (now - requestedAt) <= maxAge
    }

    Function("getDailyResetDeviceKey") { () -> String? in
      let defaults = UserDefaults(suiteName: appGroupSuiteName) ?? .standard
      return defaults.string(forKey: dailyResetDeviceKeyKey)
    }

    Function("setDailyResetDeviceKey") { (value: String) -> Bool in
      let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
      guard !trimmed.isEmpty else {
        return false
      }
      let defaults = UserDefaults(suiteName: appGroupSuiteName) ?? .standard
      defaults.set(trimmed, forKey: dailyResetDeviceKeyKey)
      return true
    }

    Function("getDailyResetBackendUrl") { () -> String? in
      let defaults = UserDefaults(suiteName: appGroupSuiteName) ?? .standard
      return defaults.string(forKey: dailyResetBackendUrlKey)
    }

    Function("setDailyResetBackendUrl") { (value: String) -> Bool in
      let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
      guard let url = URL(string: trimmed), url.scheme == "https" else {
        return false
      }
      let defaults = UserDefaults(suiteName: appGroupSuiteName) ?? .standard
      defaults.set(trimmed, forKey: dailyResetBackendUrlKey)
      return true
    }
  }
}
