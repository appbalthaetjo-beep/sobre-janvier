import Foundation
import ManagedSettings
import ManagedSettingsUI
import UIKit

final class ShieldConfigurationExtension: ShieldConfigurationDataSource {
  private let appGroupSuiteName = "group.com.balthazar.sobre"

  private let eveningEnabledKey = "eveningEnabled"
  private let eveningStartKey = "eveningStart"
  private let eveningEndKey = "eveningEnd"
  private let emergencyUntilKey = "emergencyUntil"

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
    // To make the app icon appear visually larger, we draw it slightly oversized
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
    return configurationForContext()
  }

  func configuration(shielding category: ActivityCategory) -> ShieldConfiguration {
    return configurationForContext()
  }

  override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
    return configurationForContext()
  }

  private func configurationForContext() -> ShieldConfiguration {
    let defaults = appGroupDefaults()
    ensureScheduleDefaults(defaults)

    let now = Date().timeIntervalSince1970

    let emergencyUntil = defaults.double(forKey: emergencyUntilKey)
    if emergencyUntil > now {
      let subtitle =
        "Blocage d'urgence : tiens bon.\n\n" +
        "Tes apps sensibles sont bloquees 10 minutes pour t'aider a respirer et reprendre le controle."

      return ShieldConfiguration(
        backgroundBlurStyle: .none,
        backgroundColor: .black,
        icon: shieldIconImage(),
        title: .init(text: "Blocage d'urgence 10 min", color: .white),
        subtitle: .init(text: subtitle, color: .white),
        primaryButtonLabel: .init(text: "OK", color: .black),
        primaryButtonBackgroundColor: .systemYellow,
        secondaryButtonLabel: .init(text: "Annuler", color: .systemYellow)
      )
    }

    let isEvening = isWithinEveningWindow(now: Date(), defaults: defaults)
    let eveningEnabled = defaults.bool(forKey: eveningEnabledKey)
    if isEvening && eveningEnabled {
      let subtitle =
        "Tu as choisi de proteger tes soirees.\n\n" +
        "Expire.\n\n" +
        "Fais attention a ta consommation.\n\n" +
        "Apres avoir continue, retape sur l'icone de l'app pour l'ouvrir."

      return ShieldConfiguration(
        backgroundBlurStyle: .none,
        backgroundColor: .black,
        icon: shieldIconImage(),
        title: .init(text: "Mode Nuit active", color: .white),
        subtitle: .init(text: subtitle, color: .white),
        primaryButtonLabel: .init(text: "Continuer (retape)", color: .black),
        primaryButtonBackgroundColor: .systemYellow,
        secondaryButtonLabel: .init(text: "Annuler", color: .systemYellow)
      )
    }

    let dailyEnabled = defaults.object(forKey: dailyEnabledKey) as? Bool ?? true
    let unlockedUntil = defaults.double(forKey: dailyUnlockedUntilKey)

    // Defensive cleanup: if the unlock window is expired, reset it so the shield UI is consistent.
    if unlockedUntil > 0 && now >= unlockedUntil {
      defaults.set(0, forKey: dailyUnlockedUntilKey)
    }

    let isDailyLocked = dailyEnabled && (unlockedUntil == 0 || unlockedUntil <= now)
    if isDailyLocked {
      let lastSentAt = defaults.double(forKey: dailyNotifLastSentAtKey)
      let shouldShowResend = lastSentAt > 0 && (now - lastSentAt) < 300
      let primaryLabel = shouldShowResend ? "Je n'ai pas recu la notification ?" : "Lancer le check-in"
      return ShieldConfiguration(
        backgroundBlurStyle: .none,
        backgroundColor: .black,
        icon: shieldIconImage(),
        title: .init(text: "Tes apps sensibles sont verrouillees.", color: .white),
        subtitle: .init(text: "Fais ton check-in Sobre pour les deverrouiller aujourd'hui.", color: .white),
        primaryButtonLabel: .init(text: primaryLabel, color: .black),
        primaryButtonBackgroundColor: .systemYellow
      )
    }

    return ShieldConfiguration(
      backgroundBlurStyle: .none,
      backgroundColor: .black,
      icon: shieldIconImage(),
      title: .init(text: "Acces limite", color: .white),
      subtitle: .init(text: "Cette fonctionnalite est bloquee.", color: .white),
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
    if defaults.object(forKey: emergencyUntilKey) == nil {
      defaults.set(0, forKey: emergencyUntilKey)
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
