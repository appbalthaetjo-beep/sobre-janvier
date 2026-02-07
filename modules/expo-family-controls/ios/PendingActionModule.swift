import ExpoModulesCore

public final class PendingActionModule: Module {
  private let appGroupSuiteName = "group.com.balthazar.sobre"
  private let pendingActionKey = "pendingAction"

  public func definition() -> ModuleDefinition {
    Name("PendingAction")

    Function("consume") { (expected: String) -> Bool in
      let defaults = UserDefaults(suiteName: appGroupSuiteName) ?? .standard
      let current = defaults.string(forKey: pendingActionKey)
      guard current == expected else {
        return false
      }
      defaults.removeObject(forKey: pendingActionKey)
      return true
    }
  }
}

