import SwiftUI
import SwiftData

struct MemoryDetailView: View {
    @Environment(\.modelContext) private var modelContext
    @Bindable var memory: Memory
    @State private var showReminderSheet = false
    @State private var magnification: CGFloat = 1

    private let reminderService = ReminderService()
    private let searchService = VectorSearchService()
    @Query private var allMemories: [Memory]

    var related: [Memory] {
        let matches = searchService.search(query: memory.extractedText, memories: allMemories, topK: 6)
        return matches.map(\.memory).filter { $0.id != memory.id }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if let image = UIImage(data: memory.imageData) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .scaleEffect(magnification)
                        .gesture(MagnificationGesture().onChanged { magnification = $0 })
                }

                Text("Extracted Text")
                    .font(.headline)
                Text(memory.extractedText.isEmpty ? "No text found." : memory.extractedText)
                    .textSelection(.enabled)

                TextField("Add note", text: Binding($memory.userNote, replacingNilWith: ""), axis: .vertical)
                    .textFieldStyle(.roundedBorder)

                Button(memory.isFavourite ? "Unfavourite" : "Favourite") {
                    memory.isFavourite.toggle()
                    try? modelContext.save()
                }

                Button("Set reminder") {
                    showReminderSheet = true
                }

                if !related.isEmpty {
                    Text("Related memories")
                        .font(.headline)
                    ForEach(Array(related.prefix(5))) { item in
                        Text(item.extractedText.isEmpty ? "Image-only memory" : item.extractedText)
                            .lineLimit(2)
                            .padding(10)
                            .background(Color.marcCard)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                }
            }
            .padding()
        }
        .background(Color.marcBackground.ignoresSafeArea())
        .sheet(isPresented: $showReminderSheet) {
            ReminderSheet { date in
                Task {
                    try? await reminderService.scheduleReminder(for: memory, at: date)
                    memory.reminderDate = date
                    try? modelContext.save()
                }
            }
        }
    }
}

private extension Binding where Value == String? {
    init(_ source: Binding<String?>, replacingNilWith nilValue: String) {
        self.init(get: { source.wrappedValue ?? nilValue }, set: { source.wrappedValue = $0 })
    }
}
