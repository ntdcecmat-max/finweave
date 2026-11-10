package test.finweave.prototype.collector

import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONObject
import org.junit.Assert.*
import org.junit.Test
import org.junit.Ignore
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class VaultInstrumentedTest {
    private val context get()=InstrumentationRegistry.getInstrumentation().targetContext
    @Test fun vcbIncomingAndOutgoingSanitizedTextCandidates() {
        val parser=VcbTextCandidate()
        for((sign,direction) in listOf("+" to "income","-" to "expense")) {
            val fields=NotificationFields("Synthetic candidate","Số dư TK VCB 9080701111 ${sign}321,654 VND lúc 03-02-2024 12:34:56. Số dư 2,468,135 VND. Ref SYNTHETIC_REF",null,null)
            val result=parser.parse(fields).evidence!!
            assertEquals(direction,result.direction);assertEquals("321654",result.amount)
            assertEquals("****1111",result.sourceAccountRef);assertEquals("incomplete",result.ruleStatus);assertNull(result.sourceOccurredAt)
        }
    }
    @Ignore("ZaloPay incoming Android notification sample and verified metadata are missing")
    @Test fun zalopayIncomingRequestedFixture() = Unit
    @Ignore("ZaloPay outgoing receipt is not a verified Android notification")
    @Test fun zalopayOutgoingRequestedFixture() = Unit
    @Test fun keystoreCiphertextSurvivesRoomReopenAndNeverCrossesVault() {
        val v=Vault(context);val id=Wire.id();val vault=Wire.id()
        val value=JSONObject().put("synthetic","SYNTHETIC_ONLY").put("amount","76543")
        val e=v.seal(vault,"outbox",id,value)
        v.dao.put(OutboxRow(id,vault,"pending",1,e.keyVersion,e.iv,e.cipher,Long.MAX_VALUE,e.cipher.size+12))
        assertFalse(String(e.cipher).contains("SYNTHETIC_ONLY"))
        assertEquals(Wire.canonical(value),Wire.canonical(v.open(vault,"outbox",id,e.keyVersion,e.iv,e.cipher)))
        v.db.close()
        val reopened=Vault(context);val row=reopened.dao.outbox_items(vault).single { it.id==id }
        assertEquals("76543",reopened.open(vault,"outbox",row.id,row.keyVersion,row.iv,row.cipher).getString("amount"))
        try { reopened.open(vault,"outbox","different",row.keyVersion,row.iv,row.cipher);fail("AAD mismatch must fail") } catch (_:javax.crypto.AEADBadTagException) {}
        val bad=row.cipher.clone();bad[0]=(bad[0].toInt() xor 1).toByte()
        try { reopened.open(vault,"outbox",row.id,row.keyVersion,row.iv,bad);fail("Bitflip must fail") } catch (_:javax.crypto.AEADBadTagException) {}
        val newKey=reopened.seal(vault,"outbox",Wire.id(),value);assertTrue(newKey.keyVersion>row.keyVersion)
        assertTrue(reopened.dao.outbox_items(Wire.id()).isEmpty());reopened.dao.deleteOutboxRow(id,vault);reopened.db.close()
    }
    @Test fun durableNonceReservationIsUniqueAcrossCrashAndTables() {
        val v=Vault(context);val owner=Wire.id()
        val first=v.seal(owner,"outbox",Wire.id(),JSONObject().put("fixture",true))
        val abandoned=v.seal(owner,"capture",Wire.id(),JSONObject().put("fixture",true))
        val third=v.seal(owner,"ack",Wire.id(),JSONObject().put("fixture",true))
        assertFalse(first.iv.contentEquals(abandoned.iv));assertFalse(abandoned.iv.contentEquals(third.iv))
        assertTrue(java.nio.ByteBuffer.wrap(third.iv,4,8).long>java.nio.ByteBuffer.wrap(first.iv,4,8).long)
        v.db.close()
    }
    @Test fun realSourcesStayUnregisteredAndNoPermissionIsAssumed() {
        assertTrue(SourceCatalog.liveProfiles.isEmpty())
        val runtime=CollectorRuntime.get(context)
        assertNull(runtime.session);assertFalse(runtime.statusV2().getString("readiness")=="ready")
    }
}
