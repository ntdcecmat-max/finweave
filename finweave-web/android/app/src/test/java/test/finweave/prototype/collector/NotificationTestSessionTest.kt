package test.finweave.prototype.collector

import org.junit.Assert.*
import org.junit.Test

class NotificationTestSessionTest {
    private val own="test.finweave.prototype"
    private fun fields(p:NotificationTestSession.Pending)=NotificationFields(p.fixture.title,p.fixture.text,p.fixture.text,null)
    @Test fun requiresStartAndExactOwnPackageChannelNonceAndContent() {
        val s=NotificationTestSession(own)
        assertThrows(IllegalArgumentException::class.java) { s.prepare("income",1,"nonce",0) }
        s.start(10);val p=s.prepare("income",1,"nonce",11)
        assertFalse(s.receive("bank.other",NotificationTestSession.CHANNEL,p.tag,1,fields(p),12))
        assertFalse(s.receive(own,"other",p.tag,1,fields(p),12))
        assertFalse(s.receive(own,NotificationTestSession.CHANNEL,"forged",1,fields(p),12))
        assertFalse(s.receive(own,NotificationTestSession.CHANNEL,p.tag,1,NotificationFields(p.fixture.title,"arbitrary",null,null),12))
        assertEquals(0,s.snapshot(12).size)
        assertTrue(s.receive(own,NotificationTestSession.CHANNEL,p.tag,1,fields(p),13))
        assertEquals("321654",s.snapshot(13).single().amount)
        assertEquals("income",s.snapshot(13).single().direction)
        assertFalse(s.receive(own,NotificationTestSession.CHANNEL,p.tag,1,fields(p),14))
    }
    @Test fun outgoingParsesAndOtpIsDiscardedWithoutFinancialEvidence() {
        val s=NotificationTestSession(own);s.start(1)
        for((i,name) in listOf("expense","otp").withIndex()) {
            val p=s.prepare(name,i,"nonce-$i",2)
            assertTrue(s.receive(own,NotificationTestSession.CHANNEL,p.tag,i,fields(p),3))
        }
        assertEquals("87543",s.snapshot(4)[0].amount);assertEquals("expense",s.snapshot(4)[0].direction)
        assertEquals("OTP_DISCARDED",s.snapshot(4)[1].outcome);assertNull(s.snapshot(4)[1].amount)
        assertNull(s.snapshot(4)[1].direction)
    }
    @Test fun expiresAndStopClearsEvidenceAndPending() {
        val s=NotificationTestSession(own);s.start(1);val p=s.prepare("income",1,"n",2)
        assertFalse(s.receive(own,NotificationTestSession.CHANNEL,p.tag,1,fields(p),900001))
        assertEquals(0,s.pendingCount(900001));assertTrue(s.snapshot(900001).isEmpty())
        s.start(900002);val q=s.prepare("income",2,"n2",900003)
        assertTrue(s.receive(own,NotificationTestSession.CHANNEL,q.tag,2,fields(q),900004));s.stop()
        assertFalse(s.active(900005));assertTrue(s.snapshot(900005).isEmpty())
    }
    @Test fun queueBoundAndUnknownFixturesFailClosed() {
        val s=NotificationTestSession(own);s.start(1)
        assertThrows(IllegalStateException::class.java) { s.prepare("bank-input",1,"n",2) }
        repeat(16) { s.prepare("income",it,"n$it",2) }
        assertThrows(IllegalArgumentException::class.java) { s.prepare("income",17,"n17",2) }
        assertEquals(16,s.pendingCount(3))
    }
}
