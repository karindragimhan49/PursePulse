import jwt from "jsonwebtoken";

export const identifierUser = (req, res, next) => {
    let token = req.headers.client === 'not-browser' ? req.headers.authorization : req.cookies?.Authorization;

    if (!token) {
        return res.status(403).json({ success: false, message: "Unauthorized - No token provided" });
    }

    try {
        let userToken = token?.startsWith('Bearer ') ? token.split(' ')[1] : token;

        const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);
        if (!jwtVerified) {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }

        req.user = jwtVerified;
        next();

    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ success: false, message: "Unauthorized - Invalid or expired token" });
    }
};

export const identifierAdmin = (req, res, next) => {
    let token = req.headers.client === 'not-browser' ? req.headers.authorization : req.cookies?.Authorization;

    if (!token) {
        return res.status(403).json({ success: false, message: "Unauthorized - No token provided" });
    }

    try {
        let userToken = token?.startsWith('Bearer ') ? token.split(' ')[1] : token;

        const jwtVerified = jwt.verify(userToken, process.env.TOKEN_SECRET);
        if (!jwtVerified) {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }

        if (jwtVerified.role !== "admin") {
            return res.status(403).json({ success: false, message: "Access denied. Admins only." });
        }

        req.user = jwtVerified;
        next();

    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ success: false, message: "Unauthorized - Invalid or expired token" });
    }
};
