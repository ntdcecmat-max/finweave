package test.finweave.prototype.collector

import android.app.Notification
import android.content.Context
import android.os.Build
import android.os.SystemClock
import android.service.notification.StatusBarNotification
import org.json.JSONArray
import org.json.JSONObject

object ZaloPreview {
    private var until=0L
    private var discarded=0
    private var callbacks=0
    private var skipped=0
    private var reason="NOT_STARTED"
    private val shapes=mutableListOf<JSONObject>()
    private val seen=mutableSetOf<String>()
    private var salt=java.util.UUID.randomUUID().toString()
    private fun time()=SystemClock.elapsedRealtime()
    private fun allowed(context:Context):Boolean {
        val r=CollectorRuntime.get(context)
        return r.unlocked() && r.permission() && r.listenerBound && r.consent==SourceCatalog.CONSENT
    }
    private fun identity(context:Context):AppIdentity? {
        if(Build.VERSION.SDK_INT!=30) return null
        return try {
            val app=AppVerifier.inspect(context,ZaloPreviewPolicy.PACKAGE) ?: return null
            if(!ZaloPreviewPolicy.profile.accepts(app,System.currentTimeMillis())) return null
            if(context.packageManager.getInstallSourceInfo(ZaloPreviewPolicy.PACKAGE).installingPackageName!="com.android.vending") return null
            app
        } catch(_:Exception) { null }
    }
    @Synchronized fun stop(why:String="STOPPED") { until=0;discarded=0;callbacks=0;skipped=0;reason=why;shapes.clear();seen.clear();salt=java.util.UUID.randomUUID().toString() }
    @Synchronized fun start(context:Context,acknowledge:Boolean,analyzeTransactions:Boolean) {
        require(acknowledge && analyzeTransactions && allowed(context)) { "TEST_CONSENT_OR_ACCESS_REQUIRED" }
        require(identity(context)!=null) { "TEST_SOURCE_IDENTITY_CHANGED" }
        stop();reason="WAITING";until=time()+15*60*1000
    }
    @Synchronized fun active():Boolean { if(until>0 && time()>=until) stop("EXPIRED");return until>time() }
    @Synchronized fun receive(context:Context,sbn:StatusBarNotification) {
        if(sbn.packageName!=ZaloPreviewPolicy.PACKAGE || !active()) return
        if(!allowed(context)) { stop("ACCESS_OR_LISTENER_LOST");return }
        if(identity(context)==null) { stop("SOURCE_CHANGED");return }
        callbacks=(callbacks+1).coerceAtMost(10000)
        val n=sbn.notification
        if(n.flags and Notification.FLAG_GROUP_SUMMARY!=0) { skipped=(skipped+1).coerceAtMost(10000);return }
        // Package/signer/version/device/store/consent/session gates precede extras.
        val values=try { listOf(Notification.EXTRA_TITLE,Notification.EXTRA_TEXT,Notification.EXTRA_BIG_TEXT,Notification.EXTRA_SUB_TEXT).map { n.extras.getCharSequence(it) } }
            catch(_:Exception) { skipped=(skipped+1).coerceAtMost(10000);return }
        if(values.sumOf { it?.length ?: 0 }>16384) { skipped=(skipped+1).coerceAtMost(10000);return }
        val fields=NotificationFields(values[0]?.toString(),values[1]?.toString(),values[2]?.toString(),values[3]?.toString())
        if(fields.oversized() || values.all { it.isNullOrBlank() }) { skipped=(skipped+1).coerceAtMost(10000);return }
        if(!ZaloPreviewPolicy.safe(fields)) { discarded=(discarded+1).coerceAtMost(10000);return }
        val shape=JSONObject().put("title",ZaloPreviewPolicy.shape(fields.title) ?: JSONObject.NULL)
            .put("text",ZaloPreviewPolicy.shape(fields.text) ?: JSONObject.NULL).put("bigText",ZaloPreviewPolicy.shape(fields.bigText) ?: JSONObject.NULL)
            .put("subText",ZaloPreviewPolicy.shape(fields.subText) ?: JSONObject.NULL)
            .put("analysis",ZaloCandidatePreview.analyze(fields))
        // Opt-in local RAM retains only shapes and candidate amount/direction. No raw content, identity or OS key.
        val occurrence=Wire.sha((salt+sbn.key+"|"+sbn.postTime+"|"+shape.toString()).toByteArray())
        if(occurrence in seen) return
        if(seen.size>=100) { stop("CAPACITY");return }
        seen.add(occurrence);shape.put("id",Wire.id());shapes.add(shape)
        while(shapes.size>20) shapes.removeAt(0)
    }
    @Synchronized fun status(context:Context):JSONObject {
        val admitted=identity(context)!=null
        if(until>0 && !allowed(context)) stop("ACCESS_OR_LISTENER_LOST")
        if(until>0 && !admitted) stop("SOURCE_CHANGED")
        val running=active()
        val r=CollectorRuntime.get(context)
        return JSONObject().put("active",active()).put("sourceVerified",admitted).put("sourceVersion","11.14.0")
            .put("accessGranted",r.permission()).put("listenerBound",r.listenerBound).put("consented",r.consent==SourceCatalog.CONSENT)
            .put("remainingSeconds",if(running) ((until-time()).coerceAtLeast(0)+999)/1000 else 0)
            .put("reason",reason).put("callbacks",callbacks).put("skipped",skipped)
            .put("discardedSensitive",discarded).put("samples",JSONArray(shapes))
    }
}
