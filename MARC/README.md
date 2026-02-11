# MARC — Memory Augmented Recall Companion

MARC is a local-first iOS app that ingests screenshots into a searchable personal memory index.

## Privacy promise

- No accounts
- No cloud sync
- No analytics/telemetry
- No network calls

## Requirements

- Xcode 15+
- iOS 17+ deployment target
- Swift 5.9+

## Project structure

```
MARC/
├── App/
├── Models/
├── Services/
├── Utilities/
└── Views/
```

## Setup

1. In Xcode, create a new iOS App target named `MARC`.
2. Drag the `MARC/` source folders into the target.
3. Enable capabilities:
   - Photos
   - Notifications
4. Add usage strings to `Info.plist`:
   - `NSPhotoLibraryUsageDescription`
   - `NSPhotoLibraryAddUsageDescription`
5. Build and run on iOS 17 simulator/device.

## Embeddings

MVP uses `NaturalLanguage.NLEmbedding.sentenceEmbedding(for: .english)` for on-device sentence vectors.

### Optional Core ML upgrade

If you want stronger retrieval quality, convert a quantized MiniLM model to Core ML and place it in `MARC/Resources/`.

Example conversion entry point:

```bash
python -m pip install coremltools transformers optimum
python convert_minilm_to_coreml.py
```

Then update `EmbeddingService` to call the generated Core ML model and keep vector dimension fixed (for example 384).

## Notes

- OCR is powered by Vision (`VNRecognizeTextRequest`) with `.accurate` mode.
- Cosine similarity uses Accelerate (`vDSP.dot`, `vDSP.sumOfSquares`).
- Screenshot import is event-driven via `PHPhotoLibraryChangeObserver`.
