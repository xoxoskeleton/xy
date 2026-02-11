import SwiftUI

struct ReminderSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onPick: (Date) -> Void

    var body: some View {
        NavigationStack {
            List {
                Button("Tomorrow") { schedule(days: 1) }
                Button("In 3 days") { schedule(days: 3) }
                Button("Next week") { schedule(days: 7) }
            }
            .navigationTitle("Set reminder")
        }
    }

    private func schedule(days: Int) {
        let date = Calendar.current.date(byAdding: .day, value: days, to: .now) ?? .now
        onPick(date)
        dismiss()
    }
}
