package test.finweave.prototype.collector

import android.content.Context
import androidx.work.*
import org.json.JSONObject
import java.util.concurrent.Callable
import java.util.concurrent.TimeUnit

class CollectorWorker(context:Context,params:WorkerParameters):Worker(context,params) {
    private val runtime=CollectorRuntime.get(context)
    private fun <T> serial(work:()->T):T = runtime.executor.submit(Callable { runtime.initialize();work() }).get()
    private data class Upload(val session:NativeSession,val batch:BatchRow,val request:JSONObject,val generation:Int)
    private fun eligible(s:NativeSession,request:JSONObject,time:Long):Boolean {
        val items=request.getJSONObject("input").getJSONArray("items")
        return (0 until items.length()).all {
            val item=items.getJSONObject(it)
            val binding=s.bindings.singleOrNull { b -> b.id==item.getString("bindingId") && b.version==item.getLong("bindingVersion") && b.enabled && b.id in runtime.selected }
            val profile=binding?.let { b -> SourceCatalog.liveProfiles.singleOrNull { p -> p.id==b.parserProfileId && p.packageName==b.packageName } }
            val app=profile?.let { p -> AppVerifier.inspect(applicationContext,p.packageName) }
            profile!=null && app!=null && profile.accepts(app,time) && item.getString("parserVersion")==profile.id
        }
    }
    private data class Renewal(val session:NativeSession,val pending:AuthRow,val request:JSONObject,val generation:Int)
    private fun renewIfNeeded(expected:String):Result? {
        val rotation=serial {
            val s=runtime.session ?: return@serial null
            val now=runtime.now(s) ?: return@serial null
            if(s.vaultId!=expected || runtime.reason!=null || !runtime.permission() || !runtime.listenerBound || runtime.selected.isEmpty() ||
                runtime.consent!=SourceCatalog.CONSENT || NativeEndpoint.origin==null || now<s.credentialExpires-300000) return@serial null
            if(now>=s.authorizedUntil || now>s.credentialExpires+7*CollectorRuntime.DAY) { runtime.fence("REAUTH_REQUIRED");return@serial null }
            val previous=runtime.vault.dao.auth_pending(s.vaultId).firstOrNull { it.state=="renewal" }
            if(previous!=null) {
                if(now>=previous.expires) { runtime.fence("REAUTH_REQUIRED");return@serial null }
                Renewal(s,previous,runtime.vault.open(s.vaultId,"renewal",previous.id,previous.keyVersion,previous.iv,previous.cipher),runtime.generation.get())
            } else {
                val id=Wire.id()
                val request=JSONObject().put("contractVersion","2.0.0").put("requestId",Wire.id()).put("workspaceId",s.workspace).put("operationId","renewCollectorCredential")
                    .put("input",JSONObject().put("deviceId",s.device).put("deviceEpoch",s.deviceEpoch).put("recoveryEpoch",s.recoveryEpoch))
                    .put("mutation",JSONObject().put("idempotencyKey",id).put("expectedWorkspaceVersion",JSONObject.NULL).put("expectedObjectVersions",JSONObject()).put("previewToken",JSONObject.NULL))
                val e=runtime.vault.seal(s.vaultId,"renewal",id,request)
                val pending=AuthRow(id,s.vaultId,"renewal",now,e.keyVersion,e.iv,e.cipher,now+300000,e.cipher.size+12)
                runtime.vault.dao.put(pending);Renewal(s,pending,request,runtime.generation.get())
            }
        } ?: return null
        val (s,pending,request,gen)=rotation
        if(runtime.generation.get()!=gen || runtime.reason!=null || !runtime.permission()) return Result.success()
        val response=CollectorHttp(NativeEndpoint.origin ?: return Result.success()).send(s,request,runtime.now(s) ?: return Result.success())
        return serial {
            if(runtime.generation.get()!=gen || runtime.session!==s || runtime.reason!=null || !runtime.permission()) return@serial Result.success()
            if(response.status!=200 || response.revision!=SourceCatalog.API || response.reply==null) {
                if(response.status in listOf(401,403,409)) { runtime.fence("REAUTH_REQUIRED");Result.success() }
                else Result.retry()
            } else {
                val r=response.reply;Wire.exactKeys(r,setOf("contractVersion","requestId","workspaceVersion","data"))
                require(r.getString("contractVersion")=="2.0.0" && r.getString("requestId")==request.getString("requestId") && r.isNull("workspaceVersion"))
                val data=r.getJSONObject("data");Wire.exactKeys(data,setOf("deviceId","token","expiresAt","authorizedUntil","deviceEpoch","recoveryEpoch"))
                require(data.getString("deviceId")==s.device && data.getLong("deviceEpoch")==s.deviceEpoch && data.getLong("recoveryEpoch")==s.recoveryEpoch)
                val token=data.getString("token");require(token.matches(Regex("[A-Za-z0-9_-]{43}")))
                val expires=java.time.Instant.parse(data.getString("expiresAt")).toEpochMilli()
                val authorized=java.time.Instant.parse(data.getString("authorizedUntil")).toEpochMilli()
                require(expires>(runtime.now(s) ?: error("CLOCK_UNTRUSTED")))
                runtime.renewed(s,token,expires,authorized,pending.id)
                null
            }
        }
    }
    override fun doWork():Result {
        val expected=inputData.getString("vault") ?: return Result.success()
        try {
            renewIfNeeded(expected)?.let { return it }
            val plan=serial {
                val s=runtime.session ?: return@serial null
                val now=runtime.now(s) ?: return@serial null
                if(s.vaultId!=expected || runtime.reason!=null || !runtime.permission() || !runtime.listenerBound ||
                    runtime.consent!=SourceCatalog.CONSENT || runtime.selected.isEmpty()) return@serial null
                if(now>=s.authorizedUntil || now>=s.credentialExpires) { runtime.fence("REAUTH_REQUIRED");return@serial null }
                if(NativeEndpoint.origin==null) { runtime.fence("UPDATE_REQUIRED");return@serial null }
                runtime.prune(s,now)
                val rows=runtime.vault.dao.outbox_items(s.vaultId).filter { it.state!="quarantined" && it.expires>now }
                if(rows.isEmpty()) return@serial null
                val old=runtime.vault.dao.upload_batches(s.vaultId).firstOrNull { it.state=="pending" }
                if(old!=null) {
                    if(old.sequence>now) { schedule(applicationContext,s.vaultId,old.sequence-now);return@serial null }
                    if(old.expires<=now) { runtime.fence("EXPIRED");return@serial null }
                    val batch=runtime.vault.open(s.vaultId,"batch",old.id,old.keyVersion,old.iv,old.cipher)
                    if(batch.getInt("generation")!=runtime.generation.get()) { runtime.fence("EPOCH_CHANGED");return@serial null }
                    val request=batch.getJSONObject("request")
                    if(!eligible(s,request,now)) { runtime.fence("BINDING_REQUIRED");return@serial null }
                    Upload(s,old,request,runtime.generation.get())
                } else {
                    val items=mutableListOf<JSONObject>()
                    val id=Wire.id();val requestId=Wire.id();var request:JSONObject?=null
                    for(row in rows.take(50)) {
                        val item=runtime.vault.open(s.vaultId,"outbox",row.id,row.keyVersion,row.iv,row.cipher)
                        val binding=s.bindings.singleOrNull { it.id==item.getString("bindingId") && it.version==item.getLong("bindingVersion") && it.enabled && it.id in runtime.selected }
                        val profile=binding?.let { b -> SourceCatalog.liveProfiles.singleOrNull { it.id==b.parserProfileId && it.packageName==b.packageName } }
                        val app=profile?.let { AppVerifier.inspect(applicationContext,it.packageName) }
                        if(profile==null || app==null || !profile.accepts(app,now)) { runtime.fence("BINDING_REQUIRED");return@serial null }
                        val candidate=Wire.envelope(s.workspace,s.device,s.deviceEpoch,s.recoveryEpoch,items+item,requestId,id)
                        if(Wire.canonical(candidate).toByteArray().size>262144) break
                        items.add(item);request=candidate
                    }
                    if(request==null) { runtime.fence("QUEUE_FULL");return@serial null }
                    val payload=JSONObject().put("generation",runtime.generation.get()).put("request",request)
                    val encrypted=runtime.vault.seal(s.vaultId,"batch",id,payload)
                    val batch=BatchRow(id,s.vaultId,"pending",now,encrypted.keyVersion,encrypted.iv,encrypted.cipher,rows.minOf { it.expires },encrypted.cipher.size+12)
                    runtime.vault.dao.put(batch);Upload(s,batch,request,runtime.generation.get())
                }
            } ?: return Result.success()
            val (s,batch,request,gen)=plan
            if(gen!=runtime.generation.get() || runtime.reason!=null || !runtime.permission() || runtime.session!==s) return Result.success()
            val now=runtime.now(s) ?: return Result.success()
            val result=CollectorHttp(NativeEndpoint.origin ?: return Result.success()).send(s,request,now)
            return serial {
                if(runtime.session?.vaultId!=s.vaultId || runtime.generation.get()!=gen || !runtime.permission() || runtime.reason!=null) return@serial Result.success()
                val at=runtime.now(s) ?: return@serial Result.success()
                if(result.revision!=SourceCatalog.API) { runtime.fence("UPDATE_REQUIRED");return@serial Result.success() }
                val reply=result.reply
                if(result.status==202 && reply!=null) {
                    val receipts=Wire.receipts(reply,request,202)
                    val rows=runtime.vault.dao.outbox_items(s.vaultId)
                    val items=request.getJSONObject("input").getJSONArray("items")
                    val actions=receipts.map { ack ->
                        val index=(0 until items.length()).single { val item=items.getJSONObject(it);item.getString("eventKey")==ack.getString("eventKey") && item.getLong("revision")==ack.getLong("revision") }
                        val item=items.getJSONObject(index)
                        val row=rows.single { it.id==item.getString("eventKey") && it.state!="quarantined" && it.expires>at }
                        require(Wire.canonical(runtime.vault.open(s.vaultId,"outbox",row.id,row.keyVersion,row.iv,row.cipher))==Wire.canonical(item))
                        val e=if(ack.getString("state")=="durable") runtime.vault.seal(s.vaultId,"ack",row.id,JSONObject().put("item",item).put("ack",ack)) else null
                        Triple(row,ack,e)
                    }
                    runtime.vault.db.runInTransaction {
                        actions.forEach { (row,ack,e) ->
                            if(e!=null) {
                                runtime.vault.dao.put(AckRow(row.id,s.vaultId,"durable",at,e.keyVersion,e.iv,e.cipher,at+7*CollectorRuntime.DAY,e.cipher.size+12))
                                runtime.vault.dao.deleteOutboxRow(row.id,s.vaultId)
                            } else runtime.vault.dao.put(row.copy(state="quarantined"))
                        }
                        runtime.vault.dao.deleteBatchRow(batch.id,s.vaultId)
                    }
                    runtime.lastAck=reply.getJSONObject("data").getString("acceptedAt")
                    var journal=runtime.vault.dao.ack_replay(s.vaultId)
                    while(journal.size>1000 || journal.sumOf { it.bytes.toLong() }>8L*1024*1024) {
                        runtime.gap(s,"ACK_JOURNAL_EVICTED");runtime.vault.dao.deleteAckRow(journal.first().id,s.vaultId);journal=journal.drop(1)
                    }
                    schedule(applicationContext,s.vaultId);Result.success()
                } else if(result.status==422 && reply!=null) {
                    val rejected=Wire.rejectedItems(reply,request)
                    runtime.vault.db.runInTransaction {
                        val rows=runtime.vault.dao.outbox_items(s.vaultId)
                        rejected.forEach { tuple -> rows.single { it.id==tuple.first }.let { runtime.vault.dao.put(it.copy(state="quarantined")) } }
                        runtime.vault.dao.deleteBatchRow(batch.id,s.vaultId)
                    }
                    runtime.gap(s,"INGEST_PERMANENT_REJECTION");Result.success()
                } else if(result.status==413 && reply?.optString("outcome")=="not_committed" && reply.optString("requestId")==request.getString("requestId")) {
                    val items=request.getJSONObject("input").getJSONArray("items")
                    if(items.length()==1) { runtime.fence("QUEUE_FULL");return@serial Result.success() }
                    val parts=(0 until items.length()).map { items.getJSONObject(it) }.chunked((items.length()+1)/2)
                    val split=parts.map { part ->
                        val id=Wire.id();val req=Wire.envelope(s.workspace,s.device,s.deviceEpoch,s.recoveryEpoch,part,Wire.id(),id)
                        val e=runtime.vault.seal(s.vaultId,"batch",id,JSONObject().put("generation",gen).put("request",req))
                        BatchRow(id,s.vaultId,"pending",at,e.keyVersion,e.iv,e.cipher,batch.expires,e.cipher.size+12)
                    }
                    runtime.vault.db.runInTransaction { runtime.vault.dao.deleteBatchRow(batch.id,s.vaultId);split.forEach { runtime.vault.dao.put(it) } }
                    schedule(applicationContext,s.vaultId);Result.success()
                } else if(result.status in listOf(401,403,409,422) || result.status in 300..399) {
                    runtime.fence(if(result.status==409) "EPOCH_CHANGED" else "REAUTH_REQUIRED");Result.success()
                } else {
                    val floor=maxOf(30L,result.retryAfterSeconds ?: 0,reply?.optLong("retryAfterSeconds",0) ?: 0)
                    val retryAt=Math.addExact(at,Math.multiplyExact(floor,1000))
                    runtime.vault.dao.put(batch.copy(sequence=retryAt))
                    if(runAttemptCount>=7) { runtime.fence("SERVER_RETRY_AFTER");Result.success() }
                    else { schedule(applicationContext,s.vaultId,retryAt-at);Result.success() }
                }
            }
        } catch (_:Exception) {
            // Unknown network/ACK outcome keeps immutable encrypted command.
            return if(runAttemptCount<7) Result.retry() else { runtime.fence("NETWORK_WAIT");Result.success() }
        }
    }
    companion object {
        fun schedule(context:Context,vault:String,delay:Long=0) {
            val data=Data.Builder().putString("vault",vault).build()
            val constraints=Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()
            val request=OneTimeWorkRequest.Builder(CollectorWorker::class.java).setInputData(data).setConstraints(constraints)
                .setBackoffCriteria(BackoffPolicy.EXPONENTIAL,30,TimeUnit.SECONDS).setInitialDelay(delay,TimeUnit.MILLISECONDS).addTag("fw-"+vault).build()
            WorkManager.getInstance(context).enqueueUniqueWork("fw-upload-"+vault,ExistingWorkPolicy.APPEND_OR_REPLACE,request)
            val periodic=PeriodicWorkRequest.Builder(CollectorWorker::class.java,15,TimeUnit.MINUTES).setInputData(data).setConstraints(constraints).addTag("fw-"+vault).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork("fw-safety-"+vault,ExistingPeriodicWorkPolicy.KEEP,periodic)
        }
        fun cancel(context:Context,vault:String?) { if(vault!=null) WorkManager.getInstance(context).cancelAllWorkByTag("fw-"+vault) }
    }
}
