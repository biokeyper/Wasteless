package com.codewithjj.wasteless.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.core.checksums.ResponseChecksumValidation;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.net.URI;

@Configuration
public class R2Config {

    // R2_ENDPOINT is the bucket's S3 API endpoint from the Cloudflare dashboard,
    // e.g. https://<account_id>.r2.cloudflarestorage.com
    @Bean
    public S3Client r2Client(
            @Value("${R2_ENDPOINT}") String endpoint,
            @Value("${R2_ACCESS_KEY_ID}") String accessKeyId,
            @Value("${R2_SECRET_ACCESS_KEY}") String secretAccessKey) {
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of("auto"))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                .forcePathStyle(true)
                // Only send checksums when an operation requires them; the SDK's newer
                // default checksum headers are not accepted by every S3-compatible store.
                .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                .responseChecksumValidation(ResponseChecksumValidation.WHEN_REQUIRED)
                .build();
    }
}
