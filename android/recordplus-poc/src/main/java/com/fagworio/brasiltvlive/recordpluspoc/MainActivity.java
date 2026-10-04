package com.fagworio.brasiltvlive.recordpluspoc;

import android.app.Activity;
import android.app.AlertDialog;
import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.res.Configuration;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.os.Build;
import android.util.Log;
import android.util.DisplayMetrics;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.GeolocationPermissions;
import android.webkit.ConsoleMessage;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.view.TextureView;

import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsIntent;
import androidx.webkit.WebViewAssetLoader;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.exoplayer.hls.HlsMediaSource;
import androidx.media3.datasource.DefaultHttpDataSource;

import org.json.JSONException;
import org.json.JSONObject;

/** Hosts the complete BrasilTvLive web shell and native provider surfaces. */
public final class MainActivity extends Activity {
    private static final String TAG = "BrasilTvLiveAndroid";
    private static final String APP_ASSET_URL =
            "https://appassets.androidplatform.net/assets/web/index.html";

    private FrameLayout root;
    private WebView appWebView;
    private WebView providerWebView;
    private WebViewAssetLoader assetLoader;
    private TextureView nativeLiveTexture;
    private ExoPlayer nativeLivePlayer;
    private String nativeLiveUrl;
    private boolean nativeLiveMuted = true;
    private float nativeLiveVolume;
    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private JSONObject providerState;
    private boolean providerVisible;
    private boolean providerPlayerOpened;
    private boolean providerCompatibilitySurface;
    private String pendingExternalAuthUrl;
    private String pendingGeolocationOrigin;
    private GeolocationPermissions.Callback pendingGeolocationCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,
                WindowManager.LayoutParams.FLAG_FULLSCREEN);
        enterImmersiveMode();
        assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        buildApplicationSurface();
    }

    private void buildApplicationSurface() {
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(8, 12, 18));
        setContentView(root);
        nativeLiveTexture = new TextureView(this);
        // The shared React surface is transparent on Android TV so the native
        // Media3 frame can remain underneath the existing hero/EPG overlay.
        // Explicitly opting out of an opaque texture avoids the Android 9
        // compositor treating the video layer as an empty black surface.
        nativeLiveTexture.setOpaque(false);
        nativeLiveTexture.setFocusable(false);
        nativeLiveTexture.setClickable(false);
        nativeLiveTexture.setVisibility(View.GONE);
        appWebView = new WebView(this);
        configureAppWebView(appWebView);
        root.addView(appWebView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        // The native video is above the transparent app shell only inside the
        // hero rectangle. Provider WebViews are added later and stay on top.
        root.addView(nativeLiveTexture, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        appWebView.requestFocus(View.FOCUS_FORWARD);
        appWebView.loadUrl(APP_ASSET_URL);
    }

    private void configureCommonWebView(WebView view) {
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setGeolocationEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);
        // The shared app is authored against a wide desktop/TV viewport. On
        // Android TV 9, overview mode is what makes that viewport fit the
        // physical 1080p canvas instead of rendering it at the device's
        // 320dpi logical scale and clipping the navigation shell.
        settings.setLoadWithOverviewMode(true);
        settings.setDefaultFontSize(16);
        settings.setTextZoom(100);
        settings.setDefaultTextEncodingName("UTF-8");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            view.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, false);
        }
        if ((getResources().getConfiguration().uiMode & Configuration.UI_MODE_TYPE_MASK)
                == Configuration.UI_MODE_TYPE_TELEVISION) {
            // The shared TV layout is authored at a 1280 CSS-pixel viewport.
            // Android TV 9 reports a 320dpi logical density, so use a scale
            // derived from the display instead of a device-specific constant.
            view.setInitialScale(calculateTvScale());
        }
        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(view, true);
        view.setFocusable(true);
        view.setFocusableInTouchMode(true);
        view.setOverScrollMode(View.OVER_SCROLL_NEVER);
        view.setScrollBarStyle(View.SCROLLBARS_OUTSIDE_OVERLAY);
    }

    private int calculateTvScale() {
        DisplayMetrics metrics = getResources().getDisplayMetrics();
        float width = metrics.widthPixels;
        if (width <= 0) return 67;
        // 1280 CSS pixels are the reference canvas used by the Electron TV
        // shell. Clamp the result so 1080p Android 9 and newer 4K TV devices
        // preserve the same visual scale without oversized text.
        int scale = Math.round(67f * (width / 1920f));
        return Math.max(50, Math.min(100, scale));
    }

    private void configureAppWebView(WebView view) {
        configureCommonWebView(view);
        view.addJavascriptInterface(new AndroidAppBridge(), "AndroidBrasilTvLive");
        view.setWebViewClient(new AppWebViewClient());
        view.setWebChromeClient(new AppChromeClient());
        view.setBackgroundColor(Color.TRANSPARENT);
        // Android TV 9 keeps a hardware WebView surface opaque even when its
        // DOM backgrounds are transparent. Software composition is limited to
        // the app shell (provider pages keep their normal hardware path) and
        // lets the native Media3 TextureView show through the hero artwork.
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P) {
            view.setLayerType(View.LAYER_TYPE_SOFTWARE, null);
        }
    }

    private void configureProviderWebView(WebView view) {
        configureCommonWebView(view);
        WebSettings settings = view.getSettings();
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        // Provider pages use the same desktop/TV layout as the Electron
        // surface. Keep that identity on current Android WebViews; the
        // Android 9 system WebView is handled by the compatibility surface
        // below because it cannot parse the provider bundles at all.
        if (!hasLegacyProviderWebView()) {
            String userAgent = settings.getUserAgentString();
            if (userAgent != null && !userAgent.contains("Chrome/")) {
                settings.setUserAgentString(userAgent.replace("; wv", "")
                        + " Chrome/120.0.0.0 Safari/537.36");
            }
        }
        view.addJavascriptInterface(new ProviderBridge(), "AndroidBrasilTvLive");
        view.setWebViewClient(new ProviderWebViewClient());
        view.setWebChromeClient(new ProviderChromeClient());
        view.setBackgroundColor(Color.BLACK);
        view.setVerticalScrollBarEnabled(true);
        view.setScrollbarFadingEnabled(false);
        view.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
    }

    private boolean hasLegacyProviderWebView() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return true;
        android.content.pm.PackageInfo packageInfo = WebView.getCurrentWebViewPackage();
        if (packageInfo == null || packageInfo.versionName == null) return true;
        String[] parts = packageInfo.versionName.split("\\.");
        try {
            return Integer.parseInt(parts[0]) < 100;
        } catch (NumberFormatException exception) {
            return true;
        }
    }

    private boolean isTelevisionDevice() {
        return (getResources().getConfiguration().uiMode & Configuration.UI_MODE_TYPE_MASK)
                == Configuration.UI_MODE_TYPE_TELEVISION;
    }

    private void openProvider(String payload) {
        try {
            JSONObject request = new JSONObject(payload);
            String providerId = request.optString("providerId", "");
            String url = request.optString("url", "");
            String channelUrl = request.optString("channelUrl", url);
            String channelName = request.optString("channelName", "");
            String mode = request.optString("mode", "login");
            if (providerId.isEmpty() || url.isEmpty()) return;

            closeCustomView();
            if (providerWebView != null) {
                root.removeView(providerWebView);
                providerWebView.destroy();
            }
            providerWebView = new RemoteWebView(this);
            configureProviderWebView(providerWebView);
            root.addView(providerWebView, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT));
            providerVisible = !"preview".equals(mode);
            providerWebView.setVisibility(providerVisible ? View.VISIBLE : View.GONE);
            providerPlayerOpened = "watch".equals(mode) || "player".equals(mode);

            providerState = new JSONObject();
            providerState.put("providerId", providerId);
            providerState.put("channelUrl", channelUrl);
            providerState.put("channelName", channelName);
            providerState.put("mode", mode);
            providerState.put("status", providerPlayerOpened ? "player" : "open");
            providerState.put("requestId", System.currentTimeMillis());
            sendProviderState(providerState);
            // Android TV login must use the deterministic TV form. Provider
            // login SPAs can remain on an endless loader even when the TV has
            // a newer WebView, while the official player still needs the
            // provider surface for playback. Keep the compatibility form
            // limited to authentication and legacy WebViews.
            providerCompatibilitySurface = hasLegacyProviderWebView()
                    || (isTelevisionDevice() && "login".equals(mode));
            if (providerCompatibilitySurface) {
                Log.w(TAG, "Legacy Android WebView detected; using provider compatibility surface for " + providerId);
                providerWebView.loadDataWithBaseURL(
                        providerId.equals("globoplay") ? "https://globoplay.globo.com" : "https://www.recordplus.com",
                        buildProviderCompatibilityHtml(providerId, channelName, url),
                        "text/html",
                        "UTF-8",
                        url);
                providerWebView.postDelayed(() -> injectTvLoginPresentation(providerWebView), 250);
            } else {
                providerWebView.loadUrl(url);
            }
            if (providerVisible) providerWebView.requestFocus(View.FOCUS_FORWARD);
        } catch (JSONException exception) {
            Log.w(TAG, "Invalid provider request", exception);
        }
    }

    private String openProviderAndReturn(String payload) {
        openProvider(payload);
        try {
            return providerState == null ? "{}" : providerState.toString();
        } catch (RuntimeException exception) {
            return "{}";
        }
    }

    /**
     * Opens the provider's own e-mail/password page in the provider WebView.
     * This keeps the provider session in the same CookieManager used by the
     * official player. Social buttons use the browser path below instead.
     */
    private void openProviderInsideWebView(String url) {
        if (providerWebView == null || providerState == null || url == null || url.isEmpty()) return;
        pendingExternalAuthUrl = null;
        providerCompatibilitySurface = false;
        providerPlayerOpened = false;
        providerVisible = true;
        providerWebView.setVisibility(View.VISIBLE);
        try {
            providerState.put("status", "loading");
            providerState.put("authSurface", "webview");
            sendProviderState(providerState);
        } catch (JSONException exception) {
            Log.w(TAG, "Could not update provider WebView state", exception);
        }
        providerWebView.loadUrl(url);
        providerWebView.requestFocus(View.FOCUS_FORWARD);
    }

    private void closeProvider(String reason) {
        providerVisible = false;
        providerCompatibilitySurface = false;
        if (providerWebView != null) providerWebView.setVisibility(View.GONE);
        if (providerState != null) {
            try {
                providerState.put("status", "closed");
                providerState.put("reason", reason);
                sendProviderState(providerState);
            } catch (JSONException exception) {
                Log.w(TAG, "Could not close provider state", exception);
            }
        }
        appWebView.requestFocus(View.FOCUS_FORWARD);
    }

    private void setProviderLayer(String layer) {
        if (providerWebView == null || providerState == null) return;
        providerVisible = !"background".equals(layer);
        providerWebView.setVisibility(providerVisible ? View.VISIBLE : View.GONE);
        if (providerVisible) providerWebView.requestFocus(View.FOCUS_FORWARD);
        else appWebView.requestFocus(View.FOCUS_FORWARD);
    }

    private void setProviderAudioMuted(boolean muted) {
        if (providerWebView == null) return;
        String script = "(function(){document.querySelectorAll('video,audio').forEach(function(e){e.muted="
                + (muted ? "true" : "false") + ";});})();";
        providerWebView.evaluateJavascript(script, null);
    }

    private void sendProviderState(JSONObject state) {
        if (appWebView == null || state == null) return;
        String script = "window.dispatchEvent(new CustomEvent('brasiltvlive-provider-state',{detail:"
                + state.toString() + "}));";
        appWebView.evaluateJavascript(script, null);
    }

    private void openNativeLiveStream(String url) {
        if (url == null || url.trim().isEmpty()) return;
        if (nativeLivePlayer != null && url.equals(nativeLiveUrl)) {
            nativeLiveTexture.setVisibility(View.VISIBLE);
            nativeLivePlayer.setPlayWhenReady(true);
            return;
        }
        releaseNativeLiveStream();
        nativeLiveUrl = url;
        nativeLivePlayer = new ExoPlayer.Builder(this).build();
        nativeLivePlayer.addListener(new Player.Listener() {
            @Override public void onPlaybackStateChanged(int playbackState) {
                Log.d(TAG, "Native live playback state: " + playbackState + " for " + nativeLiveUrl);
                if (playbackState == Player.STATE_READY) {
                    sendNativeLiveState("ready", null);
                }
            }

            @Override public void onIsPlayingChanged(boolean isPlaying) {
                if (isPlaying) sendNativeLiveState("playing", null);
            }

            @Override public void onPlayerError(PlaybackException error) {
                Log.w(TAG, "Native live stream error for " + nativeLiveUrl, error);
                sendNativeLiveState("error", error.getMessage());
            }
        });
        nativeLivePlayer.setVideoTextureView(nativeLiveTexture);
        nativeLivePlayer.setVolume(nativeLiveMuted ? 0f : nativeLiveVolume);
        MediaItem mediaItem = new MediaItem.Builder()
                .setUri(Uri.parse(url))
                .setMimeType(MimeTypes.APPLICATION_M3U8)
                .build();
        DefaultHttpDataSource.Factory httpFactory = new DefaultHttpDataSource.Factory()
                .setAllowCrossProtocolRedirects(true)
                .setUserAgent("BrasilTvLive/AndroidTV");
        nativeLivePlayer.setMediaSource(new HlsMediaSource.Factory(httpFactory).createMediaSource(mediaItem));
        nativeLivePlayer.setPlayWhenReady(true);
        nativeLivePlayer.prepare();
        updateNativeLiveTextureLayout(false);
        nativeLiveTexture.setVisibility(View.VISIBLE);
        Log.d(TAG, "Native live stream opened: " + url);
    }

    private void updateNativeLiveTextureLayout(boolean fullscreen) {
        if (root == null || nativeLiveTexture == null) return;
        int width = root.getWidth();
        int height = root.getHeight();
        if (width <= 0 || height <= 0) {
            root.post(() -> updateNativeLiveTextureLayout(fullscreen));
            return;
        }
        FrameLayout.LayoutParams params;
        if (fullscreen) {
            params = new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT);
        } else {
            // Leave the hero copy visible in navigation. The native layer is
            // deliberately kept to the right-side artwork area; fullscreen
            // switches back to MATCH_PARENT below.
            int left = Math.round(width * 0.56f);
            int videoHeight = Math.max(1, Math.round(height * 0.486f));
            params = new FrameLayout.LayoutParams(Math.max(1, width - left), videoHeight);
            params.leftMargin = left;
        }
        nativeLiveTexture.setLayoutParams(params);
        nativeLiveTexture.bringToFront();
    }

    private void setNativeLiveAudio(boolean muted, float volume) {
        nativeLiveMuted = muted;
        nativeLiveVolume = Math.max(0f, Math.min(1f, volume));
        if (nativeLivePlayer != null) {
            nativeLivePlayer.setVolume(nativeLiveMuted ? 0f : nativeLiveVolume);
        }
    }

    private void setNativeLiveLayout(boolean fullscreen) {
        if (nativeLivePlayer != null && nativeLiveTexture != null) {
            updateNativeLiveTextureLayout(fullscreen);
        }
    }

    private void setNativeLiveVisible(boolean visible) {
        if (nativeLiveTexture == null) return;
        nativeLiveTexture.setVisibility(visible && nativeLivePlayer != null ? View.VISIBLE : View.GONE);
        if (visible && nativeLivePlayer != null) nativeLiveTexture.bringToFront();
    }

    private void releaseNativeLiveStream() {
        if (nativeLivePlayer != null) {
            nativeLivePlayer.clearVideoTextureView(nativeLiveTexture);
            nativeLivePlayer.release();
            nativeLivePlayer = null;
        }
        nativeLiveUrl = null;
        if (nativeLiveTexture != null) nativeLiveTexture.setVisibility(View.GONE);
    }

    private void sendNativeLiveState(String status, String message) {
        if (appWebView == null || nativeLiveUrl == null) return;
        try {
            JSONObject detail = new JSONObject();
            detail.put("status", status);
            detail.put("url", nativeLiveUrl);
            if (message != null) detail.put("message", message);
            String script = "window.dispatchEvent(new CustomEvent('brasiltvlive-native-stream-state',{detail:"
                    + detail.toString() + "}));";
            appWebView.evaluateJavascript(script, null);
        } catch (JSONException exception) {
            Log.w(TAG, "Could not report native live state", exception);
        }
    }

    private boolean isLoginUrl(String url) {
        String normalized = url == null ? "" : url.toLowerCase();
        return normalized.contains("/login") || normalized.contains("/entrar")
                || normalized.contains("/auth/");
    }

    private boolean isProviderPlayerUrl(String url) {
        String normalized = url == null ? "" : url.toLowerCase();
        return normalized.contains("/player/") || normalized.contains("/ao-vivo/")
                || normalized.contains("/ao-vivo?");
    }

    private boolean isGoogleAuthUrl(Uri uri) {
        String host = uri == null ? null : uri.getHost();
        return host != null && ("accounts.google.com".equalsIgnoreCase(host)
                || host.endsWith(".accounts.google.com"));
    }

    private boolean isSocialAuthUrl(Uri uri) {
        String host = uri == null ? null : uri.getHost();
        if (host == null) return false;
        return isGoogleAuthUrl(uri)
                || "appleid.apple.com".equalsIgnoreCase(host)
                || host.endsWith(".appleid.apple.com");
    }

    private boolean openProviderInCustomTab(Uri uri) {
        String customTabsPackage = CustomTabsClient.getPackageName(this, null);
        if (customTabsPackage == null) return false;
        try {
            CustomTabsIntent customTabs = new CustomTabsIntent.Builder()
                    .setShowTitle(true)
                    .build();
            customTabs.intent.setPackage(customTabsPackage);
            customTabs.intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            customTabs.launchUrl(this, uri);
            return true;
        } catch (ActivityNotFoundException | SecurityException exception) {
            Log.w(TAG, "Could not open provider auth in Custom Tab", exception);
            return false;
        }
    }

    /**
     * Opens provider authentication in the system browser surface.
     *
     * Google OAuth must not be completed inside an embedded Android WebView.
     * Android 9's bundled WebView is also too old for the provider's current
     * JavaScript bundles, so ACTION_VIEW is the portable fallback for API 28.
     * A TV image without a browser gets an explicit, remote-friendly message
     * instead of silently swallowing ActivityNotFoundException.
     */
    private void openProviderInSecureBrowser(Uri uri, String flowLabel) {
        if (uri == null || uri.getScheme() == null || uri.getHost() == null) {
            Log.w(TAG, "Refusing to open invalid provider auth URL: " + uri);
            showProviderBrowserUnavailable(flowLabel);
            return;
        }

        pendingExternalAuthUrl = uri.toString();
        try {
            boolean openedInCustomTab = openProviderInCustomTab(uri);
            if (!openedInCustomTab) {
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                intent.addCategory(Intent.CATEGORY_BROWSABLE);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if (getPackageManager().resolveActivity(intent, PackageManager.MATCH_DEFAULT_ONLY) == null) {
                    Log.w(TAG, "No browser available for provider auth: " + uri);
                    pendingExternalAuthUrl = null;
                    showProviderBrowserUnavailable(flowLabel);
                    return;
                }
                startActivity(intent);
            }
            if (providerState != null) {
                providerState.put("status", "external-auth");
                providerState.put("authSurface", openedInCustomTab ? "custom-tab" : "secure-browser");
                sendProviderState(providerState);
            }
        } catch (ActivityNotFoundException | SecurityException exception) {
            Log.w(TAG, "Could not open secure provider auth surface", exception);
            pendingExternalAuthUrl = null;
            showProviderBrowserUnavailable(flowLabel);
        } catch (JSONException exception) {
            Log.w(TAG, "Could not update provider auth state", exception);
        }
    }

    private void showProviderBrowserUnavailable(String flowLabel) {
        new AlertDialog.Builder(this)
                .setTitle("Navegador necessário")
                .setMessage("Para concluir o " + flowLabel
                        + ", esta TV precisa de um navegador compatível instalado. "
                        + "Instale o Chrome, TV Bro ou outro navegador para Android TV e tente novamente. "
                        + "O Android System WebView sozinho não abre páginas externas.")
                .setPositiveButton("OK", null)
                .show();
    }

    private final class ProviderBridge {
        @JavascriptInterface
        public void openProviderInternal(String url) {
            runOnUiThread(() -> openProviderInsideWebView(url));
        }

        @JavascriptInterface
        public void openProviderExternal(String url) {
            runOnUiThread(() -> {
                openProviderInSecureBrowser(Uri.parse(url), "login oficial");
            });
        }

        @JavascriptInterface
        public void closeProviderSurface() {
            runOnUiThread(() -> closeProvider("compatibility-close"));
        }
    }

    private String buildProviderCompatibilityHtml(String providerId, String channelName, String providerUrl) {
        String provider = "globoplay".equals(providerId) ? "Globo" : "Record+";
        String brand = "globoplay".equals(providerId) ? "globoplay" : "recordplus";
        String escapedProviderUrl = escapeHtml(providerUrl);
        String socialNote = "O login social abre a página oficial do provedor para concluir a autenticação.";
        String providerNotice = "A página oficial usa recursos que não existem no Android System WebView desta TV. "
                + "A interface abaixo mantém o fluxo navegável; o login social será concluído no navegador oficial.";
        StringBuilder html = new StringBuilder();
        html.append("<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'>")
                .append("<meta name='viewport' content='width=device-width,initial-scale=1'>")
                .append("<style>")
                .append("*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#000;color:#f5f7fb;font-family:Arial,sans-serif}body{overflow-y:auto;padding:28px 5vw 60px}.top{display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:36px}.brand{font-size:28px;font-weight:800;letter-spacing:-.04em}.brand.record{color:#fff}.brand.record:before{content:'▶';color:#ec168c;margin-right:10px}.brand.globo{color:#fff}.signup{color:#ff0a96;font-size:18px;font-weight:700}.layout{width:min(720px,100%);margin:0 auto}.eyebrow{color:#ff0a96;text-transform:uppercase;letter-spacing:.14em;font-size:13px;font-weight:800;margin-bottom:12px}.title{font-size:34px;font-weight:500;margin:0 0 30px}.subtitle{color:#b7c2d1;font-size:17px;line-height:1.5;margin:-16px 0 28px}.field{display:grid;gap:9px;margin:18px 0}.field label{font-size:17px}.field input{width:100%;height:58px;border:1px solid #616b76;border-radius:10px;background:#1b1b1b;color:#fff;padding:0 18px;font-size:20px}.field input:focus,button:focus,a:focus{outline:4px solid #42a5ff;outline-offset:3px}.remember{display:flex;align-items:center;gap:10px;margin:18px 0 26px;font-size:18px}.remember input{width:22px;height:22px}.primary,.social,.secondary{width:100%;min-height:54px;border:0;border-radius:10px;font-size:18px;font-weight:700;cursor:pointer}.primary{background:#4a4a4a;color:#fff}.secondary{background:transparent;border:1px solid #7d8b9b;color:#fff;margin-top:12px}.reset{display:block;text-align:center;color:#ff0a96;font-size:18px;font-weight:700;margin:28px 0;text-decoration:none}.socials{display:grid;grid-template-columns:1fr 1fr;gap:16px}.social{background:#fff;color:#111}.globo-card{border:1px solid #65707c;border-radius:10px;padding:24px;margin-top:34px;color:#e5ebf1}.globo-card h2{font-size:20px;margin:0 0 18px}.globo-card p{font-size:17px;line-height:1.5;margin:10px 0}.notice{margin-top:34px;border:1px solid #394452;border-radius:12px;padding:18px;color:#aeb9c6;font-size:14px;line-height:1.5}.notice strong{display:block;color:#fff;font-size:15px;margin-bottom:6px}.channel{color:#fff;font-size:16px;margin-bottom:20px}")
                .append("</style></head><body>")
                .append("<header class='top'><div class='brand ").append("globoplay".equals(providerId) ? "globo" : "record").append("'>")
                .append(brand).append("</div><div class='signup'>Cadastre-se</div></header>")
                .append("<main class='layout'>")
                .append("<div class='eyebrow'>Acesso necessário</div>")
                .append("<h1 class='title'>").append("globoplay".equals(providerId) ? "Conta Globo" : "Entre na sua conta").append("</h1>")
                .append("<p class='subtitle'>Conclua o login para abrir ").append(escapeHtml(channelName)).append(".</p>");
        if ("globoplay".equals(providerId)) {
            html.append("<div class='field'><label for='email'>Informe o seu e-mail</label><input id='email' type='email' placeholder='Ex: @gmail, @outlook, @yahoo, etc.'></div>")
                    .append("<button class='primary' onclick=\"openOfficial('password')\">Continuar</button>")
                    .append("<p class='subtitle' style='text-align:center;margin:34px 0 18px'>Ou escolha uma opção:</p>")
                    .append("<div class='socials'><button class='social' onclick=\"openOfficial('social')\">G&nbsp;&nbsp; Google</button><button class='social' onclick=\"openOfficial('social')\">f&nbsp;&nbsp; Facebook</button></div>")
                    .append("<div class='globo-card'><h2>Por que ter uma Conta Globo?</h2><p>✓ A Conta Globo é gratuita, basta se cadastrar e acessar.</p><p>✓ Use o mesmo login para todos os produtos Globo e parceiros.</p></div>");
        } else {
            html.append("<div class='field'><label for='email'>E-mail</label><input id='email' type='email' placeholder='Endereço de e-mail'></div>")
                    .append("<div class='field'><label for='password'>Senha</label><input id='password' type='password' placeholder='Senha'></div>")
                    .append("<label class='remember'><input type='checkbox'>Lembrar meu usuário</label>")
                    .append("<button class='primary' onclick=\"openOfficial('password')\">Entrar</button><a class='reset' href='#' onclick=\"openOfficial('password');return false\">Redefinir senha</a>")
                    .append("<div class='socials'><button class='social' onclick=\"openOfficial('social')\">G&nbsp;&nbsp; Continuar com Google</button><button class='social' onclick=\"openOfficial('social')\">●&nbsp;&nbsp; Continuar com Apple</button></div>");
        }
        html.append("<div class='notice'><strong>Login oficial ").append(provider).append("</strong>").append(providerNotice).append("<br><br>").append(socialNote).append("</div>")
                .append("<button class='secondary' onclick=\"AndroidBrasilTvLive.closeProviderSurface()\">Voltar para os canais</button>")
                .append("</main><script>var providerUrl='").append(escapeJavaScript(providerUrl)).append("';function openOfficial(mode){if(mode==='password'){AndroidBrasilTvLive.openProviderInternal(providerUrl);}else{AndroidBrasilTvLive.openProviderExternal(providerUrl);}}</script></body></html>");
        return html.toString();
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    private String escapeJavaScript(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r");
    }

    private void updateProviderNavigation(String url) {
        if (providerState == null) return;
        try {
            providerState.put("currentUrl", url);
            if (isLoginUrl(url)) providerState.put("status", "auth-required");
            else if (isProviderPlayerUrl(url) || providerPlayerOpened) {
                providerPlayerOpened = true;
                providerState.put("status", "player");
            } else providerState.put("status", "ready");
            sendProviderState(providerState);
        } catch (JSONException exception) {
            Log.w(TAG, "Could not update provider state", exception);
        }
    }

    private void injectTvLoginPresentation(WebView view) {
        String script = "(function(){var id='brasiltvlive-tv-login';var style=document.getElementById(id);"
                + "if(!style){style=document.createElement('style');style.id=id;document.head.appendChild(style);}"
                + "style.textContent='html,body{overflow-y:scroll!important;min-height:100vh!important;}"
                + "body{padding-bottom:24vh!important;}button,a,[role=button],[tabindex=0],input{"
                + "scroll-margin-top:120px;scroll-margin-bottom:120px;}"
                + "button:focus,a:focus,input:focus,select:focus,textarea:focus{outline:4px solid #42a5ff!important;outline-offset:3px!important;box-shadow:0 0 0 3px rgba(66,165,255,.3),0 0 18px rgba(66,165,255,.28)!important;}';"
                + "if(window.__brasiltvliveTvLoginKeys)return;window.__brasiltvliveTvLoginKeys=true;"
                + "function controls(){return [].slice.call(document.querySelectorAll('input,button,select,textarea,a,[role=button]'))"
                + ".filter(function(e){var r=e.getBoundingClientRect(),s=getComputedStyle(e);return !e.disabled&&r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';});}"
                + "function move(direction){var list=controls(),current=document.activeElement,index=list.indexOf(current);if(!list.length)return;"
                + "var nextIndex=direction==='down'?Math.min(list.length-1,index<0?0:index+1):Math.max(0,index<0?list.length-1:index-1);"
                + "var next=list[nextIndex];if(!next)return;next.focus();try{next.scrollIntoView({block:'center',inline:'nearest'});}catch(e){next.scrollIntoView();}}"
                + "window.__brasiltvliveMoveLoginFocus=move;"
                + "window.__brasiltvliveActivateLoginFocus=function(){var target=document.activeElement;if(!target||target===document.body)return;"
                + "if(target.tagName==='INPUT'&&target.type!=='checkbox'&&target.type!=='radio'){target.focus();return;}"
                + "if(typeof target.click==='function')target.click();};"
                + "document.addEventListener('keydown',function(event){var key=event.key;if(key!=='ArrowDown'&&key!=='ArrowUp')return;"
                + "event.preventDefault();event.stopPropagation();move(key==='ArrowDown'?'down':'up');},true);"
                + "document.addEventListener('focusin',function(event){try{event.target.scrollIntoView({block:'center',inline:'nearest'});}catch(e){}},true);"
                + "setTimeout(function(){var list=controls();if(list.length&&(!document.activeElement||document.activeElement===document.body))list[0].focus();},120);})();";
        view.evaluateJavascript(script, null);
    }

    private void dispatchProviderLoginFocus(String direction) {
        if (providerWebView == null) return;
        providerWebView.evaluateJavascript(
                "window.__brasiltvliveMoveLoginFocus&&window.__brasiltvliveMoveLoginFocus('"
                        + direction + "');", null);
    }

    private void dispatchProviderLoginActivate() {
        if (providerWebView == null) return;
        providerWebView.evaluateJavascript(
                "window.__brasiltvliveActivateLoginFocus&&window.__brasiltvliveActivateLoginFocus();",
                null);
    }

    /**
     * Android TV's software keyboard can consume DPAD events before the
     * Activity receives them. Intercept those events before IME dispatch so
     * the provider login form keeps a deterministic remote-control focus.
     */
    private final class RemoteWebView extends WebView {
        RemoteWebView(Context context) {
            super(context);
        }

        @Override
        public boolean dispatchKeyEventPreIme(KeyEvent event) {
            if (event.getAction() == KeyEvent.ACTION_DOWN
                    && this == providerWebView
                    && providerVisible
                    && (providerCompatibilitySurface || isLoginUrl(getUrl()))) {
                int keyCode = event.getKeyCode();
                if (keyCode == KeyEvent.KEYCODE_DPAD_DOWN) {
                    dispatchProviderLoginFocus("down");
                    return true;
                }
                if (keyCode == KeyEvent.KEYCODE_DPAD_UP) {
                    dispatchProviderLoginFocus("up");
                    return true;
                }
                if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER
                        || keyCode == KeyEvent.KEYCODE_ENTER
                        || keyCode == KeyEvent.KEYCODE_NUMPAD_ENTER) {
                    dispatchProviderLoginActivate();
                    return true;
                }
            }
            return super.dispatchKeyEventPreIme(event);
        }
    }

    private void scrollProviderLogin(int direction) {
        if (providerWebView == null) return;
        int amount = Math.max(360, Math.round(providerWebView.getHeight() * 0.68f));
        providerWebView.scrollBy(0, direction * amount);
        providerWebView.evaluateJavascript("(function(){var e=document.activeElement;if(e&&e.blur)e.blur();})();", null);
    }

    private void enterImmersiveMode() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                        | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    private void closeCustomView() {
        if (customView == null) return;
        root.removeView(customView);
        customView = null;
        if (customViewCallback != null) {
            customViewCallback.onCustomViewHidden();
            customViewCallback = null;
        }
        if (providerWebView != null) providerWebView.setVisibility(providerVisible ? View.VISIBLE : View.GONE);
        else if (appWebView != null) appWebView.setVisibility(View.VISIBLE);
        enterImmersiveMode();
    }

    private void dispatchChannelStep(int direction) {
        try {
            JSONObject event = new JSONObject();
            event.put("type", "channel-step");
            event.put("direction", direction);
            sendProviderState(event);
        } catch (JSONException exception) {
            Log.w(TAG, "Could not dispatch channel step", exception);
        }
    }

    private void dispatchAppBack() {
        if (appWebView == null || appWebView.getVisibility() != View.VISIBLE) return;
        // Android TV delivers the remote Back button to the Activity before
        // the WebView receives a DOM key event. Re-dispatch it on the focused
        // element so React's modal focus scope can close the region form and
        // the shared TV navigation can restore its own focus.
        String script = "(function(){var target=document.activeElement||document.body;"
                + "target.dispatchEvent(new KeyboardEvent('keydown',{key:'Back',code:'BrowserBack',"
                + "bubbles:true,cancelable:true}));})();";
        appWebView.evaluateJavascript(script, null);
    }

    private void dispatchAppEnter() {
        if (appWebView == null || appWebView.getVisibility() != View.VISIBLE) return;
        // Some Android TV 9 remotes expose OK as DPAD_CENTER instead of a DOM
        // Enter key. Forward it to the focused React control and activate
        // buttons explicitly so channel cells enter fullscreen reliably.
        String script = "(function(){var target=document.activeElement||document.body;"
                + "target.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',"
                + "bubbles:true,cancelable:true}));"
                + "if(target.tagName==='BUTTON'&&!target.disabled)target.click();})();";
        appWebView.evaluateJavascript(script, null);
    }

    private void dispatchAppDirection(String key) {
        if (appWebView == null || appWebView.getVisibility() != View.VISIBLE) return;
        // Android TV 9 can route DPAD events to the native <select> control
        // before Chromium dispatches them to React. Re-emit the direction on
        // the focused DOM control so the shared React focus model owns both
        // the region form and the EPG navigation on every WebView version.
        String script = "(function(){var target=document.activeElement||document.body;"
                + "var event=new KeyboardEvent('keydown',{key:'" + key
                + "',code:'" + key + "',bubbles:true,cancelable:true});"
                + "target.dispatchEvent(event);})();";
        appWebView.evaluateJavascript(script, null);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            int keyCode = event.getKeyCode();
            if (keyCode == KeyEvent.KEYCODE_BACK && providerVisible) {
                // WebView can consume Back for its own history before the
                // Activity callback. Provider surfaces belong to the app, so
                // always return to the BrasilTvLive navigation shell.
                closeProvider("back");
                return true;
            }
            if (keyCode == KeyEvent.KEYCODE_CHANNEL_UP || keyCode == KeyEvent.KEYCODE_MEDIA_NEXT) {
                dispatchChannelStep(1);
                return true;
            }
            if (keyCode == KeyEvent.KEYCODE_CHANNEL_DOWN || keyCode == KeyEvent.KEYCODE_MEDIA_PREVIOUS) {
                dispatchChannelStep(-1);
                return true;
            }
            if (providerVisible && providerWebView != null
                    && (providerCompatibilitySurface || isLoginUrl(providerWebView.getUrl()))
                    && keyCode == KeyEvent.KEYCODE_DPAD_DOWN) {
                dispatchProviderLoginFocus("down");
                return true;
            }
            if (providerVisible && providerWebView != null
                    && (providerCompatibilitySurface || isLoginUrl(providerWebView.getUrl()))
                    && keyCode == KeyEvent.KEYCODE_DPAD_UP) {
                dispatchProviderLoginFocus("up");
                return true;
            }
            if (providerVisible && providerWebView != null
                    && (providerCompatibilitySurface || isLoginUrl(providerWebView.getUrl()))
                    && (keyCode == KeyEvent.KEYCODE_DPAD_CENTER
                    || keyCode == KeyEvent.KEYCODE_ENTER
                    || keyCode == KeyEvent.KEYCODE_NUMPAD_ENTER)) {
                dispatchProviderLoginActivate();
                return true;
            }
            if (!providerVisible && customView == null && appWebView != null
                    && appWebView.getVisibility() == View.VISIBLE) {
                if (keyCode == KeyEvent.KEYCODE_DPAD_UP) {
                    dispatchAppDirection("ArrowUp");
                    return true;
                }
                if (keyCode == KeyEvent.KEYCODE_DPAD_DOWN) {
                    dispatchAppDirection("ArrowDown");
                    return true;
                }
                if (keyCode == KeyEvent.KEYCODE_DPAD_LEFT) {
                    dispatchAppDirection("ArrowLeft");
                    return true;
                }
                if (keyCode == KeyEvent.KEYCODE_DPAD_RIGHT) {
                    dispatchAppDirection("ArrowRight");
                    return true;
                }
            }
            if (!providerVisible && (keyCode == KeyEvent.KEYCODE_DPAD_CENTER
                    || keyCode == KeyEvent.KEYCODE_ENTER
                    || keyCode == KeyEvent.KEYCODE_NUMPAD_ENTER)) {
                dispatchAppEnter();
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
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && providerVisible) {
            closeProvider("back");
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public void onBackPressed() {
        if (customView != null) {
            closeCustomView();
            return;
        }
        if (providerVisible && providerWebView != null) {
            // The provider is an app-owned login/player surface. Back should
            // always return to BrasilTvLive instead of traversing the
            // provider's own history into a blank intermediate document.
            closeProvider("back");
            return;
        }
        dispatchAppBack();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && customView == null) enterImmersiveMode();
    }

    @Override
    protected void onPause() {
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (pendingExternalAuthUrl == null || providerState == null) return;
        pendingExternalAuthUrl = null;
        try {
            providerState.put("status", "external-auth-returned");
            sendProviderState(providerState);
        } catch (JSONException exception) {
            Log.w(TAG, "Could not report return from provider auth", exception);
        }
    }

    @Override
    protected void onDestroy() {
        CookieManager.getInstance().flush();
        closeCustomView();
        releaseNativeLiveStream();
        if (providerWebView != null) providerWebView.destroy();
        if (appWebView != null) appWebView.destroy();
        super.onDestroy();
    }

    private final class AndroidAppBridge {
        @JavascriptInterface
        public String openProviderSurface(String payload) {
            runOnUiThread(() -> openProvider(payload));
            try {
                JSONObject request = new JSONObject(payload);
                JSONObject response = new JSONObject();
                response.put("providerId", request.optString("providerId", ""));
                response.put("channelUrl", request.optString("channelUrl", ""));
                response.put("channelName", request.optString("channelName", ""));
                response.put("mode", request.optString("mode", "login"));
                response.put("status", "open");
                return response.toString();
            } catch (JSONException exception) {
                return "{}";
            }
        }

        @JavascriptInterface public void closeProviderSurface() {
            runOnUiThread(() -> closeProvider("app-request"));
        }
        @JavascriptInterface public void setProviderBounds(String bounds) {
            runOnUiThread(() -> MainActivity.this.setProviderBounds(bounds));
        }
        @JavascriptInterface public void setProviderLayer(String layer) {
            runOnUiThread(() -> MainActivity.this.setProviderLayer(layer));
        }
        @JavascriptInterface public void setProviderAudioMuted(boolean muted) {
            runOnUiThread(() -> MainActivity.this.setProviderAudioMuted(muted));
        }
        @JavascriptInterface public void openLiveStream(String url) {
            runOnUiThread(() -> openNativeLiveStream(url));
        }
        @JavascriptInterface public void closeLiveStream() {
            runOnUiThread(MainActivity.this::releaseNativeLiveStream);
        }
        @JavascriptInterface public void setLiveStreamAudio(boolean muted, float volume) {
            runOnUiThread(() -> setNativeLiveAudio(muted, volume));
        }
        @JavascriptInterface public void setLiveStreamLayout(boolean fullscreen) {
            runOnUiThread(() -> setNativeLiveLayout(fullscreen));
        }
        @JavascriptInterface public void setLiveStreamVisible(boolean visible) {
            runOnUiThread(() -> setNativeLiveVisible(visible));
        }
    }

    private void setProviderBounds(String ignored) {
        // Android keeps provider authentication/player fullscreen for TV safety.
    }

    private final class AppWebViewClient extends WebViewClient {
        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            return assetLoader.shouldInterceptRequest(request.getUrl());
        }
        @Override @SuppressWarnings("deprecation")
        public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
            return assetLoader.shouldInterceptRequest(Uri.parse(url));
        }
        @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) Log.w(TAG, "Application WebView error: " + error);
        }
        @Override public void onPageFinished(WebView view, String url) {
            view.evaluateJavascript(
                    "(function(){var m=document.querySelector('meta[name=viewport]');if(m)m.setAttribute('content','width=1280, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');document.documentElement.classList.add('android-tv-shell');return JSON.stringify({innerWidth:innerWidth,innerHeight:innerHeight});})()",
                    value -> Log.d(TAG, "APP_VIEWPORT_AFTER_TV_META " + value));
            view.evaluateJavascript(
                    "JSON.stringify({innerWidth:innerWidth,innerHeight:innerHeight,devicePixelRatio:devicePixelRatio,scrollY:scrollY})",
                    value -> Log.d(TAG, "APP_VIEWPORT " + value));
            // TV focus can make Chromium scroll the focused EPG cell into view
            // while the React shell is mounting. Keep the navigation surface
            // at its designed top edge after that first focus pass.
            view.postDelayed(() -> view.evaluateJavascript(
                    "window.scrollTo(0,0);document.documentElement.scrollTop=0;document.body.scrollTop=0;",
                    null), 220);
            super.onPageFinished(view, url);
        }
    }

    private final class ProviderWebViewClient extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isSocialAuthUrl(uri)) {
                openProviderInSecureBrowser(uri, "login social");
                return true;
            }
            return false;
        }
        @Override @SuppressWarnings("deprecation")
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            Uri uri = Uri.parse(url);
            if (isSocialAuthUrl(uri)) {
                openProviderInSecureBrowser(uri, "login social");
                return true;
            }
            return false;
        }
        @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
            updateProviderNavigation(url);
            super.onPageStarted(view, url, favicon);
        }
        @Override public void onPageFinished(WebView view, String url) {
            CookieManager.getInstance().flush();
            updateProviderNavigation(url);
            if (isLoginUrl(url)) injectTvLoginPresentation(view);
            super.onPageFinished(view, url);
        }
        @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame() && providerState != null) {
                try {
                    providerState.put("status", "error");
                    providerState.put("reason", error.getDescription());
                    sendProviderState(providerState);
                } catch (JSONException exception) {
                    Log.w(TAG, "Could not report provider error", exception);
                }
            }
            super.onReceivedError(view, request, error);
        }
    }

    private class AppChromeClient extends WebChromeClient {
        @Override public boolean onConsoleMessage(ConsoleMessage message) {
            Log.d(TAG, "WEB_CONSOLE " + message.message() + " @" + message.sourceId() + ":" + message.lineNumber());
            return true;
        }

        @Override public void onGeolocationPermissionsShowPrompt(
                String origin, GeolocationPermissions.Callback callback) {
            if (hasLocationPermission()) {
                callback.invoke(origin, true, false);
                return;
            }
            pendingGeolocationOrigin = origin;
            pendingGeolocationCallback = callback;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                requestPermissions(new String[]{
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                }, LOCATION_PERMISSION_REQUEST_CODE);
            } else {
                callback.invoke(origin, false, false);
                clearPendingGeolocation();
            }
        }

        @Override public void onShowCustomView(View view, CustomViewCallback callback) {
            if (customView != null) {
                callback.onCustomViewHidden();
                return;
            }
            customView = view;
            customViewCallback = callback;
            if (appWebView != null) appWebView.setVisibility(View.GONE);
            if (providerWebView != null) providerWebView.setVisibility(View.GONE);
            root.addView(customView, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            enterImmersiveMode();
        }
        @Override public void onHideCustomView() { closeCustomView(); }
    }

    private final class ProviderChromeClient extends AppChromeClient { }

    private static final int LOCATION_PERMISSION_REQUEST_CODE = 701;

    private boolean hasLocationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)
                == PackageManager.PERMISSION_GRANTED;
    }

    private void clearPendingGeolocation() {
        pendingGeolocationOrigin = null;
        pendingGeolocationCallback = null;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != LOCATION_PERMISSION_REQUEST_CODE) return;
        boolean granted = false;
        for (int result : grantResults) {
            if (result == PackageManager.PERMISSION_GRANTED) {
                granted = true;
                break;
            }
        }
        if (pendingGeolocationCallback != null && pendingGeolocationOrigin != null) {
            pendingGeolocationCallback.invoke(pendingGeolocationOrigin, granted, false);
        }
        clearPendingGeolocation();
    }
}
