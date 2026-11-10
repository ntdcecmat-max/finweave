package test.finweave.prototype.collector

import android.app.Notification
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import androidx.core.content.ContextCompat
import java.util.concurrent.ConcurrentHashMap

object AppVerifier {
    @Suppress("DEPRECATION")
    fun inspect(context:Context,packageName:String):AppIdentity? = try {
        val flags=if(Build.VERSION.SDK_INT>=28) PackageManager.GET_SIGNING_CERTIFICATES else PackageManager.GET_SIGNATURES
        val info=context.packageManager.getPackageInfo(packageName,flags)
        // Rotation lineage is not automatically admitted. Exact current signer set.
        val signatures=if(Build.VERSION.SDK_INT>=28) info.signingInfo?.apkContentsSigners else info.signatures
        AppIdentity(packageName,if(Build.VERSION.SDK_INT>=28) info.longVersionCode else info.versionCode.toLong(),
            signatures?.map { Wire.sha(it.toByteArray()) }?.toSet() ?: emptySet(),Build.VERSION.SDK_INT,Build.MANUFACTURER,Build.MODEL)
    } catch (_:Exception) { null }
}
class CollectorListener:NotificationListenerService() {
    private val identities=ConcurrentHashMap<String,AppIdentity>()
    private val runtime by lazy { CollectorRuntime.get(this) }
    private val packages=object:BroadcastReceiver() {
        override fun onReceive(context:Context,intent:Intent) {
            val name=intent.data?.schemeSpecificPart ?: return
            if(SourceCatalog.liveProfiles.none { it.packageName==name }) return
            identities.remove(name);runtime.fence("UPDATE_REQUIRED");refreshIdentities()
        }
    }
    override fun onCreate() {
        super.onCreate()
        val filter=IntentFilter().apply { addAction(Intent.ACTION_PACKAGE_ADDED);addAction(Intent.ACTION_PACKAGE_REPLACED);addAction(Intent.ACTION_PACKAGE_REMOVED);addDataScheme("package") }
        ContextCompat.registerReceiver(this,packages,filter,ContextCompat.RECEIVER_EXPORTED)
    }
    private fun refreshIdentities() { runtime.execute { SourceCatalog.liveProfiles.forEach { profile -> AppVerifier.inspect(this,profile.packageName)?.let { identities[profile.packageName]=it } } } }
    override fun onListenerConnected() { runtime.listenerBound=true;refreshIdentities() }
    override fun onListenerDisconnected() { runtime.listenerBound=false;identities.clear();NotificationProbe.stop(this);ZaloPreview.stop("ACCESS_OR_LISTENER_LOST");runtime.fence("LISTENER_UNBOUND") }
    override fun onNotificationPosted(sbn:StatusBarNotification) {
        try {
        if(sbn.packageName==packageName) { NotificationProbe.receive(this,sbn);return }
        ZaloPreview.receive(this,sbn)
        val profile=SourceCatalog.liveProfiles.singleOrNull { it.packageName==sbn.packageName } ?: return
        val identity=identities[sbn.packageName] ?: return
        val generation=runtime.generation.get()
        if(runtime.gate(profile,identity,generation)==null) return
        val n=sbn.notification
        if(n.flags and Notification.FLAG_GROUP_SUMMARY != 0) return
        // Bound before copying strings; no Notification/RemoteViews/intent retained.
        val fields=n.extras
        val values=listOf(Notification.EXTRA_TITLE,Notification.EXTRA_TEXT,Notification.EXTRA_BIG_TEXT,Notification.EXTRA_SUB_TEXT).map { fields.getCharSequence(it) }
        if(values.sumOf { it?.length ?: 0 }>16384) { runtime.fence("QUEUE_FULL");return }
        val input=NotificationFields(values[0]?.toString(),values[1]?.toString(),values[2]?.toString(),values[3]?.toString())
        if(input.oversized()) { runtime.fence("QUEUE_FULL");return }
        val key=sbn.key;val posted=sbn.postTime
        runtime.execute { runtime.capture(profile,identity,input,key,posted,generation) }
        } catch (_:Exception) { runtime.fence("INTEGRITY_FAILED") }
    }
    override fun onDestroy() { unregisterReceiver(packages);runtime.listenerBound=false;super.onDestroy() }
}
