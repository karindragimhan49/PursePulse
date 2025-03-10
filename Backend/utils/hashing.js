import { hash, compare } from "bcryptjs";
import { createHmac } from "crypto";

// Hash a value with salt
export const doHash = async (value, saltValue) => {
    return await hash(value, saltValue);
};

// Compare a value with a hashed value
export const doHashValidation = async (value, hashedValue) => {
    return await compare(value, hashedValue);
};

// HMAC (Hash-based Message Authentication Code)
export const hmacProcess = (value, key) => {
    return createHmac("sha256", key).update(value).digest("hex");
};
