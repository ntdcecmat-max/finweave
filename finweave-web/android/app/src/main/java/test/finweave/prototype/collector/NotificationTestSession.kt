package test.finweave.prototype.collector

// Explicit local diagnostics only. No source profile, enrollment or upload authority.
// Only exact, built-in synthetic fixtures from our own Android package are admitted.
class NotificationTestSession(private val ownPackage:String) {
    data class Fixture(val name:String,val title:String,val text:String)
    data class Pending(val id:Int,val tag:String,val fixture:Fixture)
    data class Result(val id:Int,val fixture:String,val amount:String?,val direction:String?,val outcome:String)
    private var until=0L
    private val pending=linkedMapOf<Int,Pending>()
    private val results=mutableListOf<Result>()
    @Synchronized fun start(now:Long) { stop();until=now+15*60*1000 }
    @Synchronized fun active(now:Long):Boolean { if(now>=until) stop();return until>now }
    @Synchronized fun stop() { until=0;pending.clear();results.clear() }
    @Synchronized fun prepare(name:String,id:Int,nonce:String,now:Long):Pending {
        require(active(now)) { "TEST_SESSION_REQUIRED" }
        require(pending.size<16) { "TEST_QUEUE_FULL" }
        val fixture=fixtures.singleOrNull { it.name==name } ?: error("INVALID_TEST_CASE")
        return Pending(id,"finweave-local-test-"+nonce,fixture).also { pending[id]=it }
    }
    @Synchronized fun discard(id:Int) { pending.remove(id) }
    @Synchronized fun expects(pkg:String,channel:String?,tag:String?,id:Int,now:Long):Boolean =
        active(now) && pkg==ownPackage && channel==CHANNEL && pending[id]?.tag==tag
    @Synchronized fun receive(pkg:String,channel:String?,tag:String?,id:Int,fields:NotificationFields,now:Long):Boolean {
        if(!expects(pkg,channel,tag,id,now)) return false
        val expected=pending[id] ?: return false
        if(fields.oversized() || fields.title!=expected.fixture.title || fields.text!=expected.fixture.text ||
            fields.bigText!=null && fields.bigText!=expected.fixture.text || fields.subText!=null) return false
        val parsed=VcbTextCandidate().parse(fields)
        pending.remove(id)
        results.add(Result(id,expected.fixture.name,parsed.evidence?.amount,parsed.evidence?.direction,
            if(parsed.evidence!=null) "PARSED_SYNTHETIC" else parsed.reason))
        while(results.size>20) results.removeAt(0)
        return true
    }
    @Synchronized fun snapshot(now:Long):List<Result> { active(now);return results.toList() }
    @Synchronized fun pendingCount(now:Long):Int { active(now);return pending.size }
    companion object {
        const val CHANNEL="finweave_local_notification_test"
        private const val incoming="Số dư TK VCB 9080701111 +321,654 VND lúc 03-02-2024 12:34:56. Số dư 2,468,135 VND. Ref SYNTHETIC_TEST"
        private const val outgoing="Số dư TK VCB 9080701111 -87,543 VND lúc 03-02-2024 12:34:56. Số dư 2,468,135 VND. Ref SYNTHETIC_TEST"
        val fixtures=listOf(Fixture("income","FinWeave · TIỀN VÀO GIẢ LẬP",incoming),
            Fixture("expense","FinWeave · TIỀN RA GIẢ LẬP",outgoing),
            Fixture("otp","FinWeave · OTP GIẢ LẬP","OTP 654321 — dữ liệu giả; không phải giao dịch"))
    }
}
