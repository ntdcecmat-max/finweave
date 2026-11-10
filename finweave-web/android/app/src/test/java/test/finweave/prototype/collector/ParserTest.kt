package test.finweave.prototype.collector

import org.junit.Assert.*
import org.junit.Test

class ParserTest {
    private val parser=VcbTextCandidate()
    // Entirely fabricated values; no image, private name/account/ref/balance copied.
    private fun text(sign:String="+",amount:String="321,654",date:String="03-02-2024 12:34:56") =
        "Số dư TK VCB 9080701111 $sign$amount VND lúc $date. Số dư 2,468,135 VND. Ref SYNTHETIC_REF.CT tu DEMO PERSON toi DEMO SHOP"
    private fun parse(t:String)=parser.parse(NotificationFields("Synthetic candidate",t,null,null))
    @Test fun vcbIncomingCandidate() {
        val result=parse(text()).evidence!!
        assertEquals("321654",result.amount);assertEquals("income",result.direction)
        assertEquals("****1111",result.sourceAccountRef)
        assertNull(result.transactionRef);assertNull(result.sourceOccurredAt)
        assertEquals("incomplete",result.ruleStatus)
    }
    @Test fun vcbOutgoingCandidate() {
        val result=parse(text("-", "87,543")).evidence!!
        assertEquals("87543",result.amount);assertEquals("expense",result.direction)
        assertEquals("****1111",result.sourceAccountRef);assertEquals("incomplete",result.ruleStatus)
    }
    @Test fun walletIncomingHasNoNotificationSample() {
        assertTrue(SourceCatalog.liveProfiles.none { it.id.contains("zalo",ignoreCase=true) })
        assertNull(parse("ZaloPay logo").evidence)
    }
    @Test fun walletOutgoingReceiptIsNotNotificationGrammar() {
        assertNull(parse("Chi tiết giao dịch Chuyển tiền -99.000đ Thành công").evidence)
    }
    @Test fun malformedOrAmbiguousAmountsAreRejected() {
        listOf("32,16,54","1.234","0","-42","123 VND +456","١٢٣","9999999999999999999")
            .forEach { assertNull(parse(text(amount=it)).evidence) }
    }
    @Test fun missingDirectionBalanceOnlyAndUnknownMessageAreRejected() {
        listOf(text(sign=""),"Số dư TK VCB 9080701111 Số dư 2,468,135 VND.", "Ưu đãi 500,000 VND", "")
            .forEach { assertNull(parse(it).evidence) }
    }
    @Test fun invalidCalendarDatesAreRejected() {
        listOf("31-02-2024 12:34:56","03-02-2024 25:00:00","03-13-2024 12:00:00")
            .forEach { assertNull(parse(text(date=it)).evidence) }
    }
    @Test fun otpInEveryFieldIsDiscardedBeforeParsing() {
        for(field in 0..3) {
            val f=arrayOf<String?>("Demo",text(),text(),"Demo");f[field]="OTP 654321"
            assertEquals("OTP_DISCARDED",parser.parse(NotificationFields(f[0],f[1],f[2],f[3])).reason)
        }
    }
    @Test fun expandedTextAndConflictingFields() {
        assertNotNull(parser.parse(NotificationFields(null,text().take(30),text(),null)).evidence)
        assertNull(parser.parse(NotificationFields(null,text(),text("-"),null)).evidence)
    }
    @Test fun noExtraAmountFeeOrSecondTransactionIsGuessed() {
        assertNull(parse(text()+" phí 1,000 VND").evidence)
        assertNull(parse(text()+" "+text("-")).evidence)
        assertEquals("321654",parse(text()).evidence!!.amount) // balance/account/ref are never the amount
    }
    @Test fun oversizedUnicodeDoesNotBecomeValidTruncatedInput() {
        assertEquals("OVERSIZE",parse("é".repeat(9000)).reason)
    }
    private fun profile()=SourceProfile("candidate","synthetic.test",setOf(7),setOf("a".repeat(64)),setOf(36),setOf("Demo/Model"),1000,parser)
    @Test fun exactPackageSignerVersionDeviceAndExpiryGate() {
        val p=profile();val a=AppIdentity("synthetic.test",7,setOf("a".repeat(64)),36,"Demo","Model")
        assertTrue(p.accepts(a,999));assertFalse(p.accepts(a,1000))
        assertFalse(p.accepts(a.copy(packageName="forged"),999))
        assertFalse(p.accepts(a.copy(version=8),999))
        assertFalse(p.accepts(a.copy(signers=setOf("b".repeat(64))),999))
        assertFalse(p.accepts(a.copy(signers=setOf("a".repeat(64),"b".repeat(64))),999))
        assertFalse(p.accepts(a.copy(model="Other"),999));assertFalse(p.accepts(a.copy(androidApi=35),999))
        assertTrue(SourceCatalog.liveProfiles.isEmpty())
    }
    @Test fun bindingRequiresExplicitChoiceAndVersionedExactProfile() {
        val p=profile()
        val a=Binding("a",3,"account_a",p.packageName,p.id,true,"****1111")
        val b=a.copy(id="b",accountId="account_b")
        assertNull(BindingResolver.resolve(emptyList(),p,"****1111",setOf("a")))
        assertNull(BindingResolver.resolve(listOf(a,b),p,"****1111",setOf("a","b")))
        assertEquals(a,BindingResolver.resolve(listOf(a,b),p,"****1111",setOf("a")))
        assertNull(BindingResolver.resolve(listOf(a,b),p,"****2222",setOf("a")))
        assertNull(BindingResolver.resolve(listOf(a.copy(enabled=false)),p,null,setOf("a")))
        assertNull(BindingResolver.resolve(listOf(a.copy(parserProfileId="old")),p,null,setOf("a")))
    }
}
