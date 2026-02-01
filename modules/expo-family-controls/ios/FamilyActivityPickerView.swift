import SwiftUI
import FamilyControls

@available(iOS 16.0, *)
struct FamilyActivityPickerView: View {
  @State var selection: FamilyActivitySelection
  let onCancel: () -> Void
  let onConfirm: (FamilyActivitySelection) -> Void

  var body: some View {
    NavigationView {
      VStack(spacing: 0) {
        FamilyActivityPicker(selection: $selection)
          .frame(maxWidth: .infinity, maxHeight: .infinity)

        Button("Valider") {
          onConfirm(selection)
        }
        .buttonStyle(.borderedProminent)
        .padding()
      }
      .navigationTitle("Blocage")
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Fermer") {
            onCancel()
          }
        }
      }
    }
  }
}
