import SwiftUI
import SwiftData

struct ContentView: View {
    var body: some View {
        TabView {
            NavigationStack {
                TimelineView()
            }
            .tabItem {
                Label("Timeline", systemImage: "clock.arrow.circlepath")
            }

            NavigationStack {
                SearchView()
            }
            .tabItem {
                Label("Search", systemImage: "magnifyingglass")
            }

            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: "gearshape")
            }
        }
        .background(Color.marcBackground.ignoresSafeArea())
    }
}

extension Color {
    static let marcBackground = Color(red: 10/255, green: 14/255, blue: 26/255)
    static let marcAccent = Color(red: 74/255, green: 158/255, blue: 1.0)
    static let marcCard = Color.white.opacity(0.08)
}
