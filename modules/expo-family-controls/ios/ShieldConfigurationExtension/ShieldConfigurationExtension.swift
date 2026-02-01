import Foundation
import ManagedSettings
import ManagedSettingsUI

final class ShieldConfigurationExtension: ShieldConfigurationDataSource {
  private let appGroupSuiteName = "group.com.balthazar.sobre"
  private let eveningStartKey = "eveningStart"
  private let eveningEndKey = "eveningEnd"
  private let frictionStartKey = "eveningFrictionStart"
  private let dailyEnabledKey = "dailyEnabled"
  private let dailyUnlockedUntilKey = "dailyUnlockedUntil"
  private let dailyNotifLastSentAtKey = "dailyNotifLastSentAt"

  override func configuration(shielding application: Application) -> ShieldConfiguration {
    return configurationForCurrentMode()
  }

  override func configuration(shielding application: Application, in category: ActivityCategory) -> ShieldConfiguration {
    return configurationForCurrentMode()
  }

  override func configuration(shielding webDomain: WebDomain) -> ShieldConfiguration {
    return configurationForCurrentMode()
  }

  override func configuration(shielding webDomain: WebDomain, in category: ActivityCategory) -> ShieldConfiguration {
    return configurationForCurrentMode()
  }

  private func configurationForCurrentMode() -> ShieldConfiguration {
    let defaults = appGroupDefaults()
    ensureScheduleDefaults(defaults)
    let isEvening = isWithinEveningWindow(now: Date(), defaults: defaults)
    let eveningEnabled = defaults.object(forKey: "eveningEnabled") as? Bool ?? true

    if isEvening && eveningEnabled {
      let remaining = remainingFrictionSeconds(defaults: defaults)
      let subtitle = remaining > 0 ? "Respire \(remaining) secondes…" : "Respire 5 secondes…"
      return ShieldConfiguration(
        backgroundBlurStyle: .systemUltraThinMaterialDark,
        icon: .init(systemName: "moon.stars.fill"),
        title: .init(text: "Mode Nuit activé"),
        subtitle: .init(text: subtitle),
        primaryButtonLabel: .init(text: "Continuer quand même"),
        secondaryButtonLabel: .init(text: "Aide-moi (SOS)")
      )
    }

    let dailyEnabled = defaults.object(forKey: dailyEnabledKey) as? Bool ?? true
    let unlockedUntil = defaults.double(forKey: dailyUnlockedUntilKey)
    let isLocked = unlockedUntil <= Date().timeIntervalSince1970

    if dailyEnabled && isLocked {
      let lastSentAt = defaults.double(forKey: dailyNotifLastSentAtKey)
      let now = Date().timeIntervalSince1970
      let shouldShowResend = lastSentAt > 0 && (now - lastSentAt) < 300
      let primaryLabel = shouldShowResend ? "Je n’ai pas reçu la notification ?" : "Lancer le check-in"
      return ShieldConfiguration(
        backgroundBlurStyle: .systemUltraThinMaterialDark,
        icon: .init(systemName: "lock.shield"),
        title: .init(text: "Tes apps sensibles sont verrouillées."),
        subtitle: .init(text: "Fais ton check-in Sobre pour les déverrouiller aujourd’hui."),
        primaryButtonLabel: .init(text: primaryLabel)
      )
    }

    return ShieldConfiguration(
      backgroundBlurStyle: .systemUltraThinMaterialDark,
      icon: .init(systemName: "lock.fill"),
      title: .init(text: "Accès limité"),
      subtitle: .init(text: "Cette fonctionnalité est bloquée."),
      primaryButtonLabel: .init(text: "Fermer"),
      secondaryButtonLabel: .init(text: "Annuler")
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
    if defaults.object(forKey: "eveningEnabled") == nil {
      defaults.set(true, forKey: "eveningEnabled")
    }
    if defaults.string(forKey: eveningStartKey) == nil {
      defaults.set("22:00", forKey: eveningStartKey)
    }
    if defaults.string(forKey: eveningEndKey) == nil {
      defaults.set("07:00", forKey: eveningEndKey)
    }
  }

  private func remainingFrictionSeconds(defaults: UserDefaults) -> Int {
    let now = Date().timeIntervalSince1970
    let start = defaults.double(forKey: frictionStartKey)
    if start <= 0 || now - start > 30 {
      defaults.set(now, forKey: frictionStartKey)
      return 5
    }
    let elapsed = max(0, now - start)
    let remaining = max(0, 5 - Int(elapsed))
    return remaining
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
