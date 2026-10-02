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
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.HttpAuthHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;

/**
 * Native RecordPlus surface shared by Android and Android TV.
 *
 * Authentication and playback stay inside the provider WebView partition.
 * The BrasilTvLive shell only supplies the selected channel and receives the
 * Back/CH result; it never reads or copies provider credentials or cookies.
 */
public final class MainActivity extends Activity {
    public static final String EXTRA_CHANNEL_URL =
            "com.fagworio.brasiltvlive.recordpluspoc.CHANNEL_URL";
    public static final String EXTRA_CHANNEL_NAME =
            "com.fagworio.brasiltvlive.recordpluspoc.CHANNEL_NAME";
    public static final String EXTRA_CHANNEL_DIRECTION =
            "com.fagworio.brasiltvlive.recordpluspoc.CHANNEL_DIRECTION";

    private static final String TAG = "RecordPlusSurface";
    private static final String RECORDPLUS_HOST = "www.recordplus.com";
    private static final String RECORDPLUS_LOGIN_URL =
            "https://www.recordplus.com/login?redirectTo=%2F";
    private static final String RECORDPLUS_MINAS_URL =
            "https://www.recordplus.com/player/channel/Y2hhbm5lbCNyNy5jb20jbWc";
    private static final String DEFAULT_CHANNEL_NAME = "RECORD Minas";

    private FrameLayout root;
    private WebView webView;
    private TextView statusView;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private String selectedChannelUrl;
    private String selectedChannelName;
    private boolean playerOpened;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        enterImmersiveMode();

