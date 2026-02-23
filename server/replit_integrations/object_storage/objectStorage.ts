import type { Response } from "express";
import { randomUUID } from "crypto";
import {
    ObjectAclPolicy,
    ObjectPermission,
    canAccessObject,
    getObjectAclPolicy,
    setObjectAclPolicy,
} from "./objectAcl";
import {
    getPresignedPutUrl,
    streamObjectToResponse,
    getObjectMetadata,
} from "../../services/s3Storage";

export class ObjectNotFoundError extends Error {
    constructor() {
        super("Object not found");
        this.name = "ObjectNotFoundError";
        Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
    }
}

// The object storage service is used to interact with the object storage service.
export class ObjectStorageService {
    constructor() {}

    // Gets the public object search paths.
    getPublicObjectSearchPaths(): Array<string> {
        const pathsStr = process.env.PUBLIC_OBJECT_SEARCH_PATHS || "";
        const paths = Array.from(
            new Set(
                pathsStr
                    .split(",")
                    .map((path) => path.trim())
                    .filter((path) => path.length > 0),
            ),
        );
        if (paths.length === 0) {
            throw new Error(
                "PUBLIC_OBJECT_SEARCH_PATHS not set. Create a bucket in 'Object Storage' " +
                    "tool and set PUBLIC_OBJECT_SEARCH_PATHS env var (comma-separated paths).",
            );
        }
        return paths;
    }

    // Gets the private object directory.
    getPrivateObjectDir(): string {
        const dir = process.env.PRIVATE_OBJECT_DIR || "";
        if (!dir) {
            throw new Error(
                "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
                    "tool and set PRIVATE_OBJECT_DIR env var.",
            );
        }
        return dir;
    }

    // Search for a public object from the search paths.
    async searchPublicObject(filePath: string): Promise<File | null> {
        for (const searchPath of this.getPublicObjectSearchPaths()) {
            const fullPath = `${searchPath}/${filePath}`;
            const { bucketName, objectName } = parseObjectPath(fullPath);
            try {
                const meta = await getObjectMetadata(bucketName, objectName);
                if (meta) return { bucketName, objectName } as any;
            } catch (err) {
                // not found, continue
            }
        }

        return null;
    }

    // Downloads an object to the response.
    async downloadObject(
        file: { bucketName: string; objectName: string },
        res: Response,
        cacheTtlSec: number = 3600,
    ) {
        try {
            await streamObjectToResponse(
                file.bucketName,
                file.objectName,
                res,
                cacheTtlSec,
            );
        } catch (error) {
            console.error("Error downloading file:", error);
            if (!res.headersSent) {
                res.status(500).json({ error: "Error downloading file" });
            }
        }
    }

    // Gets the upload URL for an object entity.
    async getObjectEntityUploadURL(extension?: string): Promise<string> {
        const privateObjectDir = this.getPrivateObjectDir();
        if (!privateObjectDir) {
            throw new Error(
                "PRIVATE_OBJECT_DIR not set. Create a bucket in 'Object Storage' " +
                    "tool and set PRIVATE_OBJECT_DIR env var.",
            );
        }
        const objectId = randomUUID();
        const ext = extension ? `.${extension.replace(/^\./, "")}` : "";
        const fullPath = `${privateObjectDir}/uploads/${objectId}${ext}`;

        const { bucketName, objectName } = parseObjectPath(fullPath);
        return getPresignedPutUrl(bucketName, objectName, 900);
    }

    // Gets the object entity file from the object path.
    async getObjectEntityFile(objectPath: string): Promise<File> {
        if (!objectPath.startsWith("/objects/")) {
            throw new ObjectNotFoundError();
        }

        const parts = objectPath.slice(1).split("/");
        if (parts.length < 2) {
            throw new ObjectNotFoundError();
        }

        const entityId = parts.slice(1).join("/");
        let entityDir = this.getPrivateObjectDir();
        if (!entityDir.endsWith("/")) {
            entityDir = `${entityDir}/`;
        }
        const objectEntityPath = `${entityDir}${entityId}`;
        const { bucketName, objectName } = parseObjectPath(objectEntityPath);
        try {
            await getObjectMetadata(bucketName, objectName);
            return { bucketName, objectName } as any;
        } catch (err) {
            throw new ObjectNotFoundError();
        }
    }

    normalizeObjectEntityPath(rawPath: string): string {
        if (!rawPath.startsWith(process.env.S3_ENDPOINT || "")) {
            return rawPath;
        }

        const url = new URL(rawPath);
        const rawObjectPath = url.pathname;

        let objectEntityDir = this.getPrivateObjectDir();
        if (!objectEntityDir.endsWith("/")) {
            objectEntityDir = `${objectEntityDir}/`;
        }

        if (!rawObjectPath.startsWith(objectEntityDir)) {
            return rawObjectPath;
        }

        const entityId = rawObjectPath.slice(objectEntityDir.length);
        return `/objects/${entityId}`;
    }

    // Tries to set the ACL policy for the object entity and return the normalized path.
    async trySetObjectEntityAclPolicy(
        rawPath: string,
        aclPolicy: ObjectAclPolicy,
    ): Promise<string> {
        const normalizedPath = this.normalizeObjectEntityPath(rawPath);
        if (!normalizedPath.startsWith("/")) {
            return normalizedPath;
        }
        const objectFile = await this.getObjectEntityFile(normalizedPath);
        await setObjectAclPolicy(objectFile as any, aclPolicy);
        return normalizedPath;
    }

    // Checks if the user can access the object entity.
    async canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission,
    }: {
        userId?: string;
        objectFile: { bucketName: string; objectName: string };
        requestedPermission?: ObjectPermission;
    }): Promise<boolean> {
        return canAccessObject({
            userId,
            objectFile,
            requestedPermission: requestedPermission ?? ObjectPermission.READ,
        });
    }
}

function parseObjectPath(path: string): {
    bucketName: string;
    objectName: string;
} {
    if (!path.startsWith("/")) {
        path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
        throw new Error("Invalid path: must contain at least a bucket name");
    }

    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");

    return {
        bucketName,
        objectName,
    };
}

async function signObjectURL({
    bucketName,
    objectName,
    method,
    ttlSec,
}: {
    bucketName: string;
    objectName: string;
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    ttlSec: number;
}): Promise<string> {
    throw new Error(
        "signObjectURL is no longer supported. Use S3 presigned URLs instead.",
    );
}
