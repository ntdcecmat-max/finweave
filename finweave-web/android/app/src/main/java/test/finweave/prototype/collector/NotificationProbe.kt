package test.finweave.prototype.collector

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.os.SystemClock
import android.service.notification.StatusBarNotification
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicInteger

object NotificationProbe {
    private val session=NotificationTestSession("test.finweave.prototype")
    private val ids=AtomicInteger(900000)
    private val posted=linkedMapOf<Int,String>()
    private fun time()=SystemClock.elapsedRealtime()
    fun ensureChannel(context:Context) {
        if(Build.VERSION.SDK_INT>=26) context.getSystemService(NotificationManager::class.java)
            .createNotificationChannel(NotificationChannel(NotificationTestSession.CHANNEL,
                "FinWeave · thông báo kiểm thử",NotificationManager.IMPORTANCE_DEFAULT).apply { description="Chỉ dữ liệu giao dịch giả do bạn yêu cầu để test listener." })
    }
    private fun canPost(context:Context):Boolean {
        val manager=context.getSystemService(NotificationManager::class.java)
        if(!manager.areNotificationsEnabled()) return false
        if(Build.VERSION.SDK_INT<26) return true
        val channel=manager.getNotificationChannel(NotificationTestSession.CHANNEL) ?: return true
        if(channel.importance==NotificationManager.IMPORTANCE_NONE) return false
        return Build.VERSION.SDK_INT<28 || channel.group==null || manager.getNotificationChannelGroup(channel.group)?.isBlocked!=true
    }
    private fun allowed(context:Context):Boolean {
        val r=CollectorRuntime.get(context)
        return r.unlocked() && r.permission() && r.consent==SourceCatalog.CONSENT
    }
    @Synchronized fun stop(context:Context) {
        session.stop()
        val manager=context.getSystemService(NotificationManager::class.java)
        posted.forEach { (id,tag) -> manager.cancel(tag,id) };posted.clear()
    }
    @Synchronized fun start(context:Context) {
        require(allowed(context)) { "TEST_CONSENT_OR_ACCESS_REQUIRED" }
        require(CollectorRuntime.get(context).listenerBound) { "TEST_LISTENER_NOT_BOUND" }
        stop(context);session.start(time())
    }
    @Synchronized fun post(context:Context,name:String):Int {
        require(allowed(context)) { "TEST_CONSENT_OR_ACCESS_REQUIRED" }
        ensureChannel(context)
        require(canPost(context)) { "TEST_POST_PERMISSION_REQUIRED" }
        require(posted.size<20) { "TEST_QUEUE_FULL" }
        val id=ids.incrementAndGet()
        val request=session.prepare(name,id,java.util.UUID.randomUUID().toString(),time())
        val manager=context.getSystemService(NotificationManager::class.java)
        val n=NotificationCompat.Builder(context,NotificationTestSession.CHANNEL)
            .setSmallIcon(test.finweave.prototype.R.drawable.ic_stat_test)
            .setContentTitle(request.fixture.title).setContentText(request.fixture.text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(request.fixture.text))
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setAutoCancel(true).build()
        try { manager.notify(request.tag,id,n);posted[id]=request.tag }
        catch(e:Exception) { session.discard(id);throw e }
        return id
    }
    @Synchronized fun receive(context:Context,sbn:StatusBarNotification) {
        if(!allowed(context)) { stop(context);return }
        val channel=if(Build.VERSION.SDK_INT>=26) sbn.notification.channelId else NotificationTestSession.CHANNEL
        if(!session.expects(sbn.packageName,channel,sbn.tag,sbn.id,time())) return
        // Never read other applications' extras, or keep/log Notification objects.
        val extras=sbn.notification.extras
        val values=listOf(Notification.EXTRA_TITLE,Notification.EXTRA_TEXT,Notification.EXTRA_BIG_TEXT,Notification.EXTRA_SUB_TEXT).map { extras.getCharSequence(it) }
        if(values.sumOf { it?.length ?: 0 }>16384) return
        session.receive(sbn.packageName,channel,sbn.tag,sbn.id,
            NotificationFields(values[0]?.toString(),values[1]?.toString(),values[2]?.toString(),values[3]?.toString()),time())
    }
    @Synchronized fun status(context:Context):JSONObject {
        if(!allowed(context) || !session.active(time())) stop(context)
        val runtime=CollectorRuntime.get(context)
        val manager=context.getSystemService(NotificationManager::class.java)
        val importance=if(Build.VERSION.SDK_INT>=26) manager.getNotificationChannel(NotificationTestSession.CHANNEL)?.importance else null
        // NotificationManager only returns this app's notifications; inspect IDs/tags, never extras.
        val visible=manager.activeNotifications.count { posted.containsKey(it.id) && posted[it.id]==it.tag }
        return JSONObject().put("active",session.active(time())).put("listenerBound",runtime.listenerBound)
            .put("accessGranted",runtime.permission()).put("canPost",canPost(context))
            .put("channelImportance",importance ?: JSONObject.NULL).put("systemNotificationCount",visible)
            .put("pending",session.pendingCount(time())).put("results",JSONArray(session.snapshot(time()).map {
                JSONObject().put("id",it.id).put("fixture",it.fixture).put("amount",it.amount ?: JSONObject.NULL)
                    .put("direction",it.direction ?: JSONObject.NULL).put("outcome",it.outcome)
            }))
    }
}
