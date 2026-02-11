import SwiftUI

struct SearchResultView: View {
    let result: SearchResult

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(result.memory.extractedText.isEmpty ? "Image-only memory" : result.memory.extractedText)
                .lineLimit(2)
                .foregroundStyle(.white)

            HStack {
                Text(result.memory.tags.map(\.name).joined(separator: ", "))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
                Spacer()
                Text(String(format: "%.2f", result.score))
                    .font(.caption2)
                    .foregroundStyle(.marcAccent)
            }
        }
        .padding()
        .background(Color.marcCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
