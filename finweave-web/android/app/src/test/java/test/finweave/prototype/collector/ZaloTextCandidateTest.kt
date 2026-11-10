package test.finweave.prototype.collector

import org.junit.Assert.*
import org.junit.Test

class ZaloTextCandidateTest {
    private val parser = ZaloTextCandidate()
    private fun parse(body: String, title: String? = "ZaloPay", big: String? = null, sub: String? = null) =
        parser.parse(NotificationFields(title, body, big, sub))
    @Test fun incomingNormalizesVndGroupingWithoutFloatingPoint() {
        for (money in listOf("130.000đ", "130,000 VND", "130000 VNĐ", "+130.000 ₫")) {
            val p = parse("Bạn đã nhận được $money từ NGƯỜI A.")
            assertEquals("130000", p.evidence?.amount); assertEquals("income", p.evidence?.direction)
            assertEquals("incomplete", p.evidence?.ruleStatus)
            assertNull(p.evidence?.transactionRef); assertNull(p.evidence?.sourceAccountRef); assertNull(p.evidence?.sourceOccurredAt)
        }
        assertEquals("999999999999999999", parse("Bạn đã nhận 999999999999999999 VND.").evidence?.amount)
        assertNull(parse("Bạn đã nhận 1.000.000.000.000.000.000 VND.").evidence)
    }
    @Test fun outgoingRequiresOwnPerspectiveAndNotTheWordTransferAlone() {
        assertEquals("expense", parse("Bạn đã chuyển 45.000đ cho NGƯỜI B.").evidence?.direction)
        assertEquals("expense", parse("Bạn đã gửi thành công -45,000 VND tới NGƯỜI B.").evidence?.direction)
        assertEquals("expense", parse("Thanh toán thành công 45.000đ tại CỬA HÀNG A.").evidence?.direction)
        for (body in listOf("Chuyển tiền 45.000đ", "NGƯỜI A đã chuyển 45.000đ cho bạn.", "Bạn có thông báo mới.", "Số dư +45.000đ"))
            assertNull(body, parse(body).evidence)
    }
    @Test fun cannotGuessFromSignsConflictingTitleOrDifferentFields() {
        assertEquals("CONFLICTING_DIRECTION", parse("Bạn đã nhận -10.000đ.").reason)
        assertEquals("CONFLICTING_DIRECTION", parse("Bạn đã chuyển +10.000đ.").reason)
        assertEquals("CONFLICTING_DIRECTION", parse("Bạn đã nhận 10.000đ.", "Thanh toán thành công").reason)
        assertEquals("CONFLICTING_DIRECTION", parse("Bạn đã chuyển 10.000đ.", "Nhận tiền thành công").reason)
        assertEquals("CONFLICTING_FIELDS", parse("Bạn đã nhận 10.000đ.", big="Bạn đã chuyển 10.000đ.").reason)
        assertEquals("CONFLICTING_FIELDS", parse("Bạn đã nhận 10.000đ.", big="Bạn đã nhận 20.000đ.").reason)
    }
    @Test fun exactExpandedTextCanRefineCollapsedBody() {
        val p = parse("Bạn đã nhận 10.000đ", big="Bạn đã nhận 10.000đ từ NGƯỜI A.")
        assertEquals("10000", p.evidence?.amount)
        assertEquals("income", parse("BẠN ĐÃ NHẬN\n10.000Đ.").evidence?.direction)
    }
    @Test fun promotionalConditionalPendingAndFailedNotificationsNeverBecomeMoney() {
        for (phrase in listOf("thất bại", "đang xử lý", "đang chờ", "chờ xác nhận", "chưa", "không", "đã hủy"))
            assertEquals("NON_FINAL", parse("Bạn đã nhận 10.000đ.", sub=phrase).reason)
        for (phrase in listOf("ưu đãi", "khuyến mãi", "nhận ngay", "hoàn đến", "tặng", "hãy", "vui lòng", "sẽ", "có thể", "yêu cầu"))
            assertEquals("PROMOTIONAL", parse("Bạn đã nhận 10.000đ.", sub=phrase).reason)
    }
    @Test fun internalSavingsAndRefundsAreNotOrdinaryIncomeOrExpense() {
        assertEquals("INTERNAL_TRANSFER", parse("Bạn đã nhận 10.000đ.", "Nạp tiền Số dư sinh lời").reason)
        assertEquals("INTERNAL_TRANSFER", parse("Bạn đã chuyển 10.000đ.", sub="chuyển nội bộ").reason)
        assertEquals("REFUND_UNVERIFIED", parse("Bạn đã nhận 10.000đ.", "Hoàn tiền thành công").reason)
    }
    @Test fun zeroMalformedAmountsOtherCurrenciesFeesAndBalancesAreRejected() {
        for (money in listOf("0đ", "01đ", "10.00đ", "1,000.00đ", "100 USD", "1234567890123456789đ"))
            assertNull(money, parse("Bạn đã nhận $money.").evidence)
        assertEquals("AMBIGUOUS_AMOUNT", parse("Bạn đã nhận 10.000đ từ A. Số dư 50.000đ.").reason)
        assertEquals("AMBIGUOUS_AMOUNT", parse("Bạn đã chuyển 10.000đ cho A.", sub="Phí 1.000đ").reason)
        assertEquals("AMBIGUOUS_AMOUNT", parse("Bạn đã nhận 10.000đ.", "Nhận 20.000đ").reason)
    }
    @Test fun authenticationAndOversizeInAnyFieldAreDiscarded() {
        val body = "Bạn đã nhận 10.000đ."
        for (fields in listOf(NotificationFields("OTP 123456", body, null, null), NotificationFields(null, body, "Mã xác thực 123456", null),
            NotificationFields(null, body, null, "PIN 1234"), NotificationFields(null, "mật khẩu", null, null),
            NotificationFields(java.text.Normalizer.normalize("Mã xác thực", java.text.Normalizer.Form.NFD), body, null, null),
            NotificationFields(null, body, null, "Mã\u00a0xác\u00a0thực")))
            assertEquals("OTP_DISCARDED", parser.parse(fields).reason)
        assertEquals("OVERSIZE", parse(body, sub="đ".repeat(9000)).reason)
    }
    @Test fun bridgeReturnsOnlyTypedCandidateOrUnknownAndNeverIdentities() {
        val value = ZaloCandidatePreview.analyze(NotificationFields("ZaloPay", "Bạn đã nhận 10.000đ từ TÊN RIÊNG 123456789.", null, null))
        assertEquals(setOf("status", "amount", "direction", "reason"), value.keys().asSequence().toSet())
        assertEquals("10000", value.getString("amount")); assertEquals("income", value.getString("direction"))
        assertFalse(value.toString().contains("RIÊNG")); assertFalse(value.toString().contains("123456789"))
        val unknown = ZaloCandidatePreview.analyze(ZaloCandidatePreview.fixture("unknown"))
        assertTrue(unknown.isNull("amount")); assertTrue(unknown.isNull("direction"))
        assertEquals("UNKNOWN", unknown.getString("status")); assertTrue(SourceCatalog.liveProfiles.isEmpty())
    }
}
