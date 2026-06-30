async function testPayload(name: string, payload: any) {
    const url = "http://localhost:8080/api/auth/signup";
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });
        console.log(`Payload [${name}] -> Status: ${res.status}`);
        const text = await res.text();
        console.log(`Payload [${name}] -> Response text: ${text.slice(0, 150)}`);
    } catch (e: any) {
        console.error(`Payload [${name}] -> Failed: ${e.message}`);
    }
}

async function main() {
    // 1. Lowercase role
    await testPayload("Lowercase role", {
        email: `test-lc-${Date.now()}@example.com`,
        password: "Password123!",
        name: "Test Lowercase",
        role: "customer"
    });

    // 2. Empty name
    await testPayload("Empty name", {
        email: `test-name-${Date.now()}@example.com`,
        password: "Password123!",
        name: "",
        role: "CUSTOMER"
    });

    // 3. Short password
    await testPayload("Short password", {
        email: `test-pwd-${Date.now()}@example.com`,
        password: "123",
        name: "Test Pwd",
        role: "CUSTOMER"
    });

    // 4. Already existing email
    await testPayload("Existing email", {
        email: "sameerkhan031181@gmail.com",
        password: "Password123!",
        name: "Sameer Khan",
        role: "CUSTOMER"
    });
}

main();
