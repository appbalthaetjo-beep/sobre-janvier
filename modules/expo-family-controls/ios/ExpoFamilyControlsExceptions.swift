import ExpoModulesCore

internal final class FamilyControlsUnavailableException: Exception {
  override var reason: String {
    "FamilyControls requires iOS 16 or later."
  }
}

internal final class FamilyControlsNotAuthorizedException: GenericException<String> {
  override var reason: String {
    "FamilyControls authorization status is \(param)."
  }
}

internal final class FamilyControlsPickerCanceledException: Exception {
  override var reason: String {
    "FamilyControls picker was canceled."
  }
}

internal final class FamilyControlsPresentationException: Exception {
  override var reason: String {
    "Unable to present FamilyControls picker."
  }
}

internal final class FamilyControlsAppGroupUnavailableException: Exception {
  override var reason: String {
    "App Group UserDefaults is unavailable. Check the App Group entitlement."
  }
}

internal final class FamilyControlsNoSavedSelectionException: Exception {
  override var reason: String {
    "No saved FamilyControls selection found."
  }
}
