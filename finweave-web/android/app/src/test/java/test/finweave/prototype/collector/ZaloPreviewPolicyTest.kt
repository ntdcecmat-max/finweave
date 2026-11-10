package test.finweave.prototype.collector

import org.junit.Assert.*
import org.junit.Test

class ZaloPreviewPolicyTest {
    private val identity=AppIdentity(ZaloPreviewPolicy.PACKAGE,ZaloPreviewPolicy.VERSION,setOf(ZaloPreviewPolicy.SIGNER),30,"Sony","SO-01M")
    @Test fun localIdentityCannotAdmitDifferentOrExpiredSources() {
        val p=ZaloPreviewPolicy.profile;val now=p.expiresAt-1
        assertTrue(p.accepts(identity,now))
        for(changed in listOf(identity.copy(packageName="com.zing.zalo"),identity.copy(version=identity.version+1),
            identity.copy(signers=emptySet()),identity.copy(signers=identity.signers+"extra"),
            identity.copy(signers=setOf("fake")),identity.copy(androidApi=31),identity.copy(model="other"),identity.copy(manufacturer="other")))
            assertFalse(p.accepts(changed,now))
        assertFalse(p.accepts(identity,p.expiresAt))
        assertTrue(SourceCatalog.liveProfiles.isEmpty())
        assertNull(p.parser.parse(NotificationFields(null,"Nhận tiền 123456 VND",null,null)).evidence)
    }
    @Test fun shapeOnlyContainsFixedLabelsAndNoFinancialOrPersonalValues() {
        val raw="Nguyễn Văn Test nhận tiền 1.234.567 VND từ TK 0123456789, Ref ABC123xyz thành công lúc 12:34"
        val shape=ZaloPreviewPolicy.shape(raw)!!
        assertTrue(shape.contains("[INCOMING]"));assertTrue(shape.contains("[SUCCESS]"));assertTrue(shape.contains("[VND]"))
        assertFalse(shape.contains("Nguyễn"));assertFalse(shape.contains("123"));assertFalse(shape.contains("ABC"));assertFalse(shape.contains("xyz"))
        assertTrue(Regex("^(?:\\[(?:TEXT|NUMBER|INCOMING|TRANSFER|PAYMENT|SUCCESS|FAILED|PENDING|REFUND|OUTGOING|VND|TRUNCATED)\\](?: |$))*$").matches(shape))
        assertEquals("[TEXT] [NUMBER] [TEXT]",ZaloPreviewPolicy.shape("prefix123suffix"))
        assertNull(ZaloPreviewPolicy.shape(null));assertNull(ZaloPreviewPolicy.shape("   "))
    }
    @Test fun authenticationContentIsRejectedInEveryField() {
        for(sensitive in listOf("OTP 123456","Mã xác thực 123456","Mã bảo mật", "Mã đăng nhập", "verification code", "one-time-password", "PIN 1234", "mật khẩu", "PASSWORD")) {
            assertFalse(ZaloPreviewPolicy.safe(NotificationFields(sensitive,"nhận tiền",null,null)))
            assertFalse(ZaloPreviewPolicy.safe(NotificationFields(null,sensitive,null,null)))
            assertFalse(ZaloPreviewPolicy.safe(NotificationFields(null,null,sensitive,null)))
            assertFalse(ZaloPreviewPolicy.safe(NotificationFields(null,null,null,sensitive)))
        }
        assertTrue(ZaloPreviewPolicy.safe(NotificationFields("ZaloPay","Thanh toán thành công 123 VND",null,null)))
        assertFalse(ZaloPreviewPolicy.safe(NotificationFields(null,"đ".repeat(9000),null,null)))
    }
    @Test fun outputAndUtf8InputAreBounded() {
        val shape=ZaloPreviewPolicy.shape("name 123 ".repeat(1000))!!
        assertTrue(shape.endsWith("[TRUNCATED]"));assertTrue(shape.split(" ").size<=66)
        assertTrue(shape.length<1200)
        assertEquals("[PAYMENT] [FAILED]",ZaloPreviewPolicy.shape("thanh toán thất bại"))
        assertEquals("[TRANSFER] [PENDING] [REFUND]",ZaloPreviewPolicy.shape("chuyển tiền đang xử lý hoàn tiền"))
    }
}
