import Foundation
import NaturalLanguage

struct EmbeddingService {
    private let sentenceEmbedding = NLEmbedding.sentenceEmbedding(for: .english)

    func generateEmbedding(for text: String) -> [Float]? {
        let normalized = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !normalized.isEmpty else { return nil }
        guard let vector = sentenceEmbedding?.vector(for: normalized) else { return nil }
        return vector.map(Float.init)
    }
}
