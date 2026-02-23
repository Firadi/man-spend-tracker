import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    CopyObjectCommand,
    HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PassThrough } from "stream";
import type { Response } from "express";

const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION || "auto";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;

if (
    !S3_ACCESS_KEY ||
    !S3_SECRET_KEY ||
    !process.env.S3_BUCKET ||
    !S3_ENDPOINT
) {
    // Defer throwing until functions are used so the app can start in other envs.
}

const s3Client = new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    credentials:
        S3_ACCESS_KEY && S3_SECRET_KEY
            ? {
                  accessKeyId: S3_ACCESS_KEY,
                  secretAccessKey: S3_SECRET_KEY,
              }
            : undefined,
    forcePathStyle: true,
});

export async function getPresignedPutUrl(
    bucket: string,
    key: string,
    ttlSec = 900,
): Promise<string> {
    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(s3Client, cmd, { expiresIn: ttlSec });
}

export async function getObjectMetadata(bucket: string, key: string) {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    const res = await s3Client.send(cmd);
    return {
        contentType: res.ContentType,
        size: res.ContentLength,
        metadata: res.Metadata || {},
        body: res.Body,
    };
}

export async function streamObjectToResponse(
    bucket: string,
    key: string,
    res: Response,
    cacheTtlSec = 3600,
) {
    const meta = await getObjectMetadata(bucket, key);
    const isPublic =
        meta.metadata && meta.metadata["custom-aclpolicy"]
            ? JSON.parse(meta.metadata["custom-aclpolicy"])?.visibility ===
              "public"
            : false;

    res.set({
        "Content-Type": meta.contentType || "application/octet-stream",
        "Content-Length": String(meta.size || 0),
        "Cache-Control": `${isPublic ? "public" : "private"}, max-age=${cacheTtlSec}`,
    });

    // Body can be a stream or other type. Pipe if stream-like.
    const body = meta.body as any;
    if (!body) {
        res.status(404).json({ error: "Object not found" });
        return;
    }

    if (typeof body.pipe === "function") {
        (body as NodeJS.ReadableStream).pipe(res);
    } else if (body instanceof Uint8Array) {
        res.send(Buffer.from(body));
    } else {
        // fallback: stream via PassThrough
        const pass = new PassThrough();
        pass.end(Buffer.from(String(body)));
        pass.pipe(res);
    }
}

export async function deleteObject(bucket: string, key: string) {
    const cmd = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    return s3Client.send(cmd);
}

export async function listObjects(bucket: string, prefix?: string) {
    const cmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix });
    return s3Client.send(cmd);
}

export async function getObjectAclPolicy(bucket: string, key: string) {
    try {
        const head = await s3Client.send(
            new HeadObjectCommand({ Bucket: bucket, Key: key }),
        );
        const meta = head.Metadata || {};
        const raw = meta["custom-aclpolicy"] || meta["custom:aclPolicy"];
        if (!raw) return null;
        return JSON.parse(raw as string);
    } catch (err) {
        return null;
    }
}

export async function setObjectAclPolicy(
    bucket: string,
    key: string,
    aclPolicy: any,
) {
    // Fetch current object metadata/content type
    const head = await s3Client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    const existingMeta = head.Metadata || {};

    const newMeta = {
        ...existingMeta,
        "custom-aclpolicy": JSON.stringify(aclPolicy),
    };

    // Copy the object onto itself with REPLACE metadata
    const cmd = new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${encodeURIComponent(key)}`,
        Key: key,
        Metadata: newMeta,
        MetadataDirective: "REPLACE",
        ContentType: head.ContentType,
    });

    return s3Client.send(cmd);
}
