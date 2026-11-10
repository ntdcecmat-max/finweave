package synthetic.finweave.spike

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.provider.Settings
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

// UNCOMPILED candidate. Dedicated synthetic app, never registered in REAL builds.
@CapacitorPlugin(name = "SyntheticProbe")
class SyntheticProbePlugin : Plugin() {
    @PluginMethod fun getProbeStatus(call: PluginCall) {
        val manager = context.getSystemService(NotificationManager::class.java)
        val enabled = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
            ?.split(":")?.any { it.substringBefore("/") == context.packageName } == true
        call.resolve(JSObject().put("profile", "SYNTHETIC").put("listenerEnabled", enabled)
            .put("postingEnabled", manager.areNotificationsEnabled()).put("fullBridgeReady", false)
            .put("capturedFixtureCount", SyntheticListener.count.get()))
    }
    @PluginMethod fun openListenerSettings(call: PluginCall) {
        activity.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        // Opening settings never implies permission granted.
        call.resolve(JSObject().put("opened", true))
    }
    @PluginMethod fun emitFixture(call: PluginCall) {
        val manager = context.getSystemService(NotificationManager::class.java)
        if (!manager.areNotificationsEnabled()) { call.reject("PERMISSION_DENIED"); return }
        if (android.os.Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(
            NotificationChannel("fixture", "Synthetic probe", NotificationManager.IMPORTANCE_DEFAULT))
        val builder = if (android.os.Build.VERSION.SDK_INT >= 26) Notification.Builder(context,"fixture") else Notification.Builder(context)
        val notification = builder.setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("SYNTHETIC ONLY").setContentText("SYNTHETIC IN 12345 VND ACC=A REF=R1").build()
        try { manager.notify(1,notification); call.resolve(JSObject().put("posted",true)) }
        catch (_: SecurityException) { call.reject("PERMISSION_DENIED") }
    }
}
