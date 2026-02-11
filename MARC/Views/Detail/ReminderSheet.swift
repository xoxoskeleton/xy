import SwiftUI

struct ReminderSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onPick: (Date) -> Void

    @State private var customDate = Date.now.addingTimeInterval(86_400)
    @State private var showCustom = false

    var body: some View {
        NavigationStack {
            List {
                Button("Tomorrow") { schedule(days: 1) }
                Button("In 3 days") { schedule(days: 3) }
                Button("Next week") { schedule(days: 7) }

                Button("Custom date") {
                    showCustom = true
                }

                if showCustom {
                    DatePicker(
                        "Pick a date",
                        selection: $customDate,
                        in: Date.now...,
                        displayedComponents: [.date, .hourAndMinute]
                    )

                    Button("Confirm") {
                        onPick(customDate)
                        dismiss()
                    }
                    .buttonStyle(.borderedProminent)
                }
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
