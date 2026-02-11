import Foundation

struct AutoTagger {
    func tags(for text: String) -> [String] {
        let lower = text.lowercased()
        let words = lower.split(whereSeparator: { $0.isWhitespace || $0.isNewline })
        var output: [String] = []

        if hasAny(lower, ["total", "£", "$", "payment", "order", "invoice", "vat"]) { output.append("Receipt/Finance") }
        if hasAny(lower, ["menu", "restaurant", "book a table", "pasta", "pizza", "brunch"]) { output.append("Food/Restaurant") }
        if hasAny(lower, ["flight", "booking", "hotel", "departure", "gate"]) { output.append("Travel") }
        if hasAny(lower, ["@", ".com"]) || lower.range(of: #"\+?\d[\d\s\-]{7,}"#, options: .regularExpression) != nil { output.append("Contact") }
        if hasAny(lower, ["street", "road", "avenue", "postcode", "zip"]) { output.append("Location") }
        if lower.range(of: #"(func\s+\w+|let\s+\w+|class\s+\w+|\{.*\})"#, options: .regularExpression) != nil { output.append("Code") }
        if lower.range(of: #"^\w+:|\d{1,2}:\d{2}"#, options: [.regularExpression, .anchorsMatchLines]) != nil { output.append("Conversation") }
        if words.count > 200 { output.append("Web/Article") }
        if words.count < 50 && output.isEmpty { output.append("Idea/Note") }

        return output.isEmpty ? ["Uncategorised"] : output
    }

    private func hasAny(_ text: String, _ keywords: [String]) -> Bool {
        keywords.contains { text.contains($0) }
    }
}
