import FamilyControls
import Foundation
import ManagedSettings
import ManagedSettingsUI
import UserNotifications

final class ShieldActionExtension: ShieldActionDelegate {
  private let appGroupSuiteName = "group.com.balthazar.sobre"
  private let pendingActionKey = "pendingAction"
  private let eveningSelectionKey = "eveningSelection"
  private let eveningEnabledKey = "eveningEnabled"
  private let eveningStartKey = "eveningStart"
  private let eveningEndKey = "eveningEnd"
  private let eveningOverrideUntilKey = "eveningOverrideUntil"
  private let eveningOverrideWindowSecondsKey = "eveningOverrideWindowSeconds"
  private let frictionStartKey = "eveningFrictionStart"
  private let sosRequestedAtKey = "sosRequestedAt"
  private let dailyNotifLastSentAtKey = "dailyNotifLastSentAt"
  private let store = ManagedSettingsStore()

  func handle(action: ShieldAction, for application: Application, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    handleAction(action, completionHandler: completionHandler)
  }

  func handle(action: ShieldAction, for application: Application, in category: ActivityCategory, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    handleAction(action, completionHandler: completionHandler)
  }

  func handle(action: ShieldAction, for category: ActivityCategory, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    handleAction(action, completionHandler: completionHandler)
  }

  func handle(action: ShieldAction, for webDomain: WebDomain, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    handleAction(action, completionHandler: completionHandler)
  }

  private func handleAction(_ action: ShieldAction, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    let defaults = appGroupDefaults()
    ensureScheduleDefaults(defaults)
    let isEvening = isWithinEveningWindow(now: Date(), defaults: defaults)
    let eveningEnabled = defaults.bool(forKey: eveningEnabledKey)

    if isEvening && eveningEnabled {
      switch action {
      case .primaryButtonPressed:
        if remainingFrictionSeconds(defaults: defaults) > 0 {
          completionHandler(.defer)
          return
        }
        let overrideSeconds = max(1, defaults.integer(forKey: eveningOverrideWindowSecondsKey))
        let overrideUntil = Date().addingTimeInterval(TimeInterval(overrideSeconds)).timeIntervalSince1970
        defaults.set(overrideUntil, forKey: eveningOverrideUntilKey)
        defaults.set(0, forKey: frictionStartKey)
        clearShield()
        DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(overrideSeconds)) { [weak self] in
          self?.applyShieldIfNeeded()
        }
        completionHandler(.close)
      case .secondaryButtonPressed:
        defaults.set(Date().timeIntervalSince1970, forKey: sosRequestedAtKey)
        completionHandler(.close)
      @unknown default:
        completionHandler(.close)
      }
      return
    }

    // Daily flow
    switch action {
    case .primaryButtonPressed:
      // Ask the main app to trigger the daily reset flow when it becomes active.
      defaults.set("daily-reset", forKey: pendingActionKey)
      completionHandler(.defer)
    case .secondaryButtonPressed:
      completionHandler(.close)
    @unknown default:
      completionHandler(.close)
    }
  }

  private func applyShieldIfNeeded() {
    guard let selection = loadSelection() else {
      clearShield()
      return
    }

    let defaults = appGroupDefaults()
    ensureScheduleDefaults(defaults)

    let now = Date()
    let isEvening = isWithinEveningWindow(now: now, defaults: defaults)
    let eveningEnabled = defaults.bool(forKey: eveningEnabledKey)
    if isEvening && eveningEnabled {
      let overrideUntil = defaults.double(forKey: eveningOverrideUntilKey)
      if overrideUntil > now.timeIntervalSince1970 {
        clearShield()
        return
      }
    }

    guard isEvening && eveningEnabled else {
      clearShield()
      return
    }

    defaults.set(0, forKey: frictionStartKey)
    store.shield.applications = selection.applicationTokens
    // TODO: Map categories to shield.applicationCategories when needed.
    store.shield.applicationCategories = nil
    store.shield.webDomains = selection.webDomainTokens
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
    if defaults.object(forKey: eveningOverrideWindowSecondsKey) == nil {
      defaults.set(15, forKey: eveningOverrideWindowSecondsKey)
    }
    if defaults.object(forKey: dailyNotifLastSentAtKey) == nil {
      defaults.set(0, forKey: dailyNotifLastSentAtKey)
    }
  }

  private func remainingFrictionSeconds(defaults: UserDefaults) -> Int {
    let now = Date().timeIntervalSince1970
    let start = defaults.double(forKey: frictionStartKey)
    if start <= 0 {
      defaults.set(now, forKey: frictionStartKey)
      return 5
    }
    let elapsed = max(0, now - start)
    return max(0, 5 - Int(elapsed))
  }

  private func loadSelection() -> FamilyActivitySelection? {
    let defaults = appGroupDefaults()
    guard let base64 = defaults.string(forKey: eveningSelectionKey),
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

  private func sendDailyCheckinNotification(defaults: UserDefaults) {
    let now = Date().timeIntervalSince1970
    let last = defaults.double(forKey: dailyNotifLastSentAtKey)
    if now - last < 30 {
      return
    }
    defaults.set(now, forKey: dailyNotifLastSentAtKey)

    let content = UNMutableNotificationContent()
    content.title = "Sobre"
    content.body = "Fais ton check-in Sobre pour débloquer tes apps aujourd’hui."
    content.sound = .default
    content.userInfo = ["url": "sobre://daily-checkin"]

    let request = UNNotificationRequest(
      identifier: "daily-checkin",
      content: content,
      trigger: nil
    )

    UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
  }
}
