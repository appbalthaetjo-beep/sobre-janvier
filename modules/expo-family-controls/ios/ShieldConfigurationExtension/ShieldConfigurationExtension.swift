import Foundation
import ManagedSettings
import ManagedSettingsUI
import UIKit

final class ShieldConfigurationExtension: ShieldConfigurationDataSource {
  private let appGroupSuiteName = "group.com.balthazar.sobre"
  private let eveningEnabledKey = "eveningEnabled"
  private let eveningStartKey = "eveningStart"
  private let eveningEndKey = "eveningEnd"
  private let dailyEnabledKey = "dailyEnabled"
  private let dailyUnlockedUntilKey = "dailyUnlockedUntil"
  private let dailyNotifLastSentAtKey = "dailyNotifLastSentAt"

  private func sobreWordmarkImage() -> UIImage? {
    if let image = UIImage(named: "sobre_wordmark") {
      return image.withRenderingMode(.alwaysOriginal)
    }
    if let path = Bundle.main.path(forResource: "sobre_wordmark", ofType: "png"),
       let image = UIImage(contentsOfFile: path) {
      return image.withRenderingMode(.alwaysOriginal)
    }
    return nil
  }

  private func sobreLogoImage() -> UIImage? {
    if let image = UIImage(named: "sobre_logo") {
      return image.withRenderingMode(.alwaysOriginal)
    }
    if let path = Bundle.main.path(forResource: "sobre_logo", ofType: "png"),
       let image = UIImage(contentsOfFile: path) {
      return image.withRenderingMode(.alwaysOriginal)
    }
    return nil
  }

  private func sobreShieldLogoImage() -> UIImage? {
    if let image = UIImage(named: "sobre_shield_logo") {
      return image.withRenderingMode(.alwaysOriginal)
    }
    if let path = Bundle.main.path(forResource: "sobre_shield_logo", ofType: "png"),
       let image = UIImage(contentsOfFile: path) {
      return image.withRenderingMode(.alwaysOriginal)
    }
    return nil
  }

  private func shieldAppIconImage() -> UIImage? {
    guard let base = sobreLogoImage() else {
      return nil
    }

    // The Shield icon slot is small and iOS may add its own padding.
    // To make the app icon appear visually larger, we draw it slightly "oversized"
    // into a square canvas so it fills more of the available area.
    let canvasSize = CGSize(width: 256, height: 256)
    let oversize: CGFloat = 1.18
    let drawSize = CGSize(width: canvasSize.width * oversize, height: canvasSize.height * oversize)
    let origin = CGPoint(x: (canvasSize.width - drawSize.width) / 2, y: (canvasSize.height - drawSize.height) / 2)
    let drawRect = CGRect(origin: origin, size: drawSize)

    let format = UIGraphicsImageRendererFormat.default()
    format.opaque = false
    format.scale = 2
    let renderer = UIGraphicsImageRenderer(size: canvasSize, format: format)
    let image = renderer.image { _ in
      base.draw(in: drawRect)
    }
    return image.withRenderingMode(.alwaysOriginal)
  }

  private func shieldIconImage() -> UIImage? {
    // Use the dedicated Shield logo for both shields (Daily + Night), then fall back to the app icon.
    return sobreShieldLogoImage() ?? shieldAppIconImage() ?? sobreLogoImage() ?? sobreWordmarkImage()
  }

  override func configuration(shielding application: Application) -> ShieldConfiguration {
    return configurationForCurrentMode()
  }

  func configuration(shielding category: ActivityCategory) -> ShieldConfiguration {
    return configurationForCurrentMode()
  }

  override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
    return configurationForCurrentMode()
  }

  private func configurationForCurrentMode() -> ShieldConfiguration {
    let defaults = appGroupDefaults()
    ensureScheduleDefaults(defaults)
    let isEvening = isWithinEveningWindow(now: Date(), defaults: defaults)
    let eveningEnabled = defaults.bool(forKey: eveningEnabledKey)

    if isEvening && eveningEnabled {
      let subtitle =
        "Tu as choisi de protéger tes soirées.\n\n" +
        "Expire.\n\n" +
        "Fais attention à ta consommation."
      return ShieldConfiguration(
        backgroundBlurStyle: .none,
        backgroundColor: .black,
        icon: shieldIconImage(),
        title: .init(text: "Mode Nuit activé", color: .white),
        subtitle: .init(text: subtitle, color: .white),
        primaryButtonLabel: .init(text: "Continuer quand même", color: .black),
        primaryButtonBackgroundColor: .systemYellow,
        secondaryButtonLabel: .init(text: "Annuler", color: .systemYellow)
      )
    }

    let dailyEnabled = defaults.object(forKey: dailyEnabledKey) as? Bool ?? true
    let unlockedUntil = defaults.double(forKey: dailyUnlockedUntilKey)
    // Defensive cleanup: if the unlock window is expired, reset it so the shield UI is consistent.
    if unlockedUntil > 0 && Date().timeIntervalSince1970 >= unlockedUntil {
      defaults.set(0, forKey: dailyUnlockedUntilKey)
    }
    // If we're not in evening mode and the system is showing a Shield, prefer our custom "Daily Reset"
    // UI (with the primary button) instead of falling back to a generic "Accès limité" UI.
    // The shield should normally not be presented while unlocked, but if it is, showing our UI still
    // preserves the expected path for users.
    if dailyEnabled {
      let lastSentAt = defaults.double(forKey: dailyNotifLastSentAtKey)
      let now = Date().timeIntervalSince1970
      let shouldShowResend = lastSentAt > 0 && (now - lastSentAt) < 300
      let primaryLabel = shouldShowResend ? "Je n’ai pas reçu la notification ?" : "Lancer le check-in"
      return ShieldConfiguration(
        backgroundBlurStyle: .none,
        backgroundColor: .black,
        icon: shieldIconImage(),
        title: .init(text: "Tes apps sensibles sont verrouillées.", color: .white),
        subtitle: .init(text: "Fais ton check-in Sobre pour les déverrouiller aujourd’hui.", color: .white),
        primaryButtonLabel: .init(text: primaryLabel, color: .black),
        primaryButtonBackgroundColor: .systemYellow
      )
    }

    return ShieldConfiguration(
      backgroundBlurStyle: .none,
      backgroundColor: .black,
      icon: shieldIconImage(),
      title: .init(text: "Accès limité", color: .white),
      subtitle: .init(text: "Cette fonctionnalité est bloquée.", color: .white),
      primaryButtonLabel: .init(text: "Fermer", color: .black),
      primaryButtonBackgroundColor: .systemYellow,
      secondaryButtonLabel: .init(text: "Annuler", color: .systemYellow)
    )
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
    if defaults.object(forKey: dailyNotifLastSentAtKey) == nil {
      defaults.set(0, forKey: dailyNotifLastSentAtKey)
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
