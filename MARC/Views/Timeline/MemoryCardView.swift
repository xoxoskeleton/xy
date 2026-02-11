import SwiftUI

struct MemoryCardView: View {
    let memory: Memory

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if let uiImage = UIImage(data: memory.thumbnailData) {
                Image(uiImage: uiImage)
                    .resizable()
                    .scaledToFit()
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }

            Text(memory.extractedText.isEmpty ? "No text detected" : memory.extractedText)
                .lineLimit(3)
                .foregroundStyle(.white)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack {
                    ForEach(memory.tags, id: \.id) { tag in
                        Text(tag.name)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.marcAccent.opacity(0.25))
                            .clipShape(Capsule())
                    }
                }
            }

            HStack {
                Text(DateFormatters.relative.localizedString(for: memory.createdAt, relativeTo: .now))
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                Spacer()
                if memory.isFavourite {
                    Image(systemName: "star.fill").foregroundStyle(.yellow)
                }
            }
        }
        .padding()
        .background(Color.marcCard)
        .clipShape(RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(.white.opacity(0.08)))
    }
}
