package test.finweave.prototype.collector
import org.junit.Test
import org.junit.Assert.*
import org.json.JSONObject
import java.io.File
class ApiSchemaTest {
 private val schema=ApiSchema(JSONObject(File("src/main/assets/api005.json").readText()).getJSONObject("contract"))
 @Test fun strictFinancialInput(){val account=JSONObject("""{"name":"cash","kind":"cash","opening":{"value":"9007199254740993","currency":"VND"},"openingDate":"2026-10-12"}""");schema.check("createAccountInput",account);account.getJSONObject("opening").put("value",9007199254740993L);assertThrows(IllegalArgumentException::class.java){schema.check("createAccountInput",account)}}
 @Test fun unknownFieldsDenied(){val input=JSONObject().put("email","native@owner.test").put("password","Integration password 2026!").put("installationPublicKey",JSONObject.NULL).put("role","owner");assertThrows(IllegalArgumentException::class.java){schema.check("signInInput",input)}}
 @Test fun nullAndTimePreserved(){val session=JSONObject("""{"sessionId":"s","subjectId":"o","deviceId":null,"workspaceIds":[],"role":"owner","expiresAt":"2026-10-12T00:00:00Z","synthetic":true}""");schema.check("getSessionOutput",session);assertTrue(session.isNull("deviceId"));session.put("expiresAt","2026-02-30T00:00:00Z");assertThrows(IllegalArgumentException::class.java){schema.check("getSessionOutput",session)}}
 @Test fun countersFailRatherThanClamp(){val s=schema.contract.getJSONObject("components").getJSONObject("schemas").getJSONObject("getAgentRunOutput").getJSONObject("properties").getJSONObject("toolCalls");val name="BE19Counter";schema.contract.getJSONObject("components").getJSONObject("schemas").put(name,s);schema.check(name,8);assertThrows(IllegalArgumentException::class.java){schema.check(name,9)}}
 @Test fun shortDerIntegersAreLeftPadded(){val result=NativeProof.derToRaw(byteArrayOf(0x30,6,2,1,1,2,1,2));assertEquals(64,result.size);assertEquals(1,result[31].toInt());assertEquals(2,result[63].toInt())}
}
