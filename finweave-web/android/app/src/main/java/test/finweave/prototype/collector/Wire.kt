package test.finweave.prototype.collector

import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Base64

object Wire {
    fun id(): String = Base64.getUrlEncoder().withoutPadding().encodeToString(ByteArray(32).also { SecureRandom().nextBytes(it) })
    fun sha(bytes: ByteArray): String = MessageDigest.getInstance("SHA-256").digest(bytes).joinToString("") { "%02x".format(it) }
    // This subset has only strings, integral safe numbers, booleans/null, arrays
    // and objects. Reject floats/unsafe integers rather than approximating JCS.
    fun canonical(value: Any?): String = when (value) {
        null, JSONObject.NULL -> "null"
        is JSONObject -> value.keys().asSequence().toList().sorted().joinToString(",", "{", "}") { JSONObject.quote(it) + ":" + canonical(value.get(it)) }
        is JSONArray -> (0 until value.length()).joinToString(",", "[", "]") { canonical(value.get(it)) }
        is String -> JSONObject.quote(value).replace("\\/", "/")
        is Boolean -> value.toString()
        is Int, is Long -> { require((value as Number).toLong() in -9007199254740991L..9007199254740991L); value.toString() }
        else -> error("WIRE_TYPE_REJECTED")
    }
    fun evidence(e: Evidence) = JSONObject().put("amount", e.amount ?: JSONObject.NULL).put("currency", "VND")
        .put("direction", e.direction).put("sourceAccountRef", e.sourceAccountRef ?: JSONObject.NULL)
        .put("transactionRef", e.transactionRef ?: JSONObject.NULL).put("sourceOccurredAt", e.sourceOccurredAt ?: JSONObject.NULL).put("ruleStatus", e.ruleStatus)
    fun item(e: Evidence, binding: Binding, event: String, revision: Long, observed: String, parser: String, source: String): JSONObject {
        val normalized = evidence(e)
        val item = JSONObject().put("eventKey", event).put("bindingId", binding.id).put("bindingVersion", binding.version)
            .put("sourceKey", source).put("revision", revision).put("observedAt", observed).put("parserVersion", parser).put("normalizedEvidence", normalized)
        return item.put("payloadDigest", sha(canonical(item).toByteArray()))
    }
    fun envelope(workspace: String, device: String, epoch: Long, recovery: Long, items: List<JSONObject>, request: String, key: String) =
        JSONObject().put("contractVersion", "2.0.0").put("requestId", request).put("workspaceId", workspace).put("operationId", "ingestNotifications")
            .put("input", JSONObject().put("deviceId", device).put("deviceEpoch", epoch).put("recoveryEpoch", recovery).put("items", JSONArray(items)))
            .put("mutation", JSONObject().put("idempotencyKey", key).put("expectedWorkspaceVersion", 0).put("expectedObjectVersions", JSONObject()).put("previewToken", JSONObject.NULL))
    fun exactKeys(j: JSONObject, expected: Set<String>) { require(j.keys().asSequence().toSet() == expected) { "WIRE_KEYS_REJECTED" } }
    // Validate all receipts before changing any row. HTTP 2xx alone is no ACK.
    fun receipts(reply: JSONObject, request: JSONObject, httpCode: Int): List<JSONObject> {
        require(httpCode == 202)
        exactKeys(reply, setOf("contractVersion", "requestId", "workspaceVersion", "data"))
        require(reply.getString("contractVersion") == "2.0.0" && reply.getString("requestId") == request.getString("requestId") && reply.isNull("workspaceVersion"))
        val d = reply.getJSONObject("data"); exactKeys(d, setOf("receipts", "acceptedAt")); java.time.Instant.parse(d.getString("acceptedAt"))
        val items = request.getJSONObject("input").getJSONArray("items")
        val receipts = d.getJSONArray("receipts"); require(receipts.length() == items.length())
        val expected = (0 until items.length()).associate { val i = items.getJSONObject(it); (i.getString("eventKey") to i.getLong("revision")) to i }
        require(expected.size == items.length())
        val seen = mutableSetOf<Pair<String, Long>>()
        val result = (0 until receipts.length()).map {
            val r = receipts.getJSONObject(it); exactKeys(r, setOf("eventKey", "revision", "receiptId", "state", "errorCode"))
            val tuple = r.getString("eventKey") to r.getLong("revision"); require(tuple in expected && seen.add(tuple))
            when (r.getString("state")) {
                "durable" -> require(r.getString("receiptId").matches(Regex("[A-Za-z0-9_-]{1,80}")) && r.isNull("errorCode"))
                "rejected" -> require(r.isNull("receiptId") && r.getString("errorCode").matches(Regex("[A-Za-z0-9_-]{1,80}")))
                else -> error("ACK_STATE_REJECTED")
            }; r
        }
        require((httpCode == 202) == result.any { it.getString("state") == "durable" })
        return result
    }
    fun rejectedItems(reply:JSONObject,request:JSONObject):List<Pair<String,Long>> {
        val required=setOf("contractVersion","requestId","workspaceVersion","code","message","retryable","retryAfterSeconds","fieldErrors","outcome")
        val keys=reply.keys().asSequence().toSet()
        require(keys.containsAll(required) && keys.all { it in required || it in setOf("resultRef","itemErrors") })
        require(reply.getString("contractVersion")=="2.0.0" && reply.getString("requestId")==request.getString("requestId") &&
            reply.getString("code")=="VALIDATION" && reply.getString("outcome")=="not_committed")
        val sent=request.getJSONObject("input").getJSONArray("items")
        val expected=(0 until sent.length()).map { val i=sent.getJSONObject(it);i.getString("eventKey") to i.getLong("revision") }.toSet()
        val errors=reply.getJSONArray("itemErrors")
        val rejected=(0 until errors.length()).map { val i=errors.getJSONObject(it)
            exactKeys(i,setOf("eventKey","revision","errorCode"));require(i.getString("errorCode").matches(Regex("[A-Za-z0-9_-]{1,80}")))
            i.getString("eventKey") to i.getLong("revision") }
        require(rejected.size==expected.size && rejected.toSet()==expected)
        return rejected
    }
}
