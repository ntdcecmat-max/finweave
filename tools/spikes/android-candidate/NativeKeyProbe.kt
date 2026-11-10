package synthetic.finweave.spike

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.Signature
import java.security.spec.ECGenParameterSpec

// No JS signing capability. Invoke only from isolated instrumentation.
object NativeKeyProbe {
    private const val alias = "synthetic-installation-p256-v1"
    fun createOnce() {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        if (store.containsAlias(alias)) return
        KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC,"AndroidKeyStore").apply {
            initialize(KeyGenParameterSpec.Builder(alias,KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY)
                .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
                .setDigests(KeyProperties.DIGEST_SHA256).build())
        }.generateKeyPair()
    }
    fun fixedFixture(): Pair<ByteArray, ByteArray> {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        val entry = store.getEntry(alias,null) as KeyStore.PrivateKeyEntry
        val signature = Signature.getInstance("SHA256withECDSA").apply {
            initSign(entry.privateKey); update("SYNTHETIC-PROOF-v1".toByteArray(Charsets.UTF_8))
        }.sign() // DER. Conversion to raw64 requires separately pinned/tested library.
        return Pair(entry.certificate.publicKey.encoded,signature)
    }
}
