import Foundation
import UserNotifications

struct ReminderService {
    func requestPermission() async throws {
        let center = UNUserNotificationCenter.current()
        _ = try await center.requestAuthorization(options: [.alert, .sound, .badge])
    }

    func scheduleReminder(for memory: Memory, at date: Date) async throws {
        let content = UNMutableNotificationContent()
        content.title = "MARC reminder"
        content.body = memory.extractedText.isEmpty ? "A saved memory is ready to revisit." : String(memory.extractedText.prefix(120))
        content.userInfo = ["memoryId": memory.id.uuidString]

        let interval = max(date.timeIntervalSinceNow, 1)
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: interval, repeats: false)
        let request = UNNotificationRequest(identifier: memory.id.uuidString, content: content, trigger: trigger)
        try await UNUserNotificationCenter.current().add(request)
    }

    func pendingRequests() async -> [UNNotificationRequest] {
        await UNUserNotificationCenter.current().pendingNotificationRequests()
    }
}
