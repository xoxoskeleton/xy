import SwiftUI
import SwiftData

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var memories: [Memory]
    @State private var showConfirm = false

    var body: some View {
        List {
            Section("Privacy") {
                Text("All data is stored locally on this device.")
                Button("Clear all data", role: .destructive) {
                    showConfirm = true
                }
            }

            Section("About") {
                Text("MARC v1.0")
                Text("Made with 🧠 by MARC")
            }
        }
        .scrollContentBackground(.hidden)
        .background(Color.marcBackground)
        .navigationTitle("Settings")
        .alert("Delete all memories?", isPresented: $showConfirm) {
            Button("Delete", role: .destructive) {
                memories.forEach(modelContext.delete)
                try? modelContext.save()
            }
            Button("Cancel", role: .cancel) { }
        }
    }
}
