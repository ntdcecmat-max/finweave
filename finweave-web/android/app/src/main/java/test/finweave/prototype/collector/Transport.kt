package test.finweave.prototype.collector

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import org.json.JSONObject
import java.net.URL
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.Signature
import java.security.spec.ECGenParameterSpec
import java.util.Base64
import java.net.HttpURLConnection

object NativeEndpoint {
    // Deployment origin has not been supplied or verified. No LAN/debug fallback.
    val origin:String? get() = test.finweave.prototype.BuildConfig.FW_API_ORIGIN.takeIf { it.isNotEmpty() }
}
object NativeProof {
    fun createKey(alias:String):String {
        val g=KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC,"AndroidKeyStore")
        g.initialize(KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_SIGN).setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
            .setDigests(KeyProperties.DIGEST_SHA256).setUserAuthenticationRequired(false).build())
        return Base64.getUrlEncoder().withoutPadding().encodeToString(g.generateKeyPair().public.encoded)
    }
    fun derToRaw(der:ByteArray):ByteArray {
        require(der.size in 8..72 && der[0]==0x30.toByte() && (der[1].toInt() and 255)==der.size-2)
        var pos=2
        fun integer():ByteArray {
            require(der[pos++]==2.toByte());val n=der[pos++].toInt() and 255;require(n in 1..33 && pos+n<=der.size)
            val value=der.copyOfRange(pos,pos+n);pos+=n
            require(value[0].toInt()>=0 && (n<=32 || value[0]==0.toByte()))
            val significant=if(n==33) value.copyOfRange(1,n) else value
            return ByteArray(32-significant.size)+significant
        }
        val r=integer();val s=integer();require(pos==der.size);return r+s
    }
    fun claims(request:JSONObject,origin:String,path:String,credential:String,time:Long) = JSONObject()
        .put("revision",SourceCatalog.API).put("purpose",request.getString("operationId")).put("method","POST")
        .put("path",path).put("audience",origin).put("bodyDigest",Wire.sha(Wire.canonical(request).toByteArray()))
        .put("credentialDigest",Wire.sha(credential.toByteArray())).put("challengeId",JSONObject.NULL).put("challengeNonce",JSONObject.NULL)
        .put("issuedAt",time/1000).put("nonce",Wire.id())
    fun header(s:NativeSession,request:JSONObject,origin:String,path:String,time:Long):String {
        val bytes=Wire.canonical(claims(request,origin,path,s.credential,time)).toByteArray()
        val keys=KeyStore.getInstance("AndroidKeyStore").also { it.load(null) }
        val signature=Signature.getInstance("SHA256withECDSA")
        signature.initSign(keys.getKey(s.signingAlias,null) as java.security.PrivateKey);signature.update(bytes)
        val b64=Base64.getUrlEncoder().withoutPadding()
        return b64.encodeToString(bytes)+"."+b64.encodeToString(derToRaw(signature.sign()))
    }
}
data class HttpResult(val status:Int,val reply:JSONObject?,val retryAfterSeconds:Long?,val revision:String?)
class CollectorHttp(private val origin:String) {
    init { val u=URL(origin);require((u.protocol=="https" || test.finweave.prototype.BuildConfig.DEBUG && u.protocol=="http" && u.host=="127.0.0.1") && u.userInfo==null && u.path.isEmpty() && u.query==null && u.ref==null) }
    fun send(s:NativeSession,request:JSONObject,time:Long):HttpResult {
        val op=request.getString("operationId")
        require(op in setOf("ingestNotifications","reconcileReceipts","renewCollectorCredential"))
        val path=if(op=="renewCollectorCredential") "/v2/identity/$op" else "/v2/operations/$op"
        val wire=Wire.canonical(request).toByteArray();require(wire.size<=262144)
        val c=URL(origin+path).openConnection() as HttpURLConnection
        try {
            c.instanceFollowRedirects=false;c.connectTimeout=15000;c.readTimeout=20000;c.requestMethod="POST";c.doOutput=true
            c.setRequestProperty("Content-Type","application/json");c.setRequestProperty("X-FW-Contract-Revision",SourceCatalog.API)
            c.setRequestProperty("Authorization","Bearer "+s.credential)
            c.setRequestProperty("X-FW-Collector-Proof",NativeProof.header(s,request,origin,path,time))
            c.setFixedLengthStreamingMode(wire.size);c.outputStream.use { it.write(wire) }
            val status=c.responseCode;val input=if(status in 200..299) c.inputStream else c.errorStream
            val bytes=input?.use { stream ->
                val output=java.io.ByteArrayOutputStream();val buffer=ByteArray(4096)
                while(true) { val n=stream.read(buffer);if(n<0) break;require(output.size()+n<=262144);output.write(buffer,0,n) }
                output.toByteArray()
            } ?: ByteArray(0)
            val reply=try { JSONObject(String(bytes,Charsets.UTF_8)) } catch (_:Exception) { null }
            val header=c.getHeaderField("Retry-After")
            val retry=header?.toLongOrNull()?.takeIf { it>=0 } ?: header?.let {
                try { ((java.time.ZonedDateTime.parse(it,java.time.format.DateTimeFormatter.RFC_1123_DATE_TIME).toInstant().toEpochMilli()-time+999)/1000).coerceAtLeast(0) } catch (_:Exception) { null }
            }
            return HttpResult(status,reply,retry,c.getHeaderField("X-FW-Contract-Revision"))
        } finally { c.disconnect() }
    }
}
