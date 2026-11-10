package test.finweave.prototype.collector

import org.json.JSONArray
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import java.security.KeyPairGenerator
import java.security.Signature
import java.security.spec.ECGenParameterSpec

class WireTest {
    private fun item()=Wire.item(Evidence("76543","income","mask_abcdefabcdefabcd",null,"2024-02-03T05:34:56Z","incomplete"),
        Binding("binding",2,"account","synthetic.test","synthetic-v1",true,null),"event",0,"2024-02-03T05:34:57Z","synthetic-v1","synthetic-bank")
    private fun request()=Wire.envelope("workspace","device",3,4,listOf(item()),"request","key")
    private fun reply()=JSONObject().put("contractVersion","2.0.0").put("requestId","request").put("workspaceVersion",JSONObject.NULL)
        .put("data",JSONObject().put("acceptedAt","2024-02-03T05:35:00Z").put("receipts",JSONArray(listOf(
            JSONObject().put("eventKey","event").put("revision",0).put("receiptId","receipt").put("state","durable").put("errorCode",JSONObject.NULL)))))
    private fun rejected(work:()->Unit) { try { work();fail("Must reject") } catch (_:IllegalArgumentException) { } catch (_:IllegalStateException) { } }
    @Test fun itemDigestIncludesIdentityBindingAndObservedTime() {
        val i=item();val digest=i.remove("payloadDigest");assertEquals(digest,Wire.sha(Wire.canonical(i).toByteArray()))
        i.put("bindingVersion",3);assertNotEquals(digest,Wire.sha(Wire.canonical(i).toByteArray()))
    }
    @Test fun pinnedMinimalDtoHasNoRawFeeMemoOrBalance() {
        assertEquals(setOf("amount","currency","direction","sourceAccountRef","transactionRef","sourceOccurredAt","ruleStatus"),
            item().getJSONObject("normalizedEvidence").keys().asSequence().toSet())
        assertEquals("FW-API-T1-D1J2-005",SourceCatalog.API);assertEquals("FW-NATIVE-BRIDGE-003",SourceCatalog.BRIDGE)
        assertTrue(Wire.canonical(request()).toByteArray().size<262144)
    }
    @Test fun ackOnlyMeansDurableAndRequestMustMatch() {
        assertEquals("durable",Wire.receipts(reply(),request(),202).single().getString("state"))
        rejected { Wire.receipts(reply().put("requestId","different"),request(),202) }
        rejected { Wire.receipts(reply(),request(),200) }
        val r=reply();r.getJSONObject("data").getJSONArray("receipts").getJSONObject(0).put("state","posted")
        rejected { Wire.receipts(r,request(),202) }
    }
    @Test fun duplicateWrongEventRevisionAndPartialAckRejectEntireReply() {
        for(field in listOf("eventKey","revision")) {
            val r=reply();r.getJSONObject("data").getJSONArray("receipts").getJSONObject(0).put(field,if(field=="revision") 1 else "wrong")
            rejected { Wire.receipts(r,request(),202) }
        }
        val r=reply();val a=r.getJSONObject("data").getJSONArray("receipts");a.put(a.getJSONObject(0))
        rejected { Wire.receipts(r,request(),202) }
        val missing=reply();missing.getJSONObject("data").put("receipts",JSONArray())
        rejected { Wire.receipts(missing,request(),202) }
    }
    @Test fun canonicalSubsetRejectsFloatsAndUnsafeNumbers() {
        assertEquals("{\"a\":null,\"b\":\"x/y\"}",Wire.canonical(JSONObject().put("b","x/y").put("a",JSONObject.NULL)))
        rejected { Wire.canonical(JSONObject().put("amount",1.1)) }
        rejected { Wire.canonical(JSONObject().put("epoch",9007199254740992L)) }
    }
    @Test fun derEs256ConvertsToRaw64AndVerifiesIndependentJca() {
        val g=KeyPairGenerator.getInstance("EC");g.initialize(ECGenParameterSpec("secp256r1"));val key=g.generateKeyPair()
        val claims=NativeProof.claims(request(),"https://synthetic.example","/v2/operations/ingestNotifications","fake-credential",1700000000000)
        val bytes=Wire.canonical(claims).toByteArray()
        val signer=Signature.getInstance("SHA256withECDSA");signer.initSign(key.private);signer.update(bytes)
        val der=signer.sign();val raw=NativeProof.derToRaw(der);assertEquals(64,raw.size)
        val verifier=Signature.getInstance("SHA256withECDSAinP1363Format");verifier.initVerify(key.public);verifier.update(bytes);assertTrue(verifier.verify(raw))
        System.getProperty("fw.evidence.dir")?.let {
            val directory=java.io.File(it).also { folder -> folder.mkdirs() }
            val base64=java.util.Base64.getUrlEncoder().withoutPadding()
            java.io.File(directory,"jvm-wire.json").writeText(Wire.canonical(JSONObject().put("request",request()).put("reply",reply())
                .put("claims",claims).put("canonicalClaims",String(bytes,Charsets.UTF_8)).put("spki",base64.encodeToString(key.public.encoded)).put("signatureRaw64",base64.encodeToString(raw))))
        }
        rejected { NativeProof.derToRaw(ByteArray(64)) }
    }
    @Test fun retriesPreserveRequestAndPayloadIds() {
        val original=Wire.canonical(request());repeat(20) { assertEquals(original,Wire.canonical(JSONObject(original))) }
        val first=NativeProof.claims(request(),"https://synthetic.example","/v2/operations/ingestNotifications","fake",1700000000000)
        val second=NativeProof.claims(request(),"https://synthetic.example","/v2/operations/ingestNotifications","fake",1700000001000)
        assertEquals(first.getString("bodyDigest"),second.getString("bodyDigest"));assertNotEquals(first.getString("nonce"),second.getString("nonce"))
    }
    @Test fun all422RejectionsRequireMatchingCompleteNotCommittedError() {
        val error=JSONObject().put("contractVersion","2.0.0").put("requestId","request").put("workspaceVersion",JSONObject.NULL)
            .put("code","VALIDATION").put("message","Safe code").put("retryable",false).put("retryAfterSeconds",JSONObject.NULL)
            .put("fieldErrors",JSONArray()).put("outcome","not_committed")
            .put("itemErrors",JSONArray(listOf(JSONObject().put("eventKey","event").put("revision",0).put("errorCode","PARSER_UNSUPPORTED"))))
        assertEquals(listOf("event" to 0L),Wire.rejectedItems(error,request()))
        rejected { Wire.rejectedItems(JSONObject(error.toString()).put("outcome","unknown"),request()) }
        rejected { Wire.rejectedItems(JSONObject(error.toString()).put("requestId","other"),request()) }
        rejected { Wire.rejectedItems(JSONObject(error.toString()).put("itemErrors",JSONArray()),request()) }
    }
}
