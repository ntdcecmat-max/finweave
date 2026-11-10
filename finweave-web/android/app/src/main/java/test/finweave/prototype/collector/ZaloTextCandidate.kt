package test.finweave.prototype.collector

import java.text.Normalizer
import java.util.Locale
import org.json.JSONObject

// Generic Vietnamese notification grammar, not a verified ZaloPay template.
// Callback-lifetime input only; return amount/direction, never free text or identities.
// This candidate is deliberately not registered in SourceCatalog.liveProfiles.
class ZaloTextCandidate : NotificationParser {
    companion object { const val VERSION = "zalopay-generic-vnd-candidate-1" }
    private val number = "(?:[1-9][0-9]{0,2}(?:\\.[0-9]{3})+|[1-9][0-9]{0,2}(?:,[0-9]{3})+|[1-9][0-9]{0,17})"
    private val money = "([+\\-−]?$number)\\s*(?:vnd|vnđ|đ|₫)(?![\\p{L}])"
    private val monetary = Regex("(?<![\\p{L}\\p{N}.,+\\-−])$money")
    private val incoming = Regex("^bạn đã nhận(?: được)?(?: số tiền)? $money(?: từ .{1,160})?(?: thành công)?[.!]?$")
    private val outgoing = Regex("^bạn đã (?:chuyển|gửi)(?: thành công)?(?: số tiền)? $money(?: (?:đến|cho|tới) .{1,160})?(?: thành công)?[.!]?$")
    private val payment = Regex("^(?:bạn đã )?thanh toán thành công(?: số tiền)? $money(?: (?:cho|tại) .{1,160})?[.!]?$")
    private val nonFinal = Regex("thất bại|đang xử lý|đang chờ|chờ xác nhận|chưa|không|huỷ|hủy|pending|failed|cancelled|canceled")
    private val promotion = Regex("ưu đãi|khuyến mãi|khuyến mại|nhận ngay|nhận thêm|hoàn đến|tặng|cơ hội|hãy|vui lòng|có thể|sẽ|dự kiến|yêu cầu|đề nghị|hạn mức")
    private val internal = Regex("số dư sinh lời|số dư sinh lợi|chuyển nội bộ|giữa các tài khoản|giữa hai tài khoản")
    private fun normalize(value: String) = Normalizer.normalize(value, Normalizer.Form.NFC)
        .lowercase(Locale.ROOT).replace(Regex("\\s+"), " ").trim()
    private fun amount(value: String): String? {
        val canonical = value.trimStart('+', '-', '−').replace(".", "").replace(",", "")
        return canonical.takeIf { it.length in 1..18 && it.first() != '0' }
    }
    override fun parse(fields: NotificationFields): Parsed {
        if (fields.oversized()) return Parsed(null, "OVERSIZE")
        if (!ZaloPreviewPolicy.safe(fields)) return Parsed(null, "OTP_DISCARDED")
        val all = listOfNotNull(fields.title, fields.text, fields.bigText, fields.subText).map(::normalize)
        if (all.any { nonFinal.containsMatchIn(it) }) return Parsed(null, "NON_FINAL")
        if (all.any { promotion.containsMatchIn(it) }) return Parsed(null, "PROMOTIONAL")
        if (all.any { internal.containsMatchIn(it) }) return Parsed(null, "INTERNAL_TRANSFER")
        if (all.any { it.contains("hoàn tiền") }) return Parsed(null, "REFUND_UNVERIFIED")
        val bodies = listOfNotNull(fields.text, fields.bigText).map(::normalize).filter { it.isNotEmpty() }.distinct()
        val body = fields.bigText?.takeIf { it.isNotBlank() }?.let(::normalize)
            ?: fields.text?.let(::normalize) ?: return Parsed(null, "UNSUPPORTED")
        if (bodies.any { it != body && !body.startsWith(it) }) return Parsed(null, "CONFLICTING_FIELDS")
        val matches = listOfNotNull(incoming.matchEntire(body)?.let { "income" to it },
            outgoing.matchEntire(body)?.let { "expense" to it }, payment.matchEntire(body)?.let { "expense" to it })
        if (matches.size != 1) return Parsed(null, "UNSUPPORTED")
        val (direction, match) = matches.single()
        val literal = match.groupValues[1]
        val value = amount(literal) ?: return Parsed(null, "INVALID_AMOUNT")
        val amounts = all.flatMap { monetary.findAll(it).map { m -> amount(m.groupValues[1]) }.toList() }
        if (amounts.any { it == null } || amounts.filterNotNull().distinct() != listOf(value))
            return Parsed(null, "AMBIGUOUS_AMOUNT")
        val signs = all.flatMap { monetary.findAll(it).map { m -> m.groupValues[1].first() }.toList() }
        if (direction == "income" && signs.any { it == '-' || it == '−' } || direction == "expense" && signs.any { it == '+' })
            return Parsed(null, "CONFLICTING_DIRECTION")
        val title = fields.title?.let(::normalize).orEmpty()
        if (direction == "income" && Regex("chuyển tiền|thanh toán|tiền ra").containsMatchIn(title) ||
            direction == "expense" && Regex("nhận tiền|tiền vào").containsMatchIn(title))
            return Parsed(null, "CONFLICTING_DIRECTION")
        return Parsed(Evidence(value, direction, null, null, null, "incomplete"), "CANDIDATE_GENERIC_TEMPLATE_UNVERIFIED")
    }
}

object ZaloCandidatePreview {
    // Synthetic strings are examples of the generic rules, never claimed as wallet-captured templates.
    fun fixture(name: String): NotificationFields = when (name) {
        "income" -> NotificationFields("Nhận tiền thành công", "Bạn đã nhận được 130.000đ từ NGƯỜI A.", null, null)
        "expense" -> NotificationFields("Chuyển tiền thành công", "Bạn đã chuyển 45.000đ cho NGƯỜI B.", null, null)
        "unknown" -> NotificationFields("ZaloPay", "Bạn có thông báo mới. Mở ứng dụng để xem chi tiết.", null, null)
        else -> error("INVALID_TEST_CASE")
    }
    fun analyze(fields: NotificationFields): JSONObject {
        val parsed = ZaloTextCandidate().parse(fields)
        return JSONObject().put("status", if (parsed.evidence == null) "UNKNOWN" else "CANDIDATE")
            .put("amount", parsed.evidence?.amount ?: JSONObject.NULL)
            .put("direction", parsed.evidence?.direction ?: JSONObject.NULL).put("reason", parsed.reason)
    }
}
