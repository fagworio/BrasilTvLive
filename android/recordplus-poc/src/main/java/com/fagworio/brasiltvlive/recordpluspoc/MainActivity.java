package com.fagworio.brasiltvlive.recordpluspoc;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.HttpAuthHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * RecordPlusSurface POC.
 *
 * This screen intentionally keeps authentication inside the native WebView
 * cookie store. It never reads, exports, or copies provider cookies/tokens.
 */
public final class MainActivity extends Activity {
    private static final String TAG = "RecordPlusSurface";
    private static final String RECORDPLUS_HOST = "www.recordplus.com";
    private static final String RECORDPLUS_LOGIN_URL =
            "https://www.recordplus.com/login?redirectTo=%2F";
    private static final String RECORDPLUS_MINAS_URL =
            "https://www.recordplus.com/player/channel/Y2hhbm5lbCNyNy5jb20jbWc";

    private FrameLayout root;
    private WebView webView;
    private TextView statusView;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        setContentView(root);

        buildSurface();
        configureWebView();
        webView.loadUrl(RECORDPLUS_LOGIN_URL);
    }

    private void buildSurface() {
        LinearLayout shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setBackgroundColor(Color.BLACK);

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.setPadding(dp(12), dp(8), dp(12), dp(4));
        toolbar.setBackgroundColor(Color.rgb(27, 27, 34));

        TextView title = new TextView(this);
        title.setText("RecordPlus Surface");
        title.setTextColor(Color.WHITE);
        title.setTextSize(16);
        title.setGravity(Gravity.CENTER_VERTICAL);
        toolbar.addView(title, new LinearLayout.LayoutParams(0, dp(48), 1));

        Button loginButton = actionButton("Login comum");
        loginButton.setOnClickListener(view -> loadRecordPlus(RECORDPLUS_LOGIN_URL));
        toolbar.addView(loginButton);

        Button minasButton = actionButton("Minas Gerais");
        minasButton.setOnClickListener(view -> loadRecordPlus(RECORDPLUS_MINAS_URL));
        toolbar.addView(minasButton);

        shell.addView(toolbar, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        statusView = new TextView(this);
        statusView.setText("Sessão: CookieManager nativo | Google: navegador externo se necessário");
        statusView.setTextColor(Color.rgb(185, 185, 194));
        statusView.setTextSize(12);
        statusView.setPadding(dp(12), dp(5), dp(12), dp(5));
        statusView.setBackgroundColor(Color.rgb(16, 16, 20));
        shell.addView(statusView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        webView = new WebView(this);
        shell.addView(webView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        root.addView(shell, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private Button actionButton(String label) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextColor(Color.WHITE);
        button.setTextSize(12);
        button.setAllCaps(false);
        button.setMinHeight(0);
        button.setMinimumHeight(0);
        button.setPadding(dp(8), 0, dp(8), 0);
        return button;
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new RecordPlusWebViewClient());
        webView.setWebChromeClient(new RecordPlusWebChromeClient());
        webView.setBackgroundColor(Color.BLACK);
    }

    private void loadRecordPlus(String url) {
        if (customView != null) {
            hideCustomView();
        }
        webView.setVisibility(View.VISIBLE);
        setStatus("Abrindo RecordPlus...");
        webView.loadUrl(url);
    }

    private boolean isRecordPlusUrl(Uri uri) {
        String host = uri.getHost();
        return host != null && (RECORDPLUS_HOST.equalsIgnoreCase(host)
                || host.endsWith(".recordplus.com"));
    }

    private boolean isGoogleAuthUrl(Uri uri) {
        String host = uri.getHost();
        return host != null && ("accounts.google.com".equalsIgnoreCase(host)
                || host.endsWith(".accounts.google.com"));
    }

    private void openGoogleInBrowser(Uri uri) {
        setStatus("Google OAuth requer navegador/Custom Tab; WebView não será forçada");
        Log.i(TAG, "GOOGLE_OAUTH_EXTERNAL_REQUIRED: " + uri.getHost());
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            startActivity(intent);
        } catch (ActivityNotFoundException exception) {
            setStatus("Nenhum navegador disponível para o login Google");
            Log.w(TAG, "No browser available for Google OAuth", exception);
        }
    }

    private void persistCookies() {
        // Flushes the native WebView cookie store. Cookie values never leave WebView.
        CookieManager.getInstance().flush();
    }

    private void setStatus(String message) {
        if (statusView != null) {
            statusView.setText(message);
        }
    }

    private void hideCustomView() {
        if (customView == null) {
            return;
        }
        root.removeView(customView);
        customView = null;
        webView.setVisibility(View.VISIBLE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_VISIBLE);
        if (customViewCallback != null) {
            customViewCallback.onCustomViewHidden();
            customViewCallback = null;
        }
        setStatus("Fullscreen encerrado");
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            int keyCode = event.getKeyCode();
            if (keyCode == KeyEvent.KEYCODE_CHANNEL_UP
                    || keyCode == KeyEvent.KEYCODE_CHANNEL_DOWN
                    || keyCode == KeyEvent.KEYCODE_MEDIA_NEXT
                    || keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS) {
                setStatus("CH+/CH- solicitado: saindo da RecordPlusSurface");
                persistCookies();
                setResult(RESULT_OK);
                finish();
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        if (customView != null) {
            hideCustomView();
        } else if (webView.canGoBack()) {
            webView.goBack();
        } else {
            persistCookies();
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        persistCookies();
        super.onPause();
    }

    @Override
    protected void onStop() {
        persistCookies();
        super.onStop();
    }

    @Override
    protected void onDestroy() {
        persistCookies();
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }

    private final class RecordPlusWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return routeUrl(request.getUrl());
        }

        @Override
        @SuppressWarnings("deprecation")
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return routeUrl(Uri.parse(url));
        }

        private boolean routeUrl(Uri uri) {
            if (isGoogleAuthUrl(uri)) {
                openGoogleInBrowser(uri);
                return true;
            }
            return !isRecordPlusUrl(uri);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            persistCookies();
            setStatus("RecordPlus carregado | sessão persistida no CookieManager");
            super.onPageFinished(view, url);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) {
                setStatus("Erro ao carregar RecordPlus: " + error.getDescription());
            }
            super.onReceivedError(view, request, error);
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request,
                                        android.webkit.WebResourceResponse errorResponse) {
            if (request.isForMainFrame()) {
                setStatus("RecordPlus respondeu HTTP " + errorResponse.getStatusCode());
            }
            super.onReceivedHttpError(view, request, errorResponse);
        }

        @Override
        public void onReceivedHttpAuthRequest(WebView view, HttpAuthHandler handler,
                                              String host, String realm) {
            setStatus("Autenticação HTTP não suportada nesta POC");
            handler.cancel();
        }
    }

    private final class RecordPlusWebChromeClient extends WebChromeClient {
        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            if (customView != null) {
                callback.onCustomViewHidden();
                return;
            }
            customView = view;
            customViewCallback = callback;
            webView.setVisibility(View.GONE);
            root.addView(customView, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
            setStatus("Fullscreen ativo");
        }

        @Override
        public void onHideCustomView() {
            hideCustomView();
        }
    }
}
