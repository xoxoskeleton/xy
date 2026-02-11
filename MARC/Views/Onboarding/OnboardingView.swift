import SwiftUI

struct OnboardingView: View {
    let onFinish: () -> Void
    @State private var step = 0

    private let pages: [(title: String, body: String)] = [
        ("Welcome to MARC", "Screenshot it. MARC remembers it. Ask MARC anything."),
        ("Your memories stay yours", "Everything is local-first, private, and on-device."),
        ("Grant photo access", "Allow screenshot ingestion to build your memory timeline."),
        ("Enable notifications", "Set reminders to resurface useful memories later.")
    ]

    var body: some View {
        ZStack {
            LinearGradient(colors: [Color.marcBackground, .black], startPoint: .topLeading, endPoint: .bottomTrailing)
                .ignoresSafeArea()

            VStack(alignment: .leading, spacing: 20) {
                Spacer()
                Text(pages[step].title)
                    .font(.largeTitle.weight(.bold))
                    .foregroundStyle(.white)
                Text(pages[step].body)
                    .foregroundStyle(.white.opacity(0.85))
                Spacer()

                Button(step == pages.count - 1 ? "Start" : "Continue") {
                    withAnimation(.spring) {
                        if step == pages.count - 1 {
                            onFinish()
                        } else {
                            step += 1
                        }
                    }
                }
                .buttonStyle(.borderedProminent)
            }
            .padding(28)
        }
    }
}
