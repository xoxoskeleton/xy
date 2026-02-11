import UIKit
import Vision

struct OCRService {
    func extractText(from image: UIImage) async throws -> String {
        guard let cgImage = image.cgImage else { return "" }

        return try await withCheckedThrowingContinuation { continuation in
            let request = VNRecognizeTextRequest { request, error in
                if let error {
                    continuation.resume(throwing: error)
                    return
                }

                let observations = (request.results as? [VNRecognizedTextObservation]) ?? []
                let ordered = observations.sorted {
                    let lhs = $0.boundingBox
                    let rhs = $1.boundingBox
                    if abs(lhs.midY - rhs.midY) > 0.03 {
                        return lhs.midY > rhs.midY
                    }
                    return lhs.minX < rhs.minX
                }

                let lines = ordered.compactMap { $0.topCandidates(1).first?.string }
                continuation.resume(returning: lines.joined(separator: "\n"))
            }

            request.recognitionLevel = .accurate
            request.recognitionLanguages = ["en-GB", "en"]
            request.usesLanguageCorrection = true

            let handler = VNImageRequestHandler(cgImage: cgImage)
            do {
                try handler.perform([request])
            } catch {
                continuation.resume(throwing: error)
            }
        }
    }
}
