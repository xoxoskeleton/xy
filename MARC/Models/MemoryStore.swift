import Foundation
import PhotosUI
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

        let tags = autoTagNames.map { Tag(name: $0) }
        tags.forEach { context.insert($0) }

        let memory = Memory(
            imageData: compressed,
            thumbnailData: thumbnail,
            extractedText: text,
            embedding: vector,
            tags: tags,
            createdAt: createdAt
        )

        context.insert(memory)
        try? context.save()
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
