package test.finweave.prototype.collector

import android.security.keystore.KeyProperties
import androidx.appcompat.app.AlertDialog
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.security.KeyStore
import java.security.Signature
import java.util.Base64
import java.util.concurrent.atomic.AtomicInteger
import java.util.concurrent.FutureTask
import java.util.concurrent.TimeUnit
import android.os.Looper

@CapacitorPlugin(name="FinWeaveOwner")
class FinWeaveOwnerPlugin:Plugin() {
    private val runtime get()=CollectorRuntime.get(context)
    private val generation=AtomicInteger(1)
    private val alias="fw-owner-installation-003"
    private var state:JSONObject?=null
    private var loaded=false
    private val vaultId="native-owner-auth"
    private val schema by lazy { ApiSchema(JSONObject(context.assets.open("api005.json").bufferedReader().use { it.readText() }).getJSONObject("contract")) }
    private val catalog by lazy { JSONObject(context.assets.open("consumer-operation-map.json").bufferedReader().use { it.readText() }).getJSONArray("ownerBroker") }
    private val origin get()=test.finweave.prototype.BuildConfig.FW_API_ORIGIN
    private fun trusted():Boolean {
        val check={ !activity.isFinishing && !activity.isDestroyed && bridge.webView.url?.let { android.net.Uri.parse(it).let { u->u.scheme=="https"&&u.host=="localhost"&&u.port==-1 } }==true }
        if(Looper.myLooper()==Looper.getMainLooper())return check()
        val pending=FutureTask<Boolean>{check()}
        activity.runOnUiThread(pending)
        return try { pending.get(2,TimeUnit.SECONDS) } catch(_:InterruptedException) { pending.cancel(false);Thread.currentThread().interrupt();false } catch(_:Exception) { pending.cancel(false);false }
    }
    private fun loadState(){if(loaded)return;val row=runtime.vault.dao.auth_pending(vaultId).find { it.id=="owner-auth" };if(row!=null)state=runtime.vault.open(vaultId,"owner","owner-auth",row.keyVersion,row.iv,row.cipher);loaded=true}
    private fun save(){val s=state;if(s==null){runtime.vault.dao.deleteAuthRow("owner-auth",vaultId);return};val e=runtime.vault.seal(vaultId,"owner","owner-auth",s);runtime.vault.dao.put(AuthRow("owner-auth",vaultId,"active",0,e.keyVersion,e.iv,e.cipher,Long.MAX_VALUE,e.cipher.size+12))}
    private fun key(name:String=alias):String { val ks=KeyStore.getInstance("AndroidKeyStore").also { it.load(null) };return if(ks.containsAlias(name))Base64.getUrlEncoder().withoutPadding().encodeToString(ks.getCertificate(name).publicKey.encoded) else NativeProof.createKey(name) }
    private fun sign(name:String,claims:JSONObject):String {val ks=KeyStore.getInstance("AndroidKeyStore").also { it.load(null) };val signature=Signature.getInstance("SHA256withECDSA");signature.initSign(ks.getKey(name,null) as java.security.PrivateKey);signature.update(Wire.canonical(claims).toByteArray());return Base64.getUrlEncoder().withoutPadding().encodeToString(NativeProof.derToRaw(signature.sign()))}
    private fun proof(req:JSONObject,path:String,credential:String?,challenge:JSONObject?,wire:String):String {
        val claims=JSONObject().put("revision",SourceCatalog.API).put("purpose",req.getString("operationId")).put("method","POST").put("path",path).put("audience",origin)
            .put("bodyDigest",Wire.sha(wire.toByteArray())).put("credentialDigest",credential?.let { Wire.sha(it.toByteArray()) } ?: JSONObject.NULL)
            .put("challengeId",challenge?.getString("challengeId") ?: JSONObject.NULL).put("challengeNonce",challenge?.getString("nonce") ?: JSONObject.NULL).put("issuedAt",System.currentTimeMillis()/1000).put("nonce",Wire.id())
        val bytes=Wire.canonical(claims).toByteArray();val ks=KeyStore.getInstance("AndroidKeyStore").also { it.load(null) };val signature=Signature.getInstance("SHA256withECDSA")
        signature.initSign(ks.getKey(alias,null) as java.security.PrivateKey);signature.update(bytes);val b64=Base64.getUrlEncoder().withoutPadding()
        return b64.encodeToString(bytes)+"."+b64.encodeToString(NativeProof.derToRaw(signature.sign()))
    }
    private fun envelope(op:String,input:JSONObject,key:String,workspace:Any=JSONObject.NULL)=JSONObject().put("contractVersion","2.0.0").put("requestId",Wire.id()).put("operationId",op).put("workspaceId",workspace).put("input",input)
        .put("mutation",if(schema.contract.getJSONObject("components").getJSONObject("schemas").getJSONObject(op+"Request").getJSONObject("properties").getJSONObject("mutation").optString("type")=="null")JSONObject.NULL else JSONObject().put("idempotencyKey",key).put("expectedWorkspaceVersion",JSONObject.NULL).put("expectedObjectVersions",JSONObject()).put("previewToken",JSONObject.NULL))
    private fun http(req:JSONObject,credential:String?=null,challenge:JSONObject?=null,canonical:String=Wire.canonical(req)):JSONObject {
        require(origin.isNotEmpty()) { "ENDPOINT_NOT_CONFIGURED" };val endpoint=URL(origin);require(endpoint.protocol=="https"||test.finweave.prototype.BuildConfig.DEBUG&&endpoint.protocol=="http"&&endpoint.host=="127.0.0.1") { "ENDPOINT_NOT_CONFIGURED" }
        val op=req.getString("operationId");schema.check(op+"Request",req)
        val paths=schema.contract.getJSONObject("paths");val path=paths.keys().asSequence().first { paths.getJSONObject(it).getJSONObject("post").getString("operationId")==op }
        val c=URL(origin+path).openConnection() as HttpURLConnection
        try { c.instanceFollowRedirects=false;c.connectTimeout=15000;c.readTimeout=20000;c.requestMethod="POST";c.doOutput=true
            c.setRequestProperty("Content-Type","application/json");c.setRequestProperty("X-FW-Contract-Revision",SourceCatalog.API);c.setRequestProperty("X-FW-Client","android")
            if(credential!=null)c.setRequestProperty("Authorization","Bearer $credential")
            if(credential!=null||challenge!=null)c.setRequestProperty("X-FW-Native-Proof",proof(req,path,credential,challenge,canonical))
            if(op in setOf("requestPasswordReset","resetIdentityPassword"))c.setRequestProperty("Origin",origin)
            val wire=canonical.toByteArray();require(wire.size<=262144);c.setFixedLengthStreamingMode(wire.size);c.outputStream.use { it.write(wire) }
            val status=c.responseCode;require(c.getHeaderField("X-FW-Contract-Revision")==SourceCatalog.API) { "UPDATE_REQUIRED" }
            val stream=if(status in 200..299)c.inputStream else c.errorStream
            val data=stream.use {
                val output=java.io.ByteArrayOutputStream();val buffer=ByteArray(4096)
                while(true) { val n=it.read(buffer);if(n<0)break;require(output.size()+n<=262144);output.write(buffer,0,n) }
                output.toByteArray()
            }
            val body=JSONObject(String(data,Charsets.UTF_8));require(body.getString("requestId")==req.getString("requestId")) { "CONTRACT_INVALID" };schema.check(if(status in 200..299)op+"Reply" else "Error",body)
            return JSONObject().put("status",status).put("body",body).put("headers",JSONObject().put("X-FW-Contract-Revision",SourceCatalog.API).put("Date",c.getHeaderField("Date")))
        }finally {c.disconnect()}
    }
    private fun tokens(data:JSONObject){val previous=state ?: JSONObject();state=JSONObject().put("tokens",data.getJSONObject("tokens")).put("session",data.getJSONObject("session")).put("profile",data.getJSONObject("profile"));if(previous.has("challenge"))state!!.put("challenge",previous.getJSONObject("challenge"));if(previous.optJSONObject("session")?.optString("sessionId")==data.getJSONObject("session").getString("sessionId"))for(key in listOf("enrollment","reauthPending"))if(previous.has(key))state!!.put(key,previous.get(key));save()}
    private fun ownerAccess():String {
        val auth=state?.takeIf {it.has("tokens")&&it.has("session")} ?: error("REAUTH_REQUIRED")
        val t=auth.getJSONObject("tokens")
        if(java.time.Instant.parse(t.getString("accessExpiresAt")).toEpochMilli()<System.currentTimeMillis()+30000){
            val renew=auth.optJSONObject("renewRequest")?:envelope("renewNativeSession",JSONObject(),Wire.id()).also {auth.put("renewRequest",it);save()}
            val response=http(renew,t.getString("refreshToken"));require(response.getInt("status") in 200..299) {"REAUTH_REQUIRED"}
            tokens(response.getJSONObject("body").getJSONObject("data"));state!!.remove("renewRequest");save()
        }
        return state!!.getJSONObject("tokens").getString("accessToken")
    }
    private fun work(call:PluginCall,keys:Set<String>,block:()->JSONObject){if(!trusted()){call.reject("NATIVE_UNAVAILABLE","NATIVE_UNAVAILABLE");return};try { Wire.exactKeys(call.data,keys) }catch(_:Exception){call.reject("CONTRACT_INVALID","CONTRACT_INVALID");return};val gen=generation.get();runtime.execute {try {loadState();val result=block();if(generation.get()!=gen)call.reject("EPOCH_CHANGED","EPOCH_CHANGED") else call.resolve(JSObject.fromJSONObject(result))}catch(e:Exception){val code=e.message?.takeIf { candidate -> candidate in setOf("UPDATE_REQUIRED","CONTRACT_INVALID","ENDPOINT_NOT_CONFIGURED","REAUTH_REQUIRED","EPOCH_CHANGED") || schema.contract.getJSONObject("components").getJSONObject("schemas").getJSONObject("Error").getJSONObject("properties").getJSONObject("code").getJSONArray("enum").let { codes -> (0 until codes.length()).any { codes.getString(it)==candidate } } } ?: "NETWORK_WAIT";call.reject(code,code)}}}
    @PluginMethod fun getCapabilities(call:PluginCall)=work(call,emptySet()){JSONObject().put("apiRevision",SourceCatalog.API).put("bridgeRevision",SourceCatalog.BRIDGE).put("configured",origin.isNotEmpty()).put("appVersion",test.finweave.prototype.BuildConfig.VERSION_NAME).put("androidApi",android.os.Build.VERSION.SDK_INT)}
    @PluginMethod fun restoreSession(call:PluginCall)=work(call,emptySet()){
        val response=http(envelope("getSession",JSONObject(),Wire.id()),ownerAccess())
        if(response.getInt("status") !in 200..299)error(response.getJSONObject("body").getString("code"))
        val session=response.getJSONObject("body").getJSONObject("data");state!!.put("session",session);save()
        JSONObject().put("session",session).put("profile",state!!.getJSONObject("profile"))
    }
    @PluginMethod fun startAuth(call:PluginCall) {
        if(!trusted()){call.reject("NATIVE_UNAVAILABLE","NATIVE_UNAVAILABLE");return}
        generation.incrementAndGet();runtime.logout()
        work(call,setOf("operation","input","key")){
        state=null;save()
        val op=call.getString("operation")!!;require(op in setOf("signIn","registerIdentity")) { "CONTRACT_INVALID" };val input=JSONObject(call.data.getJSONObject("input").toString());require(!input.has("installationPublicKey"));input.put("installationPublicKey",key())
        val response=http(envelope(op,input,call.getString("key")!!));if(response.getInt("status") in 200..299){val challenge=response.getJSONObject("body").getJSONObject("data");val flow=Wire.id();state=(state?:JSONObject()).put("challenge",challenge).put("flowId",flow);save();response.getJSONObject("body").put("data",JSONObject().put("flowId",flow).put("state",challenge.getString("state")).put("expiresAt",challenge.getString("expiresAt")).put("channel",challenge.getString("channel")).put("synthetic",challenge.getBoolean("synthetic")))};response
    }}
    @PluginMethod fun requestReset(call:PluginCall)=work(call,setOf("email","key")){
        http(envelope("requestPasswordReset",JSONObject().put("email",call.getString("email")),call.getString("key")!!))
    }
    private fun rejectSafe(call:PluginCall,e:Exception) {
        val candidate=e.message
        val codes=schema.contract.getJSONObject("components").getJSONObject("schemas").getJSONObject("Error").getJSONObject("properties").getJSONObject("code").getJSONArray("enum")
        val code=candidate?.takeIf { it in setOf("REAUTH_REQUIRED","EPOCH_CHANGED","CONTRACT_INVALID","ENDPOINT_NOT_CONFIGURED","OUTCOME_UNKNOWN") || (0 until codes.length()).any { n->codes.getString(n)==it } } ?: "NETWORK_WAIT"
        val message=when(code){
            "INVALID_CREDENTIALS"->"Mật khẩu chưa đúng. Vui lòng thử lại."
            "CHALLENGE_INVALID"->"Mã xác nhận chưa đúng hoặc đã hết hạn. Vui lòng yêu cầu mã mới."
            "REAUTH_REQUIRED"->"Vui lòng đăng nhập lại để xác nhận chủ tài khoản."
            "EPOCH_CHANGED"->"Phiên đăng nhập đã thay đổi. Vui lòng thực hiện lại."
            "OUTCOME_UNKNOWN"->"Chưa xác nhận kết quả. Hãy thử lại đúng yêu cầu vừa gửi."
            else->"Chưa hoàn tất xác nhận. Kiểm tra kết nối và thử lại."
        }
        call.reject(message,code)
    }
    private fun authStep(call:PluginCall,gen:Int,block:()->Unit) = runtime.execute {
        try { loadState();require(gen==generation.get()) { "EPOCH_CHANGED" };block() } catch(e:Exception) { rejectSafe(call,e) }
    }
    private fun ownerDialog(call:PluginCall,gen:Int,title:String,description:String,code:Boolean,submit:(String)->Unit) {
        activity.runOnUiThread {
            if(gen!=generation.get()||!trusted()){call.reject("EPOCH_CHANGED","EPOCH_CHANGED");return@runOnUiThread}
            val field=android.widget.EditText(activity).apply {
                contentDescription=if(code)"FinWeave owner verification code" else "FinWeave owner password"
                inputType=if(code)android.text.InputType.TYPE_CLASS_NUMBER or android.text.InputType.TYPE_NUMBER_VARIATION_PASSWORD else android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
                filters=arrayOf(android.text.InputFilter.LengthFilter(if(code)6 else 128))
            }
            val dialog=AlertDialog.Builder(activity).setTitle(title).setMessage(description).setView(field)
                .setNegativeButton("Hủy"){_,_->call.reject("CANCELLED","CANCELLED")}
                .setPositiveButton(if(code)"Xác nhận" else "Tiếp tục"){_,_->val value=field.text.toString();field.text.clear();if(gen!=generation.get())call.reject("EPOCH_CHANGED","EPOCH_CHANGED") else submit(value)}.create()
            dialog.setOnCancelListener {call.reject("CANCELLED","CANCELLED")};dialog.show();dialog.window?.addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)
        }
    }
    @PluginMethod fun enroll(call:PluginCall) {
        if(!trusted()){call.reject("NATIVE_UNAVAILABLE","NATIVE_UNAVAILABLE");return}
        try {Wire.exactKeys(call.data,setOf("workspaceId","key"))}catch(_:Exception){call.reject("CONTRACT_INVALID","CONTRACT_INVALID");return}
        val gen=generation.get()
        ownerDialog(call,gen,"Xác nhận chủ tài khoản","Nhập mật khẩu để kết nối thiết bị. Mật khẩu và mã xác nhận chỉ được xử lý trong phần native.",false){password->
            authStep(call,gen){
                val auth=state?.takeIf {it.has("tokens")&&it.has("session")} ?: error("REAUTH_REQUIRED")
                val input=JSONObject().put("password",password);val digest=Wire.sha(Wire.canonical(input).toByteArray())
                var pending=auth.optJSONObject("reauthPending")?.takeIf {it.optLong("expiresAt")>System.currentTimeMillis()}
                if(pending==null){pending=JSONObject().put("key",call.getString("key")+"_reauth").put("requestId",Wire.id()).put("digest",digest).put("expiresAt",System.currentTimeMillis()+300000);auth.put("reauthPending",pending);save()}
                require(pending.getString("digest")==digest) {"OUTCOME_UNKNOWN"}
                var challenge=pending.optJSONObject("challenge")
                if(challenge==null){
                    val req=envelope("requestOwnerReauthentication",input,pending.getString("key")).put("requestId",pending.getString("requestId"))
                    val response=http(req,auth.getJSONObject("tokens").getString("accessToken"))
                    if(response.getInt("status") !in 200..299){if(response.getJSONObject("body").optString("outcome")=="not_committed"){auth.remove("reauthPending");save()};error(response.getJSONObject("body").getString("code"))}
                    challenge=response.getJSONObject("body").getJSONObject("data");pending.put("challenge",challenge);save()
                }
                val captured=challenge;val capturedPending=pending
                ownerDialog(call,gen,"Mã xác nhận FinWeave","Nhập mã vừa được gửi tới hộp thư của bạn. Với bản local, dùng công cụ Local-Login-Code trên máy tính.",true){code->
                    authStep(call,gen){
                        val owner=state ?: error("REAUTH_REQUIRED");val data=JSONObject().put("challengeId",captured.getString("challengeId")).put("code",code)
                        val codeDigest=Wire.sha(Wire.canonical(data).toByteArray())
                        if(capturedPending.has("verifyDigest"))require(capturedPending.getString("verifyDigest")==codeDigest) {"OUTCOME_UNKNOWN"}
                        else {capturedPending.put("verifyDigest",codeDigest).put("verifyId",Wire.id()).put("verifyKey",Wire.id());save()}
                        val req=envelope("verifyOwnerReauthentication",data,capturedPending.getString("verifyKey")).put("requestId",capturedPending.getString("verifyId"))
                        val response=http(req,owner.getJSONObject("tokens").getString("accessToken"))
                        if(response.getInt("status") !in 200..299){if(response.getJSONObject("body").optString("outcome")=="not_committed"){capturedPending.remove("verifyDigest");capturedPending.remove("verifyId");capturedPending.remove("verifyKey");save()};error(response.getJSONObject("body").getString("code"))}
                        require(gen==generation.get()) {"EPOCH_CHANGED"};owner.remove("reauthPending");save();enrollConfirmed(call)
                    }
                }
            }
        }
    }
    @PluginMethod fun resetPassword(call:PluginCall) {
        if(!trusted()){call.reject("NATIVE_UNAVAILABLE","NATIVE_UNAVAILABLE");return}
        val gen=generation.get();activity.runOnUiThread {
            val tokenField=android.widget.EditText(activity).apply { hint="Mã khôi phục FinWeave";inputType=android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD }
            val dialog=AlertDialog.Builder(activity).setTitle("Đặt lại mật khẩu FinWeave").setMessage("Nhập mã từ liên kết khôi phục trong hộp thoại native. Mã không được gửi vào WebView.").setView(tokenField).setNegativeButton("Hủy"){_,_->call.reject("CANCELLED","CANCELLED")}.setPositiveButton("Xác nhận"){_,_->
                if(gen!=generation.get())call.reject("EPOCH_CHANGED","EPOCH_CHANGED") else {
                    val resetToken=tokenField.text.toString();tokenField.text.clear();generation.incrementAndGet();runtime.logout()
                    work(call,setOf("password","passwordConfirmation","key")){
                        val input=JSONObject().put("resetToken",resetToken).put("password",call.getString("password")).put("passwordConfirmation",call.getString("passwordConfirmation"))
                        val old=state?.optJSONObject("resetPending");val digest=Wire.sha(Wire.canonical(input).toByteArray());if(old!=null)require(old.getString("digest")==digest) { "OUTCOME_UNKNOWN" };val request=envelope("resetIdentityPassword",input,old?.getString("key") ?: call.getString("key")!!);state=JSONObject().put("resetPending",JSONObject().put("resetToken",resetToken).put("key",request.getJSONObject("mutation").getString("idempotencyKey")).put("digest",digest));save()
                        // Passwords/codes stay in call memory. Only token/key/digest are persisted natively.
                        val result=http(request);if(result.getInt("status") in 200..299||result.getJSONObject("body").optString("outcome")=="not_committed"){state=null;save()};result
                    }
                }
            }.create();dialog.show();dialog.window?.addFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)
        }
    }
    private fun enrollConfirmed(call:PluginCall)=work(call,setOf("workspaceId","key")){
        require(runtime.consent==SourceCatalog.CONSENT) { "REAUTH_REQUIRED" }
        val auth=state?:error("REAUTH_REQUIRED");val session=auth.getJSONObject("session");val workspace=call.getString("workspaceId")!!
        val owned=session.getJSONArray("workspaceIds");require((0 until owned.length()).any { owned.getString(it)==workspace }) { "CONTRACT_INVALID" }
        val access=auth.getJSONObject("tokens").getString("accessToken")
        fun success(response:JSONObject):JSONObject {if(response.getInt("status") !in 200..299)error(response.getJSONObject("body").getString("code"));return response.getJSONObject("body").getJSONObject("data")}
        val sync=success(http(envelope("getSyncState",JSONObject().put("lastKnownVersion",JSONObject.NULL),Wire.id(),workspace),access));val epoch=sync.getLong("recoveryEpoch");val version=sync.getLong("workspaceVersion")
        val pending=auth.optJSONObject("enrollment") ?: JSONObject().put("workspace",workspace).put("epoch",epoch).put("version",version).put("alias","fw-collector-"+Wire.sha((session.getString("subjectId")+workspace).toByteArray()).take(32)).put("key",call.getString("key")).also { auth.put("enrollment",it);save() }
        require(pending.getString("workspace")==workspace&&pending.getLong("epoch")==epoch) { "REAUTH_REQUIRED" }
        val privateAlias=pending.getString("alias");val pub=key(privateAlias);val publicDigest=Wire.sha(Base64.getUrlDecoder().decode(pub));val name=android.os.Build.MANUFACTURER+" "+android.os.Build.MODEL
        fun command(op:String,input:JSONObject,stage:String):JSONObject {var request=pending.optJSONObject(stage);if(request==null){request=envelope(op,input,pending.getString("key")+"_"+stage,workspace);request.getJSONObject("mutation").put("expectedWorkspaceVersion",pending.getLong("version"));pending.put(stage,request);save()};return success(http(request,access))}
        val enrollment=pending.optJSONObject("challenge")?:command("requestDeviceEnrollment",JSONObject().put("platform","android").put("publicKeyDigest",publicDigest),"enroll_challenge").also { pending.put("challenge",it);save() }
        val claims=JSONObject().put("revision",SourceCatalog.API).put("purpose","enrollment").put("challengeId",enrollment.getString("challengeId")).put("nonce",enrollment.getString("nonce")).put("subjectId",session.getString("subjectId")).put("sessionId",session.getString("sessionId")).put("workspaceId",workspace).put("publicKeyDigest",publicDigest).put("name",name).put("appVersion",test.finweave.prototype.BuildConfig.VERSION_NAME).put("consentVersion",SourceCatalog.CONSENT).put("recoveryEpoch",epoch)
        val device=pending.optJSONObject("device")?:command("registerDevice",JSONObject().put("name",name).put("platform","android").put("appVersion",test.finweave.prototype.BuildConfig.VERSION_NAME).put("consentVersion",SourceCatalog.CONSENT).put("publicKey",pub).put("challengeId",enrollment.getString("challengeId")).put("proof",sign(privateAlias,claims)),"register").also { pending.put("device",it);save() }
        val challenge=pending.optJSONObject("credentialChallenge")?:command("requestCollectorCredentialChallenge",JSONObject().put("deviceId",device.getString("id")),"credential_challenge").also { pending.put("credentialChallenge",it);save() }
        val transcript=JSONObject().put("revision",SourceCatalog.API).put("purpose","collector_token").put("challengeId",challenge.getString("challengeId")).put("nonce",challenge.getString("nonce")).put("subjectId",session.getString("subjectId")).put("sessionId",session.getString("sessionId")).put("workspaceId",workspace).put("deviceId",device.getString("id")).put("publicKeyDigest",publicDigest).put("deviceEpoch",device.getLong("version")).put("recoveryEpoch",epoch)
        val credential=pending.optJSONObject("credential")?:command("issueCollectorCredential",JSONObject().put("deviceId",device.getString("id")).put("challengeId",challenge.getString("challengeId")).put("proof",sign(privateAlias,transcript)),"issue").also { pending.put("credential",it);save() }
        val index=pending.optString("indexKey").takeIf { it.isNotEmpty() }?:Wire.id().also { pending.put("indexKey",it);save() }
        val time=http(envelope("getSession",JSONObject(),Wire.id()),access).getJSONObject("headers").getString("Date")
        runtime.bindSession(NativeSession("device-"+device.getString("id"),session.getString("subjectId"),workspace,device.getString("id"),credential.getLong("deviceEpoch"),credential.getLong("recoveryEpoch"),credential.getString("token"),java.time.Instant.parse(credential.getString("expiresAt")).toEpochMilli(),java.time.Instant.parse(credential.getString("authorizedUntil")).toEpochMilli(),privateAlias,index,emptyList(),java.time.ZonedDateTime.parse(time,java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME).toInstant().toEpochMilli(),android.os.SystemClock.elapsedRealtime(),android.provider.Settings.Global.getInt(context.contentResolver,android.provider.Settings.Global.BOOT_COUNT,-1)))
        JSONObject().put("device",device)
    }
    @PluginMethod fun verifyAuth(call:PluginCall)=work(call,setOf("flowId","code","key")){
        require(state?.optString("flowId")==call.getString("flowId")) { "REAUTH_REQUIRED" };val challenge=state!!.getJSONObject("challenge")
        require(java.time.Instant.parse(challenge.getString("expiresAt")).toEpochMilli()>System.currentTimeMillis()) { "REAUTH_REQUIRED" }
        val response=http(envelope("verifyNativeIdentityChallenge",JSONObject().put("challengeId",challenge.getString("challengeId")).put("code",call.getString("code")),call.getString("key")!!),challenge=challenge)
        if(response.getInt("status") in 200..299){val data=response.getJSONObject("body").getJSONObject("data");tokens(data);state!!.remove("challenge");state!!.remove("flowId");save();data.remove("tokens")};response
    }
    @PluginMethod fun invoke(call:PluginCall) {
        if(!trusted()){call.reject("NATIVE_UNAVAILABLE","NATIVE_UNAVAILABLE");return}
        val wire=call.getString("canonicalRequest") ?: run { call.reject("CONTRACT_INVALID","CONTRACT_INVALID");return };val req=try {JSONObject(wire)}catch(_:Exception){call.reject("CONTRACT_INVALID","CONTRACT_INVALID");return};val op=req.optString("operationId")
        val allowed=(0 until catalog.length()).any { catalog.getString(it)==op };if(!allowed&&op!="createWorkspace"){call.reject("CONTRACT_INVALID","CONTRACT_INVALID");return}
        val highRisk=op.startsWith("confirm")||op in setOf("createEvent","correctPostedEvent","allocateGoal","revokeDevice","archiveAccount","recordCashCount")
        val gen=generation.get()
        val execute={work(call,setOf("canonicalRequest")){
            require(gen==generation.get()) { "EPOCH_CHANGED" };val auth=state?.takeIf { it.has("tokens")&&it.has("session") }?:error("REAUTH_REQUIRED");val session=auth.getJSONObject("session");val w=req.opt("workspaceId")
            require(w===JSONObject.NULL||w==null||(0 until session.getJSONArray("workspaceIds").length()).any { session.getJSONArray("workspaceIds").getString(it)==w }) { "CONTRACT_INVALID" }
            val response=http(req,ownerAccess(),canonical=wire)
            if(response.getInt("status") in 200..299&&op=="getSession"){state!!.put("session",response.getJSONObject("body").getJSONObject("data"));save()}
            if(response.getInt("status") in 200..299&&op=="revokeDevice"&&state?.optJSONObject("enrollment")?.optJSONObject("device")?.optString("id")==req.getJSONObject("input").optString("id")){runtime.logout();state!!.remove("enrollment");save()}
            if(response.getInt("status") in 200..299&&op=="bindCollector"){val old=runtime.session;val binding=response.getJSONObject("body").getJSONObject("data");if(old!=null&&old.device==binding.getString("deviceId")){val b=Binding(binding.getString("id"),binding.getLong("version"),binding.getString("accountId"),binding.getString("packageName"),binding.getString("parserProfileId"),binding.getBoolean("enabled"),null);runtime.bindSession(old.copy(bindings=old.bindings.filter { it.id!=b.id }+b))}}
            if(response.getInt("status") in 200..299&&op=="createWorkspace"){state!!.getJSONObject("session").getJSONArray("workspaceIds").put(response.getJSONObject("body").getJSONObject("data").getString("id"));save()};response
        }}
        if(highRisk)activity.runOnUiThread { AlertDialog.Builder(activity).setTitle("Xác nhận thay đổi FinWeave").setMessage("Thao tác: $op\nMã nội dung: ${Wire.sha(wire.toByteArray()).take(16)}").setNegativeButton("Hủy"){_,_->call.reject("CANCELLED","CANCELLED")}.setPositiveButton("Xác nhận"){_,_->execute()}.show() } else execute()
    }
    @PluginMethod fun signOut(call:PluginCall) {
        if(!trusted()){call.reject("NATIVE_UNAVAILABLE","NATIVE_UNAVAILABLE");return};generation.incrementAndGet();runtime.logout()
        work(call,setOf("key")){val auth=state;val pending=auth?.optJSONObject("logoutPending") ?: auth?.takeIf { it.has("tokens")&&it.has("session") }?.let { JSONObject().put("request",envelope("signOut",JSONObject().put("sessionId",it.getJSONObject("session").getString("sessionId")),call.getString("key")!!)).put("credential",it.getJSONObject("tokens").getString("accessToken")) };if(pending==null){state=null;save();JSONObject().put("localFenced",true).put("serverOutcome","not_sent")}else{state=JSONObject().put("logoutPending",pending);save();val result=http(pending.getJSONObject("request"),pending.getString("credential"));if(result.getInt("status") in 200..299||result.getInt("status")==401){state=null;save()};result}}
    }
}
