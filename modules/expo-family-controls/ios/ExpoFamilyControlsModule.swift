import DeviceActivity
import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI
import UIKit

public final class ExpoFamilyControlsModule: Module {
  private let appGroupSuiteName = "group.com.balthazar.sobre"
  private let legacySelectionKey = "familyControlsSelection"
  private let dailySelectionKey = "dailySelection"
  private let dailyUnlockedUntilKey = "dailyUnlockedUntil"
  private let eveningSelectionKey = "eveningSelection"
  private let dailyEnabledKey = "dailyEnabled"
  private let dailyResetTimeKey = "dailyResetTime"
  private let eveningEnabledKey = "eveningEnabled"
  private let eveningStartKey = "eveningStart"
  private let eveningEndKey = "eveningEnd"
  private let eveningOverrideUntilKey = "eveningOverrideUntil"
  private let eveningOverrideWindowSecondsKey = "eveningOverrideWindowSeconds"
  private let dailyDeviceActivityName = DeviceActivityName("sobreDaily")
  private let eveningDeviceActivityName = DeviceActivityName("sobreEvening")
  private let store = ManagedSettingsStore()

  public func definition() -> ModuleDefinition {
    Name("ExpoFamilyControls")

    OnCreate {
      if let defaults = try? appGroupDefaults() {
        ensureScheduleDefaults(defaults)
        if #available(iOS 16.0, *) {
          try? configureDailyDeviceActivityMonitoring(defaults)
          try? configureEveningDeviceActivityMonitoring(defaults)
        }
      }
    }

    AsyncFunction("requestAuthorization") { () async throws -> String in
      guard #available(iOS 16.0, *) else {
        throw FamilyControlsUnavailableException()
      }

