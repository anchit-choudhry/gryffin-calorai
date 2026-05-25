package com.gryffin.calorai.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Verifies Google ID tokens via the tokeninfo endpoint.
 * Production use: replace with JWKS-based local verification for performance.
 */
@Component("googleOidcVerifier")
public class GoogleOidcVerifier implements OidcTokenVerifier {

    private static final String TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

    private final String clientId;
    private final RestClient restClient;

    public GoogleOidcVerifier(
        @Value("${app.oauth2.google.client-id}") String clientId
    ) {
        this.clientId = clientId;
        this.restClient = RestClient.create();
    }

    @Override
    public OidcClaims verify(String idToken) throws OidcVerificationException {
        try {
            Map<String, Object> response = restClient.get()
                .uri(TOKENINFO_URL + "?id_token={token}", idToken)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});

            if (response == null) throw new OidcVerificationException("Empty response from Google");

            var aud = (String) response.get("aud");
            if (!clientId.equals(aud)) {
                throw new OidcVerificationException("Token audience mismatch");
            }

            if (!"true".equals(response.get("email_verified"))) {
                throw new OidcVerificationException("Google account email is not verified");
            }

            return new OidcClaims(
                (String) response.get("sub"),
                (String) response.get("email"),
                (String) response.getOrDefault("name", ""),
                "google"
            );
        } catch (OidcVerificationException e) {
            throw e;
        } catch (Exception e) {
            throw new OidcVerificationException("Google token verification failed", e);
        }
    }
}
