import FamilyControls
import Foundation
import ManagedSettings
import ManagedSettingsUI

final class ShieldActionExtension: ShieldActionDelegate {
  private let appGroupSuiteName = "group.com.balthazar.sobre"
  private let legacySelectionKey = "familyControlsSelection"
  private let eveningSelectionKey = "eveningSelection"
  private let eveningEnabledKey = "eveningEnabled"
  private let eveningStartKey = "eveningStart"
  private let eveningEndKey = "eveningEnd"
  private let eveningOverrideUntilKey = "eveningOverrideUntil"
  private let eveningOverrideWindowSecondsKey = "eveningOverrideWindowSeconds"
  private let store = ManagedSettingsStore()

  func handle(action: ShieldAction, for application: Application, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    print("[DailyReset] ShieldAction handle(for:application) invoked: \(action)")
    handleAction(action, completionHandler: completionHandler)
  }

  func handle(action: ShieldAction, for application: Application, in category: ActivityCategory, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    print("[DailyReset] ShieldAction handle(for:application,in:category) invoked: \(action)")
    handleAction(action, completionHandler: completionHandler)
  }

  func handle(action: ShieldAction, for category: ActivityCategory, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    print("[DailyReset] ShieldAction handle(for:category) invoked: \(action)")
    handleAction(action, completionHandler: completionHandler)
  }

  func handle(action: ShieldAction, for webDomain: WebDomain, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    print("[DailyReset] ShieldAction handle(for:webDomain) invoked: \(action)")
    handleAction(action, completionHandler: completionHandler)
  }

  private func handleAction(_ action: ShieldAction, completionHandler: @escaping (ShieldActionResponse) -> Void) {
    let defaults = appGroupDefaults()
    ensureScheduleDefaults(defaults)
    let isEvening = isWithinEveningWindow(now: Date(), defaults: defaults)
    let eveningEnabled = defaults.bool(forKey: eveningEnabledKey)
    print("[DailyReset] ShieldAction handleAction invoked action=\(action) isEvening=\(isEvening) eveningEnabled=\(eveningEnabled)")

    if isEvening && eveningEnabled {
      switch action {
      case .primaryButtonPressed:
        let overrideSeconds = max(1, defaults.integer(forKey: eveningOverrideWindowSecondsKey))
        let overrideUntil = Date().addingTimeInterval(TimeInterval(overrideSeconds)).timeIntervalSince1970
        defaults.set(overrideUntil, forKey: eveningOverrideUntilKey)
        clearShield()
        DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(overrideSeconds)) { [weak self] in
          self?.applyShieldIfNeeded()
        }
        // Important: `.close` closes the app and typically returns the user to the Home screen.
        // Using `.defer` allows iOS to re-evaluate shielding immediately; since we cleared shields
        // (and set an override window), the target app can continue opening.
        completionHandler(.defer)
      case .secondaryButtonPressed:
        // "Annuler" should dismiss the shield and *not* open the app.
        completionHandler(.close)
      @unknown default:
        completionHandler(.close)
      }
      return
    }

    // Daily flow
    switch action {
    case .primaryButtonPressed:
      // Simplified UX: the button just closes the Shield.
      // The user must open Sobre manually to complete the Daily Reset.
      print("[DailyReset] Shield tap: close (user will open Sobre)")
      completionHandler(.close)
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

    store.shield.applications = selection.applicationTokens
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
      defaults.set(false, forKey: eveningEnabledKey)
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
      // Ensure we don't re-apply the shield too quickly after the user chose "Continuer quand même",
      // otherwise it could interrupt their current session.
      defaults.set(30 * 60, forKey: eveningOverrideWindowSecondsKey)
    }
  }

  private func loadSelection() -> FamilyActivitySelection? {
    let defaults = appGroupDefaults()
    if let base64 = defaults.string(forKey: legacySelectionKey),
       let data = Data(base64Encoded: base64),
       let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data) {
      return selection
    }
    if let base64 = defaults.string(forKey: eveningSelectionKey),
       let data = Data(base64Encoded: base64) {
      return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
    }
    return nil
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

  /* private func scheduleDailyResetLocalNotification() {
    let center = UNUserNotificationCenter.current()

    print("[DailyReset] schedule local notification from Shield tap")

    center.removePendingNotificationRequests(withIdentifiers: [dailyResetLocalNotificationId])
    center.removeDeliveredNotifications(withIdentifiers: [dailyResetLocalNotificationId])

    let content = UNMutableNotificationContent()
    content.title = "Daily Reset Sobre"
    content.body = "Fais ton check-in pour débloquer tes apps pour aujourd’hui."
    content.sound = .default
    content.userInfo = ["url": "sobre://daily-reset", "type": "daily-reset"]

    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
    let request = UNNotificationRequest(
      identifier: dailyResetLocalNotificationId,
      content: content,
      trigger: trigger
    )

    center.add(request) { error in
      if let error = error {
        print("[DailyReset] failed to schedule local notification:", error.localizedDescription)
      } else {
        print("[DailyReset] local notification scheduled")
      }
    }
  } */

  /* private func triggerDailyResetPushIfPossible(defaults: UserDefaults) {
    let now = Date().timeIntervalSince1970
    let last = defaults.double(forKey: dailyResetLastTriggerAtKey)
    if now - last < 3 {
      print("[DailyReset] push trigger throttled (native)")
      return
    }
    defaults.set(now, forKey: dailyResetLastTriggerAtKey)

    guard let backendUrl = defaults.string(forKey: dailyResetBackendUrlKey),
          let url = URL(string: backendUrl) else {
      print("[DailyReset] missing backend url in app group; cannot trigger push")
      return
    }

    guard let deviceKey = defaults.string(forKey: dailyResetDeviceKeyKey),
          !deviceKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      print("[DailyReset] missing deviceKey in app group; cannot trigger push")
      return
    }

    print("[DailyReset] triggering backend push", backendUrl)

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    let body: [String: Any] = ["deviceKey": deviceKey]
    request.httpBody = try? JSONSerialization.data(withJSONObject: body)

    URLSession.shared.dataTask(with: request) { data, response, error in
      if let error = error {
        print("[DailyReset] backend push trigger failed", error.localizedDescription)
        return
      }
      let status = (response as? HTTPURLResponse)?.statusCode ?? -1
      print("[DailyReset] backend push trigger response status=\(status)")
      if let data = data, let text = String(data: data, encoding: .utf8), !text.isEmpty {
        print("[DailyReset] backend push trigger response body=\(text)")
      }
    }.resume()
  } */
}
