import SwiftUI
import SwiftData

@main
struct MARCApp: App {
    @State private var hasCompletedOnboarding = UserDefaults.standard.bool(forKey: "hasCompletedOnboarding")

    var sharedModelContainer: ModelContainer = {
        do {
            return try ModelContainer(for: Memory.self, Tag.self)
        } catch {
            fatalError("Unable to create model container: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            Group {
                if hasCompletedOnboarding {
                    ContentView()
                } else {
                    OnboardingView {
                        hasCompletedOnboarding = true
                        UserDefaults.standard.set(true, forKey: "hasCompletedOnboarding")
                    }
                }
            }
            .preferredColorScheme(.dark)
            .tint(Color.marcAccent)
        }
        .modelContainer(sharedModelContainer)
    }
}