        readChannelIntent(getIntent());
        buildSurface();
        configureWebView();
        loadSelectedChannel();
    }

    private void readChannelIntent(Intent intent) {
        selectedChannelUrl = intent.getStringExtra(EXTRA_CHANNEL_URL);
        selectedChannelName = intent.getStringExtra(EXTRA_CHANNEL_NAME);

        if (!isRecordPlusPlayerUrl(selectedChannelUrl)) {
            selectedChannelUrl = RECORDPLUS_MINAS_URL;
        }
        if (selectedChannelName == null || selectedChannelName.trim().isEmpty()) {
            selectedChannelName = DEFAULT_CHANNEL_NAME;
        }
    }

    private void buildSurface() {
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        setContentView(root);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.BLACK);
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        statusView = new TextView(this);
        statusView.setTextColor(Color.WHITE);
        statusView.setTextSize(13);
        statusView.setGravity(Gravity.CENTER);
        statusView.setPadding(dp(18), dp(10), dp(18), dp(10));
        statusView.setBackgroundColor(Color.argb(205, 8, 12, 18));
        statusView.setVisibility(View.GONE);
        FrameLayout.LayoutParams statusParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL);
        statusParams.bottomMargin = dp(28);
        root.addView(statusView, statusParams);
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
        settings.setSupportZoom(false);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.setWebViewClient(new RecordPlusWebViewClient());
        webView.setWebChromeClient(new RecordPlusWebChromeClient());
    }

    private void loadSelectedChannel() {
        playerOpened = false;
        setStatus("Abrindo " + selectedChannelName + "…");
        webView.requestFocus(View.FOCUS_FORWARD);
        webView.loadUrl(getLoginUrlForChannel(selectedChannelUrl));
    }

    private String getLoginUrlForChannel(String channelUrl) {
        try {
            Uri channelUri = Uri.parse(channelUrl);
            String redirectPath = channelUri.getPath();
            if (channelUri.getQuery() != null && !channelUri.getQuery().isEmpty()) {
                redirectPath += "?" + channelUri.getQuery();
            }
            return Uri.parse(RECORDPLUS_LOGIN_URL).buildUpon()
                    .clearQuery()
                    .appendQueryParameter("redirectTo", redirectPath)
                    .build()
                    .toString();
        } catch (RuntimeException exception) {
            Log.w(TAG, "Could not create channel-specific login redirect", exception);
            return RECORDPLUS_LOGIN_URL;
        }
    }

    private boolean isRecordPlusUrl(Uri uri) {
        String host = uri == null ? null : uri.getHost();
        return host != null && (RECORDPLUS_HOST.equalsIgnoreCase(host)
                || host.endsWith(".recordplus.com"));
    }

    private boolean isRecordPlusPlayerUrl(String url) {
        if (url == null) {
            return false;
        }
        try {
            Uri uri = Uri.parse(url);
            return isRecordPlusUrl(uri)
                    && uri.getPath() != null
                    && uri.getPath().startsWith("/player/");
        } catch (RuntimeException exception) {
            return false;
        }
    }

    private boolean isGoogleAuthUrl(Uri uri) {
        String host = uri == null ? null : uri.getHost();
        return host != null && ("accounts.google.com".equalsIgnoreCase(host)
                || host.endsWith(".accounts.google.com"));
    }

    private void openGoogleInBrowser(Uri uri) {
        setStatus("Login Google será concluído no navegador oficial");
        Log.i(TAG, "GOOGLE_OAUTH_EXTERNAL_REQUIRED: " + uri.getHost());
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException exception) {
            setStatus("Nenhum navegador disponível para o login Google");
            Log.w(TAG, "No browser available for Google OAuth", exception);
        }
    }

    private void injectProviderPresentation(WebView view) {
        String script = "(function(){"
                + "var id='brasiltvlive-recordplus-presentation';"
                + "var style=document.getElementById(id);"
                + "if(!style){style=document.createElement('style');style.id=id;document.head.appendChild(style);}"
                + "style.textContent='video{object-fit:cover!important;}';"
                + "document.querySelectorAll('video').forEach(function(video){"
                + "video.setAttribute('playsinline','true');video.style.objectFit='cover';"
                + "});"
                + "})();";
        view.evaluateJavascript(script, null);
    }

    private void persistCookies() {
        // Cookie values never leave the native provider WebView.
        CookieManager.getInstance().flush();
    }

    private void setStatus(String message) {
        if (statusView == null) {
            return;
        }
        statusView.setText(message);
        statusView.setVisibility(message == null || message.isEmpty() ? View.GONE : View.VISIBLE);
    }

    private void hideStatus() {
        if (statusView != null) {
            statusView.setVisibility(View.GONE);
        }
    }

    private void enterImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                        | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    private void hideCustomView() {
        if (customView == null) {
            return;
        }
        root.removeView(customView);
        customView = null;
        webView.setVisibility(View.VISIBLE);
        enterImmersiveMode();
        if (customViewCallback != null) {
            customViewCallback.onCustomViewHidden();
            customViewCallback = null;
        }
    }

    private void finishToShell(String direction) {
        persistCookies();
        Intent result = new Intent();
        result.putExtra(EXTRA_CHANNEL_NAME, selectedChannelName);
        if (direction != null && !direction.isEmpty()) {
            result.putExtra(EXTRA_CHANNEL_DIRECTION, direction);
        }
        setResult(RESULT_OK, result);
        finish();
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            int keyCode = event.getKeyCode();
            if (keyCode == KeyEvent.KEYCODE_CHANNEL_UP
                    || keyCode == KeyEvent.KEYCODE_MEDIA_NEXT) {
                finishToShell("next");
                return true;
            }
            if (keyCode == KeyEvent.KEYCODE_CHANNEL_DOWN
                    || keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS) {
                finishToShell("previous");
                return true;
            }
            if (keyCode == KeyEvent.KEYCODE_ESCAPE) {
                onBackPressed();
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        if (customView != null) {
            hideCustomView();
        } else if (playerOpened || isRecordPlusPlayerUrl(webView.getUrl())) {
            finishToShell("");
        } else if (webView.canGoBack()) {
            webView.goBack();
        } else {
            finishToShell("");
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && customView == null) {
            enterImmersiveMode();
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
        public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            if (isRecordPlusPlayerUrl(url)) {
                playerOpened = true;
            }
            super.onPageStarted(view, url, favicon);
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            persistCookies();
            if (isRecordPlusPlayerUrl(url)) {
                playerOpened = true;
                hideStatus();
                injectProviderPresentation(view);
            } else if (url.contains("/login")) {
                setStatus("Conclua o login para abrir " + selectedChannelName);
            } else {
                hideStatus();
            }
            super.onPageFinished(view, url);
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) {
                setStatus("Erro ao carregar " + selectedChannelName);
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
            setStatus("Autenticação HTTP não suportada");
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
            statusView.setVisibility(View.GONE);
            root.addView(customView, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT));
            enterImmersiveMode();
        }

        @Override
        public void onHideCustomView() {
            hideCustomView();
        }
    }
}
