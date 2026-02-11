import Foundation
import SwiftData

@Model
final class Memory {
    @Attribute(.unique) var id: UUID
    @Attribute(.externalStorage) var imageData: Data
    @Attribute(.externalStorage) var thumbnailData: Data
    var extractedText: String
    @Attribute(.externalStorage) var embeddingData: Data
    @Relationship(deleteRule: .nullify) var tags: [Tag]
    var userNote: String?
    var createdAt: Date
    var importedAt: Date
    var reminderDate: Date?
    var isFavourite: Bool
    var sourceApp: String?

    init(
        id: UUID = UUID(),
        imageData: Data,
        thumbnailData: Data,
        extractedText: String,
        embedding: [Float],
        tags: [Tag] = [],
        userNote: String? = nil,
        createdAt: Date,
        importedAt: Date = .now,
        reminderDate: Date? = nil,
        isFavourite: Bool = false,
        sourceApp: String? = nil
    ) {
        self.id = id
        self.imageData = imageData
        self.thumbnailData = thumbnailData
        self.extractedText = extractedText
        self.embeddingData = embedding.withUnsafeBufferPointer { Data(buffer: $0) }
        self.tags = tags
        self.userNote = userNote
        self.createdAt = createdAt
        self.importedAt = importedAt
        self.reminderDate = reminderDate
        self.isFavourite = isFavourite
        self.sourceApp = sourceApp
    }

    var embedding: [Float] {
        embeddingData.withUnsafeBytes { raw in
            let ptr = raw.bindMemory(to: Float.self)
            return Array(ptr)
        }
    }
}
