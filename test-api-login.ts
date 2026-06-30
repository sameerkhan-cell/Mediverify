async function main() {
    const url = "http://localhost:8080/api/auth/login";
    console.log(`Logging in sameerkhan031181@gmail.com on ${url}...`);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: "sameerkhan031181@gmail.com",
                password: "Password123!"
            })
        });
        console.log("Status:", res.status);
        const text = await res.text();
        console.log("Response text:", text);
    } catch (e: any) {
        console.error("Fetch failed:", e.message);
    }
}

main();
