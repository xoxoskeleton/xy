import SwiftUI
import SwiftData

struct TimelineView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Memory.createdAt, order: .reverse) private var memories: [Memory]
    @StateObject private var monitor = ScreenshotMonitor()
    @StateObject private var store = MemoryStore()
    @State private var showFavouritesOnly = false

    var filtered: [Memory] {
        showFavouritesOnly ? memories.filter(\.isFavourite) : memories
    }

    var body: some View {
        ZStack {
            Color.marcBackground.ignoresSafeArea()
            ScrollView {
                LazyVStack(spacing: 12) {
                    Toggle("Favourites only", isOn: $showFavouritesOnly)
                        .tint(.marcAccent)
                        .padding(.vertical, 8)

                    ForEach(filtered) { memory in
                        NavigationLink {
                            MemoryDetailView(memory: memory)
                        } label: {
                            MemoryCardView(memory: memory)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
            }
            .refreshable {
                await monitor.ingestRecentScreenshots(context: modelContext)
            }

            if store.isProcessingImport {
                ProgressView("Processing screenshot…")
                    .padding()
                    .background(.ultraThinMaterial)
                    .clipShape(Capsule())
            }
        }
        .navigationTitle("MARC")
        .task {
            await monitor.start(context: modelContext)
        }
        .onDisappear {
            monitor.stop()
        }
    }
}
