import Accelerate
import Foundation

enum VectorMath {
    static func cosineSimilarity(_ lhs: [Float], _ rhs: [Float]) -> Float {
        guard lhs.count == rhs.count, !lhs.isEmpty else { return 0 }

        let dot = vDSP.dot(lhs, rhs)
        let lhsNorm = sqrt(vDSP.sumOfSquares(lhs))
        let rhsNorm = sqrt(vDSP.sumOfSquares(rhs))
        guard lhsNorm > 0, rhsNorm > 0 else { return 0 }

        return dot / (lhsNorm * rhsNorm)
    }
}
