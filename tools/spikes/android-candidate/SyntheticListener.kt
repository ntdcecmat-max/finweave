package synthetic.finweave.spike

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.concurrent.atomic.AtomicInteger

// No raw text projection, no persistence, no network. Counts only self-authored fixture.
class SyntheticListener : NotificationListenerService() {
    companion object { val count = AtomicInteger(0) }
    override fun onNotificationPosted(sbn: StatusBarNotification) {
        if (sbn.packageName == packageName && sbn.id == 1) count.incrementAndGet()
    }
}
