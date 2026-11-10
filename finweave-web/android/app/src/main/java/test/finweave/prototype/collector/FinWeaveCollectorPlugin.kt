package test.finweave.prototype.collector

import android.content.Intent
import android.provider.Settings
import androidx.appcompat.app.AlertDialog
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONArray
import org.json.JSONObject

@CapacitorPlugin(name="FinWeaveCollector")
class FinWeaveCollectorPlugin:Plugin() {
    private val runtime get()=CollectorRuntime.get(context)
    private fun trusted():Boolean = bridge.webView.url?.let { android.net.Uri.parse(it).let { u -> u.scheme=="https" && u.host=="localhost" && u.port==-1 } } == true
    private fun run(call:PluginCall,keys:Set<String> = emptySet(),deferred:Boolean=false,work:()->JSONObject?) {
        activity.runOnUiThread {
        if(!trusted()) { call.reject("Bridge origin is unavailable","NATIVE_UNAVAILABLE");return@runOnUiThread }
        try { Wire.exactKeys(call.data,keys) } catch (_:Exception) { call.reject("Bridge input is invalid","INTEGRITY_FAILED");return@runOnUiThread }
        runtime.execute {
            try { val result=work();if(!deferred) { if(result==null) call.resolve() else call.resolve(JSObject.fromJSONObject(result)) } }
            catch (e:Exception) {
                val safe=setOf("CONSENT_UPDATE_REQUIRED","EPOCH_CHANGED","BINDING_REQUIRED","CLOCK_UNTRUSTED","REAUTH_REQUIRED")
                val code=if(e.message in safe) e.message!! else "INTEGRITY_FAILED"
                call.reject(code,code)
            }
        }
        }
    }
    override fun handleOnResume() { super.handleOnResume();runtime.execute { runtime.recheck() } }
    @PluginMethod fun getCapabilities(call:PluginCall) = run(call) {
        JSONObject().put("bridgeRevision",SourceCatalog.BRIDGE).put("apiRevision",SourceCatalog.API).put("profile","SYNTHETIC")
            .put("buildId",test.finweave.prototype.BuildConfig.VERSION_NAME).put("requiredConsentVersion",SourceCatalog.CONSENT).put("nativeAvailable",true)
    }
    @PluginMethod fun getStatus(call:PluginCall) = run(call) { runtime.recheck();runtime.legacy() }
    @PluginMethod fun getStatusV2(call:PluginCall) = run(call) { runtime.recheck();runtime.statusV2() }
    @PluginMethod fun acceptDisclosure(call:PluginCall) = run(call,setOf("version")) { runtime.accept(call.getString("version") ?: "");null }
    @PluginMethod fun openNotificationSettings(call:PluginCall) = run(call) {
        require(runtime.consent==SourceCatalog.CONSENT) { "CONSENT_UPDATE_REQUIRED" }
        activity.runOnUiThread { activity.startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)) };null
    }
    @PluginMethod fun stopAndQuarantine(call:PluginCall) {
        activity.runOnUiThread {
            if(!trusted()) { call.reject("NATIVE_UNAVAILABLE","NATIVE_UNAVAILABLE");return@runOnUiThread }
            NotificationProbe.stop(context);ZaloPreview.stop();runtime.logout();run(call) { null }
        }
    }
    @PluginMethod fun setSources(call:PluginCall) = run(call,setOf("packages")) {
        val packages=call.data.getJSONArray("packages")
        require(packages.length()<=100 && (0 until packages.length()).all { packages.get(it) is String })
        val s=runtime.session ?: error("BINDING_REQUIRED")
        val chosen=(0 until packages.length()).map { packages.getString(it) }.toSet()
        val bindings=s.bindings.filter { it.packageName in chosen && it.enabled }
        require(chosen.all { name -> bindings.count { it.packageName==name }==1 }) { "BINDING_REQUIRED" }
        runtime.configure(runtime.generation.get(),SourceCatalog.CONSENT,bindings.map { it.id }.toSet());null
    }
    @PluginMethod fun configureCapture(call:PluginCall) = run(call,setOf("generation","consentVersion","bindingIds")) {
        val ids=call.data.getJSONArray("bindingIds");require(ids.length()<=100 && (0 until ids.length()).all { ids.get(it) is String })
        val names=(0 until ids.length()).map { ids.getString(it) };require(names.toSet().size==names.size)
        runtime.configure(call.data.getInt("generation"),call.getString("consentVersion") ?: error("CONSENT_UPDATE_REQUIRED"),names.toSet());runtime.statusV2()
    }
    @PluginMethod fun retryQueue(call:PluginCall) = run(call) {
        require(runtime.ownerAuthorized()) { "REAUTH_REQUIRED" }
        val s=runtime.session ?: error("BINDING_REQUIRED")
        require(runtime.now(s)!=null) { "CLOCK_UNTRUSTED" }
        require(runtime.reason==null && runtime.selected.isNotEmpty()) { "REAUTH_REQUIRED" }
        CollectorWorker.schedule(context,s.vaultId);null
    }
    private data class Cursor(val generation:Int,val items:List<JSONObject>,val offset:Int,val expires:Long)
    private val cursors=mutableMapOf<String,Cursor>()
    @PluginMethod fun listQueue(call:PluginCall) = run(call,setOf("generation","cursor","pageSize")) {
        val gen=call.data.getInt("generation");require(gen==runtime.generation.get()) { "EPOCH_CHANGED" }
        val size=call.data.getInt("pageSize");require(size in 1..100)
        val now=android.os.SystemClock.elapsedRealtime();cursors.entries.removeAll { it.value.expires<now || it.value.generation!=gen }
        val cursor=if(call.data.isNull("cursor")) null else call.data.getString("cursor")
        val snapshot=if(cursor==null) {
            // Candidate has no identity/enrollment. Never use a mock owner to open a vault.
            val items=runtime.queue(1000)
            Cursor(gen,(0 until items.length()).map { items.getJSONObject(it) },0,now+600000)
        } else cursors.remove(cursor) ?: error("EPOCH_CHANGED")
        val page=snapshot.items.drop(snapshot.offset).take(size);val end=snapshot.offset+page.size
        val next=if(end<snapshot.items.size) Wire.id().also { require(cursors.size<16);cursors[it]=snapshot.copy(offset=end) } else null
        JSONObject().put("generation",gen).put("items",JSONArray(page)).put("nextCursor",next ?: JSONObject.NULL)
    }
    @PluginMethod fun deleteQuarantined(call:PluginCall) = run(call,setOf("reason"),deferred=true) {
        require(runtime.ownerAuthorized()) { "REAUTH_REQUIRED" }
        val reason=call.getString("reason") ?: error("INTEGRITY_FAILED");require(reason.length in 3..500)
        val s=runtime.session ?: error("BINDING_REQUIRED");val gen=runtime.generation.get()
        val rows=runtime.vault.dao.outbox_items(s.vaultId).filter { it.state=="quarantined" }
        activity.runOnUiThread {
            AlertDialog.Builder(activity).setTitle("Xóa hàng đợi cách ly")
                .setMessage("Xóa ${rows.size} mục chưa đồng bộ của chủ hiện tại. Có thể mất observations chưa nhận ACK; không xóa giao dịch đã ghi sổ.")
                .setNegativeButton("Hủy") { _,_ -> call.resolve() }
                .setPositiveButton("Xác nhận xóa") { _,_ -> runtime.execute {
                    if(runtime.generation.get()!=gen || runtime.session?.vaultId!=s.vaultId) call.reject("EPOCH_CHANGED","EPOCH_CHANGED")
                    else { runtime.vault.db.runInTransaction { rows.forEach { runtime.vault.dao.deleteOutboxRow(it.id,s.vaultId) } };call.resolve() }
                } }.show()
        }
        // Resolve only from the native confirmation, not this handler return.
        null
    }
}
