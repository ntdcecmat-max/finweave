package test.finweave.prototype;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import test.finweave.prototype.collector.FinWeaveCollectorPlugin;
import test.finweave.prototype.collector.FinWeaveNotificationTestPlugin;

public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle state) {
        registerPlugin(FinWeaveCollectorPlugin.class);
        registerPlugin(test.finweave.prototype.collector.FinWeaveOwnerPlugin.class);
        registerPlugin(FinWeaveNotificationTestPlugin.class);
        super.onCreate(state);
        if (BuildConfig.DEBUG) android.webkit.WebView.setWebContentsDebuggingEnabled(true);
        getBridge().getWebView().getSettings().setAllowFileAccess(false);
        getBridge().getWebView().getSettings().setAllowContentAccess(false);
    }
}
