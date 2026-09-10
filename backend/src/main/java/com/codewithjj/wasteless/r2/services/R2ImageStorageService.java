package com.codewithjj.wasteless.r2.services;

import com.codewithjj.wasteless.items.services.ImageStorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

@Service
public class R2ImageStorageService implements ImageStorageService {

    private final S3Client r2;
    private final String bucket;
    private final String publicUrl;

    // R2_PUBLIC_URL is the bucket's public address: its r2.dev URL or a custom domain
    public R2ImageStorageService(
            S3Client r2,
            @Value("${R2_BUCKET}") String bucket,
            @Value("${R2_PUBLIC_URL}") String publicUrl) {
        this.r2 = r2;
        this.bucket = bucket;
        this.publicUrl = publicUrl.replaceAll("/+$", "");
    }

    @Override
    public String store(MultipartFile file) {
        String key = "wasteless/" + UUID.randomUUID();
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(file.getContentType())
                .build();
        try (InputStream in = file.getInputStream()) {
            r2.putObject(request, RequestBody.fromInputStream(in, file.getSize()));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image to R2", e);
        }
        return key;
    }

    @Override
    public String getImageUrl(String key) {
        return publicUrl + "/" + key;
    }

    // Images uploaded before the move to R2 still live in Cloudinary. Deleting their
    // keys here is a no-op, so those files stay in Cloudinary until migrated.
    @Override
    public void deleteImage(String key) {
        r2.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }
}
