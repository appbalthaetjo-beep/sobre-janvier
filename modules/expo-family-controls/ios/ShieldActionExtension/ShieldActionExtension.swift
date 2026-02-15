import ManagedSettings
import ManagedSettingsUI
import DeviceActivity
import FamilyControls
import Foundation

final class ShieldActionExtension: ShieldActionDelegate {
  private let appGroupID = "group.com.balthazar.sobre"
  private let logsKey = "ShieldActionLogs"

  override func handle(
    action: ShieldAction,
    for application: ApplicationToken,
    completionHandler: @escaping (ShieldActionResponse) -> Void
  ) {
    // TEMP debug: detect if the extension is called at all
    let ud = UserDefaults(suiteName: appGroupID)
    var logs = ud?.stringArray(forKey: logsKey) ?? []
    logs.append("HANDLE CALLED")
    ud?.set(logs, forKey: logsKey)
    ud?.synchronize()

    completionHandler(.close)
  }

}
