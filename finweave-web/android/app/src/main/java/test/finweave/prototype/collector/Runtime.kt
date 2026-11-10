package test.finweave.prototype.collector

import android.content.ComponentName
import android.content.Context
import android.os.SystemClock
import android.os.UserManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import java.util.concurrent.ArrayBlockingQueue
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

data class NativeSession(val vaultId:String, val owner:String, val workspace:String, val device:String,
    val deviceEpoch:Long, val recoveryEpoch:Long, val credential:String, val credentialExpires:Long,
    val authorizedUntil:Long, val signingAlias:String, val indexKey:String, val bindings:List<Binding>,
    val serverMillis:Long, val anchorElapsed:Long, val boot:Int)

class CollectorRuntime private constructor(val context:Context) {
    val generation = AtomicInteger(1)
    @Volatile var listenerBound=false
    @Volatile var reason:String?="BINDING_REQUIRED"
    @Volatile var consent:String?=null
    @Volatile var session:NativeSession?=null
        private set
    @Volatile private var foregroundOwnerAuthorized=false
    @Volatile var selected:Set<String> = emptySet()
        private set
    @Volatile var revokePending=false
    @Volatile var lastObserved:String?=null
    @Volatile var lastAck:String?=null
    private var loaded=false
    val executor=ThreadPoolExecutor(1,1,0,TimeUnit.MILLISECONDS,ArrayBlockingQueue(32))
    val vault by lazy { Vault(context) }
    private fun boot()=Settings.Global.getInt(context.contentResolver,Settings.Global.BOOT_COUNT,-1)
    fun unlocked() = context.getSystemService(UserManager::class.java).isUserUnlocked
    fun ownerAuthorized()=foregroundOwnerAuthorized
    fun permission() = context.packageName in NotificationManagerCompat.getEnabledListenerPackages(context)
    fun now(s:NativeSession):Long? {
        val elapsed=SystemClock.elapsedRealtime()
        return if(boot()==s.boot && s.boot>=0 && elapsed>=s.anchorElapsed) s.serverMillis + (elapsed-s.anchorElapsed) else null
    }
    fun execute(block:()->Unit) {
        try { executor.execute { try { initialize(); block() } catch (_:Exception) { fence("KEY_UNAVAILABLE") } } }
        catch (_:java.util.concurrent.RejectedExecutionException) { fence("QUEUE_FULL") }
    }
    @Synchronized fun initialize() {
        if(loaded || !unlocked()) return
        val stored=vault.dao.installation()
        if(stored!=null) {
            generation.updateAndGet { maxOf(it,stored.generation) };consent=stored.consent;reason=stored.reason;revokePending=stored.revokePending
            stored.activeVault?.let { id ->
                val row=vault.dao.auth_pending(id).singleOrNull { it.id=="session-"+id && it.state=="active" }
                if(row!=null) {
                    val data=vault.open(id,"session",row.id,row.keyVersion,row.iv,row.cipher)
                    val bindings=data.getJSONArray("bindings")
                    val live=(0 until bindings.length()).map { val b=bindings.getJSONObject(it);Binding(b.getString("id"),b.getLong("version"),b.getString("accountId"),b.getString("packageName"),b.getString("parserProfileId"),b.getBoolean("enabled"),if(b.isNull("mask")) null else b.getString("mask")) }
                    val restored=NativeSession(id,data.getString("owner"),data.getString("workspace"),data.getString("device"),
                        data.getLong("deviceEpoch"),data.getLong("recoveryEpoch"),data.getString("credential"),data.getLong("credentialExpires"),
                        data.getLong("authorizedUntil"),data.getString("signingAlias"),data.getString("indexKey"),live,
                        data.getLong("serverMillis"),data.getLong("anchorElapsed"),data.getInt("boot"))
                    session=restored
                    val selection=data.getJSONArray("selected");selected=(0 until selection.length()).map { selection.getString(it) }.toSet()
                    if(now(restored)==null) { reason="CLOCK_UNTRUSTED";selected=emptySet() }
                    else if(now(restored)!!>=restored.authorizedUntil) { reason="REAUTH_REQUIRED";selected=emptySet();vault.dao.quarantine(id) }
                    // No mock owner state ever selects or opens this vault.
                }
            }
        }
        loaded=true
    }
    private fun save(deletePending:String?=null) {
        val s=session
        var encryptedSession:AuthRow?=null
        if(s!=null) {
            val id="session-"+s.vaultId
            val data=JSONObject().put("owner",s.owner).put("workspace",s.workspace).put("device",s.device).put("deviceEpoch",s.deviceEpoch)
                .put("recoveryEpoch",s.recoveryEpoch).put("credential",s.credential).put("credentialExpires",s.credentialExpires)
                .put("authorizedUntil",s.authorizedUntil).put("signingAlias",s.signingAlias).put("indexKey",s.indexKey)
                .put("serverMillis",s.serverMillis).put("anchorElapsed",s.anchorElapsed).put("boot",s.boot).put("selected",JSONArray(selected.toList()))
                .put("bindings",JSONArray(s.bindings.map { b -> JSONObject().put("id",b.id).put("version",b.version).put("accountId",b.accountId)
                    .put("packageName",b.packageName).put("parserProfileId",b.parserProfileId).put("enabled",b.enabled).put("mask",b.maskedDiscriminator ?: JSONObject.NULL) }))
            val e=vault.seal(s.vaultId,"session",id,data)
            encryptedSession=AuthRow(id,s.vaultId,"active",0,e.keyVersion,e.iv,e.cipher,s.authorizedUntil,e.cipher.size+12)
        }
        vault.db.runInTransaction {
            encryptedSession?.let { vault.dao.put(it) }
            if(deletePending!=null && s!=null) vault.dao.deleteAuthRow(deletePending,s.vaultId)
            vault.dao.installation(InstallationRow(generation=generation.get(),consent=consent,reason=reason,revokePending=revokePending,activeVault=s?.vaultId))
        }
    }
    internal fun renewed(old:NativeSession,token:String,expires:Long,authorized:Long,pending:String) {
        require(session===old && authorized<=old.authorizedUntil && expires<=authorized)
        session=old.copy(credential=token,credentialExpires=expires,authorizedUntil=authorized)
        try { save(pending) } catch(e:Exception) { session=old;throw e }
    }
    fun accept(version:String) { require(version==SourceCatalog.CONSENT) { "CONSENT_UPDATE_REQUIRED" };consent=version;save() }
    fun recheck() { if(!permission()) fence("PERMISSION_DENIED") }
    fun logout() {
        val old=session
        fence("REAUTH_REQUIRED")
        session=null;selected=emptySet();foregroundOwnerAuthorized=false;lastObserved=null;lastAck=null
        execute {
            if(old!=null) {
                vault.dao.quarantine(old.vaultId)
                vault.dao.auth_pending(old.vaultId).filter { it.id=="session-"+old.vaultId }.forEach { vault.dao.put(it.copy(state="revoked")) }
            }
            save()
        }
    }
    fun fence(code:String) {
        reason=code;selected=emptySet();generation.updateAndGet { if(it==Int.MAX_VALUE) it else it+1 }
        val old=session
        CollectorWorker.cancel(context,old?.vaultId)
        if(old!=null) revokePending=true
        try { executor.execute { try { old?.let { vault.dao.quarantine(it.vaultId);gap(it,code) };save() } catch (_:Exception) { reason="KEY_UNAVAILABLE" } } }
        catch (_:java.util.concurrent.RejectedExecutionException) { /* in-memory gate is already closed */ }
    }
    // Called only by native identity/enrollment authority after authenticated
    // replies; never by a bridge accepting owner IDs, tokens or raw notifications.
    internal fun bindSession(s:NativeSession) {
        require(s.owner.isNotBlank() && s.workspace.isNotBlank() && s.device.isNotBlank() && s.bindings.size<=100)
        val old=session
        if(old!=null && (old.vaultId!=s.vaultId || old.deviceEpoch!=s.deviceEpoch || old.recoveryEpoch!=s.recoveryEpoch)) {
            generation.incrementAndGet();vault.dao.quarantine(old.vaultId);CollectorWorker.cancel(context,old.vaultId)
        }
        session=s;selected=emptySet();foregroundOwnerAuthorized=true;reason="BINDING_REQUIRED";save()
    }
    fun configure(expected:Int, version:String, ids:Set<String>) {
        require(expected==generation.get()) { "EPOCH_CHANGED" }
        require(version==SourceCatalog.CONSENT && consent==version) { "CONSENT_UPDATE_REQUIRED" }
        val s=session ?: error("BINDING_REQUIRED")
        require(foregroundOwnerAuthorized) { "REAUTH_REQUIRED" }
        require(ids.size<=100 && ids.all { id -> s.bindings.any { it.id==id && it.enabled && SourceCatalog.liveProfiles.any { p -> p.id==it.parserProfileId && p.packageName==it.packageName } } }) { "BINDING_REQUIRED" }
        generation.incrementAndGet();vault.dao.quarantine(s.vaultId);CollectorWorker.cancel(context,s.vaultId)
        selected=ids;reason=if(ids.isEmpty()) "BINDING_REQUIRED" else null;save()
        if(ids.isNotEmpty()) CollectorWorker.schedule(context,s.vaultId)
    }
    fun gate(profile:SourceProfile, app:AppIdentity, expected:Int):NativeSession? {
        val s=session ?: return null
        val time=now(s) ?: return null
        return s.takeIf { expected==generation.get() && reason==null && unlocked() && permission() && listenerBound &&
            consent==SourceCatalog.CONSENT && selected.isNotEmpty() && time<s.authorizedUntil &&
            profile.accepts(app,time) }
    }
    fun capture(profile:SourceProfile,app:AppIdentity,fields:NotificationFields,osKey:String,postTime:Long,expected:Int) {
        val s=gate(profile,app,expected) ?: return
        val time=now(s) ?: return
        prune(s,time)
        val parsed=try { profile.parser.parse(fields) } catch (_:Exception) { fence("INTEGRITY_FAILED");gap(s,"PARSER_FAILED");return }
        val evidence=parsed.evidence ?: run { if(parsed.reason!="OTP_DISCARDED") gap(s,"PARSER_UNSUPPORTED");return }
        val b=BindingResolver.resolve(s.bindings,profile,evidence.sourceAccountRef,selected) ?: run { gap(s,"BINDING_AMBIGUOUS");return }
        val rows=vault.dao.outbox_items(s.vaultId)
        if(rows.size>=1000 || rows.sumOf { it.bytes.toLong() }>=8L*1024*1024) { gap(s,"QUEUE_FULL");fence("QUEUE_FULL");return }
        val index=vault.lookup(s.indexKey,osKey+"|"+postTime)
        val previous=vault.dao.capture_identities(s.vaultId).find { it.id==index }
        val identity=previous?.let { vault.open(s.vaultId,"capture",it.id,it.keyVersion,it.iv,it.cipher) }
        val semantic=Wire.sha(Wire.canonical(Wire.evidence(evidence)).toByteArray())
        if(identity?.getString("semantic")==semantic) return
        // An unproven update of the same OS occurrence is held locally; cannot
        // infer a settled economic revision from an Android notification update.
        if(identity!=null) { gap(s,"OCCURRENCE_CHANGED_REVIEW");return }
        val event=Wire.id()
        val item=Wire.item(evidence,b,event,0,Instant.ofEpochMilli(time).toString(),profile.id,profile.sourceKey)
        val encrypted=vault.seal(s.vaultId,"outbox",event,item)
        val capture=vault.seal(s.vaultId,"capture",index,JSONObject().put("semantic",semantic).put("eventKey",event).put("revision",0))
        if(rows.sumOf { it.bytes.toLong() } + encrypted.cipher.size + encrypted.iv.size > 8L*1024*1024) { fence("QUEUE_FULL");return }
        if(gate(profile,app,expected)==null) return
        vault.db.runInTransaction {
            vault.dao.put(OutboxRow(event,s.vaultId,"pending",time,encrypted.keyVersion,encrypted.iv,encrypted.cipher,time+7*DAY,encrypted.cipher.size+encrypted.iv.size))
            vault.dao.put(CaptureRow(index,s.vaultId,"live",time,capture.keyVersion,capture.iv,capture.cipher,time+14*DAY,capture.cipher.size+capture.iv.size))
        }
        lastObserved=Instant.ofEpochMilli(time).toString()
        CollectorWorker.schedule(context,s.vaultId)
    }
    fun gap(s:NativeSession,code:String) {
        val time=now(s) ?: return
        val id=Wire.id();val cipher=vault.seal(s.vaultId,"gap",id,JSONObject().put("reason",code).put("at",Instant.ofEpochMilli(time).toString()))
        vault.dao.put(GapRow(id,s.vaultId,code,time,cipher.keyVersion,cipher.iv,cipher.cipher,time+14*DAY,cipher.cipher.size+12))
        vault.dao.coverage_gaps(s.vaultId).dropLast(256).forEach { vault.dao.deleteGapRow(it.id,s.vaultId) }
    }
    fun prune(s:NativeSession,time:Long) {
        vault.dao.outbox_items(s.vaultId).filter { it.expires<=time }.forEach {
            if(it.sequence+14*DAY<=time) vault.dao.deleteOutboxRow(it.id,s.vaultId)
            else vault.dao.put(it.copy(state="quarantined"))
        }
        vault.dao.ack_replay(s.vaultId).filter { it.expires<=time }.forEach { vault.dao.deleteAckRow(it.id,s.vaultId) }
        vault.dao.capture_identities(s.vaultId).filter { it.expires<=time }.forEach { vault.dao.deleteCaptureRow(it.id,s.vaultId) }
        vault.dao.capture_identities(s.vaultId).dropLast(1999).forEach { vault.dao.deleteCaptureRow(it.id,s.vaultId) }
        vault.dao.coverage_gaps(s.vaultId).filter { it.expires<=time }.forEach { vault.dao.deleteGapRow(it.id,s.vaultId) }
    }
    fun queue(limit:Int=100):JSONArray {
        if(!foregroundOwnerAuthorized) return JSONArray()
        val s=session ?: return JSONArray()
        val time=now(s) ?: return JSONArray()
        prune(s,time)
        return JSONArray(vault.dao.outbox_items(s.vaultId).take(limit.coerceIn(1,1000)).map {
            JSONObject().put("id",it.id).put("state",it.state).put("observedAt",Instant.ofEpochMilli(it.sequence).toString())
                .put("source","Notification").put("reason",if(it.state=="quarantined") "EPOCH_OR_AUTHORIZATION_CHANGED" else JSONObject.NULL).put("retryAfter",JSONObject.NULL)
        })
    }
    fun legacy():JSONObject = JSONObject().put("permission",if(permission()) "granted" else "denied")
        .put("consented",consent==SourceCatalog.CONSENT).put("network",network()).put("enrolled",session!=null).put("ownerBound",session!=null && foregroundOwnerAuthorized)
        .put("lastObserved",lastObserved ?: JSONObject.NULL).put("lastAck",lastAck ?: JSONObject.NULL).put("pausedReason",reason ?: JSONObject.NULL).put("queue",queue())
    fun network():String {
        val cm=context.getSystemService(android.net.ConnectivityManager::class.java)
        val net=cm.activeNetwork ?: return "offline"
        return if(cm.getNetworkCapabilities(net)?.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_VALIDATED)==true) "online" else "offline"
    }
    fun statusV2():JSONObject {
        val s=session;val trusted=s?.let { now(it)!=null } ?: false
        val rows=if(s!=null && foregroundOwnerAuthorized) vault.dao.outbox_items(s.vaultId) else emptyList()
        val p=rows.count { it.state!="quarantined" };val q=rows.size-p
        return JSONObject().put("bridgeRevision",SourceCatalog.BRIDGE).put("generation",generation.get())
            .put("checkedAt",Instant.now().toString()).put("permission",if(permission()) "granted" else "denied").put("network",network())
            .put("enrolled",s!=null).put("ownerBound",s!=null && foregroundOwnerAuthorized).put("listenerBound",listenerBound)
            .put("consent",if(consent==SourceCatalog.CONSENT) "accepted" else if(consent==null) "required" else "update_required")
            .put("vault",if(!unlocked()) "locked" else if(s==null || q>0) "quarantined" else "ready").put("clock",if(trusted) "trusted" else "uncertain")
            .put("readiness",if(s==null || !foregroundOwnerAuthorized) "setup_required" else if(reason!=null || !trusted || !listenerBound || !permission()) "paused" else "ready")
            .put("reason",reason ?: JSONObject.NULL).put("pendingCount",p).put("pendingBytes",rows.filter { it.state!="quarantined" }.sumOf { it.bytes })
            .put("quarantineCount",q).put("ackReplayCount",if(s==null || !foregroundOwnerAuthorized) 0 else vault.dao.ack_replay(s.vaultId).size)
            .put("queueTruncated",rows.size>100).put("lastObserved",lastObserved ?: JSONObject.NULL).put("lastAck",lastAck ?: JSONObject.NULL)
            .put("physicalPurgeOverdue",s!=null && !trusted).put("revokePending",revokePending)
    }
    companion object {
        const val DAY=86400000L
        @Volatile private var instance:CollectorRuntime?=null
        @JvmStatic fun get(context:Context):CollectorRuntime=instance ?: synchronized(this) { instance ?: CollectorRuntime(context.applicationContext).also { instance=it } }
    }
}
