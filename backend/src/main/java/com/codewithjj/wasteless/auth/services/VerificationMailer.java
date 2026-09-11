package com.codewithjj.wasteless.auth.services;

import com.codewithjj.wasteless.exceptions.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.BufferingClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

// Sends verification codes through Resend's HTTPS API. Railway blocks outbound SMTP
// below the Pro plan, so an HTTPS email API is what works on every plan.
@Service
public class VerificationMailer {

    private static final Logger log = LoggerFactory.getLogger(VerificationMailer.class);

    private final RestClient resend;
    private final String from;
    private final boolean configured;

    public VerificationMailer(@Value("${app.mail.resend-api-url}") String apiUrl,
                              @Value("${app.mail.resend-api-key}") String apiKey,
                              @Value("${app.mail.from}") String from) {
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        this.resend = RestClient.builder()
                // Buffered so the request carries a Content-Length instead of a chunked body
                .requestFactory(new BufferingClientHttpRequestFactory(requestFactory))
                .baseUrl(apiUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.from = from;
        this.configured = !apiKey.isBlank();
    }

    public void sendCode(String to, String code, long validMinutes) {
        if (!configured) {
            log.error("RESEND_API_KEY is not set, so verification emails can't be sent");
            throw sendFailed();
        }
        Map<String, Object> email = Map.of(
                "from", from,
                "to", List.of(to),
                "subject", "Your Wasteless verification code",
                "text", "Your Wasteless verification code is " + code + ".\n\n"
                        + "It expires in " + validMinutes + " minutes. "
                        + "If you didn't try to create a Wasteless account, you can ignore this email.");
        try {
            resend.post()
                    .uri("/emails")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(email)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException e) {
            // Resend explains rejections in the body, e.g. a sending domain that isn't verified yet
            log.error("Resend rejected the verification email: {} {}", e.getStatusCode().value(),
                    e.getResponseBodyAsString());
            throw sendFailed();
        } catch (RestClientException e) {
            log.error("Couldn't reach Resend to send the verification email", e);
            throw sendFailed();
        }
    }

    private static ApiException sendFailed() {
        return new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "EMAIL_SEND_FAILED",
                "We couldn't send the verification email. Please try again shortly.");
    }
}
