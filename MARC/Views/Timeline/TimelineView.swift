import PhotosUI
import SwiftData
import SwiftUI

struct TimelineView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Memory.createdAt, order: .reverse) private var memories: [Memory]
    @StateObject private var monitor = ScreenshotMonitor()
    @StateObject private var store = MemoryStore()
    @State private var showFavouritesOnly = false
    @State private var selectedPhoto: PhotosPickerItem?

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
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                PhotosPicker(selection: $selectedPhoto, matching: .images) {
                    Image(systemName: "plus.circle.fill")
                        .foregroundStyle(.marcAccent)
                }
            }
        }
        .task {
            await monitor.start(context: modelContext, store: store)
        }
        .onChange(of: selectedPhoto) { _, item in
            guard let item else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    await store.importImage(image, context: modelContext)
                }
            }
        }
        .onDisappear {
            monitor.stop()
        }
    }
}
