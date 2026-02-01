import DeviceActivity
import FamilyControls
import Foundation
import ManagedSettings

final class DeviceActivityMonitorExtension: DeviceActivityMonitor {
  private let appGroupSuiteName = "group.com.balthazar.sobre"
  private let dailySelectionKey = "dailySelection"
  private let eveningSelectionKey = "eveningSelection"
  private let dailyEnabledKey = "dailyEnabled"
  private let dailyUnlockedUntilKey = "dailyUnlockedUntil"
  private let eveningEnabledKey = "eveningEnabled"
  private let eveningStartKey = "eveningStart"
  private let eveningEndKey = "eveningEnd"
  private let eveningOverrideUntilKey = "eveningOverrideUntil"
  private let frictionStartKey = "eveningFrictionStart"
  private let store = ManagedSettingsStore()

  override func intervalDidStart(for activity: DeviceActivityName) {
    applyShieldIfNeeded()
  }

  override func intervalDidEnd(for activity: DeviceActivityName) {
    clearShield()
  }

  override func eventDidReachThreshold(_ event: DeviceActivityEvent.Name, activity: DeviceActivityName) {
    applyShieldIfNeeded()
  }

  private func applyShieldIfNeeded() {
    let defaults = appGroupDefaults()
    ensureScheduleDefaults(defaults)

    let now = Date()
    let isEvening = isWithinEveningWindow(now: now, defaults: defaults)
    let eveningEnabled = defaults.bool(forKey: eveningEnabledKey)
    let dailyEnabled = defaults.bool(forKey: dailyEnabledKey)
    let unlockUntil = defaults.double(forKey: dailyUnlockedUntilKey)
    if unlockUntil > 0 && now.timeIntervalSince1970 >= unlockUntil {
      defaults.set(0, forKey: dailyUnlockedUntilKey)
    }

    if isEvening && eveningEnabled {
      let overrideUntil = defaults.double(forKey: eveningOverrideUntilKey)
      if overrideUntil > now.timeIntervalSince1970 {
        clearShield()
        return
      }
      guard let selection = loadSelection(key: eveningSelectionKey) else {
        clearShield()
        return
      }
      defaults.set(0, forKey: frictionStartKey)
      store.shield.applications = selection.applicationTokens
      // TODO: Map categories to shield.applicationCategories when needed.
      store.shield.applicationCategories = nil
      store.shield.webDomains = selection.webDomainTokens
      return
    }

    if !isEvening && dailyEnabled {
      let unlockedUntil = defaults.double(forKey: dailyUnlockedUntilKey)
      if unlockedUntil > now.timeIntervalSince1970 {
        clearShield()
        return
      }
      guard let selection = loadSelection(key: dailySelectionKey) else {
        clearShield()
        return
      }
      store.shield.applications = selection.applicationTokens
      // TODO: Map categories to shield.applicationCategories when needed.
      store.shield.applicationCategories = nil
      store.shield.webDomains = selection.webDomainTokens
      return
    }

    clearShield()
  }

  private func clearShield() {
    store.shield.applications = nil
    store.shield.applicationCategories = nil
    store.shield.webDomains = nil
  }

  private func appGroupDefaults() -> UserDefaults {
    return UserDefaults(suiteName: appGroupSuiteName) ?? .standard
  }

  private func ensureScheduleDefaults(_ defaults: UserDefaults) {
    if defaults.object(forKey: dailyEnabledKey) == nil {
      defaults.set(true, forKey: dailyEnabledKey)
    }
    if defaults.object(forKey: dailyUnlockedUntilKey) == nil {
      defaults.set(0, forKey: dailyUnlockedUntilKey)
    }
    if defaults.object(forKey: eveningEnabledKey) == nil {
      defaults.set(true, forKey: eveningEnabledKey)
    }
    if defaults.string(forKey: eveningStartKey) == nil {
      defaults.set("22:00", forKey: eveningStartKey)
    }
    if defaults.string(forKey: eveningEndKey) == nil {
      defaults.set("07:00", forKey: eveningEndKey)
    }
    if defaults.object(forKey: eveningOverrideUntilKey) == nil {
      defaults.set(0, forKey: eveningOverrideUntilKey)
    }
  }

  private func loadSelection(key: String) -> FamilyActivitySelection? {
    let defaults = appGroupDefaults()
    guard let base64 = defaults.string(forKey: key),
          let data = Data(base64Encoded: base64) else {
      return nil
    }
    return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
  }

  private func isWithinEveningWindow(now: Date, defaults: UserDefaults) -> Bool {
    let startString = defaults.string(forKey: eveningStartKey) ?? "22:00"
    let endString = defaults.string(forKey: eveningEndKey) ?? "07:00"
    guard let startMinutes = minutesFromTime(startString),
          let endMinutes = minutesFromTime(endString) else {
      return false
    }
    let calendar = Calendar.current
    let components = calendar.dateComponents([.hour, .minute], from: now)
    let nowMinutes = (components.hour ?? 0) * 60 + (components.minute ?? 0)

    if startMinutes == endMinutes {
      return true
    }
    if startMinutes < endMinutes {
      return nowMinutes >= startMinutes && nowMinutes < endMinutes
    }
    return nowMinutes >= startMinutes || nowMinutes < endMinutes
  }

  private func minutesFromTime(_ value: String) -> Int? {
    let parts = value.split(separator: ":")
    guard parts.count == 2,
          let hours = Int(parts[0]),
          let minutes = Int(parts[1]),
          hours >= 0, hours < 24, minutes >= 0, minutes < 60 else {
      return nil
    }
    return hours * 60 + minutes
  }
}
