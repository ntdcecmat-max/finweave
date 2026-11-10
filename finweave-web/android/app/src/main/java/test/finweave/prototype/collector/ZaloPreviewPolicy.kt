package test.finweave.prototype.collector

// Measured on the owner's phone, not a production source profile or bank parser.
object ZaloPreviewPolicy {
    const val PACKAGE="vn.com.vng.zalopay"
    const val VERSION=1074603L
    const val SIGNER="59dd31fdf36070a0d7f8c8cde843fac371df7f1a915c0136c9c9b55992e8cdae"
    val profile=SourceProfile("zalopay-local-preview-11.14.0",PACKAGE,setOf(VERSION),setOf(SIGNER),
        setOf(30),setOf("Sony/SO-01M"),java.time.Instant.parse("2026-11-12T00:00:00Z").toEpochMilli(),
        NotificationParser { Parsed(null,"TEMPLATE_NOT_VERIFIED") })
    private val otp=Regex("(?iu)\\bOTP\\b|mã\\s+(?:xác\\s+thực|bảo\\s+mật|đăng\\s+nhập)|verification\\s+code|one[ .-]time[ .-]password|\\bpin\\b|mật\\s+khẩu|password")
    private val labels=linkedMapOf(
        "nhận tiền" to "INCOMING", "chuyển tiền" to "TRANSFER", "thanh toán" to "PAYMENT",
        "thành công" to "SUCCESS", "thất bại" to "FAILED", "đang xử lý" to "PENDING",
        "hoàn tiền" to "REFUND", "tiền vào" to "INCOMING", "tiền ra" to "OUTGOING",
        "VND" to "VND", "VNĐ" to "VND", "₫" to "VND", "đ" to "VND"
    )
    private val tokens=Regex(labels.keys.joinToString("|") { if(it.length>1) "(?<![\\p{L}])"+Regex.escape(it)+"(?![\\p{L}])" else "(?<![\\p{L}])"+Regex.escape(it)+"(?![\\p{L}])" }+"|[0-9]+(?:[.,][0-9]+)*",RegexOption.IGNORE_CASE)
    fun safe(fields:NotificationFields)=!fields.oversized() && listOfNotNull(fields.title,fields.text,fields.bigText,fields.subText).none {
        otp.containsMatchIn(java.text.Normalizer.normalize(it,java.text.Normalizer.Form.NFC).replace(Regex("[\\p{Z}\\s]+")," "))
    }
    // All output is fixed labels, never names, account/ref/amount/time/free text.
    fun shape(text:String?):String? {
        if(text.isNullOrBlank()) return null
        val output=mutableListOf<String>();var offset=0
        fun gap(end:Int) { if(text.substring(offset,end).any { it.isLetterOrDigit() }) output.add("[TEXT]") }
        for(match in tokens.findAll(text)) {
            gap(match.range.first)
            val label=labels.entries.firstOrNull { it.key.equals(match.value,true) }?.value ?: "NUMBER"
            output.add("[$label]");offset=match.range.last+1
            if(output.size>=64) { output.add("[TRUNCATED]");return output.joinToString(" ") }
        }
        gap(text.length)
        return output.joinToString(" ")
    }
}
