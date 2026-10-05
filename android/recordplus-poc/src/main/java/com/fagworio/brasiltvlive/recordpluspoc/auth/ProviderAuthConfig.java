package com.fagworio.brasiltvlive.recordpluspoc.auth;

import android.net.Uri;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * The small, provider-owned authentication contract used by Android TV.
 *
 * It deliberately describes capabilities and trusted origins only. Provider
 * OAuth parameters, cookies and tokens remain exclusively with the official
 * provider page opened in Custom Tabs/the system browser.
 * Keep social capabilities aligned with src/providerAuth.js, which is the
 * corresponding UX contract in the React shell.
 */
public final class ProviderAuthConfig {
    public enum PairingCapability { UNKNOWN }

    private final String id;
    private final List<String> providerHosts;
    private final List<String> socialHosts;
    private final List<String> socialProviders;

    private ProviderAuthConfig(String id, List<String> providerHosts,
            List<String> socialHosts, List<String> socialProviders) {
        this.id = id;
        this.providerHosts = providerHosts;
        this.socialHosts = socialHosts;
        this.socialProviders = socialProviders;
    }

    public static ProviderAuthConfig forId(String providerId) {
        if ("recordplus".equals(providerId)) {
            return new ProviderAuthConfig(
                    "recordplus",
                    Collections.singletonList("recordplus.com"),
                    Arrays.asList("accounts.google.com", "appleid.apple.com"),
                    Arrays.asList("google", "apple"));
        }
        if ("globoplay".equals(providerId)) {
            return new ProviderAuthConfig(
                    "globoplay",
                    // Begin at the protected Globoplay channel. These are
                    // the provider-owned OIDC hops observed in the current
                    // login journey; PKCE parameters remain provider-owned.
                    Arrays.asList("globoplay.globo.com", "goidc.globo.com",
                            "authx.globoid.globo.com", "conta.globo.com"),
                    Collections.singletonList("accounts.google.com"),
                    Collections.singletonList("google"));
        }
        return null;
    }

    public String id() {
        return id;
    }

    public boolean supportsBrowserAuth() {
        return true;
    }

    public PairingCapability pairingCapability() {
        return PairingCapability.UNKNOWN;
    }

    public List<String> socialProviders() {
        return socialProviders;
    }

    public boolean allowsProviderUrl(Uri uri) {
        return hasTrustedHttpsHost(uri, providerHosts);
    }

    public boolean allowsSocialAuthUrl(Uri uri) {
        return hasTrustedHttpsHost(uri, socialHosts);
    }

    public boolean allowsUrl(Uri uri, boolean external) {
        return allowsProviderUrl(uri) || (external && allowsSocialAuthUrl(uri));
    }

    private boolean hasTrustedHttpsHost(Uri uri, List<String> allowedHosts) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) return false;
        String host = uri.getHost();
        if (host == null) return false;
        host = host.toLowerCase(java.util.Locale.ROOT);
        for (String allowedHost : allowedHosts) {
            if (host.equals(allowedHost) || host.endsWith("." + allowedHost)) return true;
        }
        return false;
    }
}