      let center = AuthorizationCenter.shared
      try await center.requestAuthorization(for: .individual)
      return Self.mapAuthorizationStatus(center.authorizationStatus)
    }

    AsyncFunction("getAuthorizationStatus") { () throws -> String in
      guard #available(iOS 16.0, *) else {
        throw FamilyControlsUnavailableException()
      }

      return Self.mapAuthorizationStatus(AuthorizationCenter.shared.authorizationStatus)
    }

    AsyncFunction("openFamilyActivityPicker") { (promise: Promise) in
      guard #available(iOS 16.0, *) else {
        promise.reject(FamilyControlsUnavailableException())
        return
      }

      let center = AuthorizationCenter.shared
      guard center.authorizationStatus == .approved else {
        promise.reject(FamilyControlsNotAuthorizedException(Self.mapAuthorizationStatus(center.authorizationStatus)))
        return
      }

      DispatchQueue.main.async { [weak self] in
        guard let self else {
          promise.reject(FamilyControlsPresentationException())
          return
        }
        guard let presenter = self.topViewController() else {
          promise.reject(FamilyControlsPresentationException())
          return
        }

        let initialSelection = self.loadSelection(key: self.legacySelectionKey) ?? FamilyActivitySelection()
        let view = FamilyActivityPickerView(
          selection: initialSelection,
          onCancel: {
            presenter.dismiss(animated: true) {
              promise.reject(FamilyControlsPickerCanceledException())
            }
          },
          onConfirm: { selection in
            do {
              try self.saveSelection(selection, key: self.legacySelectionKey)
              if let defaults = try? self.appGroupDefaults(), #available(iOS 16.0, *) {
                try? self.configureDailyDeviceActivityMonitoring(defaults)
                try? self.configureEveningDeviceActivityMonitoring(defaults)
              }
              let serialized = try Self.serialize(selection)
              presenter.dismiss(animated: true) {
                promise.resolve(serialized)
              }
            } catch {
              presenter.dismiss(animated: true) {
                promise.reject(error)
              }
            }
          }
        )

        let host = UIHostingController(rootView: view)
        host.modalPresentationStyle = .formSheet
        presenter.present(host, animated: true)
      }
    }

    AsyncFunction("getSavedSelection") { () throws -> [String: Any]? in
      guard #available(iOS 16.0, *) else {
        throw FamilyControlsUnavailableException()
      }

      guard let data = loadSelectionData(key: legacySelectionKey) else {
        return nil
      }
      let selection = try JSONDecoder().decode(FamilyActivitySelection.self, from: data)
      return try Self.serialize(selection, data: data)
    }

    AsyncFunction("applyShieldFromSavedSelection") { () throws -> [String: Any] in
      guard #available(iOS 16.0, *) else {
        throw FamilyControlsUnavailableException()
      }

      let center = AuthorizationCenter.shared
      guard center.authorizationStatus == .approved else {
        throw FamilyControlsNotAuthorizedException(Self.mapAuthorizationStatus(center.authorizationStatus))
      }

      guard let selection = loadSelection(key: legacySelectionKey) else {
        throw FamilyControlsNoSavedSelectionException()
      }

      store.shield.applications = selection.applicationTokens
      // TODO: Map categories to shield.applicationCategories when needed.
      store.shield.applicationCategories = nil
      store.shield.webDomains = selection.webDomainTokens

      return [
        "appsCount": selection.applicationTokens.count,
        "categoriesCount": selection.categoryTokens.count,
        "webDomainsCount": selection.webDomainTokens.count
      ]
    }

    AsyncFunction("clearShield") { () throws -> Bool in
      guard #available(iOS 16.0, *) else {
        throw FamilyControlsUnavailableException()
      }

      store.shield.applications = nil
      store.shield.applicationCategories = nil
      store.shield.webDomains = nil
      return true
    }

    AsyncFunction("openDailyPicker") { (promise: Promise) in
      openPicker(forKey: dailySelectionKey, promise: promise)
    }

    AsyncFunction("getDailySelection") { () throws -> [String: Any]? in
      guard #available(iOS 16.0, *) else {
        throw FamilyControlsUnavailableException()
      }
      guard let data = loadSelectionData(key: dailySelectionKey) else {
        return nil
      }
      let selection = try JSONDecoder().decode(FamilyActivitySelection.self, from: data)
      return try Self.serialize(selection, data: data)
    }

    AsyncFunction("openEveningPicker") { (promise: Promise) in
      openPicker(forKey: eveningSelectionKey, promise: promise)
    }

    AsyncFunction("getEveningSelection") { () throws -> [String: Any]? in
      guard #available(iOS 16.0, *) else {
        throw FamilyControlsUnavailableException()
      }
      guard let data = loadSelectionData(key: eveningSelectionKey) else {
        return nil
      }
      let selection = try JSONDecoder().decode(FamilyActivitySelection.self, from: data)
      return try Self.serialize(selection, data: data)
    }

    AsyncFunction("getScheduleSettings") { () throws -> [String: Any] in
      let defaults = try appGroupDefaults()
      ensureScheduleDefaults(defaults)

      return [
        "dailyEnabled": defaults.bool(forKey: dailyEnabledKey),
        "dailyResetTime": defaults.string(forKey: dailyResetTimeKey) ?? "08:00",
        "eveningEnabled": defaults.bool(forKey: eveningEnabledKey),
        "eveningStart": defaults.string(forKey: eveningStartKey) ?? "22:00",
        "eveningEnd": defaults.string(forKey: eveningEndKey) ?? "07:00",
        "eveningOverrideWindowSeconds": defaults.integer(forKey: eveningOverrideWindowSecondsKey)
      ]
    }

    AsyncFunction("setDailyEnabled") { (enabled: Bool) throws -> Bool in
      let defaults = try appGroupDefaults()
      defaults.set(enabled, forKey: dailyEnabledKey)
      if #available(iOS 16.0, *) {
        try? configureDailyDeviceActivityMonitoring(defaults)
      }
      return true
    }

    AsyncFunction("setDailyResetTime") { (time: String) throws -> Bool in
      let defaults = try appGroupDefaults()
      defaults.set(time, forKey: dailyResetTimeKey)
      if #available(iOS 16.0, *) {
        try? configureDailyDeviceActivityMonitoring(defaults)
      }
      return true
    }

    AsyncFunction("setEveningEnabled") { (enabled: Bool) throws -> Bool in
      let defaults = try appGroupDefaults()
      defaults.set(enabled, forKey: eveningEnabledKey)
      if #available(iOS 16.0, *) {
        try? configureEveningDeviceActivityMonitoring(defaults)
      }
      return true
    }

    AsyncFunction("setEveningSchedule") { (start: String, end: String) throws -> Bool in
      let defaults = try appGroupDefaults()
      defaults.set(start, forKey: eveningStartKey)
      defaults.set(end, forKey: eveningEndKey)
      if #available(iOS 16.0, *) {
        try? configureEveningDeviceActivityMonitoring(defaults)
      }
      return true
    }

    AsyncFunction("setEveningOverrideWindowSeconds") { (seconds: Int) throws -> Bool in
      let defaults = try appGroupDefaults()
      defaults.set(seconds, forKey: eveningOverrideWindowSecondsKey)
      return true
    }

    AsyncFunction("setDailyUnlockedUntil") { (timestamp: Double) throws -> Bool in
      let defaults = try appGroupDefaults()
      defaults.set(timestamp, forKey: dailyUnlockedUntilKey)
      return true
    }

    AsyncFunction("getDailyUnlockedUntil") { () throws -> Double in
      let defaults = try appGroupDefaults()
      return defaults.double(forKey: dailyUnlockedUntilKey)
    }

    AsyncFunction("clearDailyUnlockedUntil") { () throws -> Bool in
      let defaults = try appGroupDefaults()
      defaults.set(0, forKey: dailyUnlockedUntilKey)
      return true
    }

    AsyncFunction("applyCurrentShieldsNow") { () throws -> Bool in
      guard #available(iOS 16.0, *) else {
        throw FamilyControlsUnavailableException()
      }

      let defaults = try appGroupDefaults()
      ensureScheduleDefaults(defaults)

      let now = Date()
      let dailyEnabled = defaults.bool(forKey: dailyEnabledKey)
      let isEvening = isWithinEveningWindow(now: now, defaults: defaults)
      let eveningEnabled = defaults.bool(forKey: eveningEnabledKey)

      if isEvening && eveningEnabled {
        let overrideUntil = defaults.double(forKey: eveningOverrideUntilKey)
        if overrideUntil > now.timeIntervalSince1970 {
          store.shield.applications = nil
          store.shield.applicationCategories = nil
          store.shield.webDomains = nil
          return true
        }
        if let selection = loadSelection(key: legacySelectionKey) ?? loadSelection(key: eveningSelectionKey) {
          store.shield.applications = selection.applicationTokens
          store.shield.applicationCategories = nil
          store.shield.webDomains = selection.webDomainTokens
          return true
        }
        store.shield.applications = nil
        store.shield.applicationCategories = nil
        store.shield.webDomains = nil
        return true
      }

      if dailyEnabled {
        let unlockedUntil = defaults.double(forKey: dailyUnlockedUntilKey)
        if unlockedUntil > now.timeIntervalSince1970 {
          store.shield.applications = nil
          store.shield.applicationCategories = nil
          store.shield.webDomains = nil
          return true
        }
        if let selection = loadSelection(key: legacySelectionKey) ?? loadSelection(key: dailySelectionKey) {
          store.shield.applications = selection.applicationTokens
          // TODO: Map categories to shield.applicationCategories when needed.
          store.shield.applicationCategories = nil
          store.shield.webDomains = selection.webDomainTokens
          return true
        }
      }

      store.shield.applications = nil
      store.shield.applicationCategories = nil
      store.shield.webDomains = nil
      return true
    }

    AsyncFunction("clearEveningOverride") { () throws -> Bool in
      let defaults = try appGroupDefaults()
      defaults.set(0, forKey: eveningOverrideUntilKey)
      return true
    }

    AsyncFunction("getBlockState") { () throws -> [String: Any] in
      let defaults = try appGroupDefaults()
      ensureScheduleDefaults(defaults)

      let eveningStart = defaults.string(forKey: eveningStartKey) ?? "22:00"
      let eveningEnd = defaults.string(forKey: eveningEndKey) ?? "07:00"
      let dailyResetTime = defaults.string(forKey: dailyResetTimeKey) ?? "08:00"
      let overrideUntil = defaults.double(forKey: eveningOverrideUntilKey)
      let overrideWindow = defaults.integer(forKey: eveningOverrideWindowSecondsKey)
      let dailyUnlockedUntil = defaults.double(forKey: dailyUnlockedUntilKey)
      let now = Date().timeIntervalSince1970
      let isEvening = isWithinEveningWindow(now: Date(), defaults: defaults)
      let isOverrideActive = overrideUntil > now
      let hasSelection =
        loadSelectionData(key: legacySelectionKey) != nil ||
        loadSelectionData(key: dailySelectionKey) != nil ||
        loadSelectionData(key: eveningSelectionKey) != nil

      return [
        "dailyEnabled": defaults.bool(forKey: dailyEnabledKey),
        "dailyResetTime": dailyResetTime,
        "dailyUnlockedUntil": dailyUnlockedUntil,
        "eveningEnabled": defaults.bool(forKey: eveningEnabledKey),
        "eveningStart": eveningStart,
        "eveningEnd": eveningEnd,
        "eveningOverrideUntil": overrideUntil,
        "eveningOverrideWindowSeconds": overrideWindow,
        "isEveningWindow": isEvening,
        "isOverrideActive": isOverrideActive,
        "hasSelection": hasSelection
      ]
    }
  }

  @available(iOS 16.0, *)
  private static func mapAuthorizationStatus(_ status: AuthorizationStatus) -> String {
    switch status {
    case .notDetermined:
      return "notDetermined"
    case .denied:
      return "denied"
    case .approved:
      return "approved"
    @unknown default:
      return "unknown"
    }
  }

  @available(iOS 16.0, *)
  private static func serialize(_ selection: FamilyActivitySelection) throws -> [String: Any] {
    let data = try JSONEncoder().encode(selection)
    return try serialize(selection, data: data)
  }

  @available(iOS 16.0, *)
  private static func serialize(_ selection: FamilyActivitySelection, data: Data) throws -> [String: Any] {
    return [
      "data": data.base64EncodedString(),
      "applicationsCount": selection.applicationTokens.count,
      "categoriesCount": selection.categoryTokens.count,
      "webDomainsCount": selection.webDomainTokens.count
    ]
  }

  private func loadSelectionData(key: String) -> Data? {
    guard let defaults = try? appGroupDefaults() else {
      return nil
    }
    guard let base64 = defaults.string(forKey: key) else {
      return nil
    }
    return Data(base64Encoded: base64)
  }

  @available(iOS 16.0, *)
  private func loadSelection(key: String) -> FamilyActivitySelection? {
    guard let data = loadSelectionData(key: key) else {
      return nil
    }
    return try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
  }

  @available(iOS 16.0, *)
  private func saveSelection(_ selection: FamilyActivitySelection, key: String) throws {
    let defaults = try appGroupDefaults()
    let data = try JSONEncoder().encode(selection)
    defaults.set(data.base64EncodedString(), forKey: key)
  }

  private func appGroupDefaults() throws -> UserDefaults {
    guard let defaults = UserDefaults(suiteName: appGroupSuiteName) else {
      throw FamilyControlsAppGroupUnavailableException()
    }
    return defaults
  }

  private func ensureScheduleDefaults(_ defaults: UserDefaults) {
    if defaults.object(forKey: dailyEnabledKey) == nil {
      defaults.set(true, forKey: dailyEnabledKey)
    }
    if defaults.string(forKey: dailyResetTimeKey) == nil {
      defaults.set("08:00", forKey: dailyResetTimeKey)
    }
    if defaults.object(forKey: dailyUnlockedUntilKey) == nil {
      defaults.set(0, forKey: dailyUnlockedUntilKey)
    }
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
      defaults.set(15, forKey: eveningOverrideWindowSecondsKey)
    }
  }

  @available(iOS 16.0, *)
  private func configureDailyDeviceActivityMonitoring(_ defaults: UserDefaults) throws {
    let dailyEnabled = defaults.bool(forKey: dailyEnabledKey)
    let hasDailySelection = loadSelectionData(key: legacySelectionKey) != nil || loadSelectionData(key: dailySelectionKey) != nil
    let center = DeviceActivityCenter()

    guard dailyEnabled, hasDailySelection else {
      center.stopMonitoring([dailyDeviceActivityName])
      return
    }

    let timeString = defaults.string(forKey: dailyResetTimeKey) ?? "08:00"
    let (hour, minute) = parseHourMinute(timeString) ?? (8, 0)
    let components = DateComponents(hour: hour, minute: minute)

    // 1-minute repeating window anchored at the daily reset time.
    let end = addMinutes(hour: hour, minute: minute, delta: 1)
    let endComponents = DateComponents(hour: end.hour, minute: end.minute)
    let schedule = DeviceActivitySchedule(intervalStart: components, intervalEnd: endComponents, repeats: true)

    center.stopMonitoring([dailyDeviceActivityName])
    try center.startMonitoring(dailyDeviceActivityName, during: schedule)
  }

  @available(iOS 16.0, *)
  private func configureEveningDeviceActivityMonitoring(_ defaults: UserDefaults) throws {
    let eveningEnabled = defaults.bool(forKey: eveningEnabledKey)
    let hasEveningSelection = loadSelectionData(key: legacySelectionKey) != nil || loadSelectionData(key: eveningSelectionKey) != nil
    let center = DeviceActivityCenter()

    guard eveningEnabled, hasEveningSelection else {
      center.stopMonitoring([eveningDeviceActivityName])
      return
    }

    let startString = defaults.string(forKey: eveningStartKey) ?? "22:00"
    let endString = defaults.string(forKey: eveningEndKey) ?? "07:00"
    let (startHour, startMinute) = parseHourMinute(startString) ?? (22, 0)
    let (endHour, endMinute) = parseHourMinute(endString) ?? (7, 0)

    let startComponents = DateComponents(hour: startHour, minute: startMinute)
    var endComponents = DateComponents(hour: endHour, minute: endMinute)

    // Avoid start == end (treat as a tiny window); the shield logic itself decides what to show.
    if startHour == endHour && startMinute == endMinute {
      let end = addMinutes(hour: endHour, minute: endMinute, delta: 1)
      endComponents = DateComponents(hour: end.hour, minute: end.minute)
    }

    let schedule = DeviceActivitySchedule(intervalStart: startComponents, intervalEnd: endComponents, repeats: true)

    center.stopMonitoring([eveningDeviceActivityName])
    try center.startMonitoring(eveningDeviceActivityName, during: schedule)
  }

  private func parseHourMinute(_ value: String) -> (Int, Int)? {
    let parts = value.split(separator: ":")
    guard parts.count == 2,
          let hour = Int(parts[0]),
          let minute = Int(parts[1]),
          hour >= 0, hour < 24,
          minute >= 0, minute < 60 else {
      return nil
    }
    return (hour, minute)
  }

  private func addMinutes(hour: Int, minute: Int, delta: Int) -> (hour: Int, minute: Int) {
    let total = ((hour * 60 + minute) + delta) % (24 * 60)
    let h = (total / 60 + 24) % 24
    let m = (total % 60 + 60) % 60
    return (h, m)
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

  private func topViewController(base: UIViewController? = nil) -> UIViewController? {
    let root: UIViewController? = {
      if let base = base {
        return base
      }
      let scenes = UIApplication.shared.connectedScenes
      let windowScene = scenes.first { $0.activationState == .foregroundActive } as? UIWindowScene
      let window = windowScene?.windows.first { $0.isKeyWindow }
      return window?.rootViewController
    }()

    if let nav = root as? UINavigationController {
      return topViewController(base: nav.visibleViewController)
    }
    if let tab = root as? UITabBarController, let selected = tab.selectedViewController {
      return topViewController(base: selected)
    }
    if let presented = root?.presentedViewController {
      return topViewController(base: presented)
    }
    return root
  }

  private func openPicker(forKey key: String, promise: Promise) {
    guard #available(iOS 16.0, *) else {
      promise.reject(FamilyControlsUnavailableException())
      return
    }

    let center = AuthorizationCenter.shared
    guard center.authorizationStatus == .approved else {
      promise.reject(FamilyControlsNotAuthorizedException(Self.mapAuthorizationStatus(center.authorizationStatus)))
      return
    }

    DispatchQueue.main.async { [weak self] in
      guard let self else {
        promise.reject(FamilyControlsPresentationException())
        return
      }
      guard let presenter = self.topViewController() else {
        promise.reject(FamilyControlsPresentationException())
        return
      }

      let initialSelection = self.loadSelection(key: key) ?? FamilyActivitySelection()
      let view = FamilyActivityPickerView(
        selection: initialSelection,
        onCancel: {
          presenter.dismiss(animated: true) {
            promise.reject(FamilyControlsPickerCanceledException())
          }
        },
        onConfirm: { selection in
          do {
            try self.saveSelection(selection, key: key)
            if key == self.dailySelectionKey {
              if let defaults = try? self.appGroupDefaults(), #available(iOS 16.0, *) {
                try? self.configureDailyDeviceActivityMonitoring(defaults)
              }
            }
            if key == self.eveningSelectionKey {
              if let defaults = try? self.appGroupDefaults(), #available(iOS 16.0, *) {
                try? self.configureEveningDeviceActivityMonitoring(defaults)
              }
            }
            let serialized = try Self.serialize(selection)
            presenter.dismiss(animated: true) {
              promise.resolve(serialized)
            }
          } catch {
            presenter.dismiss(animated: true) {
              promise.reject(error)
            }
          }
        }
      )

      let host = UIHostingController(rootView: view)
      host.modalPresentationStyle = .formSheet
      presenter.present(host, animated: true)
    }
  }
}
