import Foundation
import Photos
import SwiftData
import UIKit

@MainActor
final class ScreenshotMonitor: NSObject, ObservableObject, PHPhotoLibraryChangeObserver {
    @Published var status: PHAuthorizationStatus = .notDetermined

    private var screenshotsFetchResult: PHFetchResult<PHAsset>?
    private weak var modelContext: ModelContext?
    private weak var memoryStore: MemoryStore?

    func start(context: ModelContext, store: MemoryStore) async {
        modelContext = context
        memoryStore = store

        let newStatus = await PHPhotoLibrary.requestAuthorization(for: .readWrite)
        status = newStatus
        guard newStatus == .authorized || newStatus == .limited else { return }

        screenshotsFetchResult = fetchScreenshots(lastDays: 7)
        PHPhotoLibrary.shared().register(self)

        await ingestRecentScreenshots(context: context)
    }

    func stop() {
        PHPhotoLibrary.shared().unregisterChangeObserver(self)
    }

    nonisolated func photoLibraryDidChange(_ changeInstance: PHChange) {
        Task { @MainActor in
            guard let fetchResult = screenshotsFetchResult,
                  let details = changeInstance.changeDetails(for: fetchResult),
                  let context = modelContext else { return }

            screenshotsFetchResult = details.fetchResultAfterChanges
            let inserted = details.insertedObjects
            for asset in inserted where asset.mediaSubtypes.contains(.photoScreenshot) {
                let identifier = asset.localIdentifier
                let descriptor = FetchDescriptor<Memory>(predicate: #Predicate { $0.assetIdentifier == identifier })
                let existing = (try? context.fetchCount(descriptor)) ?? 0
                guard existing == 0 else { continue }

                await ingest(asset: asset, context: context)
            }
        }
    }

    func ingestRecentScreenshots(context: ModelContext) async {
        let result = fetchScreenshots(lastDays: 7)
        for index in 0..<result.count {
            let asset = result.object(at: index)
            let identifier = asset.localIdentifier
            let descriptor = FetchDescriptor<Memory>(predicate: #Predicate { $0.assetIdentifier == identifier })
            let existing = (try? context.fetchCount(descriptor)) ?? 0
            guard existing == 0 else { continue }

            await ingest(asset: asset, context: context)
        }
    }

    private func fetchScreenshots(lastDays: Int) -> PHFetchResult<PHAsset> {
        let options = PHFetchOptions()
        let since = Calendar.current.date(byAdding: .day, value: -lastDays, to: .now) ?? .distantPast
        options.predicate = NSPredicate(format: "mediaSubtype & %d != 0 AND creationDate >= %@", PHAssetMediaSubtype.photoScreenshot.rawValue, since as NSDate)
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]
        return PHAsset.fetchAssets(with: .image, options: options)
    }

    private func ingest(asset: PHAsset, context: ModelContext) async {
        guard let memoryStore else { return }

        let manager = PHImageManager.default()
        let options = PHImageRequestOptions()
        options.deliveryMode = .highQualityFormat
        options.isNetworkAccessAllowed = false

        let image: UIImage? = await withCheckedContinuation { continuation in
            manager.requestImage(for: asset, targetSize: PHImageManagerMaximumSize, contentMode: .default, options: options) { image, _ in
                continuation.resume(returning: image)
            }
        }

        guard let image else { return }
        await memoryStore.importImage(
            image,
            createdAt: asset.creationDate ?? .now,
            assetIdentifier: asset.localIdentifier,
            context: context
        )
    }
}
