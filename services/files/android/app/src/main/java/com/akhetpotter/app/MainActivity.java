package com.akhetpotter.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onDestroy() {
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().destroy();
        }
        super.onDestroy();
    }
}
