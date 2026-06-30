async function testPort(port: number) {
    const url = `http://localhost:${port}/api/auth/signup`;
    console.log(`Testing URL: ${url}`);
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: `test-api-${Date.now()}@example.com`,
                password: "Password123!",
                name: "Test API User",
                role: "CUSTOMER"
            })
        });
        console.log(`Port ${port} status:`, res.status);
        console.log(`Port ${port} headers:`, Object.fromEntries(res.headers.entries()));
        const text = await res.text();
        console.log(`Port ${port} text response:`, text);
    } catch (e: any) {
        console.error(`Port ${port} failed:`, e.message);
    }
}

async function main() {
    await testPort(3000);
    await testPort(8080);
}

main();
