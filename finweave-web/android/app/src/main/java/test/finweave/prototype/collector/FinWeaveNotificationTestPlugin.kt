package test.finweave.prototype.collector

import android.Manifest
import android.os.Build
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.getcapacitor.*
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import org.json.JSONObject

@CapacitorPlugin(name="FinWeaveNotificationTest",permissions=[Permission(alias="post",strings=[Manifest.permission.POST_NOTIFICATIONS])])
class FinWeaveNotificationTestPlugin:Plugin() {
    private fun trusted(call:PluginCall):Boolean {
        val uri=bridge.webView.url?.let { android.net.Uri.parse(it) }
        if(uri?.scheme=="https" && uri.host=="localhost" && uri.port==-1) return true
        call.reject("NATIVE_UNAVAILABLE","NATIVE_UNAVAILABLE");return false
    }
    private fun run(call:PluginCall,keys:Set<String> = emptySet(),work:()->JSONObject) {
        activity.runOnUiThread {
            if(!trusted(call)) return@runOnUiThread
            try {
                Wire.exactKeys(call.data,keys)
                call.resolve(JSObject.fromJSONObject(work()))
            } catch(e:Exception) {
                val code=e.message?.takeIf { it.startsWith("TEST_") || it=="INVALID_TEST_CASE" } ?: "TEST_FAILED"
                call.reject(code,code)
            }
        }
    }
    @PluginMethod fun getStatus(call:PluginCall)=run(call) { NotificationProbe.status(context) }
    @PluginMethod fun openTestNotificationSettings(call:PluginCall)=run(call) {
        NotificationProbe.ensureChannel(context)
        val intent=if(Build.VERSION.SDK_INT>=26) Intent(Settings.ACTION_CHANNEL_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE,context.packageName).putExtra(Settings.EXTRA_CHANNEL_ID,NotificationTestSession.CHANNEL)
            else Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+context.packageName))
        activity.startActivity(intent);NotificationProbe.status(context)
    }
    @PluginMethod fun openZaloNotificationSettings(call:PluginCall)=run(call) {
        require(AppVerifier.inspect(context,ZaloPreviewPolicy.PACKAGE)?.let { ZaloPreviewPolicy.profile.accepts(it,System.currentTimeMillis()) }==true) { "TEST_SOURCE_IDENTITY_CHANGED" }
        val intent=if(Build.VERSION.SDK_INT>=26) Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,ZaloPreviewPolicy.PACKAGE)
            else Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,Uri.parse("package:"+ZaloPreviewPolicy.PACKAGE))
        activity.startActivity(intent);ZaloPreview.status(context)
    }
    @PluginMethod fun getZaloPreviewStatus(call:PluginCall)=run(call) { ZaloPreview.status(context) }
    @PluginMethod fun startZaloPreview(call:PluginCall)=run(call,setOf("acknowledge","analyzeTransactions")) { ZaloPreview.start(context,call.getBoolean("acknowledge")==true,call.getBoolean("analyzeTransactions")==true);ZaloPreview.status(context) }
    @PluginMethod fun testZaloParser(call:PluginCall)=run(call,setOf("fixture")) { ZaloCandidatePreview.analyze(ZaloCandidatePreview.fixture(call.getString("fixture") ?: "")) }
    @PluginMethod fun stopZaloPreview(call:PluginCall)=run(call) { ZaloPreview.stop();ZaloPreview.status(context) }
    @PluginMethod fun start(call:PluginCall)=run(call) { NotificationProbe.start(context);NotificationProbe.status(context) }
    @PluginMethod fun stop(call:PluginCall)=run(call) { NotificationProbe.stop(context);NotificationProbe.status(context) }
    @PluginMethod fun post(call:PluginCall)=run(call,setOf("fixture")) { JSONObject().put("id",NotificationProbe.post(context,call.getString("fixture") ?: "")) }
    @PluginMethod fun requestPostPermission(call:PluginCall) {
        activity.runOnUiThread {
            if(!trusted(call)) return@runOnUiThread
            try { Wire.exactKeys(call.data,emptySet()) } catch(_:Exception) { call.reject("TEST_FAILED");return@runOnUiThread }
            if(Build.VERSION.SDK_INT>=33 && getPermissionState("post")!=PermissionState.GRANTED)
                requestPermissionForAlias("post",call,"postPermissionResult")
            else postPermissionResult(call)
        }
    }
    @PermissionCallback private fun postPermissionResult(call:PluginCall) {
        if(trusted(call)) call.resolve(JSObject.fromJSONObject(NotificationProbe.status(context)))
    }
}
