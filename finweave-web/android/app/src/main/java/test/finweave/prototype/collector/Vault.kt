package test.finweave.prototype.collector

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.room.Room
import org.json.JSONObject
import java.nio.ByteBuffer
import java.security.KeyStore
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.Mac
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

data class Sealed(val keyVersion: Int, val iv: ByteArray, val cipher: ByteArray)
class Vault(context: Context) {
    private val directory = java.io.File(context.noBackupFilesDir, "collector").also { it.mkdirs() }
    val db = Room.databaseBuilder(context, CollectorDatabase::class.java, java.io.File(directory,"collector.sqlite").absolutePath).build()
    val dao get() = db.dao()
    private val keys = KeyStore.getInstance("AndroidKeyStore").also { it.load(null) }
    private val current = mutableMapOf<String, Int>()
    private val random = SecureRandom()

    @Synchronized private fun activeKey(vault:String):VaultKey {
        current[vault]?.let { return dao.key(vault,it) }
        val previous = dao.keys(vault)
        require(previous.size < 64) { "KEY_VERSION_CAP" }
        val version = (previous.lastOrNull()?.version ?: 0) + 1
        val alias = "fw-wrap-" + Wire.id()
        val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES,"AndroidKeyStore")
        generator.init(KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM).setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256).setUserAuthenticationRequired(false).build())
        val wrapping = generator.generateKey()
        val dek = ByteArray(32).also { random.nextBytes(it) }
        val c = Cipher.getInstance("AES/GCM/NoPadding"); c.init(Cipher.ENCRYPT_MODE,wrapping)
        c.updateAAD((vault + ":" + version).toByteArray())
        val record = VaultKey(vault,version,c.doFinal(dek),c.iv,alias,ByteArray(4).also { random.nextBytes(it) },0)
        dek.fill(0); dao.key(record); current[vault] = version; return record
    }
    private fun dek(key:VaultKey):ByteArray {
        val k = keys.getKey(key.alias,null) ?: error("KEY_UNAVAILABLE")
        val c = Cipher.getInstance("AES/GCM/NoPadding"); c.init(Cipher.DECRYPT_MODE,k,GCMParameterSpec(128,key.wrapIv))
        c.updateAAD((key.vault + ":" + key.version).toByteArray()); return c.doFinal(key.wrapped)
    }
    @Synchronized fun seal(vault:String, kind:String, id:String, payload:JSONObject):Sealed {
        require(directory.walkTopDown().filter { it.isFile }.sumOf { it.length() } < 32L*1024*1024) { "STORAGE_CAP" }
        val key = activeKey(vault)
        var counter = 0L
        // Durable reservation precedes encryption and payload transaction.
        db.runInTransaction { require(dao.reserve(vault,key.version)==1); counter=dao.key(vault,key.version).counter }
        val iv = ByteBuffer.allocate(12).put(key.prefix).putLong(counter).array()
        val bytes = dek(key)
        try {
            val c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,SecretKeySpec(bytes,"AES"),GCMParameterSpec(128,iv))
            c.updateAAD(aad(vault,kind,id,key.version)); return Sealed(key.version,iv,c.doFinal(Wire.canonical(payload).toByteArray()))
        } finally { bytes.fill(0) }
    }
    fun open(vault:String,kind:String,id:String,keyVersion:Int,iv:ByteArray,payload:ByteArray):JSONObject {
        val key=dao.key(vault,keyVersion);val bytes=dek(key)
        try {
            val c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,SecretKeySpec(bytes,"AES"),GCMParameterSpec(128,iv))
            c.updateAAD(aad(vault,kind,id,keyVersion));return JSONObject(String(c.doFinal(payload),Charsets.UTF_8))
        } finally { bytes.fill(0) }
    }
    private fun aad(vault:String,kind:String,id:String,version:Int) = "$vault|$kind|$id|$version|schema1".toByteArray()
    fun lookup(secret:String, occurrence:String):String {
        val mac=Mac.getInstance("HmacSHA256");mac.init(SecretKeySpec(java.util.Base64.getUrlDecoder().decode(secret),"HmacSHA256"))
        return mac.doFinal(occurrence.toByteArray()).joinToString("") { "%02x".format(it) }
    }
}
