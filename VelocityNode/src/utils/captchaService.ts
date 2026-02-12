interface CaptchaVerifyResponse {
    success: boolean;
    challenge_ts?: string;
    hostname?: string;
    "error-codes"?: string[];
}

export async function verifyCaptcha(token: string): Promise<{ success: boolean; errorCodes?: string[] }> {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
        console.error("RECAPTCHA_SECRET_KEY is not set in environment variables");
        return { success: false, errorCodes: ["missing-secret-key"] };
    }

    try {
        const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
            }),
        });

        const data = (await response.json()) as CaptchaVerifyResponse;

        return {
            success: data.success,
            errorCodes: data["error-codes"],
        };
    } catch (error) {
        console.error("CAPTCHA verification request failed:", error);
        return { success: false, errorCodes: ["network-error"] };
    }
}
