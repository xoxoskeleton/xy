import Foundation
import SwiftData
import UIKit

@MainActor
final class MemoryStore: ObservableObject {
    @Published var isProcessingImport = false

    private let ocrService = OCRService()
    private let embeddingService = EmbeddingService()
    private let autoTagger = AutoTagger()

    func importImage(
        _ image: UIImage,
        createdAt: Date = .now,
        assetIdentifier: String = "",
        context: ModelContext
    ) async {
        isProcessingImport = true
        defer { isProcessingImport = false }

        let compressed = image.jpegData(compressionQuality: 0.82) ?? Data()
        let thumbnail = image.thumbnailJPEGData(maxWidth: 300) ?? Data()

        let text: String
        do {
            text = try await ocrService.extractText(from: image)
        } catch {
            text = ""
        }

        let vector = embeddingService.generateEmbedding(for: text) ?? []
        let autoTagNames = autoTagger.tags(for: text)

        let tags: [Tag] = autoTagNames.map { name in
            let descriptor = FetchDescriptor<Tag>(predicate: #Predicate { $0.name == name })
            if let existing = try? context.fetch(descriptor).first {
                return existing
            }

            let newTag = Tag(name: name)
            context.insert(newTag)
            return newTag
        }

        let resolvedIdentifier = assetIdentifier.isEmpty ? "manual-\(UUID().uuidString)" : assetIdentifier

        let memory = Memory(
            assetIdentifier: resolvedIdentifier,
            imageData: compressed,
            thumbnailData: thumbnail,
            extractedText: text,
            embedding: vector,
            tags: tags,
            createdAt: createdAt
        )

        context.insert(memory)

        do {
            try context.save()
            let impact = UIImpactFeedbackGenerator(style: .medium)
            impact.impactOccurred()
        } catch {
            context.delete(memory)
        }
    }
}

private extension UIImage {
    func thumbnailJPEGData(maxWidth: CGFloat) -> Data? {
        let ratio = maxWidth / size.width
        let targetSize = CGSize(width: maxWidth, height: size.height * ratio)
        let renderer = UIGraphicsImageRenderer(size: targetSize)
        let image = renderer.image { _ in
            draw(in: CGRect(origin: .zero, size: targetSize))
        }
        return image.jpegData(compressionQuality: 0.72)
    }
}
