package test.finweave.prototype.collector

import java.time.LocalDateTime
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter
import java.time.format.ResolverStyle

// Strings have callback lifetime only. Never log or persist this object.
class NotificationFields(val title: String?, val text: String?, val bigText: String?, val subText: String?) {
    fun oversized() = listOf(title, text, bigText, subText).sumOf { it?.toByteArray(Charsets.UTF_8)?.size ?: 0 } > 16384
}
data class Evidence(val amount: String?, val direction: String, val sourceAccountRef: String?,
    val transactionRef: String?, val sourceOccurredAt: String?, val ruleStatus: String)
data class Parsed(val evidence: Evidence?, val reason: String)
fun interface NotificationParser { fun parse(fields: NotificationFields): Parsed }

// Candidate text grammar only: the screenshots do not establish Android package,
// extras mapping, time zone, finality or signer. Not registered for live capture.
class VcbTextCandidate : NotificationParser {
    companion object { const val VERSION = "vcb-text-candidate-1" }
    private val number = "(?:[1-9][0-9]{0,2}(?:,[0-9]{3})+|[1-9][0-9]{0,17})"
    private val grammar = Regex("^Số dư TK VCB ([0-9]{6,20}) ([+-])($number) VND lúc ([0-9]{2}-[0-9]{2}-[0-9]{4} [0-9]{2}:[0-9]{2}:[0-9]{2})\\. Số dư (?:0|$number) VND\\. Ref [A-Za-z0-9#._ -]{1,240}$")
    override fun parse(fields: NotificationFields): Parsed {
        if (fields.oversized()) return Parsed(null, "OVERSIZE")
        val all = listOfNotNull(fields.title, fields.text, fields.bigText, fields.subText)
        if (all.any { Regex("(?i)\\bOTP\\b|mã xác thực|verification code|one.time.password").containsMatchIn(it) }) return Parsed(null, "OTP_DISCARDED")
        val candidates = listOfNotNull(fields.text, fields.bigText).filter { it.isNotBlank() }.distinct()
        // Expanded text may be identical or an exact expansion of collapsed text.
        val body = fields.bigText?.takeIf { it.isNotBlank() } ?: fields.text ?: return Parsed(null, "UNSUPPORTED")
        if (candidates.any { it != body && !body.startsWith(it) }) return Parsed(null, "CONFLICTING_FIELDS")
        val m = grammar.matchEntire(body) ?: return Parsed(null, "UNSUPPORTED")
        val amount = m.groupValues[3].replace(",", "")
        if (amount.length > 18 || amount == "0") return Parsed(null, "INVALID_AMOUNT")
        try { LocalDateTime.parse(m.groupValues[4], DateTimeFormatter.ofPattern("dd-MM-uuuu HH:mm:ss").withResolverStyle(ResolverStyle.STRICT)) }
        catch (_: Exception) { return Parsed(null, "INVALID_TIME") }
        // Time zone/ref namespace/finality remain unverified. The candidate can
        // identify amount/direction/mask, but cannot manufacture a complete DTO.
        return Parsed(Evidence(amount, if (m.groupValues[2] == "+") "income" else "expense",
            "****" + m.groupValues[1].takeLast(4), null, null, "incomplete"), "CANDIDATE_TIME_FINALITY_UNVERIFIED")
    }
}

data class AppIdentity(val packageName: String, val version: Long, val signers: Set<String>, val androidApi: Int, val manufacturer: String, val model: String)
data class SourceProfile(val id: String, val packageName: String, val versions: Set<Long>, val signers: Set<String>,
    val androidApis: Set<Int>, val devices: Set<String>, val expiresAt: Long, val parser: NotificationParser, val sourceKey: String = id) {
    fun accepts(app: AppIdentity, now: Long) = now < expiresAt && app.packageName == packageName &&
        versions.contains(app.version) && signers.isNotEmpty() && app.signers == signers &&
        app.androidApi in androidApis && "${app.manufacturer}/${app.model}" in devices
}
data class Binding(val id: String, val version: Long, val accountId: String, val packageName: String,
    val parserProfileId: String, val enabled: Boolean, val maskedDiscriminator: String?)
object BindingResolver {
    fun resolve(bindings: List<Binding>, profile: SourceProfile, mask: String?, selected: Set<String>): Binding? {
        val live = bindings.filter { it.enabled && it.packageName == profile.packageName && it.parserProfileId == profile.id }
        val exact = if (mask == null) live else live.filter { it.maskedDiscriminator == mask }
        val chosen = exact.filter { it.id in selected }
        return chosen.singleOrNull() // no first-account fallback; selection cannot override a conflicting discriminator
    }
}
object SourceCatalog {
    const val API = "FW-API-T1-D1J2-005"
    const val BRIDGE = "FW-NATIVE-BRIDGE-003"
    const val CONSENT = "2026-10-08"
    // Both selected sources are candidates awaiting verified NLS input metadata.
    // No guessed package, signer, app version, template, timezone or lifecycle.
    val liveProfiles: List<SourceProfile> = emptyList()
}
