import Foundation
import SwiftData

@Model
final class Tag {
    @Attribute(.unique) var id: UUID
    var name: String
    var colorHex: String
    var isUserDefined: Bool

    init(id: UUID = UUID(), name: String, colorHex: String = "#4A9EFF", isUserDefined: Bool = false) {
        self.id = id
        self.name = name
        self.colorHex = colorHex
        self.isUserDefined = isUserDefined
    }
}
