import Foundation

struct SearchResult: Identifiable {
    var id: UUID { memory.id }
    let memory: Memory
    let score: Float
}

struct VectorSearchService {
    private let embeddingService = EmbeddingService()
    var threshold: Float = 0.3

    func search(query: String, memories: [Memory], topK: Int = 20, exactMatch: Bool = false) -> [SearchResult] {
        let textMatches: [SearchResult] = memories
            .filter { $0.extractedText.localizedCaseInsensitiveContains(query) || ($0.userNote?.localizedCaseInsensitiveContains(query) == true) }
            .map { SearchResult(memory: $0, score: 0.5) }

        guard !exactMatch, let queryVector = embeddingService.generateEmbedding(for: query) else {
            return Array(textMatches.prefix(topK))
        }

        let semantic = memories.compactMap { memory -> SearchResult? in
            let score = VectorMath.cosineSimilarity(queryVector, memory.embedding)
            guard score > threshold else { return nil }
            return SearchResult(memory: memory, score: score)
        }

        var seen = Set<UUID>()
        let merged = (semantic + textMatches)
            .sorted { $0.score > $1.score }
            .filter { seen.insert($0.memory.id).inserted }

        return Array(merged.prefix(topK))
    }
}
