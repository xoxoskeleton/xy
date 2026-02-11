import SwiftData
import SwiftUI

struct SearchView: View {
    @Query(sort: \Memory.createdAt, order: .reverse) private var memories: [Memory]
    @State private var query = ""
    @State private var exactMatch = false
    @State private var results: [SearchResult] = []
    @State private var searchTask: Task<Void, Never>?

    private let service = VectorSearchService()

    var body: some View {
        ZStack {
            Color.marcBackground.ignoresSafeArea()
            VStack(spacing: 12) {
                TextField("Ask MARC anything", text: $query)
                    .textFieldStyle(.roundedBorder)

                Toggle("Exact match", isOn: $exactMatch)
                    .tint(.marcAccent)

                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(results) { result in
                            NavigationLink {
                                MemoryDetailView(memory: result.memory)
                            } label: {
                                SearchResultView(result: result)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Search")
        .onChange(of: query) { _, _ in
            runSearch()
        }
        .onChange(of: exactMatch) { _, _ in
            runSearch()
        }
        .onDisappear {
            searchTask?.cancel()
        }
    }

    private func runSearch() {
        searchTask?.cancel()
        searchTask = Task {
            try? await Task.sleep(for: .milliseconds(300))
            guard !Task.isCancelled else { return }
            guard !query.isEmpty else {
                results = []
                return
            }
            results = service.search(query: query, memories: memories, exactMatch: exactMatch)
        }
    }
}
